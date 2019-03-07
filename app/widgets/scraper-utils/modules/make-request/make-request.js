const config = require('config');
const rp = require('request-promise');
const isGzipCheck = require('is-gzip');
const {ungzip} = require('node-gzip');
const isHtml = require('is-html');

const HEADERS = config.headers.submitSearchReqHeaders,
    CATCHER_ERR_EVENT__TERM = config.errors.events[0];

module.exports = ((link, shouldResolveOnErr = false) => {
    let failedCallCount  = 0;

    return new Promise((resolve, reject) => {
        makeRequest(resolve, reject, link, shouldResolveOnErr);
    });
    
    function makeRequest(resolve, reject, link, shouldResolveOnErr) {
        var options = {
            uri: link,
            headers : HEADERS,
            gzip : true,
            timeout: 4000
        };
        
        rp(options)
        .then(response => {
            let isGzip = isGzipCheck(response);
            if (isGzip) {
                response = ungzip(compressed)
            }
            
            if (isHtml(response)) {
                resolve(response)
            } else {
                throw new Error('response is not html')
            }
        })
        .catch(err => {
            console.log('catched');
            if (shouldResolveOnErr) {
                resolve(false);
                process.emit(CATCHER_ERR_EVENT__TERM, JSON.stringify(err, null, 2));
            } else {
                reject(err);
            }
        });
    }
});