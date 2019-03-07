/* DESCRIPTION:
    * This widget is responsible for database access by the 'mysql' npm package
    * for proper functioning what it needs can be found in the getDbConnPool function
    * By the revealing modular pattern it exposes 3 methods for use:
        * escape() => escapes variables, that they can be interpolled into the queries avoiding the danger of sql injection attacks
        * queryCb => does a query against the databse
        * queryProm() => promisifed queryCb which reolves just the results from the database and rejects on error
*/

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

