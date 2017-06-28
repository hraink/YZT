/**
 * 首页
 * Created by xudong.cai on 2017/2/27
 */
const express = require('express');
const router = express.Router();
const Q = require('q');
const Taf = require("@taf/taf-rpc").Communicator.New();
Taf.setProperty('timeout',5000);
//舆情牛股
var News = require("../../jce/NewsServerProxy.js").News;
var servantNews = 'AI.NewsServer.NewsServerObj';
if (!process.env.TAF_CONFIG) {
    servantNews += "@tcp -h 172.16.8.185 -t 60000 -p 10014";
}
var prxNews = Taf.stringToProxy(News.NewsInterfProxy, servantNews);

/*********************舆情牛股数据***********************/
/**
 * 每日热股
 */
router.get('/day.html',function (req, res, next) {
    prxNews.getHotDayStock().then(ret =>{
       if(ret.response.return==0){
           var rsp = ret.response.arguments.stRsp;
           logger.access_log.debug('【每日热股数据】iRet',rsp.iRet);
           logger.access_log.debug('【每日热股数据】iMsg',rsp.iMsg);
       }else{
           logger.access_log.debug('【每日热股数据】return',ret.response.return);
       }
        res.render('stock/day',{hotWeekList:rsp.hotDayList.value || null});
   }, err =>{
        logger.access_log.debug('### 【每日热股数据】 error ###',err.response);
        res.render('stock/day',{hotWeekList:null});
    }).catch(err =>{
        logger.access_log.debug('### 【每日热股数据】 error ###',err.response);
        res.render('stock/day',{hotWeekList:null});
    });
});
/**
 * 每周牛股
 */
router.get('/week.html',function (req, res, next) {
    var weekHistoryReq = new News.WeekHistoryReq();
    weekHistoryReq.startNum=0;
    weekHistoryReq.wantNum=21;
    Promise.all([getHotWeekStock(), getWeekHistoryStock(weekHistoryReq)]).then(values =>{
        var mainObj =  {
            hotWeekList : values[0].response ? values[0].response.arguments.stRsp.hotWeekList.value : null,
            weekHistoryList : values[1].response ? values[1].response.arguments.stRsp.weekHistoryList.value : null,
        };
        res.render('stock/week',{hotWeekList:mainObj.hotWeekList,weekHistoryList:mainObj.weekHistoryList});
    }).catch(reason =>{
        logger.access_log.debug('### 【每周牛股】 error ###',reason.response);
        res.render('stock/week',{hotWeekList:null,weekHistoryList:null});
    });
});

/**
 * 本周牛股数据接口
 */
router.get('/week/first/data',function (req, res, next) {
    prxNews.getHotWeekStock().then(ret =>{
        if(ret.response.return==0){
            var rsp = ret.response.arguments.stRsp;
            logger.access_log.debug('【本周牛股数据接口数据】iRet',rsp.iRet);
            logger.access_log.debug('【本周牛股数据接口数据】iMsg',rsp.iMsg);
        }else{
            logger.access_log.debug('error 【本周牛股数据接口】=',ret.response.return)
        }
        res.send({hotWeekList:rsp.hotWeekList.value || null});
    }, err =>{
        logger.access_log.debug('### 【本周牛股数据接口】 error ###',err.response);
        res.send({hotWeekList:null});
    }).catch(err =>{
        logger.access_log.debug('### 【本周牛股数据接口】 error ###',err.response);
        res.send({hotWeekList:null});
    });
});


/**
 * 历史牛股数据接口
 */
router.get('/week/weekly/data/:start/:want',function (req, res, next) {
    var weekHistoryReq = new News.WeekHistoryReq();
    weekHistoryReq.startNum=req.params.start;
    weekHistoryReq.wantNum=req.params.want;
    logger.access_log.debug('【历史牛股数据接口】请求参数',weekHistoryReq.toObject());
    prxNews.getWeekHistoryStock(weekHistoryReq).then(ret =>{
        if(ret.response.return==0){
            var rsp = ret.response.arguments.stRsp;
            logger.access_log.debug(rsp.iRet,rsp.iMsg);
        }else{
            logger.access_log.debug('【历史牛股数据接口】 return=',ret.response.return)
        }
        res.send({weekHistoryList:rsp.weekHistoryList.value || null});
    }, err =>{
        logger.access_log.debug('### 【历史牛股数据接口】 error ###',err.response);
        res.send({weekHistoryList:null});
    }).catch(err =>{
        logger.access_log.debug('### 【历史牛股数据接口】 error ###',err.response);
        res.send({weekHistoryList:null});
    });
});

/*********************异步调用函数***********************/

//每周牛股本周数据
function getHotWeekStock() {
    var deferred = Q.defer();
    const json = {
        iFunc:'每周牛股本周数据',
        iRet:-1,
        iMsg:'',
        data:null
    }
    try{
        prxNews.getHotWeekStock().then(
            function(results){
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

//每周牛股历史数据
function getWeekHistoryStock(weekHistoryReq) {
    var deferred = Q.defer();
    const json = {
        iFunc:'每周牛股历史数据',
        iRet:-1,
        iMsg:'',
        data:null
    }
    try{
        prxNews.getWeekHistoryStock(weekHistoryReq).then(
            function(results){
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

module.exports = router;