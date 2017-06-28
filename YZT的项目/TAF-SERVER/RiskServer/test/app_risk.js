var moment  = require('moment');
var Taf = require("@taf/taf-rpc").Communicator.New();
var Risk = require("./RiskServerProxy.js").Risk;
var servant = 'AI.RiskServer.RiskServerObj';
if (!process.env.TAF_CONFIG) {
        //servant += "@tcp -h 127.0.0.1 -p 14009 -t 60000";
        //servant += "@tcp -h 172.16.8.146 -t 60000 -p 10012";
        servant+= "@tcp -h 172.16.8.185 -t 60000 -p 10012";
}

var prx = Taf.stringToProxy(Risk.RiskInterProxy, servant);
var startT = new Date().getTime();

//查询用户风险评测
//prx.queryUserRisk('zhuj').then(function(ret){
//        var status = ret.response.return;
//        console.log(status);
//        console.log(ret.response.arguments.userRisk.toObject());
//        var startE = new Date().getTime();
//        console.log('times-------------',startE-startT);
//
//    }, function(err){
//        console.log('### error ###',err);
//});

//用户风险评测
//var userRisk = new Risk.UserRisk();
//userRisk.userName='zhuj';
//userRisk.risk1=2;
//userRisk.risk2=1;
//userRisk.risk3=1;
//userRisk.risk4=1;
//userRisk.risk5=1;
//userRisk.risk6=1;
//userRisk.risk7=1;
//userRisk.risk8=1;
//prx.setUserRisk(userRisk).then(function(ret){
//        var rsp = ret.response.return;
//        console.log('return-----------------',ret.response.return)
//        var startE = new Date().getTime();
//        console.log('times-------------',startE-startT);
//}, function(err){
//        console.log('### error ###',err);
//});

//var userAuthReq = new Risk.UserAuthReq();
//userAuthReq.userName='cjcgzhu';
//userAuthReq.code='351';
//prx.queryUserAuth(userAuthReq).then(function(ret){
//        var status = ret.response.return;
//        console.log(status);
//        console.log(ret.response.arguments.stRsp);
//        var startE = new Date().getTime();
//        console.log('times-------------',startE-startT);
//
//}, function(err){
//        console.log('### error ###',err);
//});


let index = require('@up/crm-module/index');

index.getModule('upv_cpwh2', 351).then(function(data){

         console.log(data);
},function(err){
        console.log(err)
});
