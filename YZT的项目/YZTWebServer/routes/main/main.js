/**
 * 首页
 * Created by xudong.cai on 2017/2/23
 */
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const Q = require('q');
const Taf = require("@taf/taf-rpc").Communicator.New();
//大盘风向标、热点追踪仪
Taf.setProperty('timeout',5000);
var News = require("../../jce/NewsServerProxy.js").News;
var servantNews = 'AI.NewsServer.NewsServerObj';
if (!process.env.TAF_CONFIG) {
    servantNews += "@tcp -h 172.16.8.185 -t 60000 -p 10014";
}
var prxNews = Taf.stringToProxy(News.NewsInterfProxy, servantNews);
//核心金股池、舆情挖掘机、精品策略库
var Strategy = require("../../jce/StrategyServerProxy.js").Strategy;
var servantStrategy = 'AI.StrategyServer.StrategyServerObj';
if (!process.env.TAF_CONFIG) {
    servantStrategy += "@tcp -h 172.16.8.185 -t 60000 -p 10021";
}
var prxStrategy = Taf.stringToProxy(Strategy.StrategyInterfProxy, servantStrategy);

//股票行情
const HQSys = require('../../jce/HsServerProxy').HQSys;
var servantHQ = "HQWeb.HsServer.HsServerObj";
if (!process.env.TAF_CONFIG){
    servantHQ = "@tcp -h 172.16.8.185 -t 60000 -p 10022";
}
var prxHQ = Taf.stringToProxy(HQSys.BasicHqProxy, servantHQ);

router.get('/',indexPage);

router.get('/main.html',indexPage);

/**
 * 首页
 * 大盘风向标
 * 核心金股池
 * 舆情挖掘机
 * 热点追踪仪
 * 精品策略库
 */
function indexPage (req, res, next) {
    //大盘风向标
    //核心金股池
    //舆情挖掘机
    //获取新闻龙虎榜利多 利空前三
    //热点追踪仪
    //精品策略
    let subJectsReq = new News.SubJectsReq();
    subJectsReq.sortType=News.SUB_SORT_TYPE.HOT_SUB;
    var mainObj =  {};
    Promise.all([getMarketVane(), getPerfectStock(), getTopLhbNews(), getSubJects(subJectsReq),getTopStgyInfoList()]).then(values =>{
        // console.log(values)
        for (var i in values){
            if (values[i].iRet && values[i].iRet !== 0){
                logger.access_log.debug(`### 【首页====》${values[i].iFunc}】 error====》${JSON.stringify(values[i].iMsg)} ###`);
            }
        }
        mainObj.marketVaneData = !values[0].response ? null : values[0].response.arguments.marketVaneRsp.marketVaneList.value;
        mainObj.perfectStockData = !values[1].response ? null : values[1].response.arguments.topStockRsp.topStockList.value;
        mainObj.topLhbLDNewsData = !values[2].response ? null : values[2].response.arguments.stRsp.lhbNewsListLD.value;
        mainObj.topLhbLKNewsData = !values[2].response ? null : values[2].response.arguments.stRsp.lhbNewsListLK.value;
        mainObj.subJectsData = !values[3].response ? null : values[3].response.arguments.stRsp.subJectList.value;
        mainObj.topStgyInfoData = !values[4].response ? null : values[4].response.arguments.stgyInfoRsp.stgyInfoList.value;
        mainObj.subJectsData = !mainObj.subJectsData ? null : mainObj.subJectsData.slice(0,4);
        // res.render('hot/theme-panorama',{title:'题材全景图',subjectObj:subjectObj});
        // console.log(mainObj.marketVaneData)
        res.render('index',{mainObj:mainObj});
    }).catch(reason =>{
        logger.access_log.debug('### 【首页】 error ###',reason.response);
        res.render('index',{mainObj:mainObj});
    });
}
/*********************股票行情数据***********************/

/**
 * 股票行情数据
 * hqType：行情类型：sim：基本行情 ex：扩展行情 qh：期货行情 all：全部行情
 * stockArray：股票代码数组
 */
router.post('/hq/:hqType',function (req, res, next) {
    //查询基本行情
    var socketData = JSON.parse(req.body.socketData);
    var stockHqReq = new HQSys.StockHqReq();
    var array = socketData;//[{shtSetcode:1,sCode:'000001'},{shtSetcode:0,sCode:'399001'},{shtSetcode:0,sCode:'399005'},{shtSetcode:0,sCode:'399006'}];
    stockHqReq.vStock.readFromObject(array);
    prxHQ.stockHq(stockHqReq).then(ret =>{
        var rsp = ret.response.arguments.stRsp;
        logger.access_log.debug('【股票行情数据】请求参数',array);
        logger.access_log.debug('【股票行情数据】iRet',rsp.iRet);
        logger.access_log.debug('【股票行情数据】iMsg',rsp.iMsg);
        // logger.access_log.debug('vStockHq',rsp.vStockHq.value);
        const resHq = [];
        for (var i in rsp.vStockHq.value){
            var obj = rsp.vStockHq.value[i];
            var baseHqInfo = {
                shtPrecise:obj.shtPrecise,
                shtSetcode:obj.shtSetcode,
                sCode:obj.sCode,
                sName:obj.sName,
                transactionStatus:obj.stExHq.bTransactionStatus.toString(),
                hqData:null
            }
            if (req.params.hqType === 'sim'){
                baseHqInfo.hqData = obj.stSimHq.toObject();
            }else if (req.params.hqType === 'ex'){
                baseHqInfo.hqData = obj.stExHq;
            }else if (req.params.hqType === 'qh'){
                baseHqInfo.hqData = obj.stQhHq;
            }else if (req.params.hqType === 'all'){
                baseHqInfo = obj;
            }else {
                baseHqInfo = {
                }
            }
            resHq.push(baseHqInfo);
        }
        res.send(resHq);
    }, err =>{
        logger.access_log.debug('### 【股票行情数据】 error ###',err.response);
        res.send(null);
    }).catch(err =>{
        logger.access_log.debug('### 【股票行情数据】 error ###',err.response);
        res.send(null);
    });
});

//前端使用ejs模板渲染
router.get('/tpl-mix/:tpl',function (req, res, next) {
    let result = '';
    let tpls = req.params.tpl.replace('.js', '').split('-');
    let tasks = [];
    for (let i in tpls) {
        let v = tpls[i];
        let file = path.join(__dirname,'../../views/tpl/') + v + '.ejs';
        if (file) {
            let task = Q.nfcall(fs.readFile,file);
            task.then(function (content) {
                content = content.toString().replace(/\r\n/g, '').replace(/\n/g, '').replace(/\r/g, '');
                result += 'var ' + v + '=\'' + content + '\';\r\n';
            });
            tasks.push(task);
        }
    }
    Q.all(tasks).then(function(){
        res.format({
            'text/plain': function(){
                res.send(result);
            }
        });
    });
});
//购买页
router.get('/buy.html',function (req, res, next) {
    res.render('error/buy');
});
/******************************异步函数************************************/

//大盘风向标
function getMarketVane() {
    var deferred = Q.defer();
    const json = {
        iFunc:'大盘风向标',
        iRet:-1,
        iMsg:'',
        data:null
    }
    try{
        prxNews.getMarketVane().then(
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

//核心金股池
function getPerfectStock() {
    var deferred = Q.defer();
    const json = {
        iFunc:'核心金股池',
        iRet:-1,
        iMsg:'',
        data:null
    }
    try{
        prxStrategy.getPerfectStock().then(
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

//舆情挖掘机
function getTopLhbNews() {
    var deferred = Q.defer();
    const json = {
        iFunc:'舆情挖掘机',
        iRet:-1,
        iMsg:'',
        data:null
    }
    try{
        prxNews.getTopLhbNews().then(
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

//热点追踪仪
function getSubJects(subJectsReq) {
    var deferred = Q.defer();
    const json = {
        iFunc:'热点追踪仪',
        iRet:-1,
        iMsg:'',
        data:null
    }
    try{
        prxNews.getSubJects(subJectsReq).then(
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

//精品策略
function getTopStgyInfoList() {
    var deferred = Q.defer();
    const json = {
        iFunc:'精品策略',
        iRet:-1,
        iMsg:'',
        data:null
    }
    try{
        prxStrategy.getTopStgyInfoList().then(
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