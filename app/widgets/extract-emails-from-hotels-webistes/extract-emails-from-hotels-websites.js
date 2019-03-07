/* DESCRIPTION:
    * The description of the module assumes that you have read the readme.txt file and the description of the app/controllers/hotel-scraper.js files description

    * This module is responsible for extacting emails from all websites which it gets from the databse
    * the main entry point of the widget is the return extractEmailsFromHotelsWebsites(); statement
    * The module recives as paramter the batchId, by that the received websites are filtererd.
    * All websites are saved by an other widget into the db and one of there identifiers is the batch id which identifies the current execution of the script
    * The extraction works on the following way:
        * via the hotelsModel.getWebsitesByBatchId(batchId) method the widget gets all the websites which have been found in the current run of the script
        * Then via the runExtractionParallel(websiteId, websiteUrl, i) function, all the websites are getting into a task queue, which will manage the extraction of the websites concurrently
        * The task-queue is the PromiseTaskQueue object
        * It manages that not more than the same amount of website are extracted at once, as you pass to it (new PromiseTaskQueue(11) => 11 co ncurrent extractions are allowed) or the default is 3.
        * The actual extraction is done by the EmailExtractor object. It iterates through all the pages of the website which it gets as paramter and extract the emails, which can be found on them.
        * In the runExtractionParallel(websiteId, websiteUrl, i) function the promiseTaskQueue object get the website by getting an emailExtractor object, which got the webists url passed in when it was construted.
        * when the last website has as well has been extracted the proiseQueue firest the 'extraction-finished' event
        * The widget when called returns a promise and that promise reolves when the 'extraction-finished' event is called.
*/
const path = require('path');
const config = require('config');

const hotelsModel = require('models/hotels-model');
const PromiseTaskQueue = require('./modules/promise-task-queue-class/promise-task-queue-class.js');
const promiseTaskQueue = new PromiseTaskQueue();

const EmailExtractor = require('./modules/extract-emails-from-website-class/extract-emails-from-website-class.js');
const {logger} = require('widgets/scraper-utils');

// Configuration needed by the widget
const MAX_PAGE_EXTRACTION_COUNT = config.emailScraper.maxPageExtraction,
    CATCHER_ERR_EVENT__TERM = config.errors.events[0];
    ERR_LOG_FOLDER__PATH = config.emailScraper.errorLog;

module.exports = ((batchId) => {
    return extractEmailsFromHotelsWebsites();
    
    async function extractEmailsFromHotelsWebsites() {
        console.log('started email extraction');

        try {
            var hotelWebsites = await hotelsModel.getWebsitesByBatchId(batchId);
        } catch (error) {
            console.log('shutdown event');
        }

        hotelWebsites.map(({websiteId, websiteUrl}, i) => {    
            runExtractionParallel(websiteId, websiteUrl, i)
        });
        
        return new Promise((resolve) => {
            promiseTaskQueue.on('finished-all-tasks', () => {
                console.log('finished all tasks');
                resolve();
            });
        });
    }
    
    function runExtractionParallel(webisteId, websiteUrl, fnId) {
        let extractEmailsParams = {
            mainPageExtractionCount : MAX_PAGE_EXTRACTION_COUNT,
            websiteUrl,
            fnId,
            batchId,
            errLogFolderPath : ERR_LOG_FOLDER__PATH 
        }
        
        let cbsParams = [webisteId, websiteUrl, fnId];
        promiseTaskQueue.addPromiseTask(extractEmailsProm, extractEmailsCb, [extractEmailsParams], cbsParams);
    }

    function extractEmailsProm(params) {
        const emailExtractor = EmailExtractor(params);
    
        return new Promise((resolve) => {
            emailExtractor.on('extraction-finished', (emails) => {
                resolve(emails);
            });
        });
    }
    
    function extractEmailsCb(err, emails, websiteId, websiteUrl, fnId) {
        if (err) {
            console.log(err);
            process.emit(CATCHER_ERR_EVENT__TERM, JSON.stringify(err, null, 2));
            return;
        }
        
        console.log(`emails for: ${websiteUrl}`);
        console.log(emails);
        let hasFoundEmals = emails.length > 0;
        if (hasFoundEmals) {
            insertEmailsIntoDb(emails, websiteId);
        } else {
            console.log(`/////////\nno email found for:\n${websiteUrl} //// ${fnId}`);
            loggeWebsiteWithNoEmail(websiteId, websiteUrl, fnId);
        }
    }
    
    function insertEmailsIntoDb(emails, websiteId) {
        hotelsModel.insertEmails(emails, websiteId, batchId, (err, results) => {
            if (err) {
                process.emit(CATCHER_ERR_EVENT__TERM, JSON.stringify(err, null, 2));
                return
            }
        });
    }
    
    function loggeWebsiteWithNoEmail(websiteId, websiteUrl) {
        let filePath = path.join(process.cwd(), `./log/no-email-websites/${batchId}`)
        let content = `\nid: ${websiteId}\nurl: ${websiteUrl}\n`;
        logger(filePath, content)
    }
});