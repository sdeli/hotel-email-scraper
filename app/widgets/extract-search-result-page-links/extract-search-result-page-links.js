/* DESCRIPTION:
    The purpose of this module is to extract all search result pages from the pagination of the search result.

    How the extraction works:
        * The main entry point of the widget is when the extractSearchResultPageLinks function called in the controller, which expects to be passed the first search result pages link and the batchId
        * So the widget gets the first search result page and it sends a request to it by the await getJqueryFromLink(firstSearchResPgsLink); statement, from where it gets back a cheerio instance (html in a jquery object)
        * Now the pagination is not continuous like number from 1 to 10, then it is segmental. If we are on search result page 44, then it is like from 1-3 44-50 ... 67 where ... is a placeholder in the pagination telling to the user that between 50 and 67 there are pages. So this structure the interation through the pagination and get all the pagination links makes a bit tricky.
        * So the widgets get the jquery instance of the first search result page and enters a do while loop
        * The do while does the following on each iteration
            * finds the active pagination item by getActivePagiElemsIndex($allPagiElemsOnCurrPage);
            * then checks if it is the last one in the pagination
            * if not it extracts the pagination items by extractCurrSearchResPageLinksIntoCsv
                * the extractCurrSearchResPageLinksIntoCsv gets the activePagiElemsIndex (active pagination items index which is the index number of that elem in the pagination)
                * and if the next pagniation items inner text (what is a number representing that items pagination number) is bigger than the current by 1 (so if that is exzactly the next one) then the curr pagniation item gets extracted. And so it does This for the next one as well until the next pagination item in the pagniation is not the next one by number.
            * Then if are on 44 and the pagniation is like from 1-3 44-50 ... 67, then in the loop the await getJqueryFromLink(lastConsecutivePagiElemsUrl); stament will send a request on number 50-s link where pagniation will look like from 1-3 50-64 ... 67
            *  The loop iterates under the last pagniation item is reached
        * When all the search result page links are extracted from the pagination items, then the controll goes back to the controller.
*/
const config = require('config');
const {getJqueryFromLink} = require('widgets/scraper-utils');
let extractCurrSearchResPageLinksIntoCsv = require('./modules/extract-curr-search-res-page-links-into-csv/extract-curr-search-res-page-links-into-csv.js');

const WEBSITES_BASE__URL = config.urls.searchHotelForm,
    PAGI_ELEMS__SEL = config.selectors.pagination.allElems,
    ACTIVE_PAGI_ELEMS__SEL = config.selectors.pagination.activeElem,
    PAGI_LINKS_FOLDER__PATH = config.pathes.paginationLinksFolder,
    PAGI_LINKS_CLICKABLE__SUBSEL = config.selectors.pagination.clickableSubSel;

extractCurrSearchResPageLinksIntoCsv = extractCurrSearchResPageLinksIntoCsv({
    WEBSITES_BASE__URL,
    PAGI_LINKS_FOLDER__PATH,
    PAGI_LINKS_CLICKABLE__SUBSEL
});

module.exports = extractSearchResultPageLinks;
    
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

