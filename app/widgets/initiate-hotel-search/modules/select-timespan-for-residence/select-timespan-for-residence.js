const {getRandomNumber} = require('widgets/scraper-utils');

module.exports = ((config) => {
    const {
        SEARCH_FORM_DAYS_IN_CALENDAR__SEL,
        DAYS_IN_CALENDAR_SELECTED_CLASS_TRACE
    } = config;
   
    return selectTimespanForResidence

    async function selectTimespanForResidence(page) {
        allActiveDayHandles = await getAllActiveDays(page);
        areDaysSelectedSuccesfully = await selectRandomTimespan(page, allActiveDayHandles);

        if (areDaysSelectedSuccesfully) {
            return true;
        } else {
            throw new Error('error in \'selectTimespanForResidence\'');    }
        }
    
    async function getAllActiveDays(page) {
        let allActiveDayHandles = [];
        let allDayHandles = await page.$$(SEARCH_FORM_DAYS_IN_CALENDAR__SEL);
        
        for (var i = 0; i < allDayHandles.length; i++) {
            var currDayHandle = allDayHandles[i];
            
            var activeDayHandle = await page.evaluate(currDayInCalendar => {
                let isDisabled = currDayInCalendar.getAttribute('class').includes('disabled');
                let isEmpty = currDayInCalendar.getAttribute('class').includes('empty');

                if (!isDisabled && !isEmpty) {
                    return true;
                } else {
                    return false;
                }
            }, currDayHandle);

            if (activeDayHandle) {
                allActiveDayHandles.push(currDayHandle)
            };
        }
        
        return allActiveDayHandles;
    }

    async function selectRandomTimespan(page, allActiveDayHandles) {
        let daysCount = allActiveDayHandles.length;
        let startDaysIndex = getRandomNumber(daysCount - 1, 0);
        let startDay = allActiveDayHandles[startDaysIndex];
        await startDay.click();

        let wasDaySelected = await checkIfDayWasSelected(page, startDay)
        if (!wasDaySelected) return false
        
        let maxDateOfResidence = (startDaysIndex + 15 <= daysCount) ? startDaysIndex + 15 : daysCount;
        let lastDaysIndex = getRandomNumber(maxDateOfResidence, startDaysIndex + 1);
        console.log(lastDaysIndex);

        let lastDay = allActiveDayHandles[lastDaysIndex];
        await lastDay.click();
        
        wasDaySelected = await checkIfDayWasSelected(page, lastDay)

        if (wasDaySelected) {
            return true;
        } else {
            return false;
        }
    }

    async function checkIfDayWasSelected(page, dayHandle) {
        let wasDaySelected = await page.evaluate((dayElem, traceOfClass) => {
            let wasDaySelected = dayElem.getAttribute('class').includes(traceOfClass);
            return wasDaySelected;
        }, dayHandle, DAYS_IN_CALENDAR_SELECTED_CLASS_TRACE);

        return wasDaySelected;
    }
});