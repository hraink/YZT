/**
 * Created by 99116 on 2017/2/16.
 */
var mysql = require('mysql');
var DateUtils = require('../common/DateUtils');
var db = {};

var pool  = mysql.createPool({
    host            : '172.16.8.128',
    port            : '3306',
    user            : 'upchina',
    password        : 'upchina2016',
    database        : 'db_yzt',
    connectionLimit : 128
});

db.query = function(querySqlStr){
    return new Promise(function(resolve,reject){
        pool.getConnection(function(err, connection) {
            if (err)
            {
                console.log('Get connection fail.', err);
                reject(err);
            }
            connection.query(querySqlStr,function(error,rows){
                if(error){
                    console.log('Execute insert error.',error);
                    reject(error);
                }
                connection.release();
                resolve(rows);

            });
        });
    });

}

db.execute = function(insertSqlStr){
    return new Promise(function(resolve,reject){
        pool.getConnection(function(err, connection) {
            if (err)
            {
                console.log('Get connection fail.', err);
                reject(-1);
            }
            connection.beginTransaction(function(errors) {
                if (errors)
                {
                    console.log('BeginTransaction fail.', errors);
                    reject(-2);
                }

                connection.query(insertSqlStr,function(error,rows){
                    if(error){
                        connection.rollback(function(){
                            console.log('Execute sql fail.',error);
                            reject(-3);
                        });
                    }
                    connection.commit(function(e){
                        if (e) {
                            connection.rollback(function() {
                                console.log('Rollback fail.',e);
                                reject(-4);
                            });
                        }
                        console.log('success!');
                        resolve(0);
                    });
                });
            });

        });
    });

}

module.exports = db;
