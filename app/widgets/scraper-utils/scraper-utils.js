const fs = require('fs');
const shortenUrl = require('node-url-shortener');
const getJqueryFromLink = require('./modules/get-jquery-from-link/get-jquery-from-link.js');
const makeRequest = require('./modules/make-request/make-request.js');

function getRandomNumber(max, min) {
    let randomFloat = Math.random() * (max - min) + min ;
    let randomInt = Math.floor(randomFloat);
    return randomInt;
}

function shortUrlPromise(longUrl) {
    return new Promise((resolve, reject) => {
        shortenUrl.short(longUrl, function(err, shortUrl){
            if (err) {
                reject(err);
                return;
            }

            resolve(shortUrl)
        });
    });
}

async function clickElemMultipalTimes(page, itemSel, clickCount) {
    for (let i = 0; i < clickCount; i++) {
        await page.click(itemSel);
        await page.waitForSelector(itemSel);
    }

    return true;
}

function getFormattedDate() {
    var date = new Date();

    var month = date.getMonth() + 1;
    var day = date.getDate();
    var hour = date.getHours();
    var min = date.getMinutes();
    var sec = date.getSeconds();

    month = (month < 10 ? "0" : "") + month;
    day = (day < 10 ? "0" : "") + day;
    hour = (hour < 10 ? "0" : "") + hour;
    min = (min < 10 ? "0" : "") + min;
    sec = (sec < 10 ? "0" : "") + sec;

    var str = date.getFullYear() + "-" + month + "-" + day + "_" +  hour + "-" + min + "-" + sec;

    /*alert(str);*/

    return str;
}

function writeOrAppendToFile(filePath, content) {
    let doesFileExist = fs.existsSync(filePath);

    return new Promise((resolve, reject) => {
        if (doesFileExist) {
            fs.appendFile(filePath, content, (err) => {
                if (err) reject(err);
                resolve();
            });
        } else {
            fs.writeFile(filePath, content, (err) => {
                if (err) reject(err);
                resolve();
            });
        }
    });
}

function readCsvIntoArr(filePath) {
    let linksInStr = fs.readFileSync(filePath, 'utf-8');
    let linksArr = linksInStr.split("\n");
    linksArr.pop() // last item is always an emtyp "\n"
    return linksArr;
}

function logger(filePath, content) {
    content = `\n\nlog: ${getFormattedDate()}\n${content}\n`;
    content += '==========================='
    return writeOrAppendToFile(filePath, content)
}

function createFolder(dirPath) {
    return new Promise((resolve, reject) => {
        fs.mkdir(dirPath, { recursive: true }, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve()
            }
        });
    });
}


module.exports = {
    getRandomNumber,
    clickElemMultipalTimes,
    getFormattedDate,
    writeOrAppendToFile,
    getJqueryFromLink,
    readCsvIntoArr,
    makeRequest,
    logger,
    createFolder
}