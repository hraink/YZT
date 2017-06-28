'use strict';
const config = require('./config');

function all() {
    return config.loadConfig('YQNGWebMgmtServer.conf', 'c');
}

// 属性缓存
process.on('message', function (data) {
    console.error('nofity', data);
    if (data.cmd == 'load') {
        //
    }
})

module.exports = {
    all: all
};