const cheerio = require('cheerio');
const uniqid = require('uniqid');

module.exports = ((params) => {    
    const {
        HOTEL_NAME__SEL,
        HOTEL_ADDR__SEL,
        COUNTRY
    } = params;

    return extractHotelInfos(params.hotelPgHtml, params.batchId)

    function extractHotelInfos(hotelPgHtml, batchId) {
        let hotelInfos = {};

        return new Promise((resolve, reject) => {
            hotelInfos.hotelId = uniqid();
            let $ = cheerio.load(hotelPgHtml);

            hotelInfos.hotelName = extractHotelName($);

            let isSelectorCorrect = hotelInfos.hotelName.lengt > 0;
            if (isSelectorCorrect) reject('incorrect selector: ' + HOTEL_NAME__SEL) 
            
            hotelInfos.fullAddr =  $(HOTEL_ADDR__SEL).text().trim().normalize().replace('\n', '');
            isSelectorCorrect = hotelInfos.fullAddr.lengt > 0;
            if (isSelectorCorrect) reject('incorrect selector: ' + HOTEL_ADDR__SEL) 
            
            hotelInfos.region =  hotelInfos.fullAddr.replace(/(.*,\s\d+\s)(.*)(,.*)/, '$2');
            hotelInfos.country = COUNTRY;
            hotelInfos.batchId = batchId;
            
            resolve(hotelInfos);
        });
    }

    function extractHotelName($) {
        let hotelNameH2 = $(HOTEL_NAME__SEL);
        hotelNameH2.children().remove();
        let hotelName = hotelNameH2.text().replace(/\n/g, ' ').trim().normalize();

        return hotelName;
    }
});