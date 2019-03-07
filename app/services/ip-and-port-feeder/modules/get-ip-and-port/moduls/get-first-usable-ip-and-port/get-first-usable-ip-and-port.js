module.exports = ((config) => {
    const {
        DELAY_UNTIL_IP_FREE_TO_USE__MIL_SECS
    } = config;

    return getFirstUsableIpAndPort;
    
    function getFirstUsableIpAndPort(ipsAndPorts) {
        for (let i = 0; i < ipsAndPorts.length; i++) {
            let currIpAndPort = ipsAndPorts[i];

            if(isCurrIpAndPortUsableCheck(currIpAndPort)) {
                currIpAndPort.isNowUsable = true;
                return currIpAndPort;
            }   
        }
        
        let firstFreedUpIpAndPort = getFirstFreeUpIpAndPort(ipsAndPorts);
        firstFreedUpIpAndPort.isNowUsable = false;
        return firstFreedUpIpAndPort;
    }
    
    function isCurrIpAndPortUsableCheck(currIpAndPort) {
        /*if currIpAndPort doesnt have a 'lastTimeInUse' property it means it wasnt used at all so it is can not be inactive in a timespan*/
        let wasntIpUsedAtAll = !Boolean(currIpAndPort.lastTimeInUse);
        if (wasntIpUsedAtAll) return true
    
        currLinuxTime = new Date().getTime();
    
        isIpAlreadyOutOfTheTimespan = DELAY_UNTIL_IP_FREE_TO_USE__MIL_SECS < (currLinuxTime - currIpAndPort.lastTimeInUse)
        if (isIpAlreadyOutOfTheTimespan) {
            return true;
        } else {
            return false;
        }
    }
    
    function getFirstFreeUpIpAndPort(ipsAndPorts) {
        lastTimesInUseArr = ipsAndPorts.map(ipAndPortObj => {
            return  ipAndPortObj.lastTimeInUse
        });

        firstExpiringTimeSpan = Math.min(...lastTimesInUseArr);
        indexOfFirstFreedUpIpAndPort = lastTimesInUseArr.indexOf(firstExpiringTimeSpan);

        let firstFreedUpIpAndPort = ipsAndPorts[indexOfFirstFreedUpIpAndPort];

        return firstFreedUpIpAndPort;
    }   
});