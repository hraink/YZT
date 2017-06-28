/**
 * Created by 99150 on 2017/1/5.
 */
'use strict';
var Q = require('q');
var request = require('request');
var crypto = require('crypto');
var key = new Buffer('upchina6');
var moment    = require('moment');
var iv = new Buffer([0x75, 0x70, 0x63, 0x68, 0x69, 0x6e, 0x61, 0x31]);//upchina1
var alg = 'blowfish';

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

exports.sortByKeyDesc =(array,key)=>{
    return array.sort(function(a, b) {
        var x = a[key]; var y = b[key];
        return ((x < y) ? 1 : ((x > y) ? -1 : 0));
    });
}
function formatStrDate(date){
    if(date==undefined||date==''||date.length<8){
        return date;
    }
    return date.substr(0,4)+'-'+date.substr(4,2)+'-'+date.substr(6,date.length);
}

exports.formatStrDate = formatStrDate;


//获取当前日期yy-mm-dd
//date 为时间对象
function getDateStr3(date) {
    var year = "";
    var month = "";
    var day = "";
    var now = date;
    year = ""+now.getFullYear();
    if((now.getMonth()+1)<10){
        month = "0"+(now.getMonth()+1);
    }else{
        month = ""+(now.getMonth()+1);
    }
    if((now.getDate())<10){
        day = "0"+(now.getDate());
    }else{
        day = ""+(now.getDate());
    }
    return year+""+month+""+day;
}

/**
 * 获得相对当前周AddWeekCount个周的起止日期
 * AddWeekCount为0代表当前周   为-1代表上一个周   为1代表下一个周以此类推
 * **/
function getWeekStartAndEnd(AddWeekCount) {
    //起止日期数组
    var startStop = new Array();
    //一天的毫秒数
    var millisecond = 1000 * 60 * 60 * 24;
    //获取当前时间
    var currentDate = new Date();
    //相对于当前日期AddWeekCount个周的日期
    currentDate = new Date(currentDate.getTime() + (millisecond * 7*AddWeekCount));
    //返回date是一周中的某一天
    var week = currentDate.getDay();
    //返回date是一个月中的某一天
    var month = currentDate.getDate();
    //减去的天数
    var minusDay = week != 0 ? week - 1 : 6;
    //获得当前周的第一天
    var currentWeekFirstDay = new Date(currentDate.getTime() - (millisecond * minusDay));
    //获得当前周的最后一天
    var currentWeekLastDay = new Date(currentWeekFirstDay.getTime() + (millisecond * 6));
    //添加至数组
    startStop.push(getDateStr3(currentWeekFirstDay));
    startStop.push(getDateStr3(currentWeekLastDay));
    return startStop;
}
exports.getWeekStartAndEnd = getWeekStartAndEnd;


function descryptData(key,encrypt)
{
    var decipher = crypto.createDecipheriv(alg, key, iv);
    decipher.setAutoPadding(false)
    var dencryptRes = decipher.update(encrypt, 'base64', 'utf8');
    dencryptRes += decipher.final('utf8');
    return dencryptRes;
}

exports.descryptData = descryptData;



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


