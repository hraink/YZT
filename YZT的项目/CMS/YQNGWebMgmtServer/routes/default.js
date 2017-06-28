const express = require('express');
const router = express.Router();
const common = require('../lib/common');
const debug = require('debug')('app:');

// e.g
const project = global.CONFIG['YQNGWebMgmtServer'];   // read config
debug('getConfig:', project);                   // debug

// Router ===================================================

router.get('/index', init, renderIndex);
router.get('/login', init, renderLogin);


// middleware ===================================================

function init(req, res, next) {
    //console.log(req.originalUrl);
    next();
}

function checkLogin(){
    next();
}

// render ===================================================

function renderIndex(req, res, next) {
    res.render('./' + 'layout', {
        title: '舆情牛股后台'
    });
}
function renderLogin(req, res, next) {
    res.render('./' + 'login', {
        title: '舆情牛股后台'
    });
}

module.exports = router;