/**
 * Created by xudong.Cai on 2017/2/27
 */
;(function () {
    var refreshHQTimeout = true; //启动及关闭
    var DSQ;
    var refreshRate = 10000;
    var startNum = 20;
    var wantNum = 10;
    $(function(){
        setTimeout(refreshHQ,refreshRate);
        $('#load_more').on('click',function () {
            loadMoreWeekly();
        });
    });
    //自动刷新交易行情数据
    function refreshHQ(){
        clearTimeout(DSQ);//清除之前申请的定时器
        if(!refreshHQTimeout) return;
        //是否在刷新时间段内
        if (!$.isRefreshDate()){
            DSQ = setTimeout(refreshHQ,refreshRate);
            return;
        }
        //刷新本周牛股
        refreshHQTimeout = false;
        getNewsData();
        DSQ = setTimeout(refreshHQ,refreshRate); //5秒刷新一次
    }
    function getNewsData() {
        $.ajax({
            type: "GET",
            url: "/stock/week/first/data?_t="+new Date().getTime(),
            async: true,
            timeout: 3000,
            dataType:'json',
            success:function (data) {
                if (!data || !data.hotWeekList){
                    return;
                }
                //更新榜单列表
                var html = ejs.render(stock_week_first,{hotWeekList:data.hotWeekList});
                $('#first_week').html(html);
                return;
            },
            error:function(XMLHttpRequest, textStatus, errorThrown) {
                if(textStatus == 'timeout') {
                    console.log("操作请求已经超时");
                } else {
                    console.log("其他错误。",textStatus);
                }
            },
            complete:function () {
                refreshHQTimeout = true;
            }
        });
    }
    //加载更多历史数据
    function loadMoreWeekly() {
        startNum += 10;
        $.ajax({
            type: "GET",
            url: "/stock/week/weekly/data/"+startNum+"/"+(wantNum+1)+"?_t="+new Date().getTime(),
            async: true,
            timeout: 3000,
            dataType:'json',
            success:function (data) {
                if (!data || !data.weekHistoryList){
                    return;
                }
                if (data.weekHistoryList < 21){
                    $('#load_more').hide();
                }
                //更新榜单列表
                var html = ejs.render(stock_week_weekly,{weekHistoryList:data.weekHistoryList});
                $('#weekly').html(html);
                return;
            },
            error:function(XMLHttpRequest, textStatus, errorThrown) {
                if(textStatus == 'timeout') {
                    console.log("操作请求已经超时");
                } else {
                    console.log("其他错误。",textStatus);
                }
            },
            complete:function () {
                refreshHQTimeout = true;
            }
        });
    }
})();