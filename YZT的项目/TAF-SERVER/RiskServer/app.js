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
//异常捕获逻辑 End //
util.init().then(() => {
    return libData.init();
}).then(() =>{
    let Risk  = require('./jce/RiskServerImp').Risk;
    Taf.server.getServant(util.conf).forEach(config => {
        let map = {
            'AI.RiskServer.RiskServerObj' : Risk.RiskInterImp,
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

