const EventEmitter = require('events');
const uniqid = require('uniqid');
const googleScraper = require('../google-scraper-class/google-scraper-class.js');

module.exports = ((config) => {
    const {
        IS_HEADLESS,
        HOTEL_WEBSITE_LINK_CONT__SEL,
        PROXIES
    } = config;
    
    let GoogleScraper = googleScraper({
        IS_HEADLESS,
        HOTEL_WEBSITE_LINK_CONT__SEL
    })
    
    class GoogleScraperQueue {
        async init() {
            this.maxScraperCount = PROXIES.length;
            this.obeserver = new EventEmitter();
            this.tasks = [];
            this.callBacks = [];
            this.freeGoogleScrapers = [];
            this.executedTaskCount = 0;

            this.obeserver.on('execute-task', () => {
                let arefreeGoogleScrapersToRunTask = this.freeGoogleScrapers.length > 0;
                let areDueTasks = this.tasks.length > 0;
                if (arefreeGoogleScrapersToRunTask && areDueTasks) {
                    this.execute();
                }

                let finishedAllExecution = this.callBacks.length === 0;
                    finishedAllExecution &= this.tasks.length === 0;
                    finishedAllExecution &= this.freeGoogleScrapers.length === this.maxScraperCount;
                if (finishedAllExecution) {
                    this.shutDownBrowsers();
                }
            })
    
            await this.initGoogleScrapers();
        }
        
        addTask(keywords, cb, cbParamsArr = [], delay) {
            let taskId = uniqid();
            this.tasks.push({taskId, keywords, cb, cbParamsArr, delay});
            this.obeserver.emit('execute-task');
        }
        
        async execute() {
            let {taskId, keywords, cb, cbParamsArr, delay} = this.tasks.shift();
            this.callBacks.push({taskId, cb, cbParamsArr})
            let googleScraper = this.freeGoogleScrapers.shift();

            console.log(this.executedTaskCount);
            this.executedTaskCount++;
            var websiteUrl = await googleScraper.getHotelWebsite(...keywords, delay)
            
            this.freeGoogleScrapers.push(googleScraper);
            
            let errDuringExtraction = Boolean(websiteUrl.err);
            if (errDuringExtraction) {
                this.runCurrTasksCb(websiteUrl.err, taskId, keywords);
                this.obeserver.emit('execute-task');
                return;
            }
            
            let didntFindUrlForWebsite = websiteUrl === false;
            if (didntFindUrlForWebsite) {
                this.runCurrTasksCb(false, taskId, keywords);
                this.obeserver.emit('execute-task');
                return;
            }
            
            this.runCurrTasksCb(false, taskId, websiteUrl);
            this.obeserver.emit('execute-task');
        }

        async initGoogleScrapers() {
            for (let i = 0; i < this.maxScraperCount; i++) {
                let googleScraper = new GoogleScraper(PROXIES[i]);
                await googleScraper.init();
                this.freeGoogleScrapers.push(googleScraper);  
            }
        }
        
        runCurrTasksCb(err, taskId, results) {
            let cbOfCurrFnObj = getCbOfCurrTask(this.callBacks, taskId)
            // console.log('err handling what if no taskId');
            let indexOfCb = this.callBacks.indexOf(cbOfCurrFnObj);
            this.callBacks.splice(indexOfCb, 1);

            setImmediate(() => {
                let {cbParamsArr} = cbOfCurrFnObj;
                cbOfCurrFnObj.cb(err, results, ...cbParamsArr);
            });
        }

        async shutDownBrowsers() {
            let scrapersCount = this.freeGoogleScrapers.length;

            for (let i = 0; i < scrapersCount; i++) {
                await this.freeGoogleScrapers[i].close();
            }
        }
    }
    
    function getCbOfCurrTask(callbacks, currTaskId) {
        let cbOfCurrFnObj = callbacks.find(cbObj => {
            isthisCbTheRequestedCb = cbObj.taskId === currTaskId;
            
            return isthisCbTheRequestedCb;
        })
        
        return cbOfCurrFnObj;
    }

    return new GoogleScraperQueue();
});

