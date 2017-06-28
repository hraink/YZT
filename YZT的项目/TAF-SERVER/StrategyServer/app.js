'use strict';
let Taf     = require('@taf/taf-rpc');
let log     = require('./lib/log');
let util   = require('./lib/util');
let libData = require('./lib/data');

//异常捕获逻辑 Start //
process.on('uncaughtException', err => {
    log.error.info('uncaughtException', err.message + '\n' + err.stack);
});

process.on('unhandledRejection', (reason, p) => {
    log.error.info("Unhandled Rejection at: Promise ", p, " reason: ", reason);
});

process.on('rejectionHandled', (reason, p) => {
    log.error.info("Rejection Unhandled at: Promise ", p, " reason: ", reason);
});
var startT = new Date().getTime();
log.initdata.info('初始化开始');
//异常捕获逻辑 End //
util.init().then(() => {
    return libData.init();
}).then(() =>{
    var endT = new Date().getTime();
    log.initdata.info('初始化耗时',endT-startT);
    let Strategy  = require('./jce/StrategyServerImp').Strategy;
    Taf.server.getServant(util.conf).forEach(config => {
        let map = {
            'AI.StrategyServer.StrategyServerObj' : Strategy.StrategyInterfImp,
        };
        if (map[config.servant]) {
            console.info("try to start servant..." + config.servant);
            Taf.server.createServer(map[config.servant]).start(config);
            console.info("servant start success..." + config.servant);
        } else {
            log.error.info('servant does not exit...' + config.servant);
        }
    });
}).catch(err => { log.error.info('some error happened when the server start', err && err.message, '\n', err && err.stack);});

