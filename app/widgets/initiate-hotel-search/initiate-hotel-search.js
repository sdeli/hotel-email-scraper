/* DESCRIPTION:
    The purpose of this module is to do a random hotel search on bookin.com on it main search page: https://www.booking.com/ , and then do a filter on the first search result page to filter out from the search all the results which are not hotels or guesthosues or chalets and pass the first search result pages link to the controller.

    At: module.exports = ((config) => { ... it creates a closure
*/
const config = require('config');
const puppeteer = require('puppeteer');

let filterSearchResult = require('./modules/filter-search-result/filter-search-result.js');
let goToFirstSearchResultsPage = require('./modules/go-to-first-search-results-page/go-to-first-search-results-page.js');

const HEADLESS = config.pupeteer.headless;

filterSearchResult = filterSearchResult({
    CHECKBOX_SPAN__SEL : config.selectors.searchFilters.checkBoxSpanSel,
    HOTEL__TERM : config.selectors.searchFilters.hotelTerm,
    CHALET__TERM : config.selectors.searchFilters.chaletTerm,
    GUEST_HOUSE__TERM : config.selectors.searchFilters.guestHousesTerm
});

goToFirstSearchResultsPage = goToFirstSearchResultsPage({
    SEARCH_FORM_DAYS_IN_CALENDAR__SEL : config.selectors.searchForm.calendarDays,
    DAYS_IN_CALENDAR_SELECTED_CLASS_TRACE : config.selectors.searchForm.selectedClassTrace,
    URL_TO_SEARCH_FROM : config.urls.searchHotelForm,
    SEARCH_FORM_COUNTRY_INPUT__SEL : config.selectors.searchForm.country,
    COUNTRY_NAME : config.general.searchedCountry,
    SEARCH_FORM_CALENDAR_BTN__SEL : config.selectors.searchForm.calendarBtn,
    SEARCH_FORM_NEXT_MONTH_ARROW__SEL : config.selectors.searchForm.nextMonthArrow,
    CHOOSE_MONTH_MAX_CLICK_COUNT : config.general.monthSearchMaxClick,
    CHOOSE_MONTH_MIN_CLICK_COUNT : config.general.monthSearchMinClick,
    SEARCH_FORM_SUBMIT_BTN__SEL : config.selectors.searchForm.submitBtn
});

module.exports = initiateHotelSearch
    
async function initiateHotelSearch() {
    const {browser, page} = await launchPuppeterBrowser();

    await goToFirstSearchResultsPage(page);
    let firstSearchResPgsLink = await filterSearchResult(page);

    await browser.close();
    return firstSearchResPgsLink;
}

async function launchPuppeterBrowser() {
    let launchOpts = {
        headless: HEADLESS,
        ignoreHTTPSErrors : true
    }

    const browser = await puppeteer.launch(launchOpts);
    const page = await browser.newPage();

    page.setViewport({width: 1285, height: 644});

    return {browser, page}
}
