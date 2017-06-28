/**
 * Created by 99116 on 2017/2/22.
 */
const express = require('express');
const router = express.Router();
const debug = require('debug')('app:');

// e.g
const users = global.CONFIG['users'];   // read config
console.log('console users:', users);                   // debug

// Router ===================================================

router.post('/doLogin', checkLogin, renderLogin);


// middleware ===================================================

function checkLogin(req, res, next){
    next();
}

// render ===================================================

function renderLogin(req, res, next) {
    var userName = req.body.userName;
    var userPass = req.body.userPass;
    //console.log('users[userName]:'+users[userName]);

    if(users[userName]==userPass){
        //console.log('userName:'+userName);
        res.cookie("userName", userName, {maxAge: 1000*60*60*24*30,httpOnly: true});
        res.redirect('/index');
    }else {
        res.redirect('/login');
    }
}

module.exports = router;