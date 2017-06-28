const express = require('express');
const router = express.Router();
const common = require('../lib/common');
const debug = require('debug')('app:');

const path = require('path');
const fs = require('fs');
const Q = require('q');

// e.g
const project = global.CONFIG['YZTWebServer'];   // read config
debug('getConfig:', project);                   // debug

// Router ===================================================

router.get('/', init, renderIndex);



// middleware ===================================================

function init(req, res, next) {
    next();
}


// render ===================================================

function renderIndex(req, res, next) {
    res.render('./' + 'index', {
        title: 'YZTWebServer'
    });
}

module.exports = router;