/* DESCRIPTION:
    * This modules intention is to provide ip address and the correspoinding ports, passwords, usernames for the entire application
    * The module keeps track when the ip was in use last time and then it doesnt give out such ip address which were used in a certain timeframe.
    * It comes in handy when you are scraping an api which denies to repsond correctly if from the sender ip more requests came then allowed in a certain time.
    * Basically when the api doesnt want somebody to blast his server with requests (For example google doesnt want you to scrape his search results 1000 times per second).
    * This module provides a way around this via hiding all request behind an ip which was not used in that timespan the api expects.
    * The startIpFeederServer() creates a server on a request can be sent for an ip adress and the getIpAndPort() function will get an ip which is free to use. If there is an ip which wasnt used recently then it gives it out, if there is no one then it keeps the whole request waiting until the first one gets freed up.
*/

const config = require('config');
const http = require('http');

const DELAY_UNTIL_IP_FREE_TO_USE__MIL_SECS = config.ipFeeder.delayInMilSecs,
    REQUEST_IP_AND_PORT__URL_PATH = config.ipFeeder.urlPath,
    PORT = config.ipFeeder.listenPort;

let getIpAndPort = require('./modules/get-ip-and-port/get-ip-and-port.js')({
    DELAY_UNTIL_IP_FREE_TO_USE__MIL_SECS
});

module.exports = startIpFeederServer;

function startIpFeederServer() {
    http.createServer(function (req, res) {
        const requestPath = req.url.replace(/^\/+|\/+$/g, '');
    
        if (requestPath === REQUEST_IP_AND_PORT__URL_PATH) {
            respondWithIpAndPort(res); 
        } else {
            respondWithInvalidCall(res);
        }
    })
    .listen(PORT);
}

function respondWithIpAndPort(res) {
    getIpAndPort()
    .then(ipAndPortObj => {
        let ipAndPortJson = JSON.stringify(ipAndPortObj);
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.write(ipAndPortJson);
        res.end();
    })
}

function respondWithInvalidCall(res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.write('invalid call');
    res.end();
}
