const config = require('config');
const TaskQueue = require('widgets/task-queue');
const hotelsModel = require('models/hotels-model');
const {readCsvIntoArr, makeRequest} = require('widgets/scraper-utils');

// const extractCurrHotelsInfos = require('./modules/extract-curr-hotel-infos-proc/extract-curr-hotel-infos-proc.js');

const HOTEL_PAGE_LINKS_FOLDER__PATH = config.pathes.hotelSubPageLinks,
    EXTRACT_HOTEL_INFOS_PROCESS__PATH = __dirname + '/modules/extract-curr-hotel-infos-proc/extract-curr-hotel-infos-proc.js',
    HOTEL_NAME__SEL = config.selectors.hotelPage.hotelName,
    HOTEL_ADDR__SEL = config.selectors.hotelPage.hotelAddr,
    COUNTRY = config.general.searchedCountry,
    CATCHER_ERR_EVENT__TERM = config.errors.events[0];
    
const PARALLEL_REQUEST_COUNT = 10;

module.exports = extractHotelInfos

async function extractHotelInfos(batchId) {
    let hotelPageLinksArr = getHotelPageLinks(batchId);
    
    for (let i = 0; i < hotelPageLinksArr.length; i += PARALLEL_REQUEST_COUNT) {
        try {
            await extract10HotelPagesForInfos(hotelPageLinksArr, i, batchId)
        } catch (err) {
            console.log('err handling');
            console.log(err);
        }

        console.log(`next ${i} - ${i + PARALLEL_REQUEST_COUNT} =================`);
    }    

    console.log('finished');
}

function getHotelPageLinks(batchId) {
    let hotelPageLinksFilePath = `${HOTEL_PAGE_LINKS_FOLDER__PATH}/${batchId}`
    let hotelPageLinksArr = readCsvIntoArr(hotelPageLinksFilePath);

    return hotelPageLinksArr;
}

function extract10HotelPagesForInfos(hotelPageLinksArr, i, batchId) {
    let currHotelPageLinksArr = hotelPageLinksArr.slice(i, i + PARALLEL_REQUEST_COUNT);

    let getHotelPgHtmlsPromisesArr = currHotelPageLinksArr.map(hotelPageLink => {
        return makeRequest(hotelPageLink, true);
    });

    const taskQueue = new TaskQueue();
    return new Promise((resolve, reject) => {
        Promise.all(getHotelPgHtmlsPromisesArr)
        .then(hotelPgHtmlsArr => {
            return getHotelInfosObjs(taskQueue, hotelPgHtmlsArr, batchId);
        })
        .then((hotelInfosArr) => {
            return hotelsModel.hotelInfosFromBookingIntoDb(hotelInfosArr);
        })
        .then(() => {
            resolve();
        })
        .catch(err => {
            console.log(err);
            process.emit(CATCHER_ERR_EVENT__TERM, JSON.stringify(err, null, 2));
            reject(err);
        });
    });
}

function getHotelInfosObjs(taskQueue, hotelPgHtmlsArr, batchId) {
    let getHotelInfosPromisesArr = [];
    
    for (let i = 0; i < hotelPgHtmlsArr.length; i++) {
        let hotelPgHtml = hotelPgHtmlsArr[i];

        if (hotelPgHtml === false) {
            continue;
        } else {
            getHotelInfosPromisesArr.push(
                getHotelInfosObj(taskQueue, hotelPgHtml, batchId)
            );
        }
    }

    return Promise.all(getHotelInfosPromisesArr)
}

function getHotelInfosObj(taskQueue, hotelPgHtml, batchId) {
    let subProcessPath = EXTRACT_HOTEL_INFOS_PROCESS__PATH;
    let extractionParams = {
        HOTEL_NAME__SEL,
        HOTEL_ADDR__SEL,
        COUNTRY,
        batchId,
        hotelPgHtml
    }

    return new Promise((resolve, reject) => {
        let cbParams = [resolve, reject];
        taskQueue.addTask(subProcessPath, resolveRejectCb, [extractionParams], cbParams);
    });
}

function resolveRejectCb(err, results, resolve, reject) {
    if (err) {
        console.log(err)
        reject(err);
    } else {
        resolve(results)
    }
}