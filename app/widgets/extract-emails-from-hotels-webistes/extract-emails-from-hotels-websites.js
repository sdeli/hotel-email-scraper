const path = require('path');
const config = require('config');

const hotelsModel = require('models/hotels-model');
const PromiseTaskQueue = require('./modules/promise-task-queue-class/promise-task-queue-class.js');
const promiseTaskQueue = new PromiseTaskQueue();

const EmailExtractor = require('./modules/extract-emails-from-website-class/extract-emails-from-website-class.js');
const {logger} = require('widgets/scraper-utils');

const MAX_PAGE_EXTRACTION_COUNT = config.emailScraper.maxPageExtraction,
    CATCHER_ERR_EVENT__TERM = config.errors.events[0];
    ERR_LOG_FOLDER__PATH = config.emailScraper.errorLog;

module.exports = ((batchId) => {
    // let extractEmailsParams = {
    //     mainPageExtractionCount : MAX_PAGE_EXTRACTION_COUNT,
    //     websiteUrl : "http://www.brillantengrund.com/",
    //     fnId : 1,
    //     batchId : '2019-03-03_12-39-25',
    //     errLogFolderPath : ERR_LOG_FOLDER__PATH 
    // }

    // const emailExtractor = EmailExtractor(extractEmailsParams)
    // emailExtractor.on('extraction-finished', (emails) => {
    //     resolve(emails);
    // });
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