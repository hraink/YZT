/**
 * 风险评测
 * Created by xudong.cai on 2017/2/7.
 */
const express = require('express');
const router = express.Router();
const Taf = require("@taf/taf-rpc").Communicator.New();
const Risk = require("../../jce/RiskServerProxy.js").Risk;
var servant = "AI.RiskServer.RiskServerObj";
if (!process.env.TAF_CONFIG){
    servant = "@tcp -h 172.16.8.185 -t 60000 -p 10012";
}

var prx = Taf.stringToProxy(Risk.RiskInterProxy, servant);

//风险评测页面
router.get('/index.html',queryRisk,function (req, res, next) {
    let userRisk = res.locals.riskInfo ? res.locals.riskInfo.arguments.userRisk : null;
    logger.access_log.debug("【用户测评数据】：",userRisk);
    //如果用户已评测过，直接跳转评测结果页
    if (req.query.retest != 1 && userRisk){
        const riskInfo = res.locals.riskInfo.arguments.userRisk;
        riskInfo.riskLever = convertDict.lever(riskInfo.riskType);
        res.render('risk/result',{riskInfo:riskInfo});
    }else {
        res.render('risk/index',{riskInfo:res.locals.riskInfo.arguments.userRisk,userName:req.params.username});
    }
});
//风险评测结果
router.get('/result.html',queryRisk,function (req, res, next) {
    let userRisk = res.locals.riskInfo ? res.locals.riskInfo.arguments.userRisk : null;
    logger.access_log.debug("【风险评测结果】：",userRisk);
    if (userRisk == null){
        //跳转错误页面
    }
    const riskInfo = userRisk;
    riskInfo.riskLever = convertDict.lever(riskInfo.riskType);
    res.render('risk/result',{riskInfo:riskInfo});
});
//提交风险评测
router.post('/submit',submitRisk);

function submitRisk(req, res, next) {
    logger.access_log.debug("【提交风险评测】");
    const riskData = req.body;
    const userRisk = new Risk.UserRisk();
    userRisk.userName = res.locals.loginUserName;
    for (var i in riskData){
        //不允许有未填项目
        if (Number(riskData[i]) === 0){
            res.send(-1);
            return;
        }
        userRisk[i] = riskData[i];
    }
    prx.setUserRisk(userRisk).then(ret => {
        res.send({status:ret.response.return});
    },err => {
        logger.error.debug('### error 【提交风险评测】 ###',err.response);
        res.send({status:-1});
    }).catch(err => {
        logger.error.debug('### error 【提交风险评测】 ###',err.response);
        res.send({status:-1});
    });
}
function queryRisk(req, res, next) {
    const username = res.locals.loginUserName;
    prx.queryUserRisk(username).then(ret => {
        res.locals.riskInfo = ret.response;
        next();
    },err => {
        logger.error.debug('### error 【提交风险评测】 ###',err.response);
        next();
    }).catch(err => {
        logger.error.debug('### error 【提交风险评测】 ###',err.response);
        next();
    });
}
//转换中文显示
const convertDict = {
    //年龄
    age : {
        2:'30岁以下',
        6:'31-40',
        7:'41-50',
        4:'51-60岁',
        1:'60岁以上'
    },
    //职业
    jobs : {
        1:'初中及以下',
        2:'高中/中专',
        4:'大专/本科',
        6:'硕士及以上'
    },
    //风险等级
    lever : function (riskType) {
        if (riskType.indexOf('C') > 0){
            return 'low';
        }
        if (riskType.indexOf('F') > 0){
            return 'middle';
        }
        if (riskType.indexOf('P') > 0){
            return 'height';
        }
    }
}
module.exports = router;