/**
 * Created by xudong.Cai on 2017/2/13.
 */
;(function () {
    var queryOpt = {
        defOpt:null,
        initOpt:function () {
            this.defOpt = {
                BUSS_TYPE:'EBT_BLK_HY',
                RANK_DAY:1,
                STARTXH:0,
                WANTNUM:50,
                SORT_COLUMN:'EMRC_DAY_ZLLR',
                SORT_METHOD:'E_SORT_DESCEN'
            }
        },
        getOpt:function () {
            return this.defOpt;
        }
    }
    var tableIndexNum = 1;
    var sw = $('.switch');
    var ts = $('.time_section');
    var myChart = null;
    var stop=true;//触发开关，防止多次调用事件
    var refreshHQTimeout = true; //启动及关闭
    var refreshRate = 10000;
    var DSQ;
    var cache_result = null;
    var cache_stock = [];

    $(function(){
        queryOpt.initOpt();
        getData();
        initBindFun();
        // 基于准备好的dom，初始化echarts实例
        $('.subject_chart').show();
        //去掉浮动样式
        tableCssHandle.tableFixRemove();
        getChartsData();
        //定时刷新数据
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
        //刷新资金流向数据
        refreshHQTimeout = false;
        getNewsData();
        // getChartsData();
        DSQ = setTimeout(refreshHQ,refreshRate); //5秒刷新一次
    }
    //获取最新数据
    function getNewsData() {
        var ajax_url = "/capital/hq/"+queryOpt.defOpt.RANK_DAY+'?_t='+new Date().getTime();
        $.ajax({
            type: "POST",
            url: ajax_url,
            data:{socketData:JSON.stringify(cache_stock)},
            async: true,
            timeout: 3000,
            dataType:'json',
            success:function (data) {
                if (!data || !data.vMFlowRank){
                    $('#stocksData').hide();
                    $('#noData').show();
                    return;
                }else {
                    $('#stocksData').show();
                    $('#noData').hide();
                }
                buildTableHtml(data,true);
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
        })
    }
    function getChartsData() {
        var emrc_day = queryOpt.defOpt.RANK_DAY == 1 ? '' : queryOpt.defOpt.RANK_DAY;
        var jlr = $.get("/capital/query/"+queryOpt.defOpt.BUSS_TYPE+'/'+queryOpt.defOpt.RANK_DAY+'?SORT_COLUMN=EMRC_'+emrc_day+'DAY_ZLLR&SORT_METHOD=E_SORT_DESCEN&_t='+new Date().getTime());  //净流入
        var jrc = $.get("/capital/query/"+queryOpt.defOpt.BUSS_TYPE+'/'+queryOpt.defOpt.RANK_DAY+'?SORT_COLUMN=EMRC_'+emrc_day+'DAY_ZLLR&SORT_METHOD=E_SORT_ASCEND&_t='+new Date().getTime());  //净流出
        $.when(jlr, jrc).done(function (d1, d2) {
            //拼接echarts数据模型
            var cData = {
                valueArray:[],
                nameArray:[]
            };
            if (d1 && d1[1] === 'success' && d1[0].vMFlowRank && d1[0].vMFlowRank.length > 0){
                for(var i in d1[0].vMFlowRank){
                    var obj = d1[0].vMFlowRank[i];
                    var label = {
                        normal:{
                            show: true,
                            position: (obj.fDayMFlowTrend.fMainMoneyInflow/100000000) >= 0 ? 'top' : 'bottom',
                        }
                    };
                    cData.valueArray.push({value:(obj.fDayMFlowTrend.fMainMoneyInflow = 0 ? 0 : (obj.fDayMFlowTrend.fMainMoneyInflow/100000000).toFixed(2)),label:label});
                    cData.nameArray.push({value:obj.sName.split("").join("\n")});
                }
            }
            if (d2 && d2[1] === 'success' && d2[0].vMFlowRank && d2[0].vMFlowRank.length > 0){
                for(var i = d2[0].vMFlowRank.length-1;i >= 0;i--){
                    var obj = d2[0].vMFlowRank[i];
                    var label = {
                        normal:{
                            show: true,
                            position: (obj.fDayMFlowTrend.fMainMoneyInflow/100000000) >= 0 ? 'top' : 'bottom',
                        }
                    };
                    cData.valueArray.push({value:(obj.fDayMFlowTrend.fMainMoneyInflow = 0 ? 0 : (obj.fDayMFlowTrend.fMainMoneyInflow/100000000).toFixed(2)),label:label});
                    cData.nameArray.push({value:obj.sName.split("").join("\n")});
                }
            }
            setCharts(cData);
        });
    }
    //设置chart
    function setCharts(cData) {
        $('#subjectChart').hide();
        //集合竞价阶段不显示chart
        $('.table_head').css('top','-41px');
        if(cData.valueArray[0] && Number(cData.valueArray[0].value) === 0 &&  Number(cData.valueArray[cData.valueArray.length-1].value) === 0 && queryOpt.defOpt.BUSS_TYPE !== 'EBT_A'){
            window.onscroll=function ()
            {
                var scrollTop=document.documentElement.scrollTop||document.body.scrollTop;
                var menu=document.getElementById("menu");
                menu.style.top=scrollTop +'px';
                var oDiv1=document.getElementsByClassName("switch")[0];
                var oDiv2=document.getElementsByClassName("time")[0];
                var oDiv3=$('#'+queryOpt.defOpt.BUSS_TYPE+"_HEAD").parents('.table_head');
                oDiv1.style.top=scrollTop +'px';
                oDiv2.style.top=scrollTop + 24 +'px';
                oDiv3.css("top",document.body.scrollTop -  41 +'px');
            }
        }else if(queryOpt.defOpt.BUSS_TYPE !== 'EBT_A' && cData.valueArray && cData.valueArray.length > 0){//图表数据有值，且当前不是选择个股资金时，显示chart
            $('#subjectChart').show();
            window.onscroll=function ()
            {
                var scrollTop=document.documentElement.scrollTop||document.body.scrollTop;
                var menu=document.getElementById("menu");
                menu.style.top=scrollTop +'px';
                var oDiv1=document.getElementsByClassName("switch")[0];
                var oDiv2=document.getElementsByClassName("time")[0];
                var oDiv3=$('#'+queryOpt.defOpt.BUSS_TYPE+"_HEAD").parents('.table_head');
                oDiv1.style.top=scrollTop +'px';
                oDiv2.style.top=scrollTop + 24 +'px';
                if(scrollTop>=360){
                    oDiv3.css("top",document.body.scrollTop -394 +'px');
                }else if(scrollTop<360){
                    oDiv3.css("top",-41 +'px');
                }
            }
            var option = {
                color: ['#3398DB'],
                tooltip : {
                    trigger: 'axis',
                    axisPointer : {            // 坐标轴指示器，坐标轴触发有效
                        lineStyle:{
                            opacity: 0
                        },
                        type : 'line'        // 默认为直线，可选为：'line' | 'shadow'
                    },
                    padding:0,
                    formatter: function (data) {
                        var className = parseFloat(data[0].value) >= 0 ? 'height' : 'low';
                        if (data[0].dataIndex > 9){
                            var html = '<div class="prompt_box '+className+'"><p class="name">'+data[0].name.split("\n").join("")+'</p><p class="num">'+data[0].value+'<span>亿</span></p><p class="funds">主力<span class="out">净流出</span>前<span class="ranking">10</span></p></div>';
                            return html;
                        }else {
                            var html = '<div class="prompt_box '+className+'"><p class="name">'+data[0].name.split("\n").join("")+'</p><p class="num">'+data[0].value+'<span>亿</span></p><p class="funds">主力<span class="out">净流入</span>前<span class="ranking">10</span></p></div>';
                            return html;
                        }
                    }
                },
                animation:false,
                grid: {
                    left: '0%',
                    right: '0%',
                    top:'10%',
                    bottom: '1%',
                    containLabel: true
                },
                xAxis : [
                    {
                        type : 'category',
                        data : cData.nameArray,
                        axisTick: false, //刻度小标记
                        axisLabel:{
                            interval:0,
                            textStyle: {
                                color: '#666666',
                                fontSize:14
                            }
                        },
                    }
                ],
                yAxis : [
                    {
                        name:' 单位：亿元',
                        nameTextStyle:{
                            color:'#666666'
                        },
                        type : 'value',
                        splitLine:{
                            lineStyle:{
                                color:'#2D2D2D'
                            }
                        },
                        axisLabel:{
                            interval:0,
                            textStyle: {
                                color: '#666666',
                                fontSize:12
                            }
                        },
                        // min:'dataMin'
                        // nameGap:20
                        // minInterval:15,
                        splitNumber:4
                    }
                ],
                series : [
                    {
                        name:'净流入',
                        type:'bar',
                        barWidth: '60%',
                        data:cData.valueArray,
                        itemStyle: {
                            normal: {
                                color: function(data) {
                                    return parseFloat(data.value) >= 0 ? '#FF5B5B' : '#3AAF65';
                                }
                            }
                        }
                    }
                ]
            };
            //对图标宽度调整
            // $(".subject_chart").css("width",computeChartWidth());
            if (myChart === null){
                myChart = echarts.init(document.getElementById('subjectChart'));
            }
            // $(window).resize(function(){
            // $(".subject_chart").css("width",computeChartWidth());
            // });
            // 使用刚指定的配置项和数据显示图表。
            myChart.setOption(option);
            // window.onresize = myChart.resize;
        }
    }
    //计算chart宽度
    var computeChartWidth = function(resize) {
        var cw = $(window).width()-190;
        return cw<1178?1178:cw;
    }
    //获取资金流向数据
    function getData() {
        $('body').animate({
            scrollTop: 0
        },0);
        var ajax_url = "/capital/query/"+queryOpt.defOpt.BUSS_TYPE+"/"+queryOpt.defOpt.RANK_DAY+'?STARTXH='+queryOpt.defOpt.STARTXH+'&WANTNUM='+queryOpt.defOpt.WANTNUM+'&SORT_COLUMN='+queryOpt.defOpt.SORT_COLUMN+'&SORT_METHOD='+queryOpt.defOpt.SORT_METHOD+'&_t='+new Date().getTime();
        $.ajax({
            type: "GET",
            url: ajax_url,
            async: true,
            timeout: 3000,
            dataType:'json',
            success:function (data) {
                if (!data || !data.vMFlowRank){
                    $('#stocksData').hide();
                    $('#noData').show();
                    return;
                }else {
                    $('#stocksData').show();
                    $('#noData').hide();
                }
                stop=true;
                buildTableHtml(data);
            },
            error:function(XMLHttpRequest, textStatus, errorThrown) {
                if(textStatus == 'timeout') {
                    console.log("操作请求已经超时");
                } else {
                    console.log("其他错误。",textStatus);
                }
            }
        })
    }
    //构建表格内容
    function buildTableHtml(result,refresh) {
        if (result == null || result.vMFlowRank == null || result.vMFlowRank.length === 0){
            return;
        }
        /*****************初始化翻页*****************/
        if (!refresh && queryOpt.defOpt.STARTXH == 0){
            //翻页插件
            $(".turn_page").createPage({
                pageCount:Math.ceil(result.iTotalSize/50) || 1,
                current:1,
                backFn:function(p){
                    queryOpt.defOpt.STARTXH = (p - 1) * 50;
                    getData();
                }
            });
        }
        /*****************初始化变量*****************/
        var html ='';
        tableIndexNum = queryOpt.defOpt.STARTXH + 1;
        var tmp_stock = [];
        var tmp_result = {};
        for(var i in result.vMFlowRank){
            var obj = result.vMFlowRank[i];
            var mf = obj.fDayMFlowTrend;
            /*****************缓存数据*****************/
            var stock = {
                shtSetcode:obj.shtSetcode,
                sCode:obj.sCode
            }
            tmp_result[obj.sCode] = {
                sData : obj
            };
            tmp_stock.push(stock);
            /*****************格式化展示数据*****************/
            var tdData = {
                fChg:$.converHQFormat(obj.fChg),
                fNowPrice:$.converHQFormat(obj.fNowPrice),
                fMainMoneyInflow:$.converBigNumFormat(mf.fMainMoneyInflow),
                fMainMoneyRatio:$.converHQFormat(mf.fMainMoneyRatio),
                fSuperLargeInflow:$.converBigNumFormat(mf.fSuperLargeInflow),
                fSuperLargeRatio:$.converHQFormat(mf.fSuperLargeRatio),
                fLargeInflow:$.converBigNumFormat(mf.fLargeInflow),
                fLargeRatio:$.converHQFormat(mf.fLargeRatio),
                fMiddleInflow:$.converBigNumFormat(mf.fMiddleInflow),
                fMiddleRatio:$.converHQFormat(mf.fMiddleRatio),
                fSmallInflow:$.converBigNumFormat(mf.fSmallInflow),
                fSmallRatio:$.converHQFormat(mf.fSmallRatio),
            }
            /*****************设置涨跌样式*****************/
            // if (refresh && cache_result && cache_result[obj.sCode]){
            //     var thisCahce = cache_result[obj.sCode].sData;
            //     //新值大于旧值：红 小于旧值：绿
            //     if (obj.fChg > thisCahce.fChg){
            //         tdData.fChg.rHQ += ' flash_height';
            //     }else if (obj.fChg < thisCahce.fChg){
            //         tdData.fChg.rHQ += ' flash_low';
            //     }
            //     if (obj.fNowPrice > thisCahce.fNowPrice){
            //         tdData.fNowPrice.rHQ += ' flash_height';
            //     }else if (obj.fNowPrice < thisCahce.fNowPrice){
            //         tdData.fNowPrice.rHQ += ' flash_low';
            //     }
            // }
            /*****************构建HTML结构*****************/
            html += '<tr class="content_tr"><td class="rank">'+tableIndexNum+'</td>';
            var unit = '%';
            if(queryOpt.defOpt.BUSS_TYPE === 'EBT_A'){
                if (obj.bTransactionStatus != undefined  && obj.bTransactionStatus.toString() == '80'){
                    unit = '';
                    //停牌样式
                    tdData.fNowPrice.rNum = '--';
                    tdData.fChg.rNum = '--';
                    tdData.fMainMoneyInflow.rNum = '--';
                    tdData.fMainMoneyRatio.rNum = '--';
                    tdData.fSuperLargeInflow.rNum = '--';
                    tdData.fSuperLargeRatio.rNum = '--';
                    tdData.fLargeInflow.rNum = '--';
                    tdData.fLargeRatio.rNum = '--';
                    tdData.fMiddleInflow.rNum = '--';
                    tdData.fMiddleRatio.rNum = '--';
                    tdData.fSmallInflow.rNum = '--';
                    tdData.fSmallRatio.rNum = '--';
                }
                html += '<td class="t_code narrow">'+obj.sCode+'</td>'
                    +'<td class="t_name narrow"><a href="javascript:void(0)" class="open_stock" data-stock-market="'+obj.shtSetcode+'" data-stock-code="'+obj.sCode+'">'+obj.sName+'</a></td>'
                    +'<td class="narrow '+tdData.fChg.rHQ+'">'+tdData.fNowPrice.rNum+'</td>';
            }else{
                html += '<td class="t_name narrow"><a href="javascript:void(0)" class="open_stock" data-stock-market="'+obj.shtSetcode+'" data-stock-code="'+obj.sCode+'">'+obj.sName+'</a></td>';
            }
            html += '<td class="narrow '+tdData.fChg.rHQ+'">'+tdData.fChg.rNum+unit+'</td>'
            +'<td class="inflow '+tdData.fMainMoneyInflow.rHQ+'">'+tdData.fMainMoneyInflow.rNum+'</td>'
            +'<td class="'+tdData.fMainMoneyRatio.rHQ+'">'+tdData.fMainMoneyRatio.rNum+unit+'</td>'
            +'<td class="inflow '+tdData.fSuperLargeInflow.rHQ+'">'+tdData.fSuperLargeInflow.rNum+'</td>'
            +'<td class="'+tdData.fSuperLargeRatio.rHQ+'">'+tdData.fSuperLargeRatio.rNum+unit+'</td>'
            +'<td class="inflow '+tdData.fLargeInflow.rHQ+'">'+tdData.fLargeInflow.rNum+'</td>'
            +'<td class="inflow '+tdData.fLargeRatio.rHQ+'">'+tdData.fLargeRatio.rNum+unit+'</td>'
            +'<td class="inflow '+tdData.fMiddleInflow.rHQ+'">'+tdData.fMiddleInflow.rNum+'</td>'
            +'<td class="inflow '+tdData.fMiddleRatio.rHQ+'">'+tdData.fMiddleRatio.rNum+unit+'</td>'
            +'<td class="inflow '+tdData.fSmallInflow.rHQ+'">'+tdData.fSmallInflow.rNum+'</td>'
            +'<td class="inflow '+tdData.fSmallRatio.rHQ+'">'+tdData.fSmallRatio.rNum+unit+'</td>'
            +'</tr>';
            tableIndexNum++;
        }
        cache_stock = tmp_stock;
        cache_result = tmp_result;
        $('#'+queryOpt.defOpt.BUSS_TYPE+'_BODY').html(html);
        //个股资金设置浮动表头
        if(queryOpt.defOpt.BUSS_TYPE === 'EBT_A'){//&& queryOpt.defOpt.BUSS_TYPE !== 'EBT_A'
            window.onscroll=function ()
            {
                var scrollTop=document.documentElement.scrollTop||document.body.scrollTop;
                var menu=document.getElementById("menu");
                menu.style.top=scrollTop +'px';
                var oDiv1=document.getElementsByClassName("switch")[0];
                var oDiv2=document.getElementsByClassName("time")[0];
                var oDiv3=$('#'+queryOpt.defOpt.BUSS_TYPE+"_HEAD").parents('.table_head');
                oDiv1.style.top=scrollTop +'px';
                oDiv2.style.top=scrollTop + 24 +'px';
                oDiv3.css('top',document.body.scrollTop - 41 +'px');
            }
        }
    }
    //初始化绑定事件
    function initBindFun() {
        //类别选择
        $(sw).find('a').off('click').on('click',function () {
            //初始化参数
            queryOpt.initOpt();
            //重置选择时间状态
            resetSelectDateStatus();
            //默认选中第一个
            $(ts).find('p:first-child').addClass('sectioned');
            var _this = this;
            //处理选择样式
            var swA = $(sw).find('a');
            for(var i = 0;i < swA.length; i++){
                $(swA[i]).removeClass('on');
            }
            $(_this).addClass('on');
            queryOpt.defOpt.BUSS_TYPE = $(_this).attr('busstype');
            //重置排序字段选择状态
            resetSelectSortStatus();
            //个股资金不显示chart
            if (queryOpt.defOpt.BUSS_TYPE !== 'EBT_A'){
                // $('.subject_chart').show();
                //去掉浮动样式
                tableCssHandle.tableFixRemove();
                getChartsData();
            }else {
                //添加浮动样式
                tableCssHandle.tableFixAdd();
                $('.subject_chart').hide();
            }
            //处理显示table body
            var tHEAD = $('.fund_data thead');
            for(var i = 0;i < tHEAD.length; i++){
                $(tHEAD[i]).hide();
            }
            $('#'+queryOpt.defOpt.BUSS_TYPE+'_HEAD').show();
            //处理显示table body
            var tBODY = $('.fund_data tbody');
            for(var i = 0;i < tBODY.length; i++){
                $(tBODY[i]).hide();
            }
            $('#'+queryOpt.defOpt.BUSS_TYPE+'_BODY').show();
            getData();
        });
        //日期选择
        $(ts).find('p').off('click').on('click',function () {
            queryOpt.defOpt.STARTXH = 0;
            queryOpt.defOpt.WANTNUM = 50;
            var _this = this;
            if (typeof $(_this).attr('rankDay') === 'undefined'){
                //设置刷新动画
                if ($(_this).hasClass('reformed')){
                    return;
                }
                $(_this).addClass('reformed');
                setTimeout(function () {
                    $(_this).removeClass('reformed');
                },800);
                getData();
                getChartsData();
                return;
            }
            //重置选择时间状态
            resetSelectDateStatus();
            $(_this).addClass('sectioned');
            queryOpt.defOpt.RANK_DAY = $(_this).attr('rankDay');
            var th = $('#'+queryOpt.defOpt.BUSS_TYPE+'_HEAD th');
            var sortColumn = '';
            for(var i = 0;i < th.length; i++){
                if ($(th[i])[0].className !== ''){
                    sortColumn = $(th[i]).attr('sortColumn');
                    break;
                }
            }
            queryOpt.defOpt.SORT_COLUMN = 'EMRC_'+((queryOpt.defOpt.RANK_DAY == '1' || queryOpt.defOpt.SORT_COLUMN === 'CHANGE') ? '' : queryOpt.defOpt.RANK_DAY)+sortColumn;
            getData();
            getChartsData();
        });
        //排序字段选择
        $('thead th').off('click').on('click',function () {
            var _this = this;
            if (typeof $(_this).attr('sortColumn') === 'undefined'){
                return;
            }
            var thisClass =  $(_this)[0].className;
            var th = $('#'+queryOpt.defOpt.BUSS_TYPE+'_HEAD th');
            for(var i = 0;i < th.length; i++){
                $(th[i]).removeClass('riseting').removeClass('sorting');
            }
            queryOpt.defOpt.SORT_COLUMN = 'EMRC_'+((queryOpt.defOpt.RANK_DAY == '1' || queryOpt.defOpt.SORT_COLUMN === 'CHANGE') ? '' : queryOpt.defOpt.RANK_DAY)+$(_this).attr('sortColumn');
            queryOpt.defOpt.SORT_METHOD = (thisClass === 'sorting' ? 'E_SORT_ASCEND' : 'E_SORT_DESCEN');
            queryOpt.defOpt.STARTXH = 0;
            queryOpt.defOpt.WANTNUM = 50;
            $(_this).addClass(thisClass === 'sorting' ? 'riseting' : 'sorting');
            getData();
        });
    }
    //重置选择时间状态
    function resetSelectDateStatus() {
        var tsP = $(ts).find('p');
        for(var i = 0;i < tsP.length; i++){
            $(tsP[i]).removeClass('sectioned');
        }
    }
    //重置选择排序状态
    function resetSelectSortStatus() {
        var th = $('#'+queryOpt.defOpt.BUSS_TYPE+'_HEAD th');
        for(var i = 0;i < th.length; i++){
            if ($(th[i]).attr('sortColumn') === 'DAY_ZLLR'){
                $(th[i]).addClass('sorting');
            }else {
                $(th[i]).removeClass('riseting').removeClass('sorting');
            }
        }
    }
    //窗口改变时修改table样式
    window.onscroll=function (){
        var scrollTop=document.documentElement.scrollTop||document.body.scrollTop;
        if(scrollTop>=318 && queryOpt.defOpt.BUSS_TYPE !== 'EBT_A'){
            tableCssHandle.tableFixAdd();
        }else if(scrollTop<=318 && queryOpt.defOpt.BUSS_TYPE !== 'EBT_A'){
            tableCssHandle.tableFixRemove();
        }
    }
    //table样式表操作
    var tableCssHandle = {
        tableFixAdd:function () {
            $(".fund_data .table_head").addClass("table_fix");
            $(".fund_data .table2_mian").addClass("table2_fix");
        },
        tableFixRemove:function () {
            $(".fund_data .table_head").removeClass("table_fix");
            $(".fund_data .table2_mian").removeClass("table2_fix");
        }
    }
})();