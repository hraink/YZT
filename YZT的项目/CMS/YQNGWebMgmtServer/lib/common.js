'use strict';
const crypto = require('crypto');
let common = {};

function isType(type) {
    return function(obj) {
        return Object.prototype.toString.call(obj) === '[object ' + type + ']';
    }
}
common.isString = isType('String');
common.isArray = isType('Array');
common.isFunction = isType('Function');

module.exports = common;