/**
 * Created by xudong.Cai on 2017/2/22
 */
;(function () {
    var stop=true;//触发开关，防止多次调用事件
    var tableIndexNum = 20;
    $(function(){
        init();
    });
    function init() {
        //日历时间控件
        var start = {
            elem: '#start',
            format: 'YYYY-MM-DD',
            min: '2016-01-01',
            max: laydate.now(-1),
            istime: false,
            istoday: false,
            choose: function (datas) {
                end.min = datas; //开始日选好后，重置结束日的最小日期
                end.start = datas; //将结束日的初始值设定为开始日
            }
        };
        var end = {
            elem: '#end',
            format: 'YYYY-MM-DD',
            min: '2016-01-01',
            max: laydate.now(-1),
            istime: false,
            istoday: false,
            choose: function (datas) {
                start.max = datas; //结束日选好后，重置开始日的最大日期
            }
        };
        laydate(start);
        laydate(end);
        closeAndOpen();
        //搜索事件绑定
        $('#btnSearch').off('click').on('click',function () {
            trackOpt.offset = 0;
            console.log($('#start').val(),$('#end').val())
            getNewsData(true);
        });
        //自动加载更多
        $(window).scroll(function() {
            //当内容滚动到底部时加载新的内容 100当距离最底部100个像素时开始加载.
            if ($(this).scrollTop() + $(window).height() + 400 >= $(document).height()) {
                if(stop){
                    stop=false;
                    trackOpt.offset = 1;
                    getNewsData(false);
                }
            }
        });
    }
    //收起展开
    function closeAndOpen() {
        $(".control").off('click').on("click", function () {
            var self = this;
            var cid = $(self).attr("data-id");
            var $bbs = $('#bbs_' + cid);
            if ($(self).attr('cur') === 'up') {
                $(self).addClass("pitted").removeClass("stuff").text("详情");
                $bbs.find(".stuffContent").hide();
                $bbs.addClass("pittedCt");
                $bbs.find(".topContent").removeClass("pittedContent");
                $(self).attr('cur', 'down');
            } else {
                $(this).addClass("stuff").removeClass("pitted").text("收起");
                $bbs.find(".stuffContent").show();
                $bbs.removeClass("pittedCt");
                $bbs.find(".topContent").addClass("pittedContent");
                $(self).attr('cur', 'up');
            }
        });
    }
    function getNewsData(refresh) {
        var ajaxURL = '/market/track/data?begin='+$('#start').val()+'&end='+$('#end').val()+'&offset='+trackOpt.offset;
        if(!refresh){
            ajaxURL += '&beginTime='+trackOpt.beginTime+'&lastNewsTime='+trackOpt.lastNewsTime+'&pageSize=10';
        }else {
            tableIndexNum = null;
        }
        $.ajax({
            type: "GET",
            url: ajaxURL+'&_t='+new Date().getTime(),
            async: true,
            timeout: 3000,
            dataType:'json',
            success:function (data) {
                if (!data || !data.lhbNewsList || data.lhbNewsList.length === 0){
                    return;
                }
                $('.status_right .status').html(data.tradeStatus);
                //更新榜单列表
                var html = ejs.render(market_track,{lhbNewsList:data.lhbNewsList,tableIndexNum:tableIndexNum});
                if (refresh == true){
                    $('#news_list').html(html);
                }else {
                    tableIndexNum = tableIndexNum+data.lhbNewsList.length;
                    trackOpt.beginTime = data.beginTime;
                    trackOpt.lastNewsTime = data.lastNewsTime;
                    $('#news_list').append(html);
                }
                closeAndOpen();
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
                stop=true;
                refreshHQTimeout = true;
            }
        });
    }

})();