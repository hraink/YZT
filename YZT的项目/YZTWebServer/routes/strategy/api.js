/**
 * Created by shinan on 2017/3/7.
 */
var Taf = require('@taf/taf-rpc').Communicator.New()
var Strategy = require('../../jce/StrategyServerProxy').Strategy
var servant = 'AI.StrategyServer.StrategyServerObj'
var logger = require('../../lib/logger')

if (!process.env.TAF_CONFIG) {
  servant += "@tcp -h 172.16.8.185 -t 60000 -p 10021"
}

// Strategy的服务
var prx = Taf.stringToProxy(Strategy.StrategyInterfProxy, servant)

// 行情服务
var Common_HQSys = require("../../jce/CommonJce.js").HQSys;
var BasicData_HQSys = require("../../jce/BasicDataJce.js").HQSys;
var HQSys = require("../../jce/HsServerProxy.js").HQSys;
var servant1 = 'HQWeb.HsServer.HsServerObj';
if (!process.env.TAF_CONFIG) {
  servant1 += "@tcp -h 172.16.8.185 -t 60000 -p 10022";
}
var hqPrx = Taf.stringToProxy(HQSys.BasicHqProxy, servant1);


var api = {
  getPerfectStock() {
    return new Promise((resolve, reject) => {
      prx.getPerfectStock()
        .then(topStockRsp => {

          topStockRsp = topStockRsp.response.arguments.topStockRsp.toObject()

          if (topStockRsp.iRet == 0) {
            resolve(topStockRsp.topStockList)
          } else {
            reject(new Error('getPerfectStock error'))
          }
        })
        .fail(err => {
          // 打印错误日志
          logger.error.info(err)
          reject(new Error('getPerfectStock error'))
        })
    })
  },
  getTopStgyInfoList() {
    return new Promise((resolve, reject) => {
      prx.getTopStgyInfoList()
        .then(rsp => {
          var stgyInfoRsp = rsp.response.arguments.stgyInfoRsp.toObject()
          if (stgyInfoRsp.iRet == 0) {
            resolve(stgyInfoRsp.stgyInfoList)
          } else {
            reject(new Error('getTopStgyInfoList error'))
          }
        })
        .fail(err => {
          // 打印错误日志
          logger.error.info(err)
          reject(new Error('getTopStgyInfoList error'))
        })
    })
  },
  /*
  * Recommend = 1,      //推荐策略
   LimitUp = 2,        //涨停宝
   Leading = 3,        //龙头战法
   FundCode = 4,       //资金密码
   Trends=5            //舆情动向
  * */
  getStgyInfoList(stgyCategory = 1) {
    return new Promise((resolve, reject) => {
      prx.getStgyInfoList(stgyCategory)
        .then(rsp => {
          var stgyInfoRsp = rsp.response.arguments.stgyInfoRsp.toObject()
          if (stgyInfoRsp.iRet == 0) {
            resolve(stgyInfoRsp.stgyInfoList)
          } else {
            reject(new Error('getStgyInfoList error'))
          }
        })
        .fail(err => {
          // 打印错误日志
          logger.error.info(err)
          reject(new Error(`getStgyInfoList error:${err.response.error.message}`))
        })
    })
  },
  // 获取近期选股
  getChooseStock({stgyCode, chooseDate}) {
    var chooseStockReq = new Strategy.ChooseStockReq()
    chooseStockReq.readFromObject({
      stgyCode,
      chooseDate
    })

    return new Promise((resolve, reject) => {
      prx.getChooseStock(chooseStockReq)
        .then(rsp => {
          var chooseStockRsp = rsp.response.arguments.chooseStockRsp.toObject()
          if (chooseStockRsp.iRet == 0) {
            resolve(chooseStockRsp.chooseStockList)
          } else {
            reject(new Error('getChooseStock error'))
          }
        })
        .fail(err => {
          // 打印错误日志
          logger.error.info(err)
          reject(new Error('getChooseStock error'))
        })
    })
  },
  // 获取近期战绩
  getTopStock(stgyCode) {
    return new Promise((resolve, reject) => {
      prx.getTopStock(stgyCode)
        .then(rsp => {
          var topStockRsp = rsp.response.arguments.topStockRsp.toObject()
          if (topStockRsp.iRet == 0) {
            resolve(topStockRsp.topStockList)
          } else {
            reject(new Error('getTopStock error'))
          }
        })
        .fail(err => {
          // 打印错误日志
          logger.error.info(err)
          reject(new Error('getTopStock error'))
        })
    })
  },
  // 获取行情 stockList: [{shtSetcode:1,sCode:'603238'}]
  stock2Industry(stockList) {
    console.log('参数长度', stockList.length)
    var stock2IndustryReq = new HQSys.Stock2IndustryReq()
    stock2IndustryReq.vStock.readFromObject(stockList)

    return new Promise((resolve, reject) => {
      hqPrx.stock2Industry(stock2IndustryReq).then(rsp => {
        console.log(rsp.response.arguments.stRsp.vStockIndustry.value)
        var stRsp = rsp.response.arguments.stRsp.toObject()
        if (stRsp.iRet == 0) {
          resolve(stRsp.vStockIndustry)
        } else {
          reject(new Error(`stock2Industry error, status: ${stRsp.iRet}`))
        }
      }).fail(err => {
        // 打印错误日志
        logger.error.info(err)
        reject(new Error('stock2Industry error'))
      })
    })
  }
}

module.exports = api