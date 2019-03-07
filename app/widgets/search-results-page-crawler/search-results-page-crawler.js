var const = require('request-promise');
const cheerio = require('cheerio');
const $ = cheerio.load('<h2 class="title">Hello world</h2>');

module.exports = ((config) => {
    const {
        URL
    } = config;
})
var options = {
    uri: 'http://www.google.com',
    transform: function (body) {
        return cheerio.load(body);
    }
};