const config = require('config');
const hotelsModel = require('models/hotels-model');
const GoogleScraperQueue = require('./modules/google-scrape-queue-class/google-scrape-queue.js');

const IS_HEADLESS = config.pupeteer.headless,
    HOTEL_WEBSITE_LINK_CONT__SEL = config.selectors.googleSearch.websiteAndAvatarCont,
    DELAY_MIN__MILI_SECS = config.extractHotelPageAndAvatarFromGoogle.minDelay,
    DELAY_MAX__MILI_SECS = config.extractHotelPageAndAvatarFromGoogle.maxDelay,
    PROXIES = config.extractHotelPageAndAvatarFromGoogle.proxies,
    CATCHER_ERR_EVENT__TERM = config.errors.events[0];
    
module.exports = ((batchId) => {
    const googleScraperQueue = GoogleScraperQueue({
        IS_HEADLESS,
        HOTEL_WEBSITE_LINK_CONT__SEL,
        PROXIES
    });

    return extractHotelWebsiteFromGoogle();

    async function extractHotelWebsiteFromGoogle() {
        try {
            var hotelsArr = await hotelsModel.getHotelNamesAndAdresses(batchId)
            await googleScraperQueue.init();
        } catch (err) {
            process.emit(CATCHER_ERR_EVENT__TERM, JSON.stringify(err, null, 2));
            console.log('emit shutdown');
        }

        let delay = {
            min : DELAY_MIN__MILI_SECS,
            max : DELAY_MAX__MILI_SECS
        }
        
        let getWebsiteGooglePromises = hotelsArr.map(hotelObj => {
            return new Promise((resolve) => {
                let {hotelId, hotelName, fullAddr} = hotelObj;
                let keywords = [hotelName, fullAddr];
                cbParamsArr = [resolve, [batchId, hotelId]]

                googleScraperQueue.addTask(keywords, cb, cbParamsArr, delay);
            });
        });
        
        console.log('websites count to extract from google: ' + getWebsiteGooglePromises.length);
        await Promise.all(getWebsiteGooglePromises);
    }
    
    function cb(err, results, resolve, sqlParams) {
        if (err) {
            resolve();
            process.emit(CATCHER_ERR_EVENT__TERM, JSON.stringify({err, results}, null, 2));
            return;
        }
        
        didntFindUrlForWebsite = Array.isArray(results);
        if (!err && didntFindUrlForWebsite) {
            resolve();
            let keywords = results;
            let errMSg = `didnt find url for website with these keywords:${JSON.stringify(keywords)}`;
            process.emit(CATCHER_ERR_EVENT__TERM, errMSg);
            return;
        }
        
        resolve();
        inertHotelWebsiteIntoDb(results, ...sqlParams);
    }
    
    function inertHotelWebsiteIntoDb(results, batchId, hotelId) {
        let websiteUrl = results;
        let hotelInfosObj = {batchId, hotelId, websiteUrl};
        
        console.log("extracted data: " + JSON.stringify(hotelInfosObj, null, 2));
        hotelsModel.insertHotelWebsite(hotelInfosObj)
        .catch(err => {
            process.emit(CATCHER_ERR_EVENT__TERM, JSON.stringify(err));
        })
    }
});