/**
 * Created by 99150 on 2016/12/22.
 */
'use strict';
let TafLog = require('@taf/taf-logs');

module.exports = {
    initdata : new TafLog('TafDate', 'initdata'),
    stgyserver:new TafLog('TafDate', 'stgyserver'),
    error:new TafLog('TafDate', 'error')
};