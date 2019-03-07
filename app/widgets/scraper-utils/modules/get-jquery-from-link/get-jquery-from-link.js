const config = require('config');
const cheerio = require('cheerio');
const rp = require('request-promise');

const HEADERS = config.headers.submitSearchReqHeaders;

module.exports = getJqueryFromLink

function getJqueryFromLink(link, i = 0) {
    var options = {
        uri: link,
        headers : HEADERS,
        gzip : true,
        transform: function (body) {
            return cheerio.load(body);
        }
    };
    
    return new Promise((resolve, reject) => {
        rp(options)
        .then($ => {
            resolve($)
        })
        .catch(err => {
            doRequestAgainOnErr(err, reject, link, i);
        });
    });  
}

function doRequestAgainOnErr(err, reject, link, i) {
    let hasBeenCalledAgain3times = i >=4;
    if (hasBeenCalledAgain3times) {
        reject(err)
    } else {
        i++;
        getJqueryFromLink(link, i)
    } 
}