const {writeOrAppendToFile} = require('widgets/scraper-utils');
let isNextPagiElemInRowCheck = require('./modules/is-next-page-elem-in-row-check/is-next-page-elem-in-row-check.js')

module.exports = ((config) => {
    const {
        WEBSITES_BASE__URL,
        PAGI_LINKS_FOLDER__PATH,
        PAGI_LINKS_CLICKABLE__SUBSEL  
    } = config;
    
    isNextPagiElemInRowCheck = isNextPagiElemInRowCheck({
        PAGI_LINKS_CLICKABLE__SUBSEL  
    });
    
    return extractSearchResPageLinksIntoCsv;
    
    async function extractSearchResPageLinksIntoCsv(batchId, pageElemParams) {
        let searchResPgUrls = getSearchResPgUrlsFromPagi(pageElemParams);
        
        await writeUrlsIntoCsv(batchId, searchResPgUrls);

        lastConsecutivePagiElemsUrl = searchResPgUrls[searchResPgUrls.length - 1];
        return lastConsecutivePagiElemsUrl;
    }
    
    function getSearchResPgUrlsFromPagi(pageElemParams) {
        let {$allPagiElemsOnCurrPage, activePagiElemsIndex} = pageElemParams;
        let pagiElemsLength = $allPagiElemsOnCurrPage.length;
        let searchResPgUrls = [];
        let i = activePagiElemsIndex;

        for (i = activePagiElemsIndex; i < pagiElemsLength; i++) {
            /*isNextPagiElemInRow means that the current pagination items page number is still in the part which is ascending by one and not the last one among the pagination items which is always 67*/
            let isNextPagiElemInRow = isNextPagiElemInRowCheck($allPagiElemsOnCurrPage, i)
            if (!isNextPagiElemInRow) break;
            
            let hasAlreadyInPrevBatch = i === activePagiElemsIndex && i !== 0;
            if (hasAlreadyInPrevBatch) continue;

            let searchResPageUrl = getUrl($allPagiElemsOnCurrPage.eq(i));
            searchResPgUrls.push(searchResPageUrl);
        }

        return searchResPgUrls
    }

    function getUrl($pagiElem) {
        let localUrl = $pagiElem.children(PAGI_LINKS_CLICKABLE__SUBSEL).attr('href');
        let absoluteUrl = `${WEBSITES_BASE__URL}${localUrl}`;
        return absoluteUrl;
    }

    async function writeUrlsIntoCsv(batchId, searchResPgUrls) {
        let csv = searchResPgUrls.join('\n') + "\n";
        let csvFilePath = `${PAGI_LINKS_FOLDER__PATH}/${batchId}`;
        
        await writeOrAppendToFile(csvFilePath, csv);
    }
});

