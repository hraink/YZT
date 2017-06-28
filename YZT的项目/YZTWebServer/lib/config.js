/*
 * Taf config 读取
 */
'use strict';
const Q = require('q');
const ConfigParser = require('@taf/taf-utils').Config;
let config = {};

config.loadConfig = function (filename, configFormat) {
    let dfd = Q.defer();
    if (process.env.TAF_CONFIG) {
        let tafConfigHelper = require('@taf/taf-config');
        let helper = new tafConfigHelper();
        helper.loadConfig(filename, configFormat).then(function (data) {
            data = parseConf(data, configFormat);
            global.CONFIG = data;
            dfd.resolve(data);
        },
        function (err) {
            dfd.reject('loadConfig file error');
        });
    } else {
        let fs = require('fs');
        fs.readFile(filename, {encoding: 'utf-8'}, function (err, data) {
            if (err) {
                dfd.reject(err);
            } else {
                data = parseConf(data, configFormat);
                global.CONFIG = data;
                dfd.resolve(data);
            }
        });
    }
    return dfd.promise;
}

function parseConf(content, configFormat) {
    let ret = content;
    if (configFormat === 'c') {
        let configParser = new ConfigParser();
        configParser.parseText(content, 'utf8');
        ret = configParser.data;
    } else if (configFormat == 'json') {
        ret = JSON.parse(content);
    }
    return ret;
}

module.exports = config;