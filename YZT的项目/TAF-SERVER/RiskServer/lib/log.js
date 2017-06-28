/**
 * Created by 99150 on 2016/12/22.
 */
'use strict';
let TafLog = require('@taf/taf-logs');

module.exports = {
    queryUserRisk: new TafLog('TafDate', 'queryUserRisk'),
    setUserRisk: new TafLog('TafDate', 'setUserRisk'),
    queryUserAuth:new TafLog('TafDate', 'queryUserAuth'),
    error:new TafLog('TafDate', 'error')
};