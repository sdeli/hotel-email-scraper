const config = require('config');
const puppeteer = require('puppeteer');

const {getRandomNumber, clickElemMultipalTimes} = require('widgets/scraper-utils');

let selectTimespanForResidence = require('./modules/select-timespan-for-residence/select-timespan-for-residence.js');

module.exports = ((config) => {
    const URL_TO_SEARCH_FROM = config.urls.searchHotelForm,
        CATCHER_ERR_EVENT__TERM = config.errors.events[0],
        CHOOSE_MONTH_MAX_CLICK_COUNT = config.general.monthSearchMaxClick,
        CHOOSE_MONTH_MIN_CLICK_COUNT = config.general.monthSearchMinClick,
        COUNTRY_NAME = config.general.searchedCountry,
        SEARCH_FORM_COUNTRY_INPUT__SEL = config.selectors.searchForm.country,
        SEARCH_FORM_CALENDAR_BTN__SEL = config.selectors.searchForm.calendarBtn,
        SEARCH_FORM_NEXT_MONTH_ARROW__SEL = config.selectors.searchForm.nextMonthArrow,
        SEARCH_FORM_DAYS_IN_CALENDAR__SEL = config.selectors.searchForm.calendarDays,
        DAYS_IN_CALENDAR_SELECTED_CLASS_TRACE = config.selectors.searchForm.selectedClassTrace,
        SEARCH_FORM_SUBMIT_BTN__SEL = config.selectors.searchForm.submitBtn,
        HEADLESS = config.pupeteer.headless,
        CHECKBOX_SPAN__SEL = config.selectors.searchFilters.checkBoxSpanSel,
        HOTEL__TERM = config.selectors.searchFilters.hotelTerm;
        CHALET__TERM = config.selectors.searchFilters.chaletTerm;
        GUEST_HOUSE__TERM = config.selectors.searchFilters.guestHousesTerm;
    
    selectTimespanForResidence = selectTimespanForResidence({
        SEARCH_FORM_DAYS_IN_CALENDAR__SEL,
        DAYS_IN_CALENDAR_SELECTED_CLASS_TRACE
    })
    
    return initiateHotelSearch;
    
    async function initiateHotelSearch() {
        const {browser, page} = await launchPuppeterBrowser();

        let firstSearchResPgsLink = await getToFirstSearchResultsPage(browser, page);

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

    async function getToFirstSearchResultsPage(browser, page) {
        // Go to search form
        await page.goto(URL_TO_SEARCH_FROM, {waitUntil : "domcontentloaded"});
        
        // Type in country to search hotels in
        await page.type(SEARCH_FORM_COUNTRY_INPUT__SEL, COUNTRY_NAME);

        await enterInfosIntoCalendar(page);
        await submitSearchGoToFirstSearchResPAge(page);

        await filterSearch(page, HOTEL__TERM);
        await filterSearch(page, CHALET__TERM);
        await filterSearch(page, GUEST_HOUSE__TERM);

        let firstSearchResPgsLink = await page.url();
        await browser.close();
        return firstSearchResPgsLink;
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

    async function filterSearch(page, textInCheckbox) {
        // The filtering takes place with ticking in a checkbox which based on its filter (guest house, bed and brekfast...) filters the search
        let allSearchFilterCheckboxesOnPage = await page.$$(CHECKBOX_SPAN__SEL)

        let selectorHasBeenChangedOnPage = allSearchFilterCheckboxesOnPage.lengt === 0;
        if (selectorHasBeenChangedOnPage) {
            let err = `selector doesnt exists: ${CHECKBOX_SPAN__SEL}`;
            process.emit(CATCHER_ERR_EVENT__TERM, err);
            return;
        }

        let checkBoxesIndex = await page.$$eval(CHECKBOX_SPAN__SEL, (checkBoxes, textInCheckbox) => {
            for (let i = 0; i < checkBoxes.length; i++) {
                let isCheckboxWeWantToClick = checkBoxes[i].innerText === textInCheckbox;
                if (isCheckboxWeWantToClick) {
                    return i;
                }
            }
        }, HOTEL__TERM);
        
        let checkbox = allSearchFilterCheckboxesOnPage[checkBoxesIndex];
        await checkbox.click(checkbox);
        // pupeteer doesnt have a built in function just to wait for network idle if there is no other event navigation or appearance of a known selector.. so we need to waitFor(certainmilsecs)
        await page.waitFor(8000);
    }

    // async function setFiltersOnFirstSearchResultsPage(page) {
    //     await page.waitForSelector(FILTER_HOTEL_AND_MORES__SEL__SEL);
    //     await page.click(FILTER_HOTEL_AND_MORES__SEL__SEL);
    //     await page.waitForNavigation({waitUntil : "networkidle2"});
        
    //     await page.click(FILTER_CHALET__SEL);
    //     await page.waitForNavigation({waitUntil : "networkidle2"});
    // }
})(config);