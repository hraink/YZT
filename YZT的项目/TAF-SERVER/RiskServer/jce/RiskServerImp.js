﻿// **********************************************************************
// This file was generated by a TAF parser!
// TAF version 4.2.2 by TAF Team.
// Generated from `./RiskServer.jce'
// **********************************************************************
var Q = require('q');
var data = require("../lib/data");
var logger = require('../lib/log');
var cache   = require('../lib/cache');
var common   = require('../lib/common');
var TafStream = require('@taf/taf-stream');
var util   = require('../lib/util');
var config = util.getConf();
var moment  = require('moment');
var Risk = require('./RiskServer.js').Risk;
module.exports.Risk = Risk;

Risk.RiskInterImp.prototype.initialize = function ( ) {
    //TODO::

}

//查询用户风险评测
Risk.RiskInterImp.prototype.queryUserRisk = function (current, userName, userRisk) {
    logger.queryUserRisk.info('EXECUTE=========>ueryUserRisk');
    var userRisk = new Risk.UserRisk();
    try{
        if(!userName) {
            logger.queryUserRisk.info('queryUserRisk 请求参数错误');
            current.sendResponse(-100, userRisk);
            return;
        }
        var cacheKey ='UserRisk_'+userName;
        cache.getCache(cacheKey).then(
            function(result){
                if(result.iRet==0){
                    var riskJson = JSON.parse(result.data.value);
                    userRisk.readFromObject(riskJson);
                    current.sendResponse(0, userRisk);
                    return;
                }else{
                    logger.queryUserRisk.info('queryUserRisk getCache错误',result.iRet);
                    current.sendResponse(-100, userRisk);
                    return;
                }
            },function(err){
                logger.queryUserRisk.info('queryUserRisk getCache错误',err);
                current.sendResponse(-100, userRisk);
                return;
            }
        ).done();
    }catch(e){
        logger.queryUserRisk.info('queryUserRisk 异常',e);
        current.sendResponse(-100, userRisk);
        return;
    }

}
//用户风险评测
Risk.RiskInterImp.prototype.setUserRisk = function (current, userRisk) {
    logger.setUserRisk.info('EXECUTE=========>setUserRisk');
        try {
        if (!userRisk) {
            logger.setUserRisk.info('setUserRisk 请求参数错误');
            current.sendResponse(-100);
            return;
        }
        var cacheKey = 'UserRisk_'+ userRisk.userName;
        //评测总分
        var totalRiskNum = userRisk.risk1 + userRisk.risk2 + userRisk.risk3 + userRisk.risk4 + userRisk.risk5 + userRisk.risk6 + userRisk.risk7 + userRisk.risk8;
        var risk = '', amount = '';
        //C 稳健型   8-22分
        if (totalRiskNum >= 8 && totalRiskNum <= 22) {
            risk = 'C';
        } else
        //F 成长型   23-37分
        if (totalRiskNum >= 23 && totalRiskNum <= 37) {
            risk = 'F';
        } else
        //P 进取型   38-52
        if (totalRiskNum >= 38 && totalRiskNum <= 52) {
            risk = 'P';
        } else {
            logger.setUserRisk.info('Error================>setUserRisk 总评测分数错误');
            current.sendResponse(-100);
            return;
        }
        if (userRisk.risk4 == 1) {
            amount = '1';
        } else if (userRisk.risk4 == 3) {
            amount = '2';
        } else if (userRisk.risk4 == 5 || userRisk.risk4 == 7) {
            amount = '5';
        } else {
            logger.setUserRisk.info('Error================>setUserRisk 用户资金分类评测分数错误');
            current.sendResponse(-100);
            return;
        }
        var riskType = amount + risk; //风险分类 (用户风险分类+用户资金分类)
        //读取初始化加载入内存中的匹配维度

        var matchMap = global.matchMap;
        var matchJson = matchMap[riskType];
        userRisk.riskType = riskType;
        userRisk.userType = matchJson.type;
        userRisk.riskEndure = matchJson.risk;
        userRisk.winHope = matchJson.winHope;
        userRisk.riskPrepare=matchJson.riskPrepare;
        userRisk.low=matchJson.low;
        userRisk.middle=matchJson.middle;
        userRisk.high=matchJson.high;

        cache.setCache(cacheKey, JSON.stringify(userRisk.toObject())).then(
            function (result) {
                current.sendResponse(0);
                return;
            }, function (err) {
                logger.setUserRisk.info('Error================>setCache Error 设置缓存错误');
                current.sendResponse(-100);
                return;
            }
        ).done();
    }catch(e){
        logger.setUserRisk.info('setUserRisk 异常',e);
        current.sendResponse(-100);
        return;
    }
}


Risk.RiskInterImp.prototype.queryUserAuth = function (current, stReq, stRsp) {
    logger.queryUserAuth.info('EXECUTE=========>queryUserAuth');
    var userAuthRsp = new Risk.UserAuthRsp();
    try {
        if (!stReq) {
            logger.queryUserAuth.info('queryUserAuth 请求参数错误');
            userAuthRsp.iRet=-100;
            userAuthRsp.iMsg='缺少请求参数';
            userAuthRsp.hasRights=false;
            userAuthRsp.endDate='';
            current.sendResponse(-100,userAuthRsp);
            return;
        }
        var userName = stReq.userName;
        var code = stReq.code;
        var url = config.auth.auth_url;
        if(url==undefined||url==''){
            logger.queryUserAuth.info('queryUserAuth 配置URL错误');
            userAuthRsp.iRet=-100;
            userAuthRsp.iMsg='配置URL错误';
            userAuthRsp.hasRights=false;
            userAuthRsp.endDate='';
            current.sendResponse(-100,userAuthRsp);
            return;
        }
        url = url+userName;
        common.getHttpData(url).then(
            function(result){
                var objRights = result.rights;
                var hasRights=false;
                var endDate='';
                objRights.forEach(rights=>{
                    //权限ID
                    if (rights.mid == code && Date.parse(rights.end_date.replace('-', '/')) > new Date()){
                        hasRights = true;
                        endDate =rights.end_date;
                    }

                });
                userAuthRsp.iRet=0;
                userAuthRsp.iMsg='SUCCESS';
                userAuthRsp.hasRights=hasRights;
                userAuthRsp.endDate=endDate;
                current.sendResponse(0,userAuthRsp);
                return;
            },function(err){
                logger.queryUserAuth.info('queryUserAuth 异常',err);
                userAuthRsp.iRet=-100;
                userAuthRsp.iMsg='queryUserAuth 异常';
                current.sendResponse(-100,userAuthRsp);
                return;
            }
        ).done();

    }catch(e){
        logger.queryUserAuth.info('queryUserAuth 异常',e);
        userAuthRsp.iRet=-100;
        userAuthRsp.iMsg='queryUserAuth 异常';
        current.sendResponse(-100,userAuthRsp);
        return;
    }

}

