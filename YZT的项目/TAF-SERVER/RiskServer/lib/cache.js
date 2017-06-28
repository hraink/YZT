/**
 * Created by 99150 on 2016/11/9.
 */
'use strict';
const Cache = require("@taf/taf-dcache-helper");
const util = require('./util');
const common = require('./common');
const config = util.getConf();
var Q = require('q');
var TafStream = require('@taf/taf-stream');
let DCacheServerTarget = "DCache.AIProxyServer.ProxyObj";
if(!process.env.TAF_CONFIG){
    DCacheServerTarget+="@tcp -h 172.16.8.119 -t 60000 -p 16240";
}
const cacheHelper = new Cache({
    proxy: DCacheServerTarget,
    moduleName: "AIRiskCache"
});

//setcache 永久有效
exports.setCache = function(key,value){
    var deferred = Q.defer();
    try{
        cacheHelper.setStringEx(key, value,0, true, 0).then(
                result=>{
                deferred.resolve(result);
            },err=>{
                deferred.reject(err);
            }
        ).done();
    }catch(err){
        deferred.reject(err);
    }
    return deferred.promise;
};
//getcache 永久有效
exports.getCache =function(key){
    var deferred = Q.defer();
    try{
        cacheHelper.getString(key).then(
                result=>{
                deferred.resolve(result);
            },err=>{
                deferred.reject(err);
            }
        ).done();
    }catch(err){
        deferred.reject(err);
    }
    return deferred.promise;
};

exports.setCacheWithLiveTime = function(key,value,livetime){
    var deferred = Q.defer();
    try{
        livetime =livetime>0?livetime:config.cache.livetime-0;
        cacheHelper.setStringEx(key, value,0, true, (Date.now() / 1e3 +livetime).toFixed(0)).then(
                result=>{
                deferred.resolve(result);
            },err=>{
                deferred.reject(err);
            }
        ).done();
    }catch(err){
        deferred.reject(err);
    }
    return deferred.promise;
};

//一次获取多个Key 的cache
exports.getManyCache =function(keys){
    var deferred = Q.defer();
    try{
        cacheHelper.getStringBatch(keys).then(
                result=>{
                deferred.resolve(result);
            },err=>{
                deferred.reject(err);
            }
        ).done();
    }catch(err){
        deferred.reject(err);
    }
    return deferred.promise;
};

//获取缓存 缓存版本号
exports.getCacheWithVer = function(key){
    var deferred = Q.defer();
    try{
        cacheHelper.getStringWithVer(key).then(
                result=>{
                deferred.resolve(result);
            },err=>{
                deferred.reject(err);
            }
        ).done();
    }catch(err){
        deferred.reject(err);
    }
    return deferred.promise;
}

//设置缓存 存在缓存版本号
exports.setCacheWithVer = function(key,value,ver){
    var deferred = Q.defer();
    try{
        cacheHelper.setStringEx(key, value, ver, true,0).then(
            function (result) {
                deferred.resolve(result);
            }, function (err) {
                 deferred.reject(err);
        }).done();
    }catch(err){
        deferred.reject(err);
    }
    return deferred.promise;
}

