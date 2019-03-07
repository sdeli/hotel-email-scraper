/* DESCRIPTION:
    * This file manages the main extraction process of emails from hotels
    * the main entry point of the file is the scrapeController function
    * The flow of the logic is "sequential execution".
    * At squence/stage the execution of the current task/goal is done by a widget/lib from the widgets folder.
    
    logic:
        1. initiateHotelSearch() goes to booking.com, initiates a search and passes the first search result pages link to the second step.

        2. extractSearchResultPageLinks gets the first search result pages link and starting from there extract all the search() result pages links into a .csv file, for further extraction in the 3rd step

        3. extractHotelInfos() reads out all search result pages links from - in the 2step created - .csv file and extracts all the hotel name and hotel address from there and saves those into the mysql database

        4. extractHotelWebsiteFromGoogle() gets all the hotelnames and adresses, which were extracted in the second step and opens pupeteer instances (based on the config.json the amount you choose or the same amount as many processors the current computer has), creates a google search link with query string from all hotel name and address pairs, sends it to one of the puppeteer instances and from the response of google it extracts the hotels websites link, if it has one then saves those into mysql database. Based on hwo many pupeteer instances are opened, more hotel website links are obtained concurrently

        5. extractEmailsFromHotelsWebsites() get all the hotels websites, which were extracted in the 4th step. It extracts all the emails and the links on the website, but from the links just those ones, which are under the same domain or subdomain (as the initial website) and then sends the next request to the next link of the same website. So it iterates through all of the possible links of the same domain and finds all the emails which are displayed on one of the websites of the domain. This scrape process is done by more emial-sraper instances concurrently. That means for the same time more websites are extracted. The count of concurrent email scraper instacnes are defined in the the config.json file.
    
    Important
        
        error handling
            1. scrapeController() function creates a listener on the process, which then will listen to general error events from the widgtes. (Right now there are no other types of errors just general)
            2. Such errors which are shutting down the process are logged by pm2 the process manager, by that the application is executed and logged into the general error file as weel and there is an email sent about it. 
*/
const path = require('path');
const fs = require('fs');

const config = require('config');
const CATCHER_ERR_EVENT__TERM = config.errors.events[0],
    ERR_LOG_FILE__PATH = path.join(process.cwd(), config.pathes.errorLog);  

let initiateHotelSearch = require('widgets/initiate-hotel-search');
let extractSearchResultPageLinks = require('widgets/extract-search-result-page-links');
let extractHotelPagelinks = require('widgets/extract-hotel-page-links');
let extractHotelInfos = require('widgets/extract-hotel-infos');
let extractHotelWebsiteFromGoogle = require('widgets/extract-hotel-website-url-from-google');
let extractEmailsFromHotelsWebsites = require('widgets/extract-emails-from-hotels-webistes');
let SendMail = require('widgets/send-mail-class');
let sendMail = new SendMail();

const {getFormattedDate, createFolder, logger} = require('widgets/scraper-utils');

module.exports = scrapeController;

function scrapeController() {
    let batchId = getFormattedDate();

    initiateHotelSearch()
    .then((firstSearchResPgsLink) => {
        console.log('firstSearchResPgsLink: ' + firstSearchResPgsLink);
        return extractSearchResultPageLinks(batchId, firstSearchResPgsLink);
    })
    .then(() => {
        return extractHotelPagelinks(batchId);
    })
    .then(() => {
        return extractHotelInfos(batchId);
    })
    .then(() => {
        return extractHotelWebsiteFromGoogle(batchId);
    })
    .then(() => {
        return extractEmailsFromHotelsWebsites(batchId);    
    })
    .then(async () => {
        console.log('sending mail');
        await sendMail.result();
        process.kill(process.pid, 'SIGHUP');
    })
    .catch(async err => {
        console.log(err);
        process.emit(CATCHER_ERR_EVENT__TERM, JSON.stringify(err, null, 2));
        await sendMail.err(err);
    });

    process.on(CATCHER_ERR_EVENT__TERM, (errStr) => {
        console.log('\ngeneral err: ' + errStr + '\n');
        logGenerealErr(errStr, batchId)
    });
};


async function logGenerealErr(errStr, batchId) {
    let generalErrLogFolderPath = `${ERR_LOG_FILE__PATH}/general-err`;

    try {
        if (!fs.existsSync(generalErrLogFolderPath)) await createFolder(generalErrLogFolderPath);
    } catch (err) {
        console.log(err);
    }

    let generalErrLogFilePath = `${generalErrLogFolderPath}/${batchId}`;

    logger(generalErrLogFilePath, errStr);
}