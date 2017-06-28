/**
 * Created by shinan on 2017/3/6.
 */
var express = require('express')
var router = express.Router()
var api = require('./api')
var co = require('co')
var moment = require('moment')

// 把行情加入选股
var addHqToChooseStock = (stgyInfoList, hqMap) => {
  stgyInfoList.forEach(stgy => {
    addHqToChooseStockEach(stgy.chooseStock, hqMap)
  })
}

var addHqToChooseStockEach = (chooseStock, hqMap) => {
  chooseStock.forEach(stock => {
    var key = stock.stockCode

    if (key in hqMap) {
      stock.nowPrice = hqMap[key].dNowPrice
      stock.industry = hqMap[key].sIndustryName
    } else {
      stock.nowPrice = '--'
      stock.industry = '--'
    }
  })
}

const countZdf = (stock) => {
  stock.zdf = (stock.nowPrice - stock.price) / stock.price
  if (Math.abs(stock.zdf) < 0.0001) {
    stock.zdf = 0
  }
}

router.get('/strategy.html', (req, res, next) => {
  co(function*() {
    var stgyCategory = req.query.type
    var stgyInfoList = yield api.getStgyInfoList(stgyCategory)

    stgyInfoList.forEach(item => {
      item.stgyStyle = item.stgyStyle.split(',')
    })

    // 策略代码，最新选股日期
    var stgyCode, currStgy, chooseDate
    if ('stgyCode' in req.query) {
      stgyCode = req.query.stgyCode
      currStgy = stgyInfoList.find(item => item.stgyCode == stgyCode)
      chooseDate = currStgy.newChooseDate
    } else {
      currStgy = stgyInfoList[0]
      stgyCode = stgyInfoList[0].stgyCode
      chooseDate = stgyInfoList[0].newChooseDate
    }

    // 当前策略的近期战绩
    var topStock = yield api.getTopStock(stgyCode)

    // 当前策略的近期选股
    var chooseStock = yield api.getChooseStock({
      stgyCode,
      chooseDate
    })

    // 拼取行情的参数列表
    let args = chooseStock.map(stock => ({
      shtSetcode: stock.market,
      sCode: stock.stockCode
    }))

    // 获取行情
    let hqArr = yield api.stock2Industry(args)
    let hqMap = {}

    hqArr.forEach(hq => {
      hqMap[hq.sCode] = hq
    })

    // 行情数据揉到选股数据里面
    addHqToChooseStockEach(chooseStock, hqMap)
    // 计算涨跌幅
    chooseStock.forEach(countZdf)
    chooseStock.sort((a, b) => b.zdf - a.zdf)

    currStgy.topStock = topStock
    currStgy.chooseStock = chooseStock
    currStgy.newChooseDateFormated = moment(currStgy.newChooseDate).format('YYYY-MM-DD')

    res.render('strategy/strategy.ejs', {
      stgyInfoList: stgyInfoList,
      type: stgyCategory || 1,
      currStgy
    })
  }).catch(next)
})

// 动态更新选股
router.get('/choose', (req, res, next) => {
  var { stgyCode, chooseDate } = req.query

  stgyCode = decodeURI(stgyCode)

  chooseDate = moment(chooseDate).format('YYYYMMDD')

  co(function*() {
    var chooseStock = yield api.getChooseStock({
      stgyCode,
      chooseDate
    })

    var args = chooseStock.map(stock => {
      return {
        shtSetcode: stock.market,
        sCode: stock.stockCode
      }
    })

    var hqArr = yield api.stock2Industry(args)
    let hqMap = {}

    hqArr.forEach(hq => {
      hqMap[hq.sCode] = hq
    })

    addHqToChooseStockEach(chooseStock, hqMap)

    chooseStock.forEach(countZdf)
    chooseStock.sort((a, b) => b.zdf - a.zdf)

    res.json({
      chooseStock: chooseStock
    })
  })
})

module.exports = router