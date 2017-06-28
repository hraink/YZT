'use strict';

const mysql   = require('mysql');
var Q = require('q');
var TafStream = require('@taf/taf-stream');
const Cache = require("@taf/taf-dcache-helper");
var pool;
var pool2;
var pool3;
var config;
var logger;
var moment;
var common;

var Taf;
var Common_HQSys;
var BasicData_HQSys;
var HQSys;
var servant;
var prx;
var TradeDate;
var timearea;
var checktime;

exports.init = () => {
    TradeDate = require("@up/trade-date");
    TradeDate.init();

    const util   = require('./util');
    config = util.getConf();
    logger = require('./log');
    moment    = require('moment');
    common = require('./common');
    Taf = require("@taf/taf-rpc").Communicator.New();
    Common_HQSys = require("../jce/CommonJce.js").HQSys;
    BasicData_HQSys = require("../jce/BasicDataJce.js").HQSys;
    HQSys = require("../jce/HsServerProxy.js").HQSys;
    timearea =config.times.timearea;
    checktime =config.times.checktime;

    servant= 'HQWeb.HsServer.HsServerObj';
    if (!process.env.TAF_CONFIG) {
        //servant += "@tcp -h 127.0.0.1 -p 14009 -t 60000";
        servant += "@tcp -h 172.16.8.185 -t 60000 -p 10022";
    }
    prx = Taf.stringToProxy(HQSys.BasicHqProxy, servant);

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
    pool3  = mysql.createPool({
        host        : config.db3.dbhost,
        port        : config.db3.dbport,
        user        : config.db3.dbuser,
        password    : config.db3.dbpass,
        database    : config.db3.dbname,
        charset     : config.db3.charset,
        connectionLimit: config.db3.max_connection  //最大连接数
    });
    exports.getPool = () => pool;
    exports.getPool2 =() => pool2;
    exports.getPool3 =() => pool3;
    return Promise.all([loadMarketVane(),loadPredict(),loadSubJects(),loadStockHot(),
        loadStockPlate(),loadStockHotHistory(),loadDayStock(),loadStockRelaPlate(),
        loadMaxHotWeek(),loadHistoryHotWeek(),loadLHBNewsData(),loadLHBNewsHistoryData(),loadCalcHotWeekProfit()]);
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
function execQuery3(sql, values, callback) {
    var errinfo;
    pool3.getConnection(function(err, connection) {
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

function getMarketVane(){
    var deferred = Q.defer();
    var sql = `  select a.gpcode,a.ymd,a.hms,a.f1 advisePosition,a.f2 vane from marketvane a  `+
              ` join  ( select gpcode,max(ymd) ymd,max(hms) hms from marketvane group by gpcode ) b `+
              ` on a.gpcode=b.gpcode and a.ymd=b.ymd and a.hms=b.hms  order by a.gpcode asc `;
    try {
        execQuery(sql, [], function (err, rows) {
            if (err) {
                deferred.resolve([]);
            } else {
                deferred.resolve(rows);
            }
        });
    }catch(e){
        deferred.resolve({
            iRet: -1,
            message: '',
            data: []
        });
    }
    return deferred.promise;
}
//初始化加载精品策略
function loadMarketVane(){
    logger.initdata.info('=====>初始化加载大盘风向标数据 MarketVane......');

    //var key = new Buffer('upchina6');
    //var userID = 'Ul7t+XEoGjwdMjnLiWw3nw==';
    //var hqrights = "wq3gfNjLhlvQKR96YdEVadWXew2pI0Wt17XPR8IPd6If5093iUqlAzunCrWqEuRG0AFYvMxJRqd2iVXmTGvyRAdEC8nr5hs76Jeq/1UWl6Hgp02i8mQVvQ==";
    //console.log(decodeURIComponent(hqrights));
    //var descryptStr=common.descryptData(key,decodeURIComponent(hqrights));
    //console.log('firstDes=',descryptStr);
    //var rd = JSON.parse(descryptStr).rd;
    //console.log('rd='+rd);
    //var new_key = new Buffer(rd+'');
    //var descryptStr_second=common.descryptData(new_key,decodeURIComponent(userID));
    //console.log('secondDes=','|||'+descryptStr_second.trim()+'|||');

    var deferred = Q.defer();
    if(common.isLoadingTime(timearea,checktime)) {
        try {
            getMarketVane().then(
                function (results) {
                    //将大盘风向数据存放至内存中
                    if (results != undefined && results.length > 0) {
                        global.MarketVane = results;
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
setInterval(loadMarketVane, 3600*1e3);
exports.loadMarketVane = loadMarketVane;


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
    //    ` FROM (select * from predict where END_DATE=(select max(END_DATE) from predict) order by HOLD_RANGE_PAR ASC)c  where c.CODE like '5%'  group by c.CODE `;
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

function getSubJects(type){
    var deferred = Q.defer();
    var sql = `  select * from bigdata_theme_hot_top where type=?`;
    try {
        execQuery3(sql, [type], function (err, rows) {
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


//初始化加载分类题材Map
function loadSubJects(){
    logger.initdata.info('=====>初始化加载分类题材SubJectsMap......')
    var deferred = Q.defer();
    if(common.isLoadingTime(timearea,checktime)) {
        try {
            var subJectsMap = {};
            Q.all([getSubJects(1), getSubJects(2), getSubJects(3), getSubJects(4)]).then(
                function (results) {
                    results.forEach((r, index)=> {
                        var subJectArray = [];
                        r.forEach(subJectInfo=> {
                            subJectArray.push(subJectInfo);
                        })
                        var key = 'SUBJECTSINFO_' + (index + 1);
                        subJectsMap[key] = subJectArray;
                    });
                    //将分类策略map存放至内存
                    if (results != undefined&&results.length>0&&results[0].length==10) {
                        global.SubJectsMap = subJectsMap;
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
setInterval(loadSubJects, 300*1e3);
exports.loadSubJects = loadSubJects;



function getStockPlate(){
    var deferred = Q.defer();
    var sql = ` SELECT PLATE_CODE, CONCAT("[",GROUP_CONCAT('{',ifnull(concat('"CONC_RELA_STK":"',CONC_RELA_STK,'"'),""),'}'),"]") AS STOCKARRAY FROM stockplate group by PLATE_CODE `;
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
//初始化加载板块成分股
function loadStockPlate(){
    logger.initdata.info('=====>初始化加载板块成分股数据 StockPlate......')
    var deferred = Q.defer();
    if(common.isLoadingTime(timearea,checktime)) {
        var stockPlateMap = {};
        try {
            getStockPlate().then(
                function (results) {
                    results.forEach(r=> {
                        var key = r.PLATE_CODE;
                        var value = r.STOCKARRAY;
                        stockPlateMap[key] = value;
                    });
                    //板块成分股数据存放至内存中
                    if (results != undefined && results.length > 0) {
                        global.StockPlate = stockPlateMap;
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
setInterval(loadStockPlate, 300*1e3);
exports.loadStockHot = loadStockPlate;



function getStockHot(){
    var deferred = Q.defer();
    var sql = ` select * from stockhot `;
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
//初始化加载股票热度数据
function loadStockHot(){
    logger.initdata.info('=====>初始化加载股票热度数据 HotStock......')
    var deferred = Q.defer();
    if(common.isLoadingTime(timearea,checktime)) {
        var stockHotMap = {};
        try {
            getStockHot().then(
                function (results) {
                    results.forEach(r=> {
                        var key = r.STK_CODE;
                        var value = r;
                        stockHotMap[key] = value;
                    });
                    //将股票热度数据存放至内存中
                    if (results != undefined && results.length > 0) {
                        global.HotStock = stockHotMap;
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
setInterval(loadStockHot, 300*1e3);
exports.loadStockHot = loadStockHot;



function getStockHotHistory(){
    var deferred = Q.defer();
    var sql = ` select c.STK_CODE,CONCAT("[", GROUP_CONCAT('{', ifnull(concat('"STK_CODE":"',c.STK_CODE,'"'),""),ifnull(concat(',"STK_HOT_INDEX":',c.STK_HOT_INDEX,''),0), `+
  ` ifnull(concat(',"COUNT_DATE":"',c.COUNT_DATE,'"'),""),'}'),"]") AS jsonArray FROM (select * from stockhot_history order by count_date asc)c group by c.STK_CODE `;
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
//初始化加载精品策略
function loadStockHotHistory(){
    logger.initdata.info('=====>初始化加载股票热度历史数据 HotStockHistory......')
    var deferred = Q.defer();
    if(common.isLoadingTime(timearea,checktime)) {
        var stockHotMap = {};
        try {
            getStockHotHistory().then(
                function (results) {
                    results.forEach(r=> {
                        var key = r.STK_CODE;
                        var value = r.jsonArray;
                        stockHotMap[key] = value;
                    });
                    //将股票热度数据存放至内存中
                    if (results != undefined && results.length > 0) {
                        global.HotStockHistory = stockHotMap;
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
setInterval(loadStockHotHistory, 3600*1e3);
exports.loadStockHotHistory = loadStockHotHistory;


//获取每日设置热股
function getDayStock(){
    var deferred = Q.defer();
    var sql = ` select concat(case Stock_Mar when 1 then '0000' when 2 then '0100' end,Stock_Code) as STK_CODE ,Stock_Name,Stock_Date from niustock_day where Stock_Date=(select max(Stock_Date) from niustock_day) `;
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
//初始化加载每日设置热股
function loadDayStock(){
    logger.initdata.info('=====>初始化加载每日设置热股 DayStock......')
    var deferred = Q.defer();
    if(common.isLoadingTime(timearea,checktime)) {
        var stockDayArray = [];
        try {
            getDayStock().then(
                function (results) {
                    results.forEach(r=> {
                        stockDayArray.push(r);
                    });
                    //将股票热度数据存放至内存中
                    if (results != undefined && results.length > 0) {
                        global.DayStock = stockDayArray;
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
setInterval(loadDayStock, 60*1e3);
exports.loadDayStock = loadDayStock;



//获取个股相关题材
function getStockRelaPlate(){
    var deferred = Q.defer();
    var sql = ` select * from  stock_rela_plate`;
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
//初始化加载个股相关题材
function loadStockRelaPlate(){
    logger.initdata.info('=====>初始化加载股相关题材 StockRelaPlate......')
    var deferred = Q.defer();
    if(common.isLoadingTime(timearea,checktime)) {
        var stockRelaPalteMap = {};
        try {
            getStockRelaPlate().then(
                function (results) {
                    results.forEach(r=> {
                        var key = r.STK_CODE;
                        stockRelaPalteMap[key] = r.PLATE_CODE;
                    });
                    //将个股相关题材数据存放至内存中
                    if (results != undefined && results.length > 0) {
                        global.StockRelaPlate = stockRelaPalteMap;
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
setInterval(loadStockRelaPlate, 60*1e3);
exports.loadStockRelaPlate = loadStockRelaPlate;


//取最大日期的 每周牛股
function getMaxHotWeek(){
    var deferred = Q.defer();
    var sql = ` select concat(case Stock_Mar when 1 then '0000' when 2 then '0100' end,Stock_Code) as STK_CODE,Stock_Date,Week_Profit,HS300_Week_Profit `+
              ` from niustock_week where Stock_Date =(select max(Stock_Date) from niustock_week where Stock_Code is not null ) `;
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
//初始化加载最大日期的每周牛股
function loadMaxHotWeek(){
    logger.initdata.info('=====>初始化加载最大日期的每周牛股 MaxHotWeekStock......')
    var deferred = Q.defer();
    if(common.isLoadingTime(timearea,checktime)) {
        try {
            getMaxHotWeek().then(
                function (results) {
                    //将最大日期的 每周牛股数据存放至内存中
                    if (results != undefined && results.length > 0) {
                        global.MaxHotWeekStock = results;
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
setInterval(loadMaxHotWeek, 3600*1e3);
exports.loadMaxHotWeek = loadMaxHotWeek;


//取历史周牛股
function getHistoryHotWeek(){
    var deferred = Q.defer();
    var sql = ` select c.Stock_Date as STOCK_DATE,CONCAT("[", GROUP_CONCAT('{', ifnull(concat('"STOCK_DATE":"',c.Stock_Date,'"'),""),ifnull(concat(',"STK_CODE":"',c.STK_CODE,'"'),""),ifnull(concat(',"STK_NAME":"',c.Stock_Name,'"'),""),    `+
              ` ifnull(concat(',"WEEK_PROFIT":',c.Week_Profit,''),0),ifnull(concat(',"HS_WEEK_PROFIT":',c.HS300_Week_Profit,''),0), '}'),"]") AS jsonArray from  `+
              ` (select concat(case Stock_Mar when 1 then '0000' when 2 then '0100' end,Stock_Code) as STK_CODE,Stock_Name ,Stock_Date,Week_Profit,HS300_Week_Profit from niustock_week) c group by c.Stock_Date  order by STOCK_DATE desc `;
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

//初始化加载历史每周牛股
function loadHistoryHotWeek(){
    logger.initdata.info('=====>初始化加载历史每周牛股 HistoryHotWeekStock......')
    var deferred = Q.defer();
    if(common.isLoadingTime(timearea,checktime)) {
        try {
            getHistoryHotWeek().then(
                function (results) {
                    //将最大日期的 每周牛股数据存放至内存中
                    if (results != undefined && results.length > 0) {
                        global.HistoryHotWeekStock = results;
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
setInterval(loadHistoryHotWeek, 3600*1e3);
exports.loadMaxHotWeek = loadHistoryHotWeek;


//获取龙虎榜数据并缓存只内存中
function getLHBNewsData(){
    var deferred = Q.defer();
    var http_url = config.url.LHB_TODAY_URL;
    try {
        common.getHttpData(http_url).then(
            function(results){
                deferred.resolve(results);
            },function(err){
                deferred.resolve({});
            }
        ).done();
    }catch(e){
        deferred.resolve({});
    }
    return deferred.promise;
}

function loadLHBNewsData(){
    logger.initdata.info('=====>初始化加载龙虎榜利多利空事件 LHBNewsData......')
    var deferred = Q.defer();
    if(common.isLoadingTime(timearea,checktime)) {
        try {
            getLHBNewsData().then(
                function (results) {
                    //初始化加载龙虎榜利多利空事件
                    if (results != undefined) {
                        global.LHBNewsData = results;
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
setInterval(loadLHBNewsData, 60*1e3);
exports.loadLHBNewsData = loadLHBNewsData;

//获取龙虎榜历史数据 第一页并缓存只内存中
function getLHBNewsHistoryData(){
    var deferred = Q.defer();
    var http_url = config.url.LHB_HISTORY_URL;
    let startDate = moment().subtract('30', 'days').format('YYYY-MM-DD');
    let endDate = moment().subtract('1', 'days').format('YYYY-MM-DD');
    http_url=http_url+'?offset=0&begin='+startDate+'&end='+endDate+'&pageSize=20';
    try {
        common.getHttpData(http_url).then(
            function(results){
                deferred.resolve(results);
            },function(err){
                deferred.resolve({});
            }
        ).done();
    }catch(e){
        deferred.resolve({});
    }
    return deferred.promise;
}


function loadLHBNewsHistoryData(){
    logger.initdata.info('=====>初始化加载龙虎榜历史数据第一页 LHBNewsHistoryData......')
    var deferred = Q.defer();
    try{
        getLHBNewsHistoryData().then(
            function(results){
                //初始化加载龙虎榜利多利空事件
                if(results!=undefined) {
                    global.LHBNewsHistoryData = results;
                }
                deferred.resolve(results);
            },function(err){
                deferred.resolve();
            }
        ).done();
    }catch(e){
        deferred.resolve();
    }
    return deferred.promise;
}
setInterval(loadLHBNewsHistoryData, 3600*1e3);
exports.loadLHBNewsHistoryData = loadLHBNewsHistoryData;



//更新历史周牛股数据的 周收益 以及沪深300收益,每次计算最近一月数据--------------------------------------------------------------------------
function calcHotWeekProfit(){
    var deferred = Q.defer();
    var sql = ` select * from niustock_week where Stock_Date=(select max(Stock_Date) from niustock_week)`;
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




//初始化加载历史每周牛股
function loadCalcHotWeekProfit(){
    logger.initdata.info('=====>初始化计算历史每周牛股周收益......')
    var deferred = Q.defer();
    if(common.isLoadingTime(timearea,checktime)) {
        try {
            calcHotWeekProfit().then(
                function (results) {
                    var weekDay = common.getWeekStartAndEnd(0);
                    TradeDate.GetTradeDate(weekDay[0], weekDay[1]).then(
                        function (res) {
                            //本周存在交易日，并且最大的周选股日期再本周之内
                            var isTradeWeek = res.length > 0;
                            var req_array = [];
                            results.forEach(r=> {
                                if (isTradeWeek && (r.Stock_Date >= weekDay[0])) {
                                    var Id = r.Id;
                                    var market = r.Stock_Mar - 1 < 0 ? 0 : r.Stock_Mar - 1;
                                    var stock = r.Stock_Code == null ? '' : r.Stock_Code;
                                    var date = moment(r.Stock_Date).format('YYYY-MM-DD');
                                    req_array.push({shtSetcode: market, sCode: stock, date: date, Id: Id});
                                    req_array.push({shtSetcode: 1, sCode: '000300', date: date, Id: Id});
                                }
                            });
                            getWeekProfit(req_array).then(
                                function (result) {
                                    deferred.resolve(result);
                                }, function (err) {
                                    deferred.resolve([]);
                                }
                            ).done();
                        }, function (err) {
                            deferred.resolve([]);
                        }).done();
                }, function (err) {
                    deferred.resolve([]);
                }
            ).done();
        } catch (e) {
            deferred.resolve([]);
        }
    }else{
        deferred.resolve([]);
    }
    return deferred.promise;
}
setInterval(loadCalcHotWeekProfit, 3600*2*1e3);
exports.loadMaxHotWeek = loadCalcHotWeekProfit;

//获取个股周K线
function getStockWeekKLine(json){
    var deferred = Q.defer();
    try{
        var kLineDataReq = new HQSys.KLineDataReq();
        kLineDataReq.market=json.shtSetcode;
        kLineDataReq.sCode=json.sCode;
        kLineDataReq.eLineType=Common_HQSys.HISTORY_DATA_TYPE.HDT_WEEK_KLINE;
        kLineDataReq.shtStartxh=0;
        kLineDataReq.shtWantNum=2;
        prx.kLineData(kLineDataReq).then(
            function(ret){
                var status = ret.response.return;
                if(status===0){
                    var vAnalyData = ret.response.arguments.stRsp.vAnalyData.value;
                    if(vAnalyData.length==0){
                        deferred.resolve({shtSetcode:json.shtSetcode,sCode:json.sCode,profit:0,date:json.date,Id:json.Id});
                    }else{
                        var fOpen=0;
                        var fClose=0;
                        var profit=0;
                        if(vAnalyData.length<2){
                            fOpen = vAnalyData[0].fOpen;
                            fClose =vAnalyData[0].fClose;
                        }else{

                            fOpen = vAnalyData[0].fClose;
                            fClose = vAnalyData[1].fClose;
                        }
                        profit = ((fClose-fOpen)/fOpen).toFixed(6);
                        deferred.resolve({shtSetcode:json.shtSetcode,sCode:json.sCode,profit:profit,date:json.date,Id:json.Id});
                    }
                }
            }, function(err){
                console.log(err);
                deferred.resolve({});
            }
        ).done();
    }catch(e){
        deferred.resolve({});
    }
    return deferred.promise;
}

function getWeekProfit(req_array){
    logger.newsserver.info('=====>查询个股本周收益......')
    var deferred = Q.defer();
    try{
        Q.all(req_array.map(req_json=>getStockWeekKLine(req_json))).then(
            function(results){
                Q.all(results.map(result_json=>updateWeekProfit(result_json))).then(
                    function(finallyresult){
                        deferred.resolve(finallyresult);
                    },function(err){
                        deferred.resolve([]);
                    }
                ).done()
            },function(err){
                deferred.resolve();
            }
        ).done();
    }catch(e){
        deferred.resolve();
    }
    return deferred.promise;
}


function updateWeekProfit(json){
    var deferred = Q.defer();
    var sql = ``;
    if(json.sCode=='000300'){
        sql = ` update niustock_week set HS300_Week_Profit=? where Id=? `;
    }else{
        sql = ` update niustock_week set Week_Profit=? where Id=? `;
    }
    try {
        execQuery(sql, [json.profit,json.Id], function (err, rows) {
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