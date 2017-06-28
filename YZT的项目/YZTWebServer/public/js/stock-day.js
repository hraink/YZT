/**
 * Created by xudong.Cai on 2017/2/27
 */
;(function () {
    var refreshHQTimeout = true; //启动及关闭
    var DSQ;
    var refreshRate = 10000;
    var stockDataList = [];
    $(function(){
        init();
        setTimeout(refreshHQ,refreshRate);
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
        //刷新行情
        refreshHQTimeout = false;
        if (stockDataList.length === 0){
            refreshHQTimeout = true;
            return;
        }
        $.getHQData(stockDataList,setHQStyle);
        DSQ = setTimeout(refreshHQ,refreshRate); //5秒刷新一次
    }
    //刷新每日热股行情数据
    function setHQStyle(data) {
        refreshHQTimeout = true;
        if (!data || data.length === 0){
            return;
        }
        for(var i in data){
            var obj = data[i];
            var hq = $.converHQFormat(obj.hqData.fChgRatio);
            if (obj.transactionStatus == '80'){
                $('.hot_info_'+obj.sCode+' #price').html('--');
                $('.hot_info_'+obj.sCode+' #zdf').html('--');
            }else {
                $('.hot_info_'+obj.sCode+' #price').html(parseFloat(obj.hqData.fNowPrice).toFixed(2));
                $('.hot_info_'+obj.sCode+' #zdf').html(hq.rNum+'%');
            }
            $('.hot_info_'+obj.sCode+' .hot_main').attr('class',hq.rHQ||'middle').addClass('hot_main');

        }
    }
    //初始化echarts
    function init() {
        var hotListDom = $('.hot_shares .hot_list');
        for(var i = 0;i < hotListDom.length;i++){
            var obj = hotListDom[i];
            var stockData = {
                shtSetcode:$(obj).data('stock-market'),
                sCode:$(obj).data('stock-code').toString()
            };
            stockDataList.push(stockData);
            //封装数据
            var old_data = $(obj).data('chart-list');
            if (old_data && old_data.length > 0){
                var chartDate = [];
                var chartHot = [];
                for(var o in old_data){
                    chartDate.push(old_data[o].date);
                    chartHot.push(old_data[o].hot);
                }
                setHightChart($(obj).find('.hot_chart'),chartDate,chartHot);
            }
        }
    }
    function setHightChart(chartObj,chartDate,chartHot){
        $(chartObj).highcharts({
            //图形
            chart: {
                backgroundColor:'rgb(31,31,31)', //图形背景色
                plotBorderWidth: 1, //图形边框
                plotBorderColor:'rgb(57,57,57)',
                spacingTop: 7,  //内边距顶部
                spacingBottom:0,
                spacingRight:1,
                spacingLeft:0
            },
            //标题
            title: {
                text: null
            },
            //图例
            legend: {
                enabled: false
            },
            //右下角网址
            credits: {
                enabled: false
            },
            //X轴
            xAxis: {
                lineColor:'rgb(57,57,57)',//X轴 轴线颜色
                crosshair: {//指示中线
                    width: 1,
                    color: 'rgb(102,102,102)',
                    zIndex:3
                },
                labels: {
                    formatter: function() {
                        return chartDate[this.value];
                    },
                    align:'left',
                    style: {
                        color: 'rgb(78,78,78)'//颜色
                        //fontSize:'14px'  //字体
                    }
                },
                tickInterval: 5,
                gridLineWidth:0,//网格线宽度 为0不显示网格线
                tickWidth: 0,    //刻度线宽度
                gridLineColor: 'rgb(26,26,26)',//设置纵向网格线（标尺）颜色
                minPadding:0,
                startOnTick:false,
                //endOnTick:true,
                //showLastLabel:true, //展示最后一个刻度线
                maxPadding:0
            },
            //Y轴
            yAxis: {
                title: {
                    text: null
                },
                labels: {
                    formatter: function() {
                        return this.value;
                    },
                    align:'right',
                    style: {
                        color: 'rgb(78,78,78)'//颜色
                        //fontSize:'14px'  //字体
                    }
                },
                gridLineColor: 'rgb(57,57,57)',
                gridLineWidth:1,
                min:0,
                //minPadding:0,
                startOnTick:false,
                tickAmount:3
            },
            tooltip: {
                formatter: function () {
                    var s = '<b style="color: rgb(153,153,153)">' + chartDate[this.x] + '</b>';
                    $.each(this.points, function () {
                        s += '<br/><span style="color: rgb(153,153,153)">' + this.series.name + ': </span><span style="color: rgb(255,91,91)">' +this.y.toFixed(2) + '</span>';
                    });
                    return s;
                },
                backgroundColor:'rgb(51,51,51)',
                borderColor:'rgb(102,102,102)',
                shared: true
            },
            plotOptions: {
                area: {
                    lineWidth: 1.0, //折线图 线宽
                    lineColor:'rgb(42,101,163)',
                    marker: {
                        enabled: false,
                        symbol: 'circle',
                        radius: 0,
                        states: {
                            hover: {
                                enabled: false
                            }
                        }
                    }
                },
                line:{
                    lineWidth: 1.0, //折线图 线宽
                    lineColor:'rgb(42,101,163)',
                    marker: {
                        enabled: false,
                        states:{
                            hover:{
                                enabled: false
                            }
                        },
                        radius: 0,
                        symbol: 'circle'
                    }

                },
                series: {
                    animation: false,
                    lineWidth:1,
                    marker: {
                        fillColor:'rgb(255,111,0)',
                        radius: 2,
                        lineWidth: 0,
                        lineColor: null,
                        enabled: false
                    }
                }
            },
            series: [
                {
                    name: '热度',
                    type: 'areaspline',
                    data: chartHot,
                    threshold : null,
                    tooltip : {
                        valueDecimals : 2
                    },
                    fillColor: {
                        linearGradient: {
                            x1: 0,
                            y1: 0,
                            x2: 1,
                            y2: 1
                        },
                        stops: [
                            [0, 'rgb(28,39,55)'],
                            [1, 'rgb(31,31,31)']
                        ]
                    },
                    radius: 0
                }
            ]
        });
    }
})();