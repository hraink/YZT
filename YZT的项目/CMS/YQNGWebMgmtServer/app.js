var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('./lib/logger');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var compress = require('compression');
var app = express();

var routes = require('./routes/index');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger.morgan_taf_log());
app.use(compress());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(function (req, res, next) {
    var url = req.originalUrl;
    //console.log('zz'+req.cookies.userName);
    if (url != "/login"&&url!="/doLogin"&&req.cookies.userName==undefined) {
        return res.redirect("/login");
    }
    next();
});

routes.init(app);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    //next(err);
    return res.redirect("/login");
});

// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stack traces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;