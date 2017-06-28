/**
 * Created by 99150 on 2017/1/5.
 */

'use strict';
var Q = require('q');
var request = require('request');
var moment    = require('moment');
function getHttpData(http_url){
    var deferred = Q.defer();
    try{
        request(http_url, function (error, response, body) {
            if (!error&&response.statusCode == 200) {
                var jsonBody = JSON.parse(body);
                deferred.resolve(jsonBody);
            }else{
                deferred.reject(error);
            }
        });
    }catch(e){
        deferred.reject(e);
    }
    return deferred.promise;
}

exports.getHttpData = getHttpData;

exports.sortByKey =(array,key)=>{
    return array.sort(function(a, b) {
        var x = a[key]; var y = b[key];
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
}

function formatStrDate(date){
    if(date==undefined||date==''||date.length<8){
        return date;
    }
    return date.substr(0,4)+'-'+date.substr(4,2)+'-'+date.substr(6,date.length);
}

exports.formatStrDate = formatStrDate;


function isLoadingTime(timearea,checkTime){
    if(checkTime==='false'){
        return true;
    }
    var isLoadingTime = false;
    var minTime =timearea.split('-')[0];
    var maxTime =timearea.split('-')[1];
    var nowTime =moment().format('HH');
    if(nowTime<minTime||nowTime>=maxTime){
        isLoadingTime=true;
    }
    return isLoadingTime
}

exports.isLoadingTime = isLoadingTime;
