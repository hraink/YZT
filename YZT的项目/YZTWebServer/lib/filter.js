'use strict';
const Q = require('q');
const userAuth = require('@up/crm-module');
const Taf = require("@taf/taf-rpc").Communicator.New();
const Risk = require("../jce/RiskServerProxy.js").Risk;
var servant = 'AI.RiskServer.RiskServerObj';
if (!process.env.TAF_CONFIG) {
    servant += "@tcp -h 172.16.8.146 -t 60000 -p 10012";
    // servant += "@tcp -h 172.16.8.185 -t 60000 -p 10002";
}

var prx = Taf.stringToProxy(Risk.RiskInterProxy, servant);

const crypto = require('crypto');
const key = new Buffer('upchina6');
const iv = new Buffer([0x75, 0x70, 0x63, 0x68, 0x69, 0x6e, 0x61, 0x31]);//upchina1
const alg = 'blowfish';
/**
 * 权限过滤器
 */

let filter = {};

//校验付费权限
function checkPay(_userAuth){
    var deferred = Q.defer();
    var loginUserName = null;
    if (typeof _userAuth === 'undefined'){
        deferred.resolve({userAuth:null,userRisk:null,loginUserName:loginUserName});
        return deferred.promise;
    }
    const userid = decodeURIComponent(_userAuth.userid);
    const hqright = decodeURIComponent(_userAuth.hqright);
    //解密得到rd
    const dencryptRdRes = decode(key, hqright);
    const keyRD = new Buffer(JSON.parse(dencryptRdRes).rd + '');
    //解密得到uid
    var dencryptUIDRes = decode(keyRD, userid);
    loginUserName = dencryptUIDRes.trim();
    Promise.all([getUserAuth(loginUserName),getUserRisk(loginUserName)]).then(
        values =>{
            deferred.resolve({userAuth:values[0],userRisk:values[1],loginUserName:loginUserName});
        },
        err =>{
            logger.access_log.debug('### 【鉴权】 error ###:',err.response)
            deferred.resolve({userAuth:null,userRisk:null,loginUserName:loginUserName});
        }
    )
    return deferred.promise;
}
//解密
function decode(_key,_value) {
    const decipherRd = crypto.createDecipheriv(alg, _key, iv);
    decipherRd.setAutoPadding(false);
    var dencryptRdRes = decipherRd.update(_value, 'base64', 'utf8');
    dencryptRdRes += decipherRd.final('utf8');
    return dencryptRdRes;
}
//获取用户权限
function getUserAuth(_userName) {
    var deferred = Q.defer();
    const json = {
        iFunc:'获取用户权限',
        iRet:-1,
        iMsg:'',
        data:null
    }
    try{
        userAuth.getModule(_userName.toString(),Number(global.CONFIG.YZTWebServer.userAuthCode)).then(
            function(results){
                deferred.resolve(results);
            },function(err){
                json.iMsg = err.response;
                deferred.resolve(json);
            }
        );
    }catch(e){
        json.iMsg = e.response;
        deferred.resolve(json);
    }
    return deferred.promise;
}
//获取用户评测数据
function getUserRisk(_userName) {
    var deferred = Q.defer();
    var username= _userName || '';
    const json = {
        iFunc:'获取用户评测数据',
        iRet:-1,
        iMsg:'',
        data:null
    }
    try{
        prx.queryUserRisk(username).then(
            function(results){
                // console.log(results.response.arguments.userRisk);
                deferred.resolve(results);
            },function(err){
                json.iMsg = err.response;
                deferred.resolve(json);
            }
        ).done();
    }catch(e){
        json.iMsg = e.response;
        deferred.resolve(json);
    }
    return deferred.promise;
}

filter.checkPay = checkPay;

module.exports = filter;