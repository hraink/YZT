/**
 * 市场关注
 * Created by xudong.cai on 2017/2/22
 */
const express = require('express');
const router = express.Router();
const Taf = require("@taf/taf-rpc").Communicator.New();
const moment = require('moment');
Taf.setProperty('timeout',3000);
var News = require("../../jce/NewsServerProxy.js").News;
var servant = 'AI.NewsServer.NewsServerObj';
if (!process.env.TAF_CONFIG) {
    servant += "@tcp -h 172.16.8.185 -t 60000 -p 10014";
}

var prx = Taf.stringToProxy(News.NewsInterfProxy, servant);

/**
 * 新闻龙虎榜
 * 1:利多 0：利空
 */
router.get('/news.html',function (req, res, next) {
    var lhbNewsReq = new News.LhbNewsReq();
    lhbNewsReq.type=1;
    var resObj = {
        lhbNewsList:null,
        tradeStatus:''
    }
    prx.getLhbNews(lhbNewsReq).then(ret =>{
        if(ret.response.return==0){
            var rsp = ret.response.arguments.stRsp;
            logger.access_log.debug('【新闻龙虎榜】iRet',rsp.iRet);
            logger.access_log.debug('【新闻龙虎榜】iMsg',rsp.iMsg);
        }else{
            logger.access_log.debug('### 【新闻龙虎榜】 error ###');
        }
        resObj.lhbNewsList = rsp.lhbNewsList.value || null;
        resObj.tradeStatus = rsp.tradeStatus || '';
        res.render('market/news',resObj);
    }, err =>{
        logger.access_log.debug('### 【新闻龙虎榜】 error ###',err.response);
        res.render('market/news',resObj);
    }).catch(err =>{
        logger.access_log.debug('### 【新闻龙虎榜】 error ###',err.response);
        res.render('market/news',resObj);
    });
});


/**
 * 新闻龙虎榜
 */
router.get('/news/data/:type',function (req, res, next) {
    var lhbNewsReq = new News.LhbNewsReq();
    lhbNewsReq.type=req.params.type || 1;
    var resObj = {
        title:'新闻龙虎榜',
        lhbNewsList:null,
        tradeStatus:''
    }
    prx.getLhbNews(lhbNewsReq).then(ret =>{
        if(ret.response.return==0){
            var rsp = ret.response.arguments.stRsp;
            logger.access_log.debug('【新闻龙虎榜】iRet',rsp.iRet);
            logger.access_log.debug('【新闻龙虎榜】iMsg',rsp.iMsg);
        }else{
            logger.access_log.debug('### 【新闻龙虎榜】 error ###');
        }
        resObj.lhbNewsList = rsp.lhbNewsList.value || null;
        resObj.tradeStatus = rsp.tradeStatus || '';
        res.send(resObj);
    }, err =>{
        logger.access_log.debug('### 【新闻龙虎榜】 error ###',err.response);
        res.send(resObj);
    }).catch(err =>{
        logger.access_log.debug('### 【新闻龙虎榜】 error ###',err.response);
        res.send(resObj);
    });
});

/**
 * 事件跟踪
 */
router.get('/track.html',function (req, res, next) {

    var lhbHistoryReq = new News.LhbHistoryReq();
    // 默认显示最近30天的数据
    let begin = moment().subtract('30', 'days').format('YYYYMMDD');
    let end = moment().subtract('1', 'days').format('YYYYMMDD');
    lhbHistoryReq.startDate=begin;
    lhbHistoryReq.endDate=end;
    lhbHistoryReq.wantNum=20;

    lhbHistoryReq.offset=0;  //第一页 offset=0  其他页 offset=1
    var resObj = {
        begin:begin.substring(0, 4) + '-' + begin.substring(4, 6) + '-' + begin.substring(6),
        end:end.substring(0, 4) + '-' + end.substring(4, 6) + '-' + end.substring(6),
        lhbNewsList:null,
        lastNewsTime:null,
        beginTime:null,
        tableIndexNum:null,
        tradeStatus:''
    }
    prx.getLhbHistory(lhbHistoryReq).then(ret =>{
        if(ret.response.return==0){
            var rsp = ret.response.arguments.stRsp;
            logger.access_log.debug('【事件跟踪】tradeStatus',rsp.tradeStatus);
            logger.access_log.debug('【事件跟踪】hasNext',rsp.hasNext);
            logger.access_log.debug('【事件跟踪】beginTime',rsp.beginTime);
            logger.access_log.debug('【事件跟踪】total',rsp.total);
            logger.access_log.debug('【事件跟踪】iRet',rsp.iRet);
            logger.access_log.debug('【事件跟踪】iMsg',rsp.iMsg);
        }else{
            logger.access_log.debug('### 【事件跟踪】 error ###');
        }
        resObj.lhbNewsList = rsp.lhbNewsList.value || null;
        resObj.tradeStatus = rsp.tradeStatus || '';
        resObj.beginTime = rsp.beginTime || null;
        if(resObj.lhbNewsList && resObj.lhbNewsList.length > 0){
            let lastNews = resObj.lhbNewsList[resObj.lhbNewsList.length-1].time;
            resObj.lastNewsTime = moment(lastNews).format('x');
        }
        // throw new Error('悲剧了，又出 bug 了');
        res.render('market/track',resObj);
    }, err =>{
        logger.access_log.debug('### 【事件跟踪】 error ###',err.response);
        res.render('market/track',resObj);
    }).catch(err =>{
        logger.access_log.debug('### 【事件跟踪】 error ###',err.response);
        res.render('market/track',resObj);
    });
});

/**
 * 事件跟踪
 */
router.get('/track/data',function (req, res, next) {
    var lhbHistoryReq = new News.LhbHistoryReq();
    lhbHistoryReq.wantNum=req.query.pageSize || 20;
    lhbHistoryReq.offset=req.query.offset || 0;  //第一页 offset=0  其他页 offset=1
    //第二页开始传参
    if (lhbHistoryReq.offset > 0){
        lhbHistoryReq.beginTime=req.query.beginTime.toString() || null; //取上一页返回的 beginTime
        lhbHistoryReq.lastNewsTime=req.query.lastNewsTime.toString() || null; //取上一页最后一条新闻的update_time 转化为毫秒的时间戳
    }else {
        lhbHistoryReq.startDate=req.query.begin || moment().subtract('30', 'days').format('YYYYMMDD');
        lhbHistoryReq.endDate=req.query.end || moment().subtract('1', 'days').format('YYYYMMDD');
    }
    var resObj = {
        lhbNewsList:null,
        beginTime:null,
        lastNewsTime:null,
        tableIndexNum:null,
        tradeStatus:''
    }
    prx.getLhbHistory(lhbHistoryReq).then(ret =>{
        if(ret.response.return==0){
            var rsp = ret.response.arguments.stRsp;
            logger.access_log.debug('【事件跟踪】tradeStatus',rsp.tradeStatus);
            logger.access_log.debug('【事件跟踪】hasNext',rsp.hasNext);
            logger.access_log.debug('【事件跟踪】beginTime',rsp.beginTime);
            logger.access_log.debug('【事件跟踪】total',rsp.total);
            logger.access_log.debug('【事件跟踪】iRet',rsp.iRet);
            logger.access_log.debug('【事件跟踪】iMsg',rsp.iMsg);
        }else{
            logger.access_log.debug('### 【事件跟踪】 error ###');
        }
        resObj.lhbNewsList = rsp.lhbNewsList.value || null;
        resObj.tradeStatus = rsp.tradeStatus || '';
        resObj.beginTime = rsp.beginTime || '';
        if(resObj.lhbNewsList && resObj.lhbNewsList.length > 0){
            let lastNews = resObj.lhbNewsList[resObj.lhbNewsList.length-1].time;
            resObj.lastNewsTime = moment(lastNews).format('x');
        }
        // throw new Error('悲剧了，又出 bug 了');
        res.send(resObj);
    }, err =>{
        logger.access_log.debug('### 【事件跟踪】 error ###',err.response);
        res.send(resObj);
    }).catch(err =>{
        logger.access_log.debug('### 【事件跟踪】 error ###',err.response);
        res.send(resObj);
    });
});
module.exports = router;