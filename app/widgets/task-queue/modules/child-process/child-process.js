process.on('message', ({taskId, tasksFilePath, taskParamsArr}) => {
    let fnPromise = require(tasksFilePath);

    fnPromise(...taskParamsArr)
    .then(results => {
        process.send({taskId, results});
    })
    .catch(err => {
        process.send({taskId, err : err.toString()});
    })
});