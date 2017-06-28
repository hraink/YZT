/**
 * Created by shinan on 2017/3/2.
 */
var co = require('co')
var express = require('express')
var router = express.Router()
var Taf = require('@taf/taf-rpc').Communicator.New()
var Strategy = require('../../jce/StrategyServerProxy').Strategy
var HQSys = require('../../jce/HsServerProxy').HQSys

const getPrx = (proxy, servant, address) => {
  if (!process.env.TAF_CONFIG) {
    servant += address
  }
  var prx = Taf.stringToProxy(proxy, servant)

  return prx
}

var prx = getPrx(Strategy.StrategyInterfProxy, 'AI.StrategyServer.StrategyServerObj', "@tcp -h 172.16.8.185 -t 60000 -p 10021")
var hqPrx = getPrx(HQSys.BasicHqProxy, 'HQWeb.HsServer.HsServerObj', "@tcp -h 172.16.8.185 -t 60000 -p 10022")

var getStockDiagnosis = (code = '000004', market = 0) => {
  var StockDiagnosisReq = new Strategy.StockDiagnosisReq()
  StockDiagnosisReq.readFromObject({
    market,
    code
  })

  return new Promise((resolve, reject) => {
    prx.getStockDiagnosis(StockDiagnosisReq)
      .then(rsp => {
        var obj = rsp.response.arguments.stRsp.toObject()
        var iRet = obj.iRet



        if (iRet == 0) {
          resolve(obj.stockDiagnosis)
        } else {
          reject(new Error('getStockDiagnosis接口调用失败'))
        }
      })
      .fail(err => {
        console.log(err)
        reject(new Error('getStockDiagnosis接口调用失败'))
      })
  })
}

var getStockStar = type => {
  var StockStarReq = new Strategy.StockStarReq()

  StockStarReq.readFromObject({type})

  return new Promise((resolve, reject) => {
    prx.getStockStar(StockStarReq)
      .then(rsp => {
        resolve(rsp.response.arguments.stRsp.toObject())
      })
      .fail(err => {
        reject(new Error('getStockStar接口调用失败'))
      })
  })
}

var getStockHq = (code, market) => {
  var stockHqReq = new HQSys.StockHqReq()

  stockHqReq.vStock.readFromObject([{
    shtSetcode: market,
    sCode: code
  }])

  return new Promise((resolve, reject) => {
    hqPrx.stockHq(stockHqReq).then(ret => {
      console.log('enter here')
      var stRsp = ret.response.arguments.stRsp.toObject()

      resolve(stRsp.vStockHq[0])
    }).fail(err => {
      reject(new Error('获取个股行情失败'))
    })
  })
}

router.use((req, res, next) => {
  req.app.locals.calColor = (value) => {
    if (value > 0) {
      return 'height'
    } else if (value < 0) {
      return 'low'
    }

    return 'middle'
  }

  req.app.locals.formatMoney = (n) => {
    var a = [[1e4, '万'], [1e8, '亿']]

    for (var i = a.length - 1; i >= 0; i--) {
      let [size, unit] = a[i]

      if (Math.abs(n) > size) {
        let ret = (n / size).toFixed(2)

        if (i == 0) {
          ret = parseInt(ret)
        }

        return ret + unit
      }
    }

    return n
  }

  req.app.locals.percent = (n) => {
    n = n * 100

    return n.toFixed(2) + '%'
  }

  next()
})

router.get('/diagnose.html', (req, res, next) => {
  Promise.all([
    getStockStar(1),
    getStockStar(2)
  ]).then(([starList, potentialList]) => {
    res.render('diagnose/index.ejs', {
      starList: starList.stockStarList,
      potentialList: potentialList.stockStarList
    })
  }).catch(next)
})

router.get('/stock', (req, res, next) => {
  co(function*() {
    var { code, market } = req.query
    var stockDiagnosis = yield getStockDiagnosis(code, market)
    var stockHq = yield getStockHq(code, market)
    var isStop = stockHq.stExHq.bTransactionStatus == 80

    res.render('diagnose/diagnose.ejs', {
      stockDiagnosis,
      isStop
    })
  }).catch(next)
})

module.exports = router