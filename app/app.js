const path = require('path');
let moduleLinker = require('./widgets/modules-linker/module-linker.js');

let pathToWidgets = `${__dirname}/widgets`;
let pathToModels = `${__dirname}/models`;
let pathToConfig = `${__dirname}/config`;
let pathToNodeModules = path.join(`${__dirname}/../node_modules`);

moduleLinker.configure({
    MODULES_FOLDER_NAME : 'modules',
    NODE_MODULES_FOLDER_NAME : 'node_modules'
});

moduleLinker = moduleLinker.getInst();
moduleLinker(false, pathToWidgets, pathToNodeModules);
moduleLinker(false, pathToModels, pathToNodeModules);
moduleLinker(false, pathToConfig, pathToNodeModules);

const dotenv = require('dotenv');

let err = dotenv.config({ path: './.env.default' });
let env = process.env;

const hotelScraper = require('./services/hotel-scraper/hotel-scraper.js');
// const ipAndPortFeeder = require('./services/ip-and-port-feeder/server.js'); 
hotelScraper();