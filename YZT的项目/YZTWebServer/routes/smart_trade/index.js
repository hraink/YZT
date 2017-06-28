var express = require('express')
var router = express.Router()
var Taf = require("@taf/taf-rpc").Communicator.New()
var Strategy = require("../../jce/StrategyServerProxy").Strategy
var servant = 'AI.StrategyServer.StrategyServerObj'

if (!process.env.TAF_CONFIG) {
  servant += "@tcp -h 172.16.8.185 -t 60000 -p 10021"
}

const StrategyInterfProxy = Taf.stringToProxy(Strategy.StrategyInterfProxy, servant)

const FLAG_NAMES = {
  1: '黄金B点',
  2: '共赢共振',
  3: '明星策略'
}

router.get('/operate.html', (req, res, next) => {
  const successCallback = rsp => {
    var { iRet } = rsp.response.arguments.optiStockRsp

    if (+iRet === 0) {
      let list = rsp.response.arguments.optiStockRsp.optiStockList.toObject()

      list.forEach(item => {
        item.flagName = FLAG_NAMES[item.flag] || ''
      })

      res.render('smart_trade/index.ejs', {
        optiStockList: list
      })
    } else {
      next(new Error('获取最优策略战绩失败'))
    }
  }

  const errorCallback = rsp => {
    next(new Error('获取最优策略战绩失败'))
  }

	StrategyInterfProxy.getOptiStock()
		.then(successCallback)
		.fail(errorCallback)
})

module.exports = router