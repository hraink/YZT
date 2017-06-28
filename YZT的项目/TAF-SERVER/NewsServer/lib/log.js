/**
 * Created by 99150 on 2016/12/22.
 */
'use strict';
let TafLog = require('@taf/taf-logs');

module.exports = {
    initdata : new TafLog('TafDate', 'initdata'),
    newsserver:new TafLog('TafDate', 'newsserver'),
    error:new TafLog('TafDate', 'error')
};