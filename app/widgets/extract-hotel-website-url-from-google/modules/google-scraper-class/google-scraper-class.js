const puppeteer = require('puppeteer');
const {getRandomNumber} = require('widgets/scraper-utils');
const url = require('url');

module.exports = ((config) => {
    const {
        IS_HEADLESS,
        HOTEL_WEBSITE_LINK_CONT__SEL
    } = config;
    
    class GoogleScraper {
        constructor(proxy) {
            this.proxy = proxy;
        }
        
        async init() {
            const {browser, page} = await launchPuppeterBrowser(this.proxy);
            this.browser = browser;
            this.page = page;
        }

        async getHotelWebsite(hotelName, fullAddr, delay) {
            let queryString = `search?q=${hotelName} ${fullAddr}`.replace(/\s/g, '+');
            let url = `https://www.google.com/${queryString}`;
            let randomDelay = getRandomNumber(delay.max, delay.min);

            let websiteUrl = await this.delayExecution(async (resolve) => {
                this.page.goto(url, {waitUntil : "networkidle0"})
                .then(async () => {
                    await this.page.waitForSelector(HOTEL_WEBSITE_LINK_CONT__SEL, {
                        timeout : 3000
                    });
                    
                    return this.extractHotelInfos(url);
                })
                .then((websiteUrl) => {
                    websiteUrl = trimWebsiteUrl(websiteUrl);
                    resolve(websiteUrl);
                })
                .catch(err => {
                    resolve({err});
                });
            }, randomDelay);

            return websiteUrl;
        }

        delayExecution(cb, randomDelay) {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    cb(resolve, reject);
                }, randomDelay);
            });
        }

        async checkIfCurrPageIsCaptcha() {
            let isCaptcha = await this.page.url().includes('sorry');
            return isCaptcha;
        }

        async extractHotelInfos() {
            let currHotelsWebsiteUrl = await this.page.$eval(HOTEL_WEBSITE_LINK_CONT__SEL, hotelWebsiteCont => {
                let aTags = hotelWebsiteCont.children;

                for (let i = 0; i < aTags.length; i++) {
                    let isATagOfCurrHotelsWebsite = aTags[i].innerText.trim().includes('Website');
                    if (isATagOfCurrHotelsWebsite) {
                        currHotelsWebsiteUrl = aTags[i].href;
                        return currHotelsWebsiteUrl;
                    }
                }

                return false;
            });
            
            return currHotelsWebsiteUrl
        }

        async close() {
            await this.browser.close();
        }
    }
    
    async function launchPuppeterBrowser(proxyObj) {
        let proxy = `--proxy-server=${proxyObj.ip}:${proxyObj.port}`;

        let launchOpts = {
            headless: IS_HEADLESS,
            ignoreHTTPSErrors : true,
            args: [proxy]
        }
    
        const browser = await puppeteer.launch(launchOpts);
        const page = await browser.newPage();
        await page.authenticate({ 
            username : proxyObj.userName, 
            password : proxyObj.pwd
        });
    
        await page.setViewport({width: 1285, height: 644});
        await page.setJavaScriptEnabled(false);
        return {browser, page};
    }

    function trimWebsiteUrl(websiteUrl) {
        // Google gives the hotels websites link in the link of a google query.. the q parameter will include the link of the hotel
        let googleQuery = url.parse(websiteUrl, true);

        let isGoogleSearchLink = googleQuery.host.includes('google');
        if (isGoogleSearchLink) {
            let hasQueryString = Boolean(googleQuery.query);
            if (!hasQueryString) throw new Error('not proper url: ' + websiteUrl);

            let queryStringHasPropIncludingwebsiteLink = Boolean(googleQuery.query.q);
            if (!queryStringHasPropIncludingwebsiteLink) throw new Error('not proper url: ' + websiteUrl);

            let isQueryParamAWebsite = Boolean(url.parse(googleQuery.query.q, true).host)
            if (isQueryParamAWebsite) {
                return googleQuery.query.q;
            } else {
                throw new Error('not proper url: ' + websiteUrl);
            }
        } else {
            return websiteUrl;
        }

    }
    
    return GoogleScraper;
});