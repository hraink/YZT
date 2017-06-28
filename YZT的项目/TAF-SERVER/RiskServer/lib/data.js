'use strict';
var mysql   = require('mysql');
var moment    = require('moment');
var Q = require('q');
var TafStream = require('@taf/taf-stream');
var Cache = require("@taf/taf-dcache-helper");
var pool;
var config;
var cache;
var fs;
//程序启动初始化
exports.init = () => {
    var util   = require('./util');
    config = util.getConf();
    cache = require('./cache');
    fs = require('fs');
    //pool  = mysql.createPool({
    //    host        : config.db.dbhost,
    //    port        : config.db.dbport,
    //    user        : config.db.dbuser,
    //    password    : config.db.dbpass,
    //    database    : config.db.dbname,
    //    charset     : config.db.charset,
    //    connectionLimit: config.db.max_connection  //最大连接数
    //});
    //exports.getPool = () => pool;
    return initBasicData();
}

function initBasicData(){
    var deferred = Q.defer();
    try{
        //初始化公共参数到内存
        //匹配度矩阵 用户类型说明---------------------------------------------------------
        var map={};
        map['1C']={type:'稳健型投资者',risk:'较低',low:60,middle:30,high:10,winHope:'期待资产平稳增值',riskPrepare:'愿意承受较小的净值波动'};
        map['1F']={type:'成长型投资者',risk:'中等',low:30,middle:40,high:30,winHope:'期待较高收益',riskPrepare:'了解风险与收益的匹配关系'};
        map['1P']={type:'进取型投资者',risk:'较高',low:10,middle:30,high:60,winHope:'期待高收益',riskPrepare:'做好了承担相应风险的准备'};
        map['2C']={type:'稳健型投资者',risk:'较低',low:60,middle:30,high:10,winHope:'期待资产平稳增值',riskPrepare:'愿意承受较小的净值波动'};
        map['2F']={type:'成长型投资者',risk:'中等',low:30,middle:40,high:30,winHope:'期待较高收益',riskPrepare:'了解风险与收益的匹配关系'};
        map['2P']={type:'进取型投资者',risk:'较高',low:10,middle:30,high:60,winHope:'期待高收益',riskPrepare:'做好了承担相应风险的准备'};
        map['5C']={type:'稳健型投资者',risk:'较低',low:60,middle:30,high:10,winHope:'期待资产平稳增值',riskPrepare:'愿意承受较小的净值波动'};
        map['5F']={type:'成长型投资者',risk:'中等',low:30,middle:40,high:30,winHope:'期待较高收益',riskPrepare:'了解风险与收益的匹配关系'};
        map['5P']={type:'进取型投资者',risk:'较高',low:10,middle:30,high:60,winHope:'期待高收益',riskPrepare:'做好了承担相应风险的准备'};
        global.matchMap =map;
        deferred.resolve();
    }catch(e){
        deferred.reject(e);
    }
    return deferred.promise;
}

setInterval(initBasicData, 24*3600*1e3);
exports.initBasicData = initBasicData;

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
            console.log(querys.sql);  //打印执行SQL语句
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


