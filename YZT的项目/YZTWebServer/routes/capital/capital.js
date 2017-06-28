/**
 * 资金流向
 * Created by xudong.cai on 2017/2/7.
 */
const express = require('express');
const router = express.Router();
const Taf = require("@taf/taf-rpc").Communicator.New();
const Common_HQSys = require('../../jce/CommonJce').HQSys;
const HQSys = require('../../jce/HsServerProxy').HQSys;
var servant = "HQWeb.HsServer.HsServerObj";
if (!process.env.TAF_CONFIG){
    servant = "@tcp -h 	172.16.8.185 -t 60000 -p 10022";
}

var prx = Taf.stringToProxy(HQSys.BasicHqProxy, servant);
router.get('/index.html',function (req, res, next) {
    res.render('capital/index');
});
//查询资金流向数据
router.get('/query/:EBT_TYPE/:EMR_DAY',function (req, res, next) {
    const mFlowRankReq = new HQSys.MFlowRankReq();
    const EBT_Value = Common_HQSys.E_BUSS_TYPE[req.params.EBT_TYPE];
    const EMR_DAY_Value = Common_HQSys.E_MF_RANK_DAY['EMR_DAY_'+req.params.EMR_DAY] || 1;
    if (!EBT_Value){
        res.send({result:null});
        return;
    }
    mFlowRankReq.eBussType = EBT_Value;    //A股 EBT_A   题材：EBT_BLK_GN   行业：EBT_BLK_HY
    mFlowRankReq.shtStartxh = req.query.STARTXH || 0;
    mFlowRankReq.shtWantNum = req.query.WANTNUM || 10;
    mFlowRankReq.eColumn = Common_HQSys.E_MF_RANK_SORT_COLUMN[req.query.SORT_COLUMN];
    mFlowRankReq.eSort = Common_HQSys.E_SORT_METHOD[req.query.SORT_METHOD];
    logger.access_log.debug('【资金流向数据】请求参数：',mFlowRankReq.toObject());
    logger.access_log.debug("【资金流向数据】EMR_DAY_Value:",EMR_DAY_Value);
    prx.mfRank(mFlowRankReq).then(ret => {
        let status = ret.response.return;
        if (status === 0){
            let iRet = ret.response.arguments.stRsp.iRet;
            let iMsg = ret.response.arguments.stRsp.iMsg;
            let iTotalSize = ret.response.arguments.stRsp.iTotalSize;
            let vMFlowRank = ret.response.arguments.stRsp.vMFlowRank.value;
            //取时间区间数据
            if (EMR_DAY_Value != 1){
                for (var i in vMFlowRank){
                    vMFlowRank[i].fDayMFlowTrend = vMFlowRank[i]['f'+(EMR_DAY_Value === 1 ? "" :EMR_DAY_Value)+'DayMFlowTrend'];
                }
            }
            logger.access_log.debug('【资金流向数据】iRet',iRet);
            logger.access_log.debug('【资金流向数据】iMsg',iMsg);
            logger.access_log.debug('【资金流向数据】iTotalSize',iTotalSize);
            res.send({vMFlowRank:vMFlowRank,iTotalSize:iTotalSize});
        }else {
            logger.access_log.debug('【资金流向数据】status',status);
            res.send({result:null});
        }
    },err => {
        logger.error('### error 【资金流向数据】 ###',err.response);
        res.send({result:null});
    }).catch(err => {
        logger.error('### error 【资金流向数据】 ###',err.response);
        res.send({result:null});
    });
});

//查询资金流向数据
router.post('/hq/:EMR_DAY',function (req, res, next) {
    const mFlowRankReq = new HQSys.MFlowRankReq();
    const EMR_DAY_Value = Common_HQSys.E_MF_RANK_DAY['EMR_DAY_'+req.params.EMR_DAY] || 1;
    var socketData = JSON.parse(req.body.socketData);
    if (!socketData || socketData.length == 0){
        res.send({result:null});
    }
    var array = socketData || [];
    mFlowRankReq.vStock.readFromObject(array);
    logger.access_log.debug('【资金流向HQ数据】请求参数：',mFlowRankReq.toObject());
    logger.access_log.debug("【资金流向HQ数据】EMR_DAY_Value:",EMR_DAY_Value);
    prx.mfRank(mFlowRankReq).then(ret => {
        let status = ret.response.return;
        if (status === 0){
            let iRet = ret.response.arguments.stRsp.iRet;
            let iMsg = ret.response.arguments.stRsp.iMsg;
            let vMFlowRank = ret.response.arguments.stRsp.vMFlowRank.value;
            //取时间区间数据
            if (EMR_DAY_Value != 1){
                for (var i in vMFlowRank){
                    vMFlowRank[i].fDayMFlowTrend = vMFlowRank[i]['f'+(EMR_DAY_Value === 1 ? "" :EMR_DAY_Value)+'DayMFlowTrend'];
                }
            }
            logger.access_log.debug('【资金流向HQ数据】iRet',iRet);
            logger.access_log.debug('【资金流向HQ数据】iMsg',iMsg);
            res.send({vMFlowRank:vMFlowRank});
        }else {
            logger.access_log.debug('【资金流向HQ数据】status',status);
            res.send({result:null});
        }
    },err => {
        logger.error('### error 【资金流向HQ数据】 ###',err.response);
        res.send({result:null});
    }).catch(err => {
        logger.error('### error 【资金流向HQ数据】 ###',err.response);
        res.send({result:null});
    });
});
module.exports = router;