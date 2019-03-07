/* DESCRIPTION:
    This module accepts
*/
const fs = require('fs');

function moduleLinker(modulesPath, nodeModulesPath) {
    modulesFoldersName = modulesPath.match(/[^/]*$/)[0];
    var modulesSymlinkPath = `${nodeModulesPath}/${modulesFoldersName}`;
    try {
        fs.mkdirSync(nodeModulesPath)
        console.log(modulesPath);
    } catch (err) {
        if (err.code !== "EEXIST") {
            console.log(`${nodeModulesPath} already exists no need to create it.`);
            return true;
        }
    }
    
    try {
        fs.symlinkSync(modulesPath, modulesSymlinkPath);
        console.log(modulesPath);
    } catch (err) {
        if (err.code !== "EEXIST") {
            console.log(`${modulesPath} already exists in ${modulesSymlinkPath}`);
            return true
        };
    }
}