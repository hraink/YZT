/**
 * Created by 99116 on 2017/2/17.
 */
var DateUtils = {};

DateUtils.dateFormat1 = function(d){
    var fmtDate = d.getFullYear();
    if(d.getMonth()<9){
        fmtDate = fmtDate + '-0' + (d.getMonth() + 1);
    }else{
        fmtDate = fmtDate + '-' + d.getMonth();
    }
    if(d.getDate()<=9){
        fmtDate = fmtDate + '-0' + d.getDate();
    }else {
        fmtDate = fmtDate + '-' + d.getDate();
    }
    return fmtDate;
}

DateUtils.dateFormat2 = function(d){
    var fmtDate = d.getFullYear();
    if(d.getMonth()<9){
        fmtDate = fmtDate + '0' + (d.getMonth() + 1);
    }else{
        fmtDate = fmtDate + d.getMonth();
    }
    if(d.getDate()<=9){
        fmtDate = fmtDate + '0' + d.getDate();
    }else {
        fmtDate = fmtDate + d.getDate();
    }
    return fmtDate;
}

DateUtils.dateFormat3 = function(d){
    if(d.length>=8){
        return d.substring(0,4)+'-'+d.substring(4,6)+'-'+d.substring(6,8);
    }
    return '-';
}

DateUtils.dateTimeFormat1 = function(dt){
    var fmtDateTime = dt.getFullYear();
    if(dt.getMonth()<9){
        fmtDateTime = fmtDateTime + '-0' + (dt.getMonth() + 1);
    }else{
        fmtDateTime = fmtDateTime + '-' + dt.getMonth();
    }
    if(dt.getDate()<=9){
        fmtDateTime = fmtDateTime + '-0' + dt.getDate();
    }else {
        fmtDateTime = fmtDateTime + '-' + dt.getDate();
    }
    var h = dt.getHours();
    var m = dt.getMinutes();
    var s = dt.getSeconds();
    if(h<10){
        h = "0" +h;
    }
    if(m<10){
        m = "0" +m;
    }
    if(s<10){
        s = "0" +s;
    }
    fmtDateTime = fmtDateTime + ' ' + h + ':' + m + ':' + s;
    return fmtDateTime;
}

//获得本周的开端日期
DateUtils.getWeekStartDate = function(){
    var nowDate = new Date();
    var nowDayOfWeek = nowDate.getDay(); //今天本周的第几天
    return new Date(nowDate.getFullYear(),nowDate.getMonth(),nowDate.getDate() - nowDayOfWeek+1);
}

//获得本周的停止日期
DateUtils.getWeekEndDate = function(){
    var nowDate = new Date();
    var nowDayOfWeek = nowDate.getDay(); //今天本周的第几天
    return new Date(nowDate.getFullYear(),nowDate.getMonth(),nowDate.getDate() + (7-nowDayOfWeek));
}

//获得日期d的前(后)n天的日期
DateUtils.getComputeDate = function(d,n){
    var paramDate = new Date(d);
    return new Date(paramDate.getFullYear(),paramDate.getMonth(),paramDate.getDate() + n);
}

//获得上周的停止日期
DateUtils.getPreWeekEndDate = function(){
    var nowDate = new Date();
    var nowDayOfWeek = nowDate.getDay(); //今天本周的第几天
    return new Date(nowDate.getFullYear(),nowDate.getMonth(),nowDate.getDate() - nowDayOfWeek);
}

module .exports = DateUtils;