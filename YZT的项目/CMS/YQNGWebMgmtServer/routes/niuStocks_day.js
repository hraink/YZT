const express = require('express');
const router = express.Router();
const common = require('../lib/common');
const db = require('./db');
var DateUtils = require('../common/DateUtils');
var PageInfo = require('../common/PageInfo');
var TradeDate = require('@up/trade-date');
const debug = require('debug')('app:');

// Router ===================================================

router.get('/dayStocks/list', init, getDayStocks);
router.get('/dayStocks/toAdd', init, toAddStocks);
router.get('/dayStocks/add', init, addStock);
router.get('/dayStocks/toEdit', init, toEdit);
router.get('/dayStocks/edit', init, editStock);
router.get('/dayStocks/delete', init, deleteStock);

// middleware ===================================================

function init(req, res, next) {
    next();
}


// render ===================================================

function renderList(req, res, next) {
    res.render('./' + 'dayStocks', {
        title: '舆情牛股后台'
    });
}

// send ===================================================
function getDayStocks(req, res, next){
    var pageNum = req.query.pageNum;
    var pageSize = req.query.pageSize;
    //console.log('pageNum:'+pageNum+'   totalPages:'+totalPages+'   pageSize:'+pageSize+'zz');
    if(pageNum==''||pageNum==undefined){
        pageNum = 1;
    }
    if(pageSize==''||pageSize==undefined){
        pageSize = 10;
    }
    var countSql = 'select count(*) as totals from niustock_day';
    var totalRecords = 0;
    db.query(countSql).then(function(ret){
        totalRecords = ret[0].totals;
    }).then(function(){
        PageInfo.init(pageNum,pageSize,totalRecords);
        var sqlStr = 'select * from niustock_day order by Update_Time desc,Stock_Code asc limit '+PageInfo.start+','+PageInfo.pageSize;
        db.query(sqlStr).then(function(rows){
            for(var i=0;i<rows.length;i++){
                rows[i].Stock_Date = DateUtils.dateFormat1(rows[i].Stock_Date);
                rows[i].Update_Time = DateUtils.dateTimeFormat1(rows[i].Update_Time);
            }
            PageInfo.setResult(rows);
            //console.log('zz:'+JSON.stringify(PageInfo));
            res.send(PageInfo);
        });
    });
}

function toAddStocks(req, res, next){
    var mType = req.query.mType;
    res.render('addStockDay',{
        'curDate':DateUtils.dateFormat1(new Date()),
        'mType':mType
    });
}
function addStock(req, res, next){
    var stockName = req.query.stockName;
    var stockCode = req.query.stockCode;
    var stockMar = req.query.stockMar;
    var nowDate = new Date();
    TradeDate.init();
    TradeDate.GetTradeDate(DateUtils.dateFormat2(nowDate),DateUtils.dateFormat2(DateUtils.getComputeDate(nowDate,1))).then(ret => {
        if(ret.length==0){//非交易日
            res.send({'retVal':3});
        }else{
            var sqlStr_q = "select * from niustock_day where Stock_Date='"+DateUtils.dateFormat1(nowDate)+"'";
            db.query(sqlStr_q).then(function(rows){
                if(rows.length>=6){//每天最多只能添加6支股票
                    res.send({'retVal':1});
                }else{
                    var flag = false;
                    for(var i=0;i<rows.length;i++){
                        if(rows[i].Stock_Code==stockCode&&rows[i].Stock_Mar==stockMar){
                            flag = true;
                            break;
                        }
                    }
                    if(flag){//如果添加的股票今天已经添加过，则不能添加
                        res.send({'retVal':2});
                    }else{
                        var sqlStr = "insert into niustock_day set Stock_Code='"+stockCode+"',Stock_Name='"+stockName+"',Stock_Mar='"+stockMar+"',Stock_Date='"+DateUtils.dateFormat1(nowDate)+"'";
                        db.execute(sqlStr).then(function(retVal){
                            res.send({'retVal':retVal});
                        });
                    }
                }
            });
        }
    });

}

function toEdit(req, res, next){
    var sId = req.query.sId;
    var mType = req.query.mType;
    var sqlStr = 'select * from niustock_day where id='+sId;
    db.query(sqlStr).then(function(rows){
        for(var i=0;i<rows.length;i++){
            rows[i].Stock_Date = DateUtils.dateFormat1(rows[i].Stock_Date);
            rows[i].Update_Time = DateUtils.dateTimeFormat1(rows[i].Update_Time);
        }
        var stkObj = {};

        if(rows.length>0){
            stkObj = rows[0];
        }
        res.render('editStockDay',{
            rowsData : stkObj,
            curDate : DateUtils.dateFormat1(new Date()),
            'mType':mType
        });
    });
}
function editStock(req, res, next){
    var stockName = req.query.stockName;
    var stockCode = req.query.stockCode;
    var stockMar = req.query.stockMar;
    var sId = req.query.sId;
    var nowDate = new Date();
    var sqlStr_q = "select * from niustock_day where Stock_Date='"+DateUtils.dateFormat1(nowDate)+"' and Stock_Code='"+stockCode+"' and Stock_Mar='"+stockMar+"'";
    db.query(sqlStr_q).then(function(rows){
        if(rows.length>0){
            res.send({'retVal':2});
        }else{
            var sqlStr = "update niustock_day set Stock_Code='"+stockCode+"',Stock_Name='"+stockName+"',Stock_Mar='"+stockMar+"',Update_Time='"+DateUtils.dateTimeFormat1(nowDate)+"' where id="+sId+"";
            db.execute(sqlStr).then(function(retVal){
                res.send({'retVal':retVal});
            });
        }
    });

}

function deleteStock(req, res, next){
    var sId = req.query.sId;
    var sqlStr = "delete from niustock_day where id="+sId+"";
    db.execute(sqlStr);
    res.send({'opt':'success'});
}

module.exports = router;