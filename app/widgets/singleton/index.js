Singleton = ((modul) => {
    let isConfigured = false;
    let modulInst;

    function configure(config) {
        if (!isConfigured) {
            isConfigured = true;
            modulInst = modul(config);
        } else {
            return false;
        }
    }
    
    function getInst() {
        if (isConfigured) {
            isConfigured = true;
            return modulInst;
        } else {
            return false;
        }
    }

    return {
        configure,
        getInst
    }
});

module.exports = Singleton;

