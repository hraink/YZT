'use strict';
let TafConfig   = require('@taf/taf-config');
var ConfigParser = require('@taf/taf-utils').Config;
let fs          = require('fs');
let logger = require('./log');
let serverconf = null;

exports.conf = process.env.TAF_CONFIG || `./AI.StrategyServer.conf`;

exports.init = () => {
    return new Promise(res => {
        if (process.env.TAF_CONFIG) {
            (new TafConfig()).getAllConfigData().then(data => {
                let configFile =data['StrategyServer.conf'];
                serverconf = parseConf(configFile);
                res();
            },err=>{
                logger.error.info('init config err-------------',err);
            }).done();

        } else {
            let configFile =fs.readFileSync('./StrategyServer.conf', 'utf8').toString();
            serverconf = parseConf(configFile);
            res();
        }
    });
};

function parseConf(content) {
    var configParser = new ConfigParser();
    configParser.parseText(content, 'utf8');
    return configParser.data;
}

exports.getConf = () => serverconf;