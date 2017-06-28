/**
 * UP加解密相关函数
 * author: 李小龙
 */

var crypto = require('crypto');
var defaultOptions = {
    key: 'upchina6',
    alg: 'des-cbc',
    iv: [0x75, 0x70, 0x63, 0x68, 0x69, 0x6e, 0x61, 0x31]
};

function UPCrypto(option){
    if (!(this instanceof UPCrypto)) {
        return new UPCrypto(option);
    }

    this.options = {};

    var keys = Object.keys(defaultOptions), key, i = 0;
    for(i = 0; i < keys.length; i++)
    {
        key = keys[i];
        this.options[key] = defaultOptions[key];
    }

    keys = Object.keys(option);
    for(i = 0; i < keys.length; i++)
    {
        key = keys[i];
        this.options[key] = option[key];
    }
}

/**
 * DES加密
 * @param encryptStr {string} 必选项 待加密的字符串
 * @returns {*}
 */
UPCrypto.prototype.desEncode = function(encryptStr){
    var that = this;

    
    
    var key = new Buffer('upchina6');
    var iv = new Buffer([0x75, 0x70, 0x63, 0x68, 0x69, 0x6e, 0x61, 0x31]);
    var alg = 'des-cbc';

    console.log('index.js desEncode 43: ', alg, that.options.key, that.options.iv);

    var cipher = crypto.createCipheriv(alg, key, iv);
    var encryptRes = cipher.update(encryptStr, 'utf8', 'base64');
    encryptRes += cipher.final('base64');
    return encryptRes;
};

/**
 * DES解密
 * @param encryptStr {string} 必选项 待解密的字符串
 * @returns {*}
 */
UPCrypto.prototype.desDecode = function(encryptStr){
    var that = this;

    var key = new Buffer(that.options.key);
    var iv = new Buffer(that.options.iv);
    var alg = that.options.alg;

    var decipher = crypto.createDecipheriv(alg, key, iv);
    var encryptRes = decipher.update(encryptStr, 'base64', 'utf8');
    encryptRes += decipher.final('utf8');
    return encryptRes;
};

/**
 * MD5加密
 * @param encryptStr  {string} 必选项 待加密的字符串
 * @returns {*}
 */
UPCrypto.prototype.md5Encode = function(encryptStr){
    var that = this;

    var md5 = crypto.createHmac('md5', that.options.key);
    md5.update(encryptStr);
    return md5.digest("base64");
};

module.exports.UPCrypto = UPCrypto;