const url = require('url');
const {getJqueryFromLink, writeOrAppendToFile} = require('widgets/scraper-utils');

module.exports = ((params) => {
    const {
        HOTEL_PAGE_LINKS_CLICKABLE__SEL,
        WEBSITES_BASE__URL,
        HOTEL_PAGE_LINKS_FILE__PATH
    } = params;
    
    return extractCurrHotelPageLinksIntoFile(params.hotelSearchResPgLink);

    function extractCurrHotelPageLinksIntoFile(hotelSearchResPgLink) {
        return new Promise((resolve) => {
            getJqueryFromLink(hotelSearchResPgLink)
            .then($ => {
                let curHotelPageLinks = getCurrHotelPageLinks($);
                return writeLinksIntoFile(curHotelPageLinks);
            })
            .then(() => {
                resolve(true);
            })
            .catch(err => {
                reject(err);
            })
        });
    }
    
    function getCurrHotelPageLinks($) {
        let currHotelSubPageATags = $(HOTEL_PAGE_LINKS_CLICKABLE__SEL);
        let curHotelSubPageLinks = [];
        
        currHotelSubPageATags.each((i, aTag) => {
            let localLink = url.format(aTag.attribs.href.trim());
            let absoluteLink = `${WEBSITES_BASE__URL}${localLink}`;
            curHotelSubPageLinks.push(absoluteLink);
        });
        
        return curHotelSubPageLinks
    }
    
    function writeLinksIntoFile(hotelPageLinksArr) {
        let hotelPageLinksCsvValue = hotelPageLinksArr.join('\n') + "\n";
        return writeOrAppendToFile(HOTEL_PAGE_LINKS_FILE__PATH, hotelPageLinksCsvValue);
    }
});
