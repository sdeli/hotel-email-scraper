let selectTimespanForResidence = require('./modules/select-timespan-for-residence/select-timespan-for-residence.js');
const {getRandomNumber, clickElemMultipalTimes} = require('widgets/scraper-utils');

module.exports = ((config) => {
    const {
        SEARCH_FORM_DAYS_IN_CALENDAR__SEL,
        DAYS_IN_CALENDAR_SELECTED_CLASS_TRACE,
        URL_TO_SEARCH_FROM,
        SEARCH_FORM_COUNTRY_INPUT__SEL,
        COUNTRY_NAME,
        SEARCH_FORM_CALENDAR_BTN__SEL,
        CHOOSE_MONTH_MAX_CLICK_COUNT,
        CHOOSE_MONTH_MIN_CLICK_COUNT,
        SEARCH_FORM_NEXT_MONTH_ARROW__SEL,
        SEARCH_FORM_SUBMIT_BTN__SEL
    } = config;

    selectTimespanForResidence = selectTimespanForResidence({
        SEARCH_FORM_DAYS_IN_CALENDAR__SEL,
        DAYS_IN_CALENDAR_SELECTED_CLASS_TRACE
    });
    
    return getToFirstSearchResultsPage
    
    async function getToFirstSearchResultsPage(page) {
        // Go to search form
        await page.goto(URL_TO_SEARCH_FROM, {waitUntil : "domcontentloaded"});
        
        // Type in country to search hotels in
        await page.type(SEARCH_FORM_COUNTRY_INPUT__SEL, COUNTRY_NAME);
    
        await enterInfosIntoCalendar(page);
        await submitSearchGoToFirstSearchResPAge(page);
    }
    
    async function enterInfosIntoCalendar(page) {
        await page.click(SEARCH_FORM_CALENDAR_BTN__SEL);
        await page.waitForSelector(SEARCH_FORM_NEXT_MONTH_ARROW__SEL);
        
        let calendarMonthNextArrowClickCount = getRandomNumber(CHOOSE_MONTH_MAX_CLICK_COUNT, CHOOSE_MONTH_MIN_CLICK_COUNT);
        await clickElemMultipalTimes(page, SEARCH_FORM_NEXT_MONTH_ARROW__SEL, calendarMonthNextArrowClickCount);
    
        await selectTimespanForResidence(page);
    }
    
    async function submitSearchGoToFirstSearchResPAge(page) {
        await page.click(SEARCH_FORM_SUBMIT_BTN__SEL);
        await page.waitForNavigation();
        
        let url = await page.url();
        return url;
    }
});