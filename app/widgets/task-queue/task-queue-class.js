const os = require('os');
const EventEmitter = require('events');
const spawn = require('child_process').spawn;
const config = require('config');
const uniqid = require('uniqid');

const childProcessRunnerFilePath = __dirname + '/modules/child-process/child-process.js';
const CPU_COUNT = os.cpus().length;

const MAX_CONCURRENCY = config.taskQueue.maxConcurrency || CPU_COUNT - 1,
    NODE_EXECUTABLE = config.taskQueue.nodePath
    
class TaskQueue {
    constructor(maxConcurrency = MAX_CONCURRENCY) {
        this.maxConcurrency = maxConcurrency;
        this.obeserver = new EventEmitter();
        this.tasks = [];
        this.callBacks = [];
        this.freeChildProc = [];
        this.taskCounter = 0;
        this.obeserver.on('execute-task', () => {
            let areFreeChildProcToRunTask = this.freeChildProc.length > 0;
            let areDueTasks = this.tasks.length > 0;

            if (areFreeChildProcToRunTask && areDueTasks) {
                this.execute();
            }

            let noMoreDueTasks = this.callBacks.length === 0;
                noMoreDueTasks &= this.freeChildProc.length === this.maxConcurrency;
            if (noMoreDueTasks) {
                this.shutDownChildProcesses()
            }
        })

        this.initiateWorkerThreads();
    }
    
    addTask(tasksFilePath, cb, taskParamsArr = [], cbsParamsArr = []) {
        let taskId = uniqid();
        this.tasks.push({taskId, tasksFilePath, cb, taskParamsArr, cbsParamsArr});
        this.obeserver.emit('execute-task')
    }
    
    execute() {
        let {taskId, tasksFilePath, cb, taskParamsArr, cbsParamsArr} = this.tasks.shift();
        this.callBacks.push({taskId, cb, cbsParamsArr})
        let childProc = this.freeChildProc.shift();
        
        console.log('executed task count: ' + this.taskCounter);
        this.taskCounter++;
        childProc.send({taskId, tasksFilePath, taskParamsArr});
    }
    
    initiateWorkerThreads() {
        for (let i = 0; i < this.maxConcurrency; i++) {
            let childProc = this.initiateWorkerThread(i);
            this.freeChildProc.push(childProc);  
        }
    }
    
    initiateWorkerThread(processId) {
        let program = NODE_EXECUTABLE
        let options = {
            stdio: [ 'pipe', 'pipe', 'pipe', 'ipc' ]
        };
        let parameters = [
            childProcessRunnerFilePath,
        ];
        
        let childProc = spawn(program, parameters, options);
        
        childProc.on('message', msg => {
            
            let didTaskExecuteSuccesfully = !msg.err && msg.results;
            if (didTaskExecuteSuccesfully) {
                this.freeChildProc.push(childProc);
                this.runCurrTasksCb(false, msg.taskId, msg.results);
                this.obeserver.emit('execute-task')
            } 
            
            let taskExecutedWithErr = msg.err && !msg.results
            if (taskExecutedWithErr) {
                console.log(`proc-${processId} message:`);
                console.log(msg);
                console.log(`proc-${processId} message end`);
                this.freeChildProc.push(childProc);
                this.runCurrTasksCb(msg.err, msg.taskId, null);
                this.obeserver.emit('execute-task')
            }
            
            if (msg.warning) {
                console.log(`proc-${processId} warning:`);
                console.log(msg.warning);
            }

            if (!didTaskExecuteSuccesfully && !taskExecutedWithErr) {
                console.log('error handling')
                console.log(`proc-${processId} unexpected happening:`);
                console.log(msg);
            }
        });

        childProc.stdout.on('data', data => {
            console.log(`proc-${processId}: ${data.toString()}`);
        });
        
        childProc.stderr.on('data', data => {
            console.log(`proc-${processId} err:\n ${data.toString()}`);
        });

        childProc.on('exit', data => {
            // if the child process exited and it is not the end of all tasks then the exit was due to an error and so new child process has to be spawned
            let isNotEndOfAllTasks = this.callBacks.length !== 0;
                isNotEndOfAllTasks &= this.freeChildProc.length !== this.maxConcurrency;
                if(isNotEndOfAllTasks) {
                    this.initiateWorkerThread();
                }
        });

        return childProc;
    }

    runCurrTasksCb(err, taskId, results) {
        let cbOfCurrFnObj = getCbOfCurrTask(this.callBacks, taskId);

        let indexOfCb = this.callBacks.indexOf(cbOfCurrFnObj);
        this.callBacks.splice(indexOfCb, 1);

        setImmediate(() => {
            // console.log('err handling what if no taskId');
            let cbsParamsArr = cbOfCurrFnObj.cbsParamsArr;
            // console.log('asd');
            cbOfCurrFnObj.cb(err, results, ...cbsParamsArr);
        });
    }

    shutDownChildProcesses() {
        this.freeChildProc.forEach(childProc => {
            this.freeChildProc[0].stdin.write('majom2');
            childProc.kill('SIGINT');
        });
    }
}


function getCbOfCurrTask(callbacks, currTaskId) {
    let cbOfCurrFnObj = callbacks.find(cbObj => {
        isthisCbTheRequestedCb = cbObj.taskId === currTaskId;
        
        return isthisCbTheRequestedCb;
    })
    
    return cbOfCurrFnObj;
}

module.exports = TaskQueue;