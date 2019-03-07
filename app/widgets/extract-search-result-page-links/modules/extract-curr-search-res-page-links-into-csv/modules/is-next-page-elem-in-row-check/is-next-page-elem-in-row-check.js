module.exports = ((config) => {
    const {
        PAGI_LINKS_CLICKABLE__SUBSEL
    } = config;
    
    return isNextPagiElemInRowCheck;
    
    function isNextPagiElemInRowCheck($allPagiElemsOnCurrPage, i) {
        let prevItemsIndex = i === 0 ? i : i - 1;
        let prevPagiElemsPgNum = getPgNumb($allPagiElemsOnCurrPage.eq(prevItemsIndex));
        let currPagiElemsPgNum = getPgNumb($allPagiElemsOnCurrPage.eq(i));

        let isNextPagiElemInRow = prevPagiElemsPgNum === 1;
        isNextPagiElemInRow = prevPagiElemsPgNum + 1 === currPagiElemsPgNum || isNextPagiElemInRow;
        isNextPagiElemInRow = Boolean(isNextPagiElemInRow);
        
        return isNextPagiElemInRow;
    }

    function getPgNumb($pagiElem) {
        return parseInt($pagiElem.children(PAGI_LINKS_CLICKABLE__SUBSEL).text().trim());
    }
});