/**
 * 机会热点
 * Created by xudong.cai on 2017/2/15.
 */
const express = require('express');
const router = express.Router();
const Q = require('q');
const Taf = require("@taf/taf-rpc").Communicator.New();
var News = require("../../jce/NewsServerProxy.js").News;
var servant = 'AI.NewsServer.NewsServerObj';
if (!process.env.TAF_CONFIG){
    servant = "@tcp -h 	172.16.8.185 -t 60000 -p 10014";
}

var prx = Taf.stringToProxy(News.NewsInterfProxy, servant);

//题材涨幅榜
const Common_HQSys = require('../../jce/CommonJce').HQSys;
var BasicData_HQSys = require("../../jce/BasicDataJce.js").HQSys;
const HQSys = require('../../jce/HsServerProxy').HQSys;
var servantHQ = "HQWeb.HsServer.HsServerObj";
if (!process.env.TAF_CONFIG){
    servantHQ = "@tcp -h 172.16.8.185 -t 60000 -p 10022";
}
var prxHQ = Taf.stringToProxy(HQSys.BasicHqProxy, servantHQ);

//题材风口—全景图
router.get('/theme/panorama.html',function (req, res, next) {
    //机会热点 题材
    const subJectsReqHot = new News.SubJectsReq();
    subJectsReqHot.sortType=News.SUB_SORT_TYPE.HOT_SUB;
    const subJectsReqExcep = new News.SubJectsReq();
    subJectsReqExcep.sortType=News.SUB_SORT_TYPE.EXCEP_SUB;
    const subJectsReqNews = new News.SubJectsReq();
    subJectsReqNews.sortType=News.SUB_SORT_TYPE.NEWS_SUB;
    //题材涨幅榜
    var stockSimpleReq = new HQSys.StockSimpleReq();
    stockSimpleReq.eBussType=Common_HQSys.E_BUSS_TYPE.EBT_BLK_GN;        //EBT_BLK_HY 行业   EBT_BLK_GN概念
    stockSimpleReq.eColumn=Common_HQSys.E_HQ_SORT_COLUMN.E_HQ_COLUMN_CHG; //分类行情数据排列  按涨跌幅排序
    stockSimpleReq.eSort=Common_HQSys.E_SORT_METHOD.E_SORT_DESCEN;  //降序排列
    // stockSimpleReq.eHqData=BasicData_HQSys.E_STOCK_HQ_DATA.E_SHD_ALL;     //取行情模块
    stockSimpleReq.eHqData=7;     //取行情模块
    stockSimpleReq.iWantNum=5;    //取板块记录数   -1取全部

    Promise.all([getHotData(subJectsReqHot), getExcepData(subJectsReqExcep), getNewsData(subJectsReqNews), getBkData(stockSimpleReq)]).then(values =>{
        var subjectObj =  {
            hotData : values[0],
            excepData : values[1],
            newsData : values[2],
            bkData : values[3]
        };
        logger.access_log.debug('【题材全景图】菊花图数据：=================》',values[0]);
        subjectObj.hotData = subjectObj.hotData.response ? subjectObj.hotData.response.arguments.stRsp.subJectList.value : null;
        subjectObj.excepData = subjectObj.excepData.response ? subjectObj.excepData.response.arguments.stRsp.subJectList.value.slice(0,5) : null;
        subjectObj.newsData = subjectObj.newsData.response ? subjectObj.newsData.response.arguments.stRsp.subJectList.value.slice(0,5) : null;
        subjectObj.bkData = subjectObj.bkData.response ? subjectObj.bkData.response.arguments.stRsp.vStock.value : null;
        res.render('hot/theme-panorama',{subjectObj:subjectObj});
    }).catch(reason =>{
        logger.access_log.debug('### 【题材排行榜】 error ###',reason.response);
        res.render('hot/theme-panorama',{subjectObj:null});
    });
});

//题材排行榜
router.get('/theme/:sortType/ranking.html',function (req, res, next) {
    let sortType = req.params.sortType;
    let subJectsReq = new News.SubJectsReq();
    subJectsReq.sortType=News.SUB_SORT_TYPE[sortType.toLocaleUpperCase()+'_SUB'];
    prx.getSubJects(subJectsReq).then(ret =>{
        var status = ret.response.return;
        if(status===0){
            var iRet=ret.response.arguments.stRsp.iRet;
            var iMsg = ret.response.arguments.stRsp.iMsg;
            logger.access_log.debug('【题材排行榜】iRet',iRet);
            logger.access_log.debug('【题材排行榜】iMsg',iMsg);
            var resDATA = ret.response.arguments.stRsp.subJectList.value;
            res.render('hot/theme-ranking',{subJectList:resDATA,active:sortType});
        }
    }, err =>{
        logger.access_log.debug('### 【题材排行榜】 error ###',err.response);
        res.render('hot/theme-ranking',{subJectList:null,active:sortType});
    }).catch(err =>{
        logger.access_log.debug('### 【题材排行榜】 error ###',err.response);
        res.render('hot/theme-ranking',{subJectList:null,active:sortType});
    });
});

//行业热图页面
router.get('/industry.html',function (req, res, next) {
    res.render('hot/industry');
});

//题材全景图数据
router.get('/industry/data',function (req, res, next) {
    prx.getSubJectsChart().then(ret =>{
        var status = ret.response.return;
        if(status===0){
            var iRet=ret.response.arguments.stRsp.iRet;
            var iMsg = ret.response.arguments.stRsp.iMsg;
            logger.access_log.debug('【题材全景图数据】iRet',iRet);
            logger.access_log.debug('【题材全景图数据】iMsg',iMsg);
            var bkData = ret.response.arguments.stRsp.dataJsonStr;
            res.send(bkData);
        }
    }, err =>{
        logger.access_log.debug('### 【题材全景图数据】 error ###',err.response);
        res.send(null);
    }).catch(err =>{
        logger.access_log.debug('### 【题材全景图数据】 error ###',err.response);
        res.send(null);
    });
});

//沪深市场热门行业按成交额从大到小排列
router.get('/industry/sort',function (req, res, next) {
    //题材涨幅榜
    var stockSimpleReq = new HQSys.StockSimpleReq();
    stockSimpleReq.eBussType=Common_HQSys.E_BUSS_TYPE.EBT_BLK_HY;        //EBT_BLK_HY 行业   EBT_BLK_GN概念
    stockSimpleReq.eColumn=Common_HQSys.E_HQ_SORT_COLUMN.E_HQ_COLUMN_AMOUNT; //分类行情数据排列  按涨跌幅排序
    stockSimpleReq.eSort=Common_HQSys.E_SORT_METHOD.E_SORT_DESCEN;  //降序排列
    // stockSimpleReq.eHqData=BasicData_HQSys.E_STOCK_HQ_DATA.E_SHD_ALL;     //取行情模块
    stockSimpleReq.eHqData=7;     //取行情模块
    stockSimpleReq.iWantNum=20;    //取板块记录数   -1取全部

    prxHQ.stockSimple(stockSimpleReq).then(ret =>{
        var status = ret.response.return;
        if(status===0){
           var iRet=ret.response.arguments.stRsp.iRet;
           var iMsg = ret.response.arguments.stRsp.iMsg;
            logger.access_log.debug('【沪深市场热门行业按成交额从大到小排列】iRet',iRet);
            logger.access_log.debug('【沪深市场热门行业按成交额从大到小排列】iMsg',iMsg);
           var vStock = ret.response.arguments.stRsp.vStock.value;
            res.send(vStock);
        }
    }, err =>{
       console.log('### error ###',err.response);
       res.send(null);
    }).catch(err =>{
        console.log('### error ###',err.response);
        res.send(null);
    });
});

//沪深市场热门行业按成交额从大到小排列——行业个股 排行
router.get('/industry/stock/sort/:industryCode',function (req, res, next) {
    //校验入参
    if (isNaN(Number(req.params.industryCode))){
        res.send({});
        return;
    }
    let sCode = req.params.industryCode;
    var array = [sCode];
    //查询行业个股涨跌幅排行前10
    var block2StockReqZDF = new HQSys.Block2StockReq();
    block2StockReqZDF.vBlockCode.readFromObject(array);
    block2StockReqZDF.eColumn=Common_HQSys.E_HQ_SORT_COLUMN.E_HQ_COLUMN_CHG;
    block2StockReqZDF.eSort=Common_HQSys.E_SORT_METHOD.E_SORT_DESCEN;
    // block2StockReqZDF.eHqData=BasicData_HQSys.E_STOCK_HQ_DATA.E_SHD_SIMPLE;
    block2StockReqZDF.eHqData=7;
    //行业个股成交额排行前10
    var block2StockReqCJE = new HQSys.Block2StockReq();
    block2StockReqCJE.vBlockCode.readFromObject(array);
    block2StockReqCJE.eColumn=Common_HQSys.E_HQ_SORT_COLUMN.E_HQ_COLUMN_AMOUNT;
    block2StockReqCJE.eSort=Common_HQSys.E_SORT_METHOD.E_SORT_DESCEN;
    // block2StockReqCJE.eHqData=BasicData_HQSys.E_STOCK_HQ_DATA.E_SHD_SIMPLE;
    block2StockReqCJE.eHqData=7;
    //Promise
    Promise.all([getZDFData(block2StockReqZDF), getCJEData(block2StockReqCJE)]).then(values => {
        var zdfData = values[0];
        var zdfList = zdfData.response ? zdfData.response.arguments.stRsp.mStockList.value : null;
        var cjeData = values[1];
        var cjeList = cjeData.response ? cjeData.response.arguments.stRsp.mStockList.value : null;
        res.send({zdfList:zdfList[sCode].vStock.value.slice(0,10),cjeList:cjeList[sCode].vStock.value.slice(0,10)});
    }).catch(reason => {
        logger.access_log.debug('### 【行业个股排行】 error ###:',reason.response)
        res.send({zdfList:null,cjeList:null});
    });
});

/*************************异步调用函数*************************/

//热点题材数据
function getHotData(subJectsReqHot) {
    var deferred = Q.defer();
    const json = {
        iFunc:'热点题材数据',
        iRet:-1,
        iMsg:'',
        data:null
    }
    try{
        prx.getSubJects(subJectsReqHot).then(
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

//异动题材数据
function getExcepData(subJectsReqExcep) {
    var deferred = Q.defer();
    const json = {
        iFunc:'异动题材数据',
        iRet:-1,
        iMsg:'',
        data:null
    }
    try{
        prx.getSubJects(subJectsReqExcep).then(
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

//最新题材数据
function getNewsData(subJectsReqNews) {
    var deferred = Q.defer();
    const json = {
        iFunc:'最新题材数据',
        iRet:-1,
        iMsg:'',
        data:null
    }
    try{
        prx.getSubJects(subJectsReqNews).then(
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

//题材涨幅榜
function getBkData(stockSimpleReq) {
    var deferred = Q.defer();
    const json = {
        iFunc:'题材涨幅榜',
        iRet:-1,
        iMsg:'',
        data:null
    }
    try{
        prxHQ.stockSimple(stockSimpleReq).then(
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


//题材涨跌幅排行数据
function getZDFData(block2StockReqZDF) {
    var deferred = Q.defer();
    const json = {
        iFunc:'题材涨跌幅排行数据',
        iRet:-1,
        iMsg:'',
        data:null
    }
    try{
        prxHQ.block2Stock(block2StockReqZDF).then(
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

//题材成交额额排行数据
function getCJEData(block2StockReqCJE) {
    var deferred = Q.defer();
    const json = {
        iFunc:'题材成交额额排行数据',
        iRet:-1,
        iMsg:'',
        data:null
    }
    try{
        prxHQ.block2Stock(block2StockReqCJE).then(
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