const config = require('config');
const {getJqueryFromLink} = require('widgets/scraper-utils');
let extractCurrSearchResPageLinksIntoCsv = require('./modules/extract-curr-search-res-page-links-into-csv/extract-curr-search-res-page-links-into-csv.js');

module.exports = ((config) => {
    const WEBSITES_BASE__URL = config.urls.searchHotelForm,
        PAGI_ELEMS__SEL = config.selectors.pagination.allElems,
        ACTIVE_PAGI_ELEMS__SEL = config.selectors.pagination.activeElem,
        PAGI_LINKS_FOLDER__PATH = config.pathes.paginationLinksFolder,
        PAGI_LINKS_CLICKABLE__SUBSEL = config.selectors.pagination.clickableSubSel;
    
    extractCurrSearchResPageLinksIntoCsv = extractCurrSearchResPageLinksIntoCsv({
        WEBSITES_BASE__URL,
        PAGI_LINKS_FOLDER__PATH,
        PAGI_LINKS_CLICKABLE__SUBSEL
    })
    
    return extractSearchResultPageLinks;
    
    async function extractSearchResultPageLinks(batchId, firstSearchResPgsLink) {
        let $ = await getJqueryFromLink(firstSearchResPgsLink);
        let isCurrPgLastSearchResultsPg;
        
        do {
            let $allPagiElemsOnCurrPage = $(PAGI_ELEMS__SEL);
            let activePagiElemsIndex = getActivePagiElemsIndex($allPagiElemsOnCurrPage);

            let pageElemParams = {$allPagiElemsOnCurrPage, activePagiElemsIndex};

            isCurrPgLastSearchResultsPg = checkIfCurrPageIsLastSearchResultPg(pageElemParams);
            if (isCurrPgLastSearchResultsPg) break;
            
            var lastConsecutivePagiElemsUrl = await extractCurrSearchResPageLinksIntoCsv(batchId, pageElemParams);
            console.log(lastConsecutivePagiElemsUrl);
            $ = await getJqueryFromLink(lastConsecutivePagiElemsUrl);
        } while (!isCurrPgLastSearchResultsPg);

        return true;
    }

    function getActivePagiElemsIndex($allPagiElemsOnCurrPage) {
        let length = $allPagiElemsOnCurrPage.length;

        for (var i = 0; i < length; i++) {
            let currPagiElem = $allPagiElemsOnCurrPage[i];
            let isPagiElemActive = currPagiElem.attribs.class.includes(ACTIVE_PAGI_ELEMS__SEL)
            if (isPagiElemActive) return i;
        }

        throw new Error('No Active Pagination Items');
    }

    function checkIfCurrPageIsLastSearchResultPg(pageElemParams) {
        let {$allPagiElemsOnCurrPage, activePagiElemsIndex} = pageElemParams;

        let allPageiElemsLastIndex = $allPagiElemsOnCurrPage.length - 1;

        let isCurrPgLastSearchResultsPg = allPageiElemsLastIndex === activePagiElemsIndex;
        return isCurrPgLastSearchResultsPg;
    }
})(config);
