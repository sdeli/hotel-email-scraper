const config = require('config');
const http = require('http');
const free = require("free-memory");

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
