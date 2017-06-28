/**
 * Created by shinan on 2016/12/8.
 */
const Taf = require("@taf/taf-rpc").Communicator.New();
Taf.setProperty("timeout", 10000);
const { Quant } = require("../../../jce/MatchProxy");
const co = require("co");
const moment = require("moment");
const fs = require("fs");
const request = require("request");
const debug = require("debug")("app:MatchApi");
const logger = require("../../../lib/logger");
const prepare = require("../../../lib/prepare");
const { Market, HqProxy } = require("./HqProxy");
const NodeCache = require("node-cache");
const predictCache = new NodeCache({
  stdTTL: 300,
  useClones: false
});

var MatchProxy;

prepare.all().then(config => {
  servant = config.QuantServer;
  MatchProxy = Taf.stringToProxy(Quant.MatchProxy, servant);
});

const MatchApi = {
  init: function(CONFIG) {
    // var servant = 'Quant.MatchServer.MatchObj'
    // if (!process.env.TAF_CONFIG) {
    //   servant += "Quant.MatchServer.MatchObj@tcp -h 192.168.7.152 -t 60000 -p 10000"
    // } else {
    //   servant = CONFIG.QuantServer
    // }

    servant = CONFIG.QuantServer;
    MatchProxy = Taf.stringToProxy(Quant.MatchProxy, servant);
  },
  getIndustry() {
    return new Promise((resolve, reject) => {
      MatchProxy.getIndustry()
        .then(Rsp => {
          var o = Rsp.response.arguments.stRsp.mIndustry.toObject();
          var arr = Object.keys(o).map(key => ({
            code: key,
            name: o[key]
          }));

          arr.unshift({
            code: "",
            name: "全部"
          });

          resolve(arr);
        })
        .fail(Err => {
          logger.error.error("getIndustry error", Err);

          reject(new Error("getIndustry error"));
        });
    });
  },
  getPredictList(cycle, category, plate, sort) {
    let key = [cycle, category, plate, sort].join("_");
    let value = predictCache.get(key);

    if (value !== undefined) {
      return Promise.resolve({ iRet: 0, data: value });
    }

    let Req = new Quant.PredictListReq();

    let pms = new Promise((resolve, reject) => {
      Req.readFromObject({
        cycle,
        category,
        plate,
        sort
      });

      MatchProxy.getPredictList(Req)
        .then(Rsp => {
          if (Rsp.response.return === 0) {
            value = Rsp.response.arguments.rsp.toObject();
            predictCache.set(key, value);

            resolve({
              iRet: Rsp.response.return,
              data: value
            });
          } else {
            resolve({ iRet: Rsp.response.return });
          }
        })
        .fail(err => {
          logger.error.error(
            "getPredictList error",
            err.response.rsp.arguments
          );

          reject(
            new Error(
              `getPredictList error: ${[cycle, category, plate, sort].join("_")}`
            )
          );
        });
    });

    return pms;
  },
  getSinglePredict(options) {
    var Req = new Quant.SinglePredictReq();
    var options = Object.assign({}, options);

    // 参数类型转换
    var args = {};

    args.market = Number(options.market);
    args.code = String(options.code);

    args.matchFactor = -1;

    if (options.volume || options.average) {
      args.matchFactor = 1; // 价格因子默认选中
    }

    if (options.volume) {
      args.matchFactor |= options.volume;
    }

    if (options.average) {
      args.matchFactor |= options.average;
    }

    args.semBlance = Number(options.semblance);
    args.matchCycle = Number(options.cycle);
    args.matchIndustry = Number(options.industry) === 0 ? "" : options.industry;
    args.matchStartDate = moment(options.matchstartdate).format("YYYYMMDD");
    args.matchEndDate = moment(options.matchenddate).format("YYYYMMDD");

    if (options.locked) {
      args.matchStartDate = 0;
      args.matchEndDate = 0;
    }

    args.queryStartDate = moment(options.querystartdate).format("YYYYMMDD");
    args.queryEndDate = moment(options.queryenddate).format("YYYYMMDD");
    args.eRetType = 0xff;

    // 输入股票如果停牌是否匹配，如果填false，检查到输入股票停牌后，直接返回失败
    args.bMatchSuspendInput = false;

    // debug(args)

    Req.readFromObject(args);

    // debug('getSinglePredict args:', options.locked, Req.toObject())

    var pms = new Promise((resolve, reject) => {
      MatchProxy.getSinglePredict(Req)
        .then(Rsp => {
          // debug('return:', Rsp.response.return)

          if (Rsp.response.return != 0) {
            // reject( new Error(`no result, code is ${Rsp.response.return}`) )
            resolve({
              iRet: Rsp.response.return
            });
          } else {
            resolve({
              iRet: 0,
              data: Rsp.response.arguments.predict.toObject()
            });
          }
        })
        .fail(error => {
          logger.error.error("getSinglePredict error", error);
          reject(new Error("getSinglePredict error"));
        });
    });

    return pms;
  }
};

module.exports = MatchApi;
