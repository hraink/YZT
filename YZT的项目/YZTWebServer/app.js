var express = require('express');
var path = require('path');
var autopath = require('@up/autopath');
var favicon = require('serve-favicon');
var logger = require('./lib/logger');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var compress = require('compression');
const moment = require('moment');
var app = express();
var routes = require('./routes/index');
var filter = require('./lib/filter');


//付费功能模块
let paymentFuncSet = new Set(['stock','strategy','operate','kline']);
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger.morgan_taf_log());
app.use(compress());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser('yzt_cookie_cxd'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(autopath('http://cdn.upchina.com'));

app.use(function (req, res, next) {
    var startT = new Date().getTime();
    res.locals.title = '优智投';
    res.locals.payURL = global.CONFIG.YZTWebServer.payURL;
    //读取当前路径，用于导航设置
    res.locals.yzt_org_url =  req.originalUrl.split('/');
    res.locals.daysRemain = null;
    var cookie = undefined;
    //取出userid，hqright
    if (typeof req.query.userid !== 'undefined' && typeof req.query.hqright !== 'undefined'){
        cookie = {
            userid:req.query.userid,
            hqright:req.query.hqright
        }
        res.cookie('yzt_ua',cookie, {maxAge: 60 * 60 * 24 * 30000,signed: true});
    }else {
        cookie = req.signedCookies.yzt_ua;
    }
    //鉴权
    filter.checkPay(cookie).then(
        function (data) {
            logger.access_log.debug(`【鉴权结果】：====》URL：${req.originalUrl}，UserName：${data.loginUserName}，userAuth：`,data.userAuth);
            res.locals.loginUserName = data.loginUserName;
            res.locals.userRiskInfo  = (data.userRisk && data.userRisk.response) ? data.userRisk.response.arguments.userRisk :null;
            res.locals.daysRemain = null;
            if(paymentFuncSet.has(res.locals.yzt_org_url[1]) && (!data.userAuth || data.userAuth.ret !== 0 || data.userAuth.endtime === 0)){
                //跳购买路由
                logger.access_log.debug(`【无权限】【${data.loginUserName}】：无访问权限 ====》${req.originalUrl}`);
                res.render('error/buy');
              return;
            }
            if (data.userAuth && data.userAuth.ret == 0 && data.userAuth.endtime != 0){
                var a = moment(new Date(data.userAuth.endtime));
                var b = moment(new Date());
                //剩余天数
                res.locals.daysRemain = a.diff(b, 'days');
            }
            var startE = new Date().getTime();
            logger.access_log.debug(`【鉴权耗时】：====》${startE-startT} 毫秒`);
            next();
        },function (err) {
           //跳转错误页面
            next();
        }
    ).done();
});

routes.init(app);


//渲染页面格式化时间时使用
app.locals.moment = moment;

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  console.log('enter here')
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        if (err.status === 404){
            res.render('error/404');
            return;
        }
        res.render('error/500', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stack traces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error/500', {
        message: err.message,
        error: {}
    });
});

module.exports = app;