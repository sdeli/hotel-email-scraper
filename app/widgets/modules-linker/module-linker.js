const fs = require('fs');

const Singleton = require('./modules/singleton/singleton.js');

module.exports = Singleton(((config) => {
    let {
        MODULES_FOLDER_NAME,
        NODE_MODULES_FOLDER_NAME
    } = config;
    
    return moduleLinker

    function moduleLinker(cwd, modulesPath, nodeModulesPath) {
        modulesPath = modulesPath ? modulesPath : `${cwd}/${MODULES_FOLDER_NAME}`;
        modulesFoldersName = modulesPath.match(/[^/]*$/)[0];

        if (nodeModulesPath) {
            var modulesSymlinkPath = `${nodeModulesPath}/${modulesFoldersName}`;
        } else {
            var modulesSymlinkPath = `${cwd}/${NODE_MODULES_FOLDER_NAME}/${modulesFoldersName}`;
        }
        
        linkModulesToNodeModules(modulesPath, nodeModulesPath, modulesSymlinkPath)
    }

    function linkModulesToNodeModules(modulesPath, nodeModulesPath, modulesSymlinkPath) {
        createNodeModulesFolderIfDoesntExist(nodeModulesPath);

        try {
            fs.symlinkSync(modulesPath, modulesSymlinkPath);
        } catch (err) {
            if (err.code !== "EEXIST") throw new Error(err);
            return true
        }
    }

    function createNodeModulesFolderIfDoesntExist(nodeModulesPath) {
        try {
            fs.mkdirSync(nodeModulesPath)
        } catch (err) {
            if (err.code !== "EEXIST") throw new Error(err);
            return true;
        }
    }
}));