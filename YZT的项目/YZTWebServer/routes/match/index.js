/**
 * Created by nanshi on 2017/2/22.
 */
var express = require("express");
var validator = require("validator");
var router = express.Router();
var co = require("co");
var MatchApi = require("./apis/MatchApi");
var HqProxy = require("./apis/HqProxy");
var TradeDate = require("@up/trade-date");
TradeDate.init();
var moment = require("moment");

const DEFAULT_TYPE = 0;
const DEFAULT_MARKET = 0;
const DEFAULT_CYCLE = 5;
const DEFAULT_CODE = "000002";
const LEGAL_CYCLES = [1, 5, 10, 20];
const MATCH_START_DATE = "1990-12-01";

validator.isDate = str => {
  var d = moment(str, "YYYY-MM-DD");

  return d.isValid();
};

const get60TradeDaysBefore = () => {
  var today = moment().format("YYYYMMDD");

  return new Promise(resolve => {
    TradeDate.GetTradeDateByRange("", today, 60)
      .then(days => {
        resolve({
          iRet: 0,
          days: days.reverse()
        });
      })
      .catch(err => {
        resolve({
          iRet: -1
        });
      });
  });
};

const toMmDdYy = input => {
  var ptrn = /(\d{4})(\d{2})(\d{2})/;

  return input.replace(ptrn, "$1-$2-$3");
};

const initQuery = (req, tradeDaysTable) => {
  let dQuery = {};
  let endDate = moment().subtract(1, "days").format("YYYY-MM-DD");

  dQuery.matchstartdate = tradeDaysTable[1];
  dQuery.matchenddate = endDate;
  dQuery.querystartdate = MATCH_START_DATE;
  dQuery.queryenddate = endDate;
  dQuery.cycle = 5;
  dQuery.industry = 0;
  dQuery.semblance = 70;
  dQuery.price = 1;
  dQuery.locked = true;

  dQuery.defaultMatchStartDate = dQuery.matchstartdate;
  dQuery.defaultMatchEndDate = dQuery.matchenddate;
  dQuery.defaultQueryStartDate = dQuery.querystartdate;
  dQuery.defaultQueryEndDate = dQuery.queryenddate;

  if (req.query.matchstartdate && validator.isDate(req.query.matchstartdate)) {
    dQuery.matchstartdate = req.query.matchstartdate;
  }

  if (req.query.matchenddate && validator.isDate(req.query.matchenddate)) {
    dQuery.matchenddate = req.query.matchenddate;
  }

  if (req.query.querystartdate && validator.isDate(req.query.querystartdate)) {
    dQuery.querystartdate = req.query.querystartdate;
  }

  if (req.query.queryenddate && validator.isDate(req.query.queryenddate)) {
    dQuery.queryenddate = req.query.queryenddate;
  }

  if (
    req.query.semblance && req.query.semblance > 0 && req.query.semblance < 100
  ) {
    dQuery.semblance = req.query.semblance;
  }

  if (
    req.query.cycle &&
    (req.query.cycle == 1 ||
      req.query.cycle == 5 ||
      req.query.cycle == 10 ||
      req.query.cycle == 20)
  )
    dQuery.cycle = req.query.cycle;
  if (req.query.volume) dQuery.volume = 2;
  if (req.query.average) dQuery.average = 4;
  if (req.query.industry) dQuery.industry = req.query.industry;
  if (req.query.locked) {
    dQuery.locked = req.query.locked;
  }

  return dQuery;
};

router.use((req, res, next) => {
  var active = req.path.split("/")[1];
  req.active = active;
  next();
});

// 首页
router.get("/kline.html", (req, res, next) => {
  co(function*() {
    let cycle = req.query.cycle || 5;

    let rsps = yield [
      MatchApi.getPredictList(cycle, 1),
      MatchApi.getPredictList(cycle, 2),
      MatchApi.getPredictList(cycle, 3),
      MatchApi.getPredictList(cycle, 4),
      MatchApi.getPredictList(cycle, 5)
    ];

    let isBusy = rsps.some(rsp => rsp.iRet != 0);

    if (isBusy) {
      res.render("match/404", { msg: "盘后数据运算中，稍后再来看看吧~" });
      return;
    }

    let [strReq, strReqHot, strReqIndex, strReqTopUp, strReqTopDown] = rsps.map(
      rsp => rsp.data
    );

    let normal = (item, index, arr) => {
      let last = item.chartDataList[item.chartDataList.length - 1];
      let day = item.klineList[item.klineList.length - 1].date;
      let thatDay = moment(day, "YYYYMMDD")
        .add(cycle, "days")
        .format("YYYYMMDD");

      item.chartDataList.forEach(o => o.date = "");

      var profitView = (last.profit / 100).toFixed(1);
      var ceilView = (last.ceil / 100).toFixed(1);
      var florView = (last.flor / 100).toFixed(1);

      delete item.sample;

      return Object.assign({}, item, {
        profit: last.profit,
        ceil: last.ceil,
        flor: last.flor,
        profitView: profitView,
        ceilView: ceilView,
        florView: florView
      });
    };

    strReq = strReq.predictList.map(normal);
    strReqHot = strReqHot.predictList.map(normal);
    strReqIndex = strReqIndex.predictList.map(normal);
    strReqTopUp = strReqTopUp.predictList.map(normal);
    strReqTopDown = strReqTopDown.predictList.map(normal);

    var pageData = {
      strReq,
      strReqHot,
      strReqIndex,
      strReqTopUp,
      strReqTopDown,
      cycle: cycle,
      active: req.active
    };

    res.render("match/index", {
      pageData
    });
  }).catch(next);
});

const addPredictDays = (date, arr, cycle) => {
  // arr.forEach((o, i) => o.date = moment(date, 'YYYYMMDD').add(i, 'days').format('YYYY-MM-DD'))

  return new Promise((rs, rj) => {
    TradeDate.GetTradeDateByRange(String(date), "", cycle + 1).then(res => {
      arr.forEach((item, index) => {
        item.date = res[index + 1];
      });

      rs();
    });
  });
};

const initDefaultParams = (req, res, next) => {
  co(function*() {
    // 获取之前的60个交易日，从今天往前取之前10,20,40,60天的日期
    var tradeDaysTableRsp = yield get60TradeDaysBefore();

    if (tradeDaysTableRsp.iRet !== 0) {
      next(new Error("获取交易日失败"));
      return;
    }

    var prevSixtyDays = tradeDaysTableRsp.days;
    var len = prevSixtyDays.length;
    var tenDayBefore = prevSixtyDays[len - 10];
    var twentyDaysBefore = prevSixtyDays[len - 20];
    var fourtyDaysBefore = prevSixtyDays[len - 40];
    var sixtyDaysBefore = prevSixtyDays[len - 60];
    var tradeDaysTable = [
      tenDayBefore,
      twentyDaysBefore,
      fourtyDaysBefore,
      sixtyDaysBefore
    ];
    tradeDaysTable = tradeDaysTable.map(s => toMmDdYy(s));

    var dQuery = initQuery(req, tradeDaysTable);
    var cycle = dQuery.cycle;
    var code = req.query.code || DEFAULT_CODE;
    var market = req.query.market !== undefined ? req.query.market : 0;

    var singlePredict = yield MatchApi.getSinglePredict(
      Object.assign({ code, market }, dQuery)
    );

    if (singlePredict.iRet == -3) {
      res.render("match/404", { msg: "盘后数据运算中，稍后再来看看吧~" });
      return;
    }

    if (singlePredict.iRet != 0) {
      res.render("match/404", { msg: "该股票历史数据不足，暂无匹配结果" });
      return;
    }

    req.cycle = cycle;
    req.singlePredict = singlePredict.data;

    yield addPredictDays(
      req.singlePredict.klineList[req.singlePredict.klineList.length - 1].date,
      req.singlePredict.chartDataList,
      cycle
    );

    req.code = code;
    req.market = market;
    req.dQuery = dQuery;
    req.tradeDaysTable = tradeDaysTable;

    next();
  }).catch(next);
};

const getIndustry = (req, res, next) => {
  MatchApi.getIndustry()
    .then(industryList => {
      req.industryList = industryList;
      next();
    })
    .catch(next);
};

// 自定义匹配
router.get("/custom", initDefaultParams, getIndustry, (req, res, next) => {
  var pageData = {
    cycle: req.cycle,
    active: req.active,
    code: req.code,
    market: req.market,
    singlePredict: req.singlePredict,
    dQuery: req.dQuery,
    industryList: req.industryList,
    tradeDaysTable: req.tradeDaysTable
  };

  res.render("match/custom", { pageData });
});

// 实时行情路由
router.get("/realtime", function(req, res, next) {
  var { market, code } = req.query;

  HqProxy.getStockRealtime(market, code)
    .then(rsp => {
      res.send(rsp);
    })
    .catch(next);
});

module.exports = router;
