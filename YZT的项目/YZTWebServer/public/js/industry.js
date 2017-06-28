/**
 * Created by xudong.Cai on 2017/2/13.
 */
;(function () {
    //初始化矩阵图组件
    var myChart = echarts.init(document.getElementById("popular_chart"));
    var refreshHQTimeout = true; //启动及关闭
    var DSQ;
    var thisCodes = '';

    $(function(){
        // 行业矩阵树图
        getIndustryData();
    });

    //自动刷新交易行情数据
    function refreshHQ(){
        clearTimeout(DSQ);//清除之前申请的定时器
        if(!refreshHQTimeout) return;
        //是否在刷新时间段内
        if (!$.isRefreshDate()){
            DSQ = setTimeout(refreshHQ,5000);
            return;
        }
        // //获取最新股票代码
        // var stockDataList = [];
        // var stockDomList = $('table tbody tr');
        // if (!stockDomList && stockDomList.length === 0){
        //     return;
        // }
        // for(var i = 0;i < stockDomList.length; i++){
        //     var obj = $(stockDomList[i]);
        //     var stockData = {
        //         shtSetcode:obj.data('stock-market'),
        //         sCode:obj.data('stock-code').toString()
        //     };
        //     stockDataList.push(stockData);
        // }
        // //刷新行情
        // $.getHQData(stockDataList,setHQStyle);
        getIndustrySort(thisCodes);
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
            $('.stock-id-'+obj.sCode+' .txt_r').attr('class','txt_r '+hq.rHQ);
            $('.stock-id-'+obj.sCode+' #xj').html(parseFloat(obj.hqData.fNowPrice).toFixed(2));
            $('.stock-id-'+obj.sCode+' #zdf').html(hq.rNum+'%');
            $('.stock-id-'+obj.sCode+' #zde').html(parseFloat(obj.hqData.fChgValue).toFixed(2));
        }
    }
    //获取沪深市场热门行业数据
    function getIndustryData() {
        $('#noData').hide();
        $.ajax({
            type: "GET",
            url: "/hot/industry/sort?_t="+new Date().getTime(),
            async: true,
            timeout: 3000,
            dataType:'json',
            success:function (data) {
                if (!data && data.length == 0){
                    $('#noData').show();
                    return;
                }
                var chartDataList = [];
                for(var i in data){
                    var obj = data[i];
                    var color = '#acaaaa';
                    var hoverColor = '#a09f9f';
                    var zde = parseFloat(obj.stSimHq.fChgRatio);
                    if (zde > 0.8){//红色 0.8以上
                        color = '#a20c0c';
                        hoverColor = '#900a0a';
                    }else if (zde > 0.4 && zde <= 0.8){//红色 0.4-0.8
                        color = '#c23c3c';
                        hoverColor = '#b93939';
                    }else if (zde > 0 && zde <= 0.4){//红色 0.4-0
                        color = '#db6767';
                        hoverColor = '#cb5c5c';
                    }
                    else if (zde < -0.8){//绿色 0.8以上
                        color = '#0a642b';
                        hoverColor = '#085524';
                    }else if (zde < -0.4 && zde >= -0.8){//绿色 0.4-0.8
                        color = '#2a874c';
                        hoverColor = '#247843';
                    }else if (zde < 0 && zde >= -0.4){//绿色 0.8以上
                        color = '#59bf7f';
                        hoverColor = '#4fb274';
                    }
                    var chartData = {
                        name:obj.sName,
                        value:obj.stSimHq.fAmount === 0 ? 1 :obj.stSimHq.fAmount,
                        sCode:obj.sCode,
                        fNowPrice:obj.stSimHq.fNowPrice,
                        fChgRatio:$.converBigNumFormat(obj.stSimHq.fChgRatio),
                        uiBlockNum:obj.stExHq.uiBlockNum,
                        uiBlockRise:obj.stExHq.uiBlockRise,
                        uiBlockFall:obj.stExHq.uiBlockFall,
                        uiBlockDraw:obj.stExHq.uiBlockNum-(obj.stExHq.uiBlockRise+obj.stExHq.uiBlockFall),
                        lVolume:obj.stSimHq.lVolume,
                        fAmount:obj.stSimHq.fAmount,
                        itemStyle:{normal:{color:color},emphasis:{color:hoverColor}}
                    }
                    chartDataList.push(chartData);
                }
                setChart(chartDataList);
                getIndustrySort(chartDataList[0].sCode);
                //绑定定时刷新行情
                refreshHQ();
            },
            error:function(XMLHttpRequest, textStatus, errorThrown) {
                if(textStatus == 'timeout') {
                    console.log("操作请求已经超时");
                } else {
                    console.log("其他错误。",textStatus);
                }
                $('#noData').show();
            }
        });
    }
    //设置矩阵图
    function setChart(data) {
        var option = {
            tooltip : {
                trigger: 'item',
                padding:0,
                formatter:function (param) {
                    var fHtml = '<div class="prompt_box"><div class="top"><p class="name">'+param.data.name+
                        '</p><p class="num '+param.data.fChgRatio.rHQ+'">'+param.data.fChgRatio.rNum+'%</p></div><div class="company"><p>公司数量</p><span class="low">'+param.data.uiBlockNum+
                        '</span><div class="increa"><p>涨跌家数</p><span class="rise">涨<span>'+param.data.uiBlockRise+'</span></span><span class="fall">跌<span>'+param.data.uiBlockFall+'</span></span><span class="flat">平<span>'+(param.data.uiBlockNum-(param.data.uiBlockRise+param.data.uiBlockFall))+'</span></span></div><div class="total_num"><p>总成交量(手)</p><span>'+$.converBigNumFormat(param.data.lVolume).rNum+
                        '</span></div><div class="total_deal"><p>总成交额(元)</p><span>'+$.converBigNumFormat(param.data.fAmount).rNum+
                        '</span></div></div>';
                    return fHtml;
                }
            },
            // color:['#c6c6c6','#ff5b5b', '#3aaf65'],
            series : [
                {
                    name:'沪深市场热门行业',
                    type:'treemap',
                    width:'100%',
                    height:'100%',
                    leafDepth:1,
                    roam:false,
                    nodeClick:false,
                    breadcrumb:false,
                    label:{
                        normal: {
                            textStyle:{
                                fontSize:14,
                            }
                        }
                    },
                    itemStyle: {
                        normal: {
                            gapWidth:1,
                            borderColor:'#1f1f1f',
                        },
                    },
                    data:data
                },
            ]
        };
        myChart.setOption(option);
        myChart.on('click',function (d) {
            getIndustrySort(d.data.sCode);
        })
    }
    //取行业排序数据
    function getIndustrySort(sCode) {
        thisCodes = sCode;
        var html = '<tr><td colspan="5">-暂无数据-</td></tr>';
        $.ajax({
            type: "GET",
            url: "/hot/industry/stock/sort/"+sCode+'?_t='+new Date().getTime(),
            async: true,
            timeout: 3000,
            dataType:'json',
            success:function (data) {
                var zdfHtml = buildIndustrySortHtml(data.zdfList,'zdf');
                var cjeHtml = buildIndustrySortHtml(data.cjeList,'cje');
                $('#increa_list tbody').removeClass('tab_noData');
                $('#deal_list tbody').removeClass('tab_noData');
                if (zdfHtml == ''){
                    $('#increa_list tbody').addClass('tab_noData').show();
                    zdfHtml = html;
                }
                if (cjeHtml == ''){
                    $('#deal_list tbody').addClass('tab_noData').show();
                    cjeHtml = html;
                }
                $('#increa_list tbody').html(zdfHtml);
                $('#deal_list tbody').html(cjeHtml);
                return;
            },
            error:function(XMLHttpRequest, textStatus, errorThrown) {
                if(textStatus == 'timeout') {
                    console.log("操作请求已经超时");
                } else {
                    console.log("其他错误。",textStatus);
                }
                $('#increa_list tbody').html(html).addClass('tab_noData').show();
                $('#deal_list tbody').html(html).addClass('tab_noData').show();
            }
        });
    }
    //构建行业个股排序HTML
    function buildIndustrySortHtml(data,type) {
        var html = '';
        if (data &&  data.length > 0){
            for(var i in data){
                var obj = data[i]
                var fChgRatio = $.converHQFormat(parseFloat(obj.stSimHq.fChgRatio));
                html += '<tr class="stock-id-'+obj.sCode+'" data-stock-market="'+obj.shtSetcode+'" data-stock-code="'+obj.sCode+'">';
                html += '<td><span>'+obj.sCode+'</span></td>';
                html += '<td><a href="javascript:void(0);" class="open_stock" target="_blank" data-stock-market="'+obj.shtSetcode+'" data-stock-code="'+obj.sCode+'">'+obj.sName+'</a></td>';
                html += '<td class="txt_r '+fChgRatio.rHQ+'"><span id="xj">'+parseFloat(obj.stSimHq.fNowPrice).toFixed(2)+'</span></td>';
                html += '<td class="txt_r '+fChgRatio.rHQ+'"><span id="zdf">'+fChgRatio.rNum+'%</span></td>';
                if (type === 'zdf'){
                    html += '<td class="txt_r '+fChgRatio.rHQ+'"><span id="zde">'+parseFloat(obj.stSimHq.fChgValue).toFixed(2)+'</span></td>';
                }else {
                    html += '<td class="txt_r"><span>'+$.converBigNumFormat(obj.stSimHq.fAmount).rNum+'</span></td>';
                }
                html += '</tr>';
            }
        }
        return html;
    }
})();