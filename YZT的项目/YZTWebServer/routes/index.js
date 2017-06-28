const express = require('express');
const router = express.Router();

const init = function (app) {
  // app.use('/', require('./default'));
  //首页
  app.use('/', require('./main/main'));
  //风险评测
  app.use('/risk', require('./risk/risk-assessment'));
  //市场关注
  app.use('/market', require('./market/market'));
  //机会热点
  app.use('/hot', require('./hot/hot'));
  //资金流向
  app.use('/capital', require('./capital/capital'));
  //舆情牛股、股票行情
  app.use('/stock', require('./stock/stock'));
  // 智能操盘
  app.use('/operate', require('./smart_trade/index'));
  // 搜索
  app.use('/search', require('./search'))
  // 智能K线
  app.use('/kline', require('./match/index'))
  // 智能诊股
  app.use('/diagnose', require('./diagnose/diagnose'))
  // 智能选股
  app.use('/strategy', require('./strategy/strategy'))
};

exports.init = init;