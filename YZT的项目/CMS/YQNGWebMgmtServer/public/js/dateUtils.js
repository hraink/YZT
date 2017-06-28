/**
 * Created by 99116 on 2017/2/21.
 */
function dateFmt1(d){
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

//获得本周的开端日期
function getWeekStartDate(){
    var nowDate = new Date();
    var nowDayOfWeek = nowDate.getDay(); //今天本周的第几天
    return new Date(nowDate.getFullYear(),nowDate.getMonth(),nowDate.getDate() - nowDayOfWeek+1);
}

//获得本周的停止日期
function getWeekEndDate(){
    var nowDate = new Date();
    var nowDayOfWeek = nowDate.getDay(); //今天本周的第几天
    return new Date(nowDate.getFullYear(),nowDate.getMonth(),nowDate.getDate() + (7-nowDayOfWeek));
}

//获得上周的停止日期
function getPreWeekEndDate(){
    var nowDate = new Date();
    var nowDayOfWeek = nowDate.getDay(); //今天本周的第几天
    return new Date(nowDate.getFullYear(),nowDate.getMonth(),nowDate.getDate() - nowDayOfWeek);
}