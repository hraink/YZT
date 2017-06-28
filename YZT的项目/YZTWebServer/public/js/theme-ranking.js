/**
 * Created by xudong.Cai on 2017/2/13.
 */
;(function () {
    var refreshHQTimeout = true; //启动及关闭
    var DSQ;
    var stockDataList = [];
    $(function(){
        bindHQRefresh();
    });
    //绑定定时刷新行情数据
    function bindHQRefresh() {
        var stockDomList = $('.topright .Shares');
        for(var i = 0;i < stockDomList.length; i++){
            var obj = $(stockDomList[i]);
            var stockData = {
                shtSetcode:obj.data('stock-market'),
                sCode:obj.data('stock-code').toString()
            };
            stockDataList.push(stockData);
        }
        refreshHQ()
    }
    //自动刷新交易行情数据
    function refreshHQ(){
        clearTimeout(DSQ);//清除之前申请的定时器
        if(!refreshHQTimeout) return;
        //是否在刷新时间段内
        if (!$.isRefreshDate()){
            DSQ = setTimeout(refreshHQ,5000);
            return;
        }
        //刷新行情
        $.getHQData(stockDataList,setHQStyle);
        DSQ = setTimeout(refreshHQ,5000); //5秒刷新一次
    }
    //设置行情样式
    function setHQStyle(data) {
        if (!data || data.length === 0){
            return;
        }
        for(var i in data){
            var obj = data[i];
            var hq = $.converHQFormat(obj.hqData.fChgRatio);
            $('.stock-id-'+obj.sCode+' div').attr('class',hq.rHQ||'middle');
            if (obj.transactionStatus == '80'){
                $('.stock-id-'+obj.sCode+' div #xj').html('--');
                $('.stock-id-'+obj.sCode+' div #zdf').html('--');
            }else {
                $('.stock-id-'+obj.sCode+' div #xj').html(parseFloat(obj.hqData.fNowPrice).toFixed(2));
                $('.stock-id-'+obj.sCode+' div #zdf').html(hq.rNum+'%');
            }
        }
    }
})();