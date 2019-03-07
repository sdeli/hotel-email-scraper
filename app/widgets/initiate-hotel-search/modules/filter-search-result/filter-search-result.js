module.exports = ((config) => {
    const {
        CHECKBOX_SPAN__SEL,
        HOTEL__TERM,
        CHALET__TERM,
        GUEST_HOUSE__TERM
    } = config;
    
    return filterSearchResult
    
    async function filterSearchResult(page) {
        // await clickFiltersCheckBox(page, HOTEL__TERM);
        await clickFiltersCheckBox(page, CHALET__TERM);
        await clickFiltersCheckBox(page, GUEST_HOUSE__TERM);
    
        let firstSearchResPgsLink = await page.url();
    
        return firstSearchResPgsLink;
    }
    
    async function clickFiltersCheckBox(page, textInCheckbox) {
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
});
