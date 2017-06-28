const express = require('express');
const router = express.Router();
const common = require('../lib/common');
const db = require('./db');
var DateUtils = require('../common/DateUtils')
var PageInfo = require('../common/PageInfo');
const debug = require('debug')('app:');
var TradeDate = require('@up/trade-date');

// Router ===================================================

router.get('/weekStocks/list', init, getDayStocks);
router.get('/weekStocks/toAdd', init, toAddStocks);
router.get('/weekStocks/add', init, addStock);
router.get('/weekStocks/toEdit', init, toEdit);
router.get('/weekStocks/edit', init, editStock);
router.get('/weekStocks/delete', init, deleteStock);
router.post('/weekStocks/setNoWeekStk', init, setNoWeekStk);


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
    var countSql = 'select count(*) as totals from niustock_week';
    var totalRecords = 0;
    db.query(countSql).then(function(ret){
        totalRecords = ret[0].totals;
    }).then(function(){
        PageInfo.init(pageNum,pageSize,totalRecords);
        var sqlStr = 'select * from niustock_week order by Update_Time desc,Stock_Code asc limit '+PageInfo.start+','+PageInfo.pageSize;
        db.query(sqlStr).then(function(rows){
            for(var i=0;i<rows.length;i++){
                rows[i].Stock_Date = DateUtils.dateFormat1(rows[i].Stock_Date);
                rows[i].Update_Time = DateUtils.dateTimeFormat1(rows[i].Update_Time);
            }
            PageInfo.setResult(rows);
            //console.log('ww:'+JSON.stringify(PageInfo));
            res.send(PageInfo);
        });
    });

}

function toAddStocks(req, res, next){
    var weekStart = DateUtils.getWeekStartDate();
    TradeDate.init();
    TradeDate.GetTradeDate(DateUtils.dateFormat2(weekStart),DateUtils.dateFormat2(DateUtils.getComputeDate(weekStart,7))).then(ret => {
        var fmtDate = DateUtils.dateFormat1(new Date());
        if(ret.length>0){
            fmtDate = DateUtils.dateFormat3(ret[0]);
        }
        res.render('addStockWeek',{
            'firstStkDate':fmtDate
        });
    });
}
function addStock(req, res, next){
    var stockName = req.query.stockName;
    var stockCode = req.query.stockCode;
    var firstStkDate = req.query.firstStkDate;
    var stockMar = req.query.stockMar;
    var nowDate = new Date();

    var sqlStr_q = "select * from niustock_week where Stock_Date between '"+DateUtils.dateFormat1(DateUtils.getWeekStartDate())+"' and '"+DateUtils.dateFormat1(DateUtils.getWeekEndDate())+"'";
    db.query(sqlStr_q).then(function(rows){
        if(rows.length>=3){
            res.send({
                'retVal':1
            });
        }else{
            var flag = false;
            for(var i=0;i<rows.length;i++){
                if((rows[i].Stock_Code==stockCode&&rows[i].Stock_Mar==stockMar)||rows[i].Stock_Code==null){
                    flag = true;
                    break;
                }
            }
            if(flag){
                res.send({'retVal':2});
            }else{
                var sqlStr = "insert into niustock_week set Stock_Code='"+stockCode+"',Stock_Name='"+stockName+"',Stock_Mar='"+stockMar+"',Stock_Date='"+firstStkDate+"'";
                db.execute(sqlStr).then(function(retVal){
                    res.send({'retVal':retVal});
                });
            }
        }
    });

}

function toEdit(req, res, next){
    var sId = req.query.sId;
    var sqlStr = 'select * from niustock_week where id='+sId;
    db.query(sqlStr).then(function(rows){
        for(var i=0;i<rows.length;i++){
            rows[i].Stock_Date = DateUtils.dateFormat1(rows[i].Stock_Date);
            rows[i].Update_Time = DateUtils.dateTimeFormat1(rows[i].Update_Time);
        }
        var stkObj = {};

        if(rows.length>0){
            stkObj = rows[0];
        }
        res.render('editStockWeek',{
            rowsData : stkObj,
            curDate : DateUtils.dateFormat1(new Date())
        });
    });
}
function editStock(req, res, next){
    var stockName = req.query.stockName;
    var stockCode = req.query.stockCode;
    var stockMar = req.query.stockMar;
    var sId = req.query.sId;
    var nowDate = new Date();
    var sqlStr_q = "select * from niustock_week where Stock_Date between '"+DateUtils.dateFormat1(DateUtils.getWeekStartDate())+"' and '"+DateUtils.dateFormat1(DateUtils.getWeekEndDate())+"' and Stock_Code='"+stockCode+"' and Stock_Mar='"+stockMar+"'";
    db.query(sqlStr_q).then(function(rows){
        if(rows.length>0){
            res.send({'retVal':2});
        }else{
            var sqlStr = "update niustock_week set Stock_Code='"+stockCode+"',Stock_Name='"+stockName+"',Stock_Mar='"+stockMar+"',Update_Time='"+DateUtils.dateTimeFormat1(nowDate)+"' where id="+sId+"";
            db.execute(sqlStr).then(function(retVal){
                res.send({'retVal':retVal});
            });
        }
    });
}

function deleteStock(req, res, next){
    var sId = req.query.sId;
    var sqlStr = "delete from niustock_week where id="+sId+"";
    db.execute(sqlStr);
    res.send({'opt':'success'});
}

function setNoWeekStk(req, res, next){
    var sqlStr_q = "select * from niustock_week where (Stock_Date between '"+DateUtils.dateFormat1(DateUtils.getWeekStartDate())+"' and '"+DateUtils.dateFormat1(DateUtils.getWeekEndDate())+"')";
    sqlStr_q = sqlStr_q + ' or Stock_Code is null ';
    db.query(sqlStr_q).then(function(rows) {
        if(rows.length>0){
            res.send({'retVal':1});
        }else{
            var weekStart = DateUtils.getWeekStartDate();
            TradeDate.init();
            TradeDate.GetTradeDate(DateUtils.dateFormat2(weekStart),DateUtils.dateFormat2(DateUtils.getComputeDate(weekStart,7))).then(ret => {
                var fmtDate = DateUtils.dateFormat1(new Date());
                if(ret.length>0){
                    fmtDate = DateUtils.dateFormat3(ret[0]);
                }
                var sqlStr = "insert into niustock_week set Stock_Date='"+fmtDate+"'";
                db.execute(sqlStr).then(function(retVal){
                    res.send({'retVal':retVal});
                });
            });
        }
    });

}

module.exports = router;