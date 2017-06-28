const express = require('express');
const router = express.Router();

const init = function(app){
    app.use('/', require('./default'));
    app.use('/', require('./login'));
    app.use('/', require('./niuStocks_day'));
    app.use('/', require('./niuStocks_week'));
};

exports.init = init;