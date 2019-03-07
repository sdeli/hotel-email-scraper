/* DESCRIPTION:
    the main purpose of the module is to get the correspondig website to hotelnames  and addresses which were extracted previously in the controller.

    How the execution wokrs:
    * the modules main entry point is the return extractHotelWebsiteFromGoogle(); statment
    * By the the hotelsModel.getHotelNamesAndAdresses(batchId) gets all the hotelnames and adresses, which were extracted in the current run of the script
    *  Then all the htoelnames and adresses are to the googleScraperQueue which will manage the concurrency of the extraction 
    * It opens more pupeteer instances (based on the config.json the amount you choose or the same amount as many processors the current computer has),creates google search links with query string from all hotel name and address pairs, sends it to one of the puppeteer instances and from the response of google it extracts the hotels websites link. When the google search page is loaded and google has the website of the current hotel, then the cb function (callback) saves that into mysql database. Based on hwo many pupeteer instances are opened, this process is done concurrently multiple times.
    * when all extractions are finished the controll get back to the controller
*/
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