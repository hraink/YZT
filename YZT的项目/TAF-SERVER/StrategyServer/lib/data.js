'use strict';
const mysql   = require('mysql');
var Q = require('q');
var TafStream = require('@taf/taf-stream');
const Cache = require("@taf/taf-dcache-helper");
var pool;
var pool2;
var config;
var logger;
var moment;
var timearea;
var checktime;
var common;
exports.init = () => {
    const util   = require('./util');
    config = util.getConf();
    logger = require('./log');
    moment    = require('moment');
    common = require('./common');
    timearea =config.times.timearea;
    checktime =config.times.checktime;
    pool  = mysql.createPool({
        host        : config.db.dbhost,
        port        : config.db.dbport,
        user        : config.db.dbuser,
        password    : config.db.dbpass,
        database    : config.db.dbname,
        charset     : config.db.charset,
        connectionLimit: config.db.max_connection  //最大连接数
    });
    pool2  = mysql.createPool({
        host        : config.db2.dbhost,
        port        : config.db2.dbport,
        user        : config.db2.dbuser,
        password    : config.db2.dbpass,
        database    : config.db2.dbname,
        charset     : config.db2.charset,
        connectionLimit: config.db2.max_connection  //最大连接数
    });
    exports.getPool = () => pool;
    exports.getPool2 =() => pool2;
    return Promise.all([loadTopStrategy(),loadStrategy(),loadTopStock(),loadChooseStock(),
        loadGoldStockPool(),loadOptiStgyStock(),loadStockStar(),loadPredict(),loadStockRating(),loadCalcData(),loadDiagnosis()]);
}
//执行所有sql语句
function execQuery(sql, values, callback) {
    var errinfo;
    pool.getConnection(function(err, connection) {
        if (err) {
            errinfo = 'DB-获取数据库连接异常！';
            console.log(errinfo);
            callback(err);
        } else {
            var querys = connection.query(sql, values, function(err, rows) {
                release(connection);
                if (err) {
                    errinfo = 'DB-SQL语句执行错误:' + err;
                    callback(err);
                } else {
                    callback(null,rows);
                }
            });
            //打印执行SQL语句
            //console.log(querys.sql);
        }
    });
}
function execQuery2(sql, values, callback) {
    var errinfo;
    pool2.getConnection(function(err, connection) {
        if (err) {
            errinfo = 'DB-获取数据库连接异常！';
            console.log(errinfo);
            callback(err);
        } else {
            var querys = connection.query(sql, values, function(err, rows) {
                release(connection);
                if (err) {
                    errinfo = 'DB-SQL语句执行错误:' + err;
                    callback(err);
                } else {
                    callback(null,rows);
                }
            });
            //打印执行SQL语句
            //console.log(querys.sql);
        }
    });
}
function release(connection) {
    try {
        connection.release(function(error) {
            if (error) {
                console.log('DB-关闭数据库连接异常！');
            }
        });
    } catch (err) {}
}
function execUpdate(sql, values, callback){
    execQuery(sql, values, function(result) {
        if (callback) {
            var affectedRows = 0;
            if (result) {
                affectedRows = result.affectedRows
            }
            callback({
                affectedRows: affectedRows
            });
        }
    });
}

function getStrategyInfo(stgyCodes){
    var deferred = Q.defer();
    var sql = ` select * from strategyinfo where status=0 and gscode in (`+stgyCodes+`) order by gsMaxRise desc `;
    try {
        execQuery(sql, [stgyCodes], function (err, rows) {
            if (err) {
                deferred.resolve([]);
            } else {
                deferred.resolve(rows);
            }
        });
    }catch(e){
        deferred.resolve([]);
    }
    return deferred.promise;
}
//初始化加载精品策略
function loadTopStrategy(){
    logger.initdata.info('=====>初始化加载精品策略TopStgyInfo......')
    var deferred = Q.defer();
    if(common.isLoadingTime(timearea,checktime)) {
        try {
            var recommend = config.stgycategory.recommend;
            var limitup = config.stgycategory.limitup;
            var leading = config.stgycategory.leading;
            //var fundcode=config.stgycategory.fundcode;
            //var trends=config.stgycategory.trends;
            //var allcodes = recommend+','+limitup+','+leading+','+fundcode+','+trends;
            var allcodes = recommend + ',' + limitup + ',' + leading;
            getStrategyInfo(allcodes).then(
                function (results) {
                    var stgyArray = results;
                    if (results.length > 3) {
                        stgyArray = results.slice(0, 3);
                    }
                    //将平均收益最高的策略存放至内存中
                    if (stgyArray != undefined && stgyArray.length > 0) {
                        global.TopStgyInfo = stgyArray;
                    }
                    deferred.resolve(stgyArray);
                }, function (err) {
                    deferred.resolve();
                }
            ).done();
        } catch (e) {
            deferred.resolve();
        }
    }else{
        deferred.resolve();
    }
    return deferred.promise;
}
setInterval(loadTopStrategy, 3600*1e3);
exports.loadTopStrategy = loadTopStrategy;
//初始化加载分组策略Map
function loadStrategy(){
    logger.initdata.info('=====>初始化加载分组策略StgyInfoMap......')
    var deferred = Q.defer();
    if(common.isLoadingTime(timearea,checktime)) {
        try {
            var recommend = config.stgycategory.recommend;
            var limitup = config.stgycategory.limitup;
            var leading = config.stgycategory.leading;
            //var fundcode=config.stgycategory.fundcode;
            //var trends=config.stgycategory.trends;
            var stgyMap = {};
            //Q.all([getStrategyInfo(recommend),getStrategyInfo(limitup),getStrategyInfo(leading), getStrategyInfo(fundcode),getStrategyInfo(trends)]).then(
            Q.all([getStrategyInfo(recommend), getStrategyInfo(limitup), getStrategyInfo(leading)]).then(
                function (results) {
                    results.forEach((r, index)=> {
                        var stgyArray = [];
                        r.forEach(stgyInfo=> {
                            stgyArray.push(stgyInfo);
                        })
                        var key = 'STGYINFO_' + (index + 1);
                        stgyMap[key] = stgyArray;
                    });
                    //将分类策略map存放至内存
                    if (results != undefined && results.length > 0) {
                        global.StgyInfoMap = stgyMap;
                    }
                    deferred.resolve(results);
                },
                function (err) {
                    console.log(err);
                    deferred.resolve();
                }
            ).done()
        } catch (e) {
            deferred.resolve();
        }
    }else{
        deferred.resolve();
    }
    return deferred.promise;
}
setInterval(loadStrategy, 3600*1e3);
exports.loadStrategy = loadStrategy;

//获取近三月策略牛股(近期战绩)
function getTopStock(stgyCodes){
    //取近三月起始截止时间
    var start=moment().subtract(90, 'days').format('YYYYMMDD');
    var end =moment().format('YYYYMMDD');
    var deferred = Q.defer();
    var sql = ` select * from strategystock where MaxRise>0 and gscode=`+stgyCodes+` and Date between ? and ? order by MaxRise desc `;
    try {
        execQuery(sql, [start,end], function (err, rows) {
            if (err) {
                deferred.resolve([]);
            } else {
                deferred.resolve(rows);
            }
        });
    }catch(e){
        deferred.resolve([]);
    }
    return deferred.promise;
}

function loadTopStock(){
    logger.initdata.info('=====>初始化加载策略牛股（近三月战绩）TopStgyStock......')
    var deferred = Q.defer();
    if(common.isLoadingTime(timearea,checktime)) {
        try {
            var recommend = config.stgycategory.recommend;
            var limitup = config.stgycategory.limitup;
            var leading = config.stgycategory.leading;
            //var fundcode=config.stgycategory.fundcode;
            //var trends=config.stgycategory.trends;
            //var allcodes = recommend+','+limitup+','+leading+','+fundcode+','+trends;
            var allcodes = recommend + ',' + limitup + ',' + leading;
            var codesArray = allcodes.split(',');
            Q.all(codesArray.map(code=>getTopStock(code))).then(
                function (results) {
                    var topStgyStockMap = {};
                    results.forEach(stockList=> {
                        if (stockList.length > 0) {
                            var key = stockList[0].gscode;
                            var value = [];
                            var sbuffer = '';
                            for (var i = 0; i < stockList.length; i++) {
                                if (sbuffer.indexOf(stockList[i].gpcode) >= 0) continue;
                                if (sbuffer.split(',').length == 21)break;
                                sbuffer += stockList[i].gpcode + ',';
                                value.push(stockList[i]);
                            }
                            topStgyStockMap[key] = value;
                        }
                    })
                    if (results != undefined && results.length > 0) {
                        global.TopStgyStock = topStgyStockMap;
                    }
                    deferred.resolve(results);
                }, function (err) {
                    deferred.resolve();
                }
            ).done();
        } catch (e) {
            deferred.resolve();
        }
    }else{
        deferred.resolve();
    }
    return deferred.promise;
}

setInterval(loadTopStock, 3600*1e3);
exports.loadTopStock = loadTopStock;

//获取每日策略入选股
function getChooseStock(){
    var deferred = Q.defer();
    var recommend=config.stgycategory.recommend;
    var limitup=config.stgycategory.limitup;
    var leading=config.stgycategory.leading;
    //var fundcode=config.stgycategory.fundcode;
    //var trends=config.stgycategory.trends;
    //var allcodes = recommend+','+limitup+','+leading+','+fundcode+','+trends;
    var allcodes = recommend+','+limitup+','+leading;
    var sql = ` select concat(concat(c.gscode,'_'),c.Date) as jsonKey,CONCAT("[", GROUP_CONCAT('{', `+
        ` ifnull(concat('"gscode":"',c.gscode,'"'),""),ifnull(concat(',"gpcode":"',c.gpcode,'"'),""), `+
        ` ifnull(concat(',"gpName":"',c.gpName,'"'),""),ifnull(concat(',"Date":"',c.Date,'"'),""),`+
        ` ifnull(concat(',"Price":',c.Price,''),0),ifnull(concat(',"Rise_SignalDate":',c.Rise_SignalDate,''),0), `+
        ` ifnull(concat(',"MaxRise":',c.MaxRise,''),0),'}'),"]") AS jsonArray`+
        ` from( select gscode,gpcode,gpName,Date,Price,Rise_SignalDate,MaxRise,Rise_NextDay,Rise_FiveDays,Rise_TenDays`+
        ` from strategystock where gscode in (`+allcodes+`)`+
        ` )c group by c.gscode,c.Date `;
    try {
        execQuery(sql, [], function (err, rows) {
            if (err) {
                deferred.resolve([]);
            } else {
                deferred.resolve(rows);
            }
        });
    }catch(e){
        deferred.resolve([]);
    }
    return deferred.promise;
}

function loadChooseStock(){
    logger.initdata.info('=====>初始化加载策略每日入选股票ChooseStock......')
    var deferred = Q.defer();
    if(common.isLoadingTime(timearea,checktime)) {
        try {
            getChooseStock().then(
                function (results) {
                    var chooseStockMap = {};
                    results.forEach(r=> {
                        var key = r.jsonKey;
                        var value = r.jsonArray;
                        chooseStockMap[key] = value;
                    })
                    if (results != undefined && results.length > 0) {
                        global.ChooseStock = chooseStockMap;
                    }
                    deferred.resolve(results);
                }, function (err) {
                    deferred.resolve();
                }
            ).done();
        } catch (e) {
            deferred.resolve();
        }
    }else{
        deferred.resolve();
    }
    return deferred.promise;
}

setInterval(loadChooseStock, 3600*1e3);
exports.loadTopStock = loadChooseStock;


//获取核心金股池
function getGoldStockPool(){
    //取近三月起始截止时间
    var recommend=config.stgycategory.recommend;
    var limitup=config.stgycategory.limitup;
    var leading=config.stgycategory.leading;
    //var fundcode=config.stgycategory.fundcode;
    //var trends=config.stgycategory.trends;
    //var allcodes = recommend+','+limitup+','+leading+','+fundcode+','+trends;
    var allcodes = recommend+','+limitup+','+leading;
    var start=moment().subtract(90, 'days').format('YYYYMMDD');
    var end =moment().format('YYYYMMDD');
    console.log(start,end,allcodes);
    var deferred = Q.defer();
    var sql = ` select * from  `+
              `  (select * from strategystock where Date between `+start+` and `+end+` and MaxRise>0 and gscode in (`+allcodes+`)) a `+
              ` join (select gscode,gsName_yzt,gsName,gsName_Phone,OS from strategyinfo) b on a.gscode = b.gscode`+
              `  join `+
              `  ( `+
              `   select gscode,max(MaxRise) as maxRise from  `+
              `   (select * from strategystock where Date between `+start+` and `+end+` and MaxRise>0 and gscode in (`+allcodes+`)) c `+
              `    group by c.gscode  `+
              `    )d `+
              `    on a.gscode=d.gscode and a.MaxRise = d.maxRise `+
              `    order by a.MaxRise desc ,b.gscode desc  `;
    try {
        execQuery(sql, [start,end], function (err, rows) {
            if (err) {
                deferred.resolve([]);
            } else {
                deferred.resolve(rows);
            }
        });
    }catch(e){
        deferred.resolve([]);
    }
    return deferred.promise;
}


function loadGoldStockPool(){
    logger.initdata.info('=====>初始化加载核心金股池 GoldStockPool......')
    var deferred = Q.defer();
    if(common.isLoadingTime(timearea,checktime)) {
        try {
            getGoldStockPool().then(
                function (results) {
                    var sbuffer = '';
                    var goldStockPoolArray = [];
                    for (var i = 0; i < results.length; i++) {
                        if (sbuffer.indexOf(results[i].gpcode) >= 0) continue;
                        if (sbuffer.split(',').length == 6)break;
                        sbuffer += results[i].gpcode + ',';
                        goldStockPoolArray.push(results[i]);
                    }
                    if (results != undefined && results.length > 0) {
                        global.GoldStockPool = goldStockPoolArray;
                    }
                    deferred.resolve(results);
                }, function (err) {
                    deferred.resolve();
                }
            ).done();
        } catch (e) {
            deferred.resolve();
        }
    }else{
        deferred.resolve();
    }
    return deferred.promise;
}

setInterval(loadGoldStockPool, 3600*1e3);
exports.loadGoldStockPool = loadGoldStockPool;



//获取策略点金
function getOptiStgyStock(){
    var start=moment().subtract(90, 'days').format('YYYYMMDD');
    var end =moment().format('YYYYMMDD');
    var deferred = Q.defer();
    var sql = ` select * from optimumstock where Buy_Date between  `+start+` and `+end+` and Highest_Increase!=88888 order by Highest_Increase desc `;
    try {
        execQuery(sql, [], function (err, rows) {
            if (err) {
                deferred.resolve([]);
            } else {
                deferred.resolve(rows);
            }
        });
    }catch(e){
        deferred.resolve([]);
    }
    return deferred.promise;
}

function loadOptiStgyStock(){
    logger.initdata.info('=====>初始化最优策略策略点金 OptiStgyStock......')
    var deferred = Q.defer();
    if(common.isLoadingTime(timearea,checktime)) {
        try {
            getOptiStgyStock().then(
                function (results) {
                    var sbuffer = '';
                    var optiStgyStockArray = [];
                    for (var i = 0; i < results.length; i++) {
                        if (sbuffer.indexOf(results[i].gpcode) >= 0) continue;
                        if (sbuffer.split(',').length == 6)break;
                        sbuffer += results[i].gpcode + ',';
                        optiStgyStockArray.push(results[i]);
                    }
                    if (results != undefined && results.length > 0) {
                        global.OptiStgyStock = optiStgyStockArray;
                    }
                    deferred.resolve(results);
                }, function (err) {
                    deferred.resolve();
                }
            ).done();
        } catch (e) {
            deferred.resolve();
        }
    }else{
        deferred.resolve();
    }
    return deferred.promise;
}

setInterval(loadOptiStgyStock, 3600*1e3);
exports.loadOptiStgyStock = loadOptiStgyStock;


//获取智能诊股 明星股 潜力股
function getStockStar(){
    var deferred = Q.defer();
    var sql = ` select code,name,market,industry,starlevel,type from stockstar order by starlevel desc `;
    try {
        execQuery(sql, [], function (err, rows) {
            if (err) {
                deferred.resolve([]);
            } else {
                deferred.resolve(rows);
            }
        });
    }catch(e){
        deferred.resolve([]);
    }
    return deferred.promise;
}

function loadStockStar(){
    logger.initdata.info('=====>初始化 智能诊股 明星股 潜力股 StockStar......')
    var deferred = Q.defer();
    if(common.isLoadingTime(timearea,checktime)) {
        try {
            getStockStar().then(
                function (results) {
                    if (results != undefined && results.length > 0) {
                        global.StockStar = results;
                    }
                    //console.log(results);
                    deferred.resolve(results);
                }, function (err) {
                    deferred.resolve();
                }
            ).done();
        } catch (e) {
            deferred.resolve();
        }
    }else{
        deferred.resolve();
    }
    return deferred.promise;
}

setInterval(loadStockStar, 3600*1e3);
exports.loadStockStar = loadStockStar;


function getPredict(){
    var deferred = Q.defer();
    var sql =
        ` select c.CODE,CONCAT("[", GROUP_CONCAT('{', `+
        ` ifnull(concat('"CODE":"',c.CODE,'"'),""),ifnull(concat(',"END_DATE":"',c.END_DATE,'"'),""), `+
        ` ifnull(concat(',"END_DATE_1":"',c.END_DATE_1,'"'),""),ifnull(concat(',"HOLD_RANGE_PAR":',c.HOLD_RANGE_PAR,''),0),ifnull(concat(',"UP_PROB":',c.UP_PROB,''),0), `+
        ` ifnull(concat(',"SUG_POSI":',c.SUG_POSI,''),0),ifnull(concat(',"PRICE_PROG":',c.PRICE_PROG,''),0),ifnull(concat(',"FLUC_CEIL":',c.FLUC_CEIL,''),0), `+
        ` ifnull(concat(',"FLUC_FLOR":',c.FLUC_FLOR,''),0),ifnull(concat(',"MKT_TYPE_PAR":',c.MKT_TYPE_PAR,''),0),'}'),"]") AS jsonArray `+
        ` FROM ( select `+
        ` concat(SEC_TYPE_PAR,STK_UNI_CODE) as CODE, date_format(END_DATE,'%Y/%m/%d') as END_DATE,HOLD_RANGE_PAR, `+
        ` date_format(END_DATE_1,'%Y/%m/%d') as END_DATE_1,UP_PROB,SUG_POSI,PRICE_PROG,FLUC_FLOR,FLUC_CEIL, `+
        ` MARKET_TYPE AS MKT_TYPE_PAR `+
        ` from stra_stk_prog_info where END_DATE=(select max(END_DATE) from stra_stk_prog_info))c group by c.CODE `;


    //var sql = `  select c.CODE,CONCAT("[", GROUP_CONCAT('{', `+
    //    ` ifnull(concat('"CODE":"',c.CODE,'"'),""),ifnull(concat(',"END_DATE":"',c.END_DATE,'"'),""), `+
    //    ` ifnull(concat(',"END_DATE_1":"',c.END_DATE_1,'"'),""),ifnull(concat(',"HOLD_RANGE_PAR":',c.HOLD_RANGE_PAR,''),0),ifnull(concat(',"UP_PROB":',c.UP_PROB,''),0), `+
    //    ` ifnull(concat(',"SUG_POSI":',c.SUG_POSI,''),0),ifnull(concat(',"PRICE_PROG":',c.PRICE_PROG,''),0),ifnull(concat(',"FLUC_CEIL":',c.FLUC_CEIL,''),0), `+
    //    ` ifnull(concat(',"FLUC_FLOR":',c.FLUC_FLOR,''),0),ifnull(concat(',"MKT_TYPE_PAR":',c.MKT_TYPE_PAR,''),0),'}'),"]") AS jsonArray `+
    //    ` FROM (select * from predict where END_DATE=(select max(END_DATE) from predict) order by HOLD_RANGE_PAR ASC)c group by c.CODE `;
    try {
        execQuery2(sql, [], function (err, rows) {
            if (err) {
                deferred.resolve([]);
            } else {
                deferred.resolve(rows);
            }
        });
    }catch(e){
        deferred.resolve([]);
    }
    return deferred.promise;
}

function loadPredict(){
    logger.initdata.info('=====>初始化加载大盘股价预测数据 MarketPredict......')
    var deferred = Q.defer();
    if(common.isLoadingTime(timearea,checktime)) {
        var predictMap = {};
        try {
            getPredict().then(
                function (results) {
                    results.forEach(r=> {
                        var key = r.CODE;
                        var value = r.jsonArray;
                        predictMap[key] = value;
                    })
                    //将大盘风向数据存放至内存中
                    if (results != undefined && results.length > 0) {
                        global.MarketPredict = predictMap;
                    }
                    deferred.resolve(results);
                }, function (err) {
                    deferred.resolve(predictMap);
                }
            ).done();
        } catch (e) {
            deferred.resolve(predictMap);
        }
    }else{
        deferred.resolve({});
    }
    return deferred.promise;
}
setInterval(loadPredict, 3600*1e3);
exports.loadPredict = loadPredict;

function getStockRating(){
    var deferred = Q.defer();
    var sql = `  select sec_code as CODE,concat('[{',ifnull(concat('"sc":"',SEC_CODE,'"'),''),ifnull(concat(',"sr":"',SYN_RATE_PAR,'"'),''), `+
        ` ifnull(concat(',"ss":"',SYN_SCORE,'"'),''),ifnull(concat(',"srp":"',STAT_RANGE_PAR,'"'),''), `+
        ` ifnull(concat(',"bon":"',BUY_ORG_NUM,'"'),''),ifnull(concat(',"ion":"',INCRE_ORG_NUM,'"'),''), `+
        ` ifnull(concat(',"non":"',NEUTER_ORG_NUM,'"'),''),ifnull(concat(',"ron":"',REDEM_ORG_NUM,'"'),''), `+
        ` ifnull(concat(',"son":"',SELL_ORG_NUM,'"'),''),ifnull(concat(',"on":"',ORG_NUM,'"'),''),'}]') as jsonArray `+
        ` from stockrating where STAT_RANGE_PAR=4 order by sec_code `;
    try {
        execQuery(sql, [], function (err, rows) {
            if (err) {
                deferred.resolve([]);
            } else {
                deferred.resolve(rows);
            }
        });
    }catch(e){
        deferred.resolve([]);
    }
    return deferred.promise;
}

function loadStockRating(){
    logger.initdata.info('=====>初始化加载（只取近三月）个股机构评级 StockRating......')
    var deferred = Q.defer();
    if(common.isLoadingTime(timearea,checktime)) {
        var stockRatingMap = {};
        try {
            getStockRating().then(
                function (results) {
                    results.forEach(r=> {
                        var key = r.CODE;
                        var value = r.jsonArray;
                        stockRatingMap[key] = value;
                    })
                    //将近三月个股机构评级数据存放至内存中
                    if (results != undefined && results.length > 0) {
                        global.StockRating = stockRatingMap;
                    }
                    deferred.resolve(results);
                }, function (err) {
                    deferred.resolve(stockRatingMap);
                }
            ).done();
        } catch (e) {
            deferred.resolve(stockRatingMap);
        }
    }else{
        deferred.resolve({});
    }
    return deferred.promise;
}
setInterval(loadStockRating, 3600*1e3);
exports.loadStockRating = loadStockRating;



function getCalcData(){
    var deferred = Q.defer();
    var sql = `  select concat(gpcode,'_',case gscode when '趋势安全-支撑压力' then 1 when '资金流向' then 2 when '财务评估_九宫图' then 3 when '买卖人气_九宫图' then 4 when '趋势动向_九宫图' then 5 end) as CODE, `+
              ` concat('[{',ifnull(concat('"gpcode":"',gpcode,'"'),''),ifnull(concat(',"gscode":"',gscode,'"'),''),ifnull(concat(',"ymd":"',ymd,'"'),''),ifnull(concat(',"hms":"',hms,'"'),''), `+
              ` ifnull(concat(',"gsset":"',gsset,'"'),0),ifnull(concat(',"f1":"',f1,'"'),0),ifnull(concat(',"f2":"',f2,'"'),0),ifnull(concat(',"f3":"',f3,'"'),0),ifnull(concat(',"f4":"',f4,'"'),0), `+
              ` ifnull(concat(',"f5":"',f5,'"'),0),ifnull(concat(',"f6":"',f6,'"'),0),ifnull(concat(',"f7":"',f7,'"'),0),ifnull(concat(',"f8":"',f8,'"'),0), `+
              ` ifnull(concat(',"f9":"',f9,'"'),0),ifnull(concat(',"f10":"',f10,'"'),0),ifnull(concat(',"f11":"',f11,'"'),0),ifnull(concat(',"f12":"',f12,'"'),0),ifnull(concat(',"f13":"',f13,'"'),0), `+
              ` ifnull(concat(',"f14":"',f14,'"'),0),ifnull(concat(',"f15":"',f15,'"'),0),ifnull(concat(',"f16":"',f16,'"'),0),'}]') as jsonArray from stockcalcdata group by gpcode,gscode; `;
    try {
        execQuery(sql, [], function (err, rows) {
            if (err) {
                deferred.resolve([]);
            } else {
                deferred.resolve(rows);
            }
        });
    }catch(e){
        deferred.resolve([]);
    }
    return deferred.promise;
}

function loadCalcData(){
    logger.initdata.info('=====>初始化加载九宫格数据 StockCalcData......')
    var deferred = Q.defer();
    if(common.isLoadingTime(timearea,checktime)) {
        var stockCalcDataMap = {};
        try {
            getCalcData().then(
                function (results) {
                    results.forEach(r=> {
                        var key = r.CODE;
                        var value = r.jsonArray;
                        stockCalcDataMap[key] = value;
                    })
                    //将九宫格数据存放至内存中
                    if (results != undefined && results.length > 0) {
                        global.StockCalcData = stockCalcDataMap;
                    }
                    deferred.resolve(results);
                }, function (err) {
                    deferred.resolve(stockCalcDataMap);
                }
            ).done();
        } catch (e) {
            deferred.resolve(stockCalcDataMap);
        }
    }else{
        deferred.resolve({});
    }
    return deferred.promise;
}
setInterval(loadCalcData, 3600*1e3);
exports.loadCalcData = loadCalcData;




function getDiagnosis(){
    var deferred = Q.defer();
    var sql = ` select concat(case market when 1 then '0000' when 2 then '0100' end ,code) as code,starlevel,short_rec,mid_long_rec,price_dis_fac,price_mac_fac,amount_dis_fac,`+
              ` amount_mac_fac,finance_dis_fac,finance_mac_fac,value_dis_fac,value_mac_fac,deal_dis_fac,deal_mac_fac from stockdiagnosis `;
    try {
        execQuery(sql, [], function (err, rows) {
            if (err) {
                deferred.resolve([]);
            } else {
                deferred.resolve(rows);
            }
        });
    }catch(e){
        deferred.resolve([]);
    }
    return deferred.promise;
}

function loadDiagnosis(){
    logger.initdata.info('=====>初始化加载诊股数据 Diagnosis......')
    var deferred = Q.defer();
    if(common.isLoadingTime(timearea,checktime)) {
        var diagnosisMap = {};
        try {
            getDiagnosis().then(
                function (results) {
                    results.forEach(r=> {
                        var key = r.code;
                        var value = r;
                        diagnosisMap[key] = value;
                    })
                    //将九宫格数据存放至内存中
                    if (results != undefined && results.length > 0) {
                        global.Diagnosis = diagnosisMap;
                    }
                    deferred.resolve(results);
                }, function (err) {
                    deferred.resolve(diagnosisMap);
                }
            ).done();
        } catch (e) {
            deferred.resolve(diagnosisMap);
        }
    }else{
        deferred.resolve({});
    }
    return deferred.promise;
}
setInterval(loadDiagnosis, 3600*1e3);
exports.loadDiagnosis = loadDiagnosis;



