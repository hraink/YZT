/**
 * Created by 99150 on 2017/1/5.
 */

'use strict';
var request = require('request');
var Q = require('q');
exports.sortByKey =(array,key)=>{
    return array.sort(function(a, b) {
        var x = a[key]; var y = b[key];
        return ((x < y) ? 1 : ((x > y) ? -1 : 0));
    });
}

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
