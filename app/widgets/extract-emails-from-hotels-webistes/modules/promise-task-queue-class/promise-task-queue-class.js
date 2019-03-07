const EventEmitter = require('events');
const free = require("free-memory");

const maxConcurrentProms = 3;/*CPU_COUNT - 1;*/ // leave one core for the main thread

class PromiseTaskQueue extends EventEmitter {
    constructor(maxConcurrentPromsArg = maxConcurrentProms) {
        super();
        this.maxConcurrentProms = maxConcurrentPromsArg;
        this.promiseTasks = [];
        this.runningPromisesCount = 0;
        this.taskCounter = 0;

        this.on('execute-task', () => {
            free(function (err, info) {
                console.log(info);
            });

            console.log('runningPromisesCount: ' + this.runningPromisesCount);
            console.log('maxConcurrentProms: ' + this.maxConcurrentProms);

            let canRunNewPromise = this.runningPromisesCount < this.maxConcurrentProms;
            console.log('canRunNewPromise: ' + canRunNewPromise);
            let areDueTasks = this.promiseTasks.length > 0;

            if (canRunNewPromise && areDueTasks) {
                this.executePromise();
            }
            
            console.log('this.promiseTasks.length: ' + this.promiseTasks.length);
            let noMoreDueTasks = this.promiseTasks.length === 0;
            noMoreDueTasks &= this.runningPromisesCount === 0;
            if (noMoreDueTasks) {
                console.log('finished all tasks');
                this.emit('finished-all-tasks');
            }
        });
    }
    
    addPromiseTask(fnPromise, cb, fnParamsArr = [], cbsParamsArr = []) {
        this.promiseTasks.push({fnPromise, cb, fnParamsArr, cbsParamsArr});
        this.emit('execute-task');
    }
    
    executePromise() {
        let {fnPromise, cb, fnParamsArr, cbsParamsArr} = this.promiseTasks.shift();
        
        console.log('running promises count: ' + this.runningPromisesCount);
        this.taskCounter++;
        console.log('task: ' + this.taskCounter);
        this.runningPromisesCount++
        
        fnPromise(...fnParamsArr)
        .then(results => {
            this.runningPromisesCount--
            this.emit('execute-task');
            cb(null, results, ...cbsParamsArr);
        })
        .catch(err => {
            this.runningPromisesCount--
            this.emit('execute-task');
            cb(err, null, ...cbsParamsArr);
        });
    }
}

module.exports = PromiseTaskQueue;