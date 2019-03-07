const mysql = require('mysql');

const db = (function(){
    let connPool;
    init();

    function init() {
        let hasNoDbConnInnitialized = connPool === undefined;

        if (hasNoDbConnInnitialized) {
            connPool = getDbConnPool();
        }
    }

    function getDbConnPool() {
        return mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database : process.env.DB_NAME,
            multipleStatements : true
        });
    }

    function queryProm(sql) {
        return new Promise((resolve, reject) => {
            connPool.query(sql, (err, results, fields) => {
                try {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                } catch (err) {
                    reject(err);
                }
            });
        });
    }

    return {
        escape : mysql.escape,
        queryProm,
        queryCb : (sql, cb) => connPool.query(sql, cb)
    }
}());


module.exports = db;

