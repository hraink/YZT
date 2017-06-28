/**
 * Created by xudong.Cai on 2017/2/22
 */
;(function () {
    var refreshHQTimeout = true; //启动及关闭
    var DSQ;
    var refreshRate = 10000;
    var ldlk = 1;
    $(function(){
        refresBtn(refreshHQ);
        setTimeout(refreshHQ,refreshRate);
        bindSwitchBtn();
    });
    //绑定切换按钮
    function bindSwitchBtn() {
        var swBtn = $('.container .switch').find('a');
        swBtn.off('click').on('click',function () {
            var _this = this;
            for(var i = 0;i <  swBtn.length; i++){
                if($(_this).attr('id') == $(swBtn[i]).attr('id')){
                    ldlk = $(swBtn[i]).data('ldlk');
                    $(swBtn[i]).removeClass('on').addClass('on');
                }else {
                    $(swBtn[i]).removeClass('on');
                }
            }
            getNewsData();
        });
    }
    function refresBtn(func){
        $('#reformBtn').off('click').on('click',function () {
            var _this = this;
            //设置刷新动画
            if ($(_this).hasClass('reformed')){
                return;
            }
            $(_this).addClass('reformed');
            setTimeout(function () {
                $(_this).removeClass('reformed');
            },800);
            func();
        });
    }
    //自动刷新交易行情数据
    function refreshHQ(){
        clearTimeout(DSQ);//清除之前申请的定时器
        if(!refreshHQTimeout) return;
        //是否在刷新时间段内
        if (!$.isRefreshDate()){
            DSQ = setTimeout(refreshHQ,refreshRate);
            return;
        }
        //刷新龙虎榜
        refreshHQTimeout = false;
        getNewsData();
        DSQ = setTimeout(refreshHQ,refreshRate); //5秒刷新一次
    }
    function getNewsData() {
        $.ajax({
            type: "GET",
            url: "/market/news/data/"+ldlk+"?_t="+new Date().getTime(),
            async: true,
            timeout: 3000,
            dataType:'json',
            success:function (data) {
                if (!data || !data.lhbNewsList){
                    return;
                }
                $('.status_right .status').html(data.tradeStatus);
                //更新榜单列表
                var html = ejs.render(market_news,{lhbNewsList:data.lhbNewsList});
                $('#news_list').html(html);
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

    //处理时间显示
    function handleDate(date) {
        var d = new Date();
        var today = d.getFullYear()+'-'+(d.getMonth()+1 < 9 ? '0' : '')+(d.getMonth()+1)+'-'+(d.getDate() < 9 ? '0' : '')+d.getDate();
        if (date,date.indexOf(today) === 0){
            return '今天 '+ date.substring(10,16);
        }else {
            return date.substring(5,16);
        }
    }
})();