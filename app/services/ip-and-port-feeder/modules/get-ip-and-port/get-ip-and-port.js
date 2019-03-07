/* DESCRIPTION:
- getIpPortObj returns an ip address and port from the ipsAndPorts object.
- All ip addresses can be used in a certain timespan just once. this timespan is defined in the  DELAY_UNTIL_IP_FREE_TO_USE__MIL_SECS constant
- the getIpPortObj module keeps track of which ipsandports were used in a still not expired timespan and gives you a one which is already freed up.
- If there are no ips and ports which could be immediatley used than it leaves the request pending and takes one which is the first which will be freed up, waits until it frees up and returns this. During this process the call to getIpPortObj function remains pending since it works via a promise and it resolves when the ip and port are free to use (if there is an ip and promise free to use then obviously the promise resolve immediatley and the call wont wait.)
*/

let ipsAndPorts = require('./assets/ips-and-ports.json').ips;
let getFirstUsableIpAndPort = require('./moduls/get-first-usable-ip-and-port/get-first-usable-ip-and-port.js');

module.exports = ((config) => {
    const {
        DELAY_UNTIL_IP_FREE_TO_USE__MIL_SECS
    } = config;
    
    getFirstUsableIpAndPort = getFirstUsableIpAndPort({
        DELAY_UNTIL_IP_FREE_TO_USE__MIL_SECS
    });
    
    return getIpPortObj

    function getIpPortObj() {
        return new Promise((resolve) => {
            let ipAndPort = getFirstUsableIpAndPort(ipsAndPorts);
    
            if (ipAndPort.isNowUsable) {
                delete ipAndPort.isNowUsable
                ipAndPort.lastTimeInUse = new Date().getTime();

                resolve({
                    ip : ipAndPort.ip,
                    port : ipAndPort.port,
                    userName : ipAndPort.userName,
                    pwd : ipAndPort.pwd
                });
                return;
            }
            
            delete ipAndPort.isNowUsable
            resolveWhenIpAndPortIsFreedUp(ipAndPort, resolve)
        });
    }
    
    function resolveWhenIpAndPortIsFreedUp(ipAndPort, resolve) {
        let currLinuxTime = new Date().getTime();

        let releaseTime = DELAY_UNTIL_IP_FREE_TO_USE__MIL_SECS - (currLinuxTime - ipAndPort.lastTimeInUse) + 10;

        ipAndPort.lastTimeInUse = currLinuxTime + releaseTime;

        setTimeout(() => {
            resolve({
                ip : ipAndPort.ip,
                port : ipAndPort.port,
                userName : ipAndPort.userName,
                pwd : ipAndPort.pwd
            })
        }, releaseTime);
    }
});