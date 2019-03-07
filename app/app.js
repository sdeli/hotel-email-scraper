const path = require('path');
let {moduleLinker} = require('./widgets/scraper-utils');

let pathToWidgets = `${__dirname}/widgets`;
let pathToModels = `${__dirname}/models`;
let pathToConfig = `${__dirname}/config`;
let pathToNodeModules = path.join(`${__dirname}/../node_modules`);

moduleLinker(pathToWidgets, pathToNodeModules);
moduleLinker(pathToModels, pathToNodeModules);
moduleLinker(pathToConfig, pathToNodeModules);

const dotenv = require('dotenv');

let err = dotenv.config({ path: './.env.default' });
let env = process.env;

const hotelScraper = require('./controllers/hotel-scraper/hotel-scraper.js');
// hotelScraper();