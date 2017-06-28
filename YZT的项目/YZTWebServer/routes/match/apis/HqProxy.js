/**
 * Created by shinan on 2016/12/28.
 */
const Taf = require("@taf/taf-rpc").Communicator.New()
const Market = require('../../../jce/MarketProxy').Market
const logger = require('../../../lib/logger')
var servant = 'Market.MarketNodeServer.MarketNodeServerObj'

if (!process.env.TAF_CONFIG) {
  servant += '@tcp -h 172.16.8.126 -t 60000 -p 10016'
}

const HqProxy = Taf.stringToProxy(Market.WebHQProxy, servant)

module.exports = {
  /*获取实时行情*/
  getStockRealtime: function(market, code) {
    let Req = new Market.stockHqReq()
    let scode = `0${market}00${code}`

    Req.readFromObject({
      vlist: [
        {
          c: scode
        }
      ]
    })

    return new Promise((resolve, reject) => {
      HqProxy.stockHq(Req)
        .then(Rsp => {
          var hq = Rsp.response.arguments.stRsp.toObject().rsp
          console.log('enter here')
          resolve(hq)
        })
        .fail(Rsp => {
          console.log('enter here')

          logger.error.error(Rsp)
          reject(new Error('HqProxy.stockHq error'))
        })
    })
  }
}