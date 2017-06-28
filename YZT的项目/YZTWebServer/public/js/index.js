/**
 * Created by xudong.Cai on 2017/2/24.
 */
;(function () {
    //轮播
    var swiper = new Swiper('.swiper-container', {
        pagination: '.swiper-pagination',
        paginationClickable: '.swiper-pagination',
        autoplayDisableOnInteraction: false,
        // autoplay:3000,
        // loop: true,
        speed:500,
    });
    //echarts涨跌样式
    var echartsZD = {
        labelBottom : {
            normal : {
                color: '#242424',
                label : {
                    show : false,
                    position : 'top'
                },
                labelLine : {
                    show : false
                }
            }
        },
        labelRed : {
            normal : {
                color: '#ff5b5b',
                label : {
                    show : true,
                    position : 'center',
                    formatter : function (params){
                        return parseFloat(params.value).toFixed(2) + '%'
                    },
                    textStyle : {
                        color:'#ff5b5b',
                        fontSize : '14',
                        fontWeight : 'bold'
                    }
                },
                labelLine : {
                    show : false
                }
            }
        },
        labelGreen : {
            normal : {
                color: 'RGBA(46,144,3,3)',
                label : {
                    show : true,
                    position : 'center',
                    formatter : function (params){
                        return parseFloat(params.value).toFixed(2) + '%'
                    },
                    textStyle : {
                        color:'RGBA(46,144,3,3)',
                        fontSize : '14',
                        fontWeight : 'bold'
                    }
                },
                labelLine : {
                    show : false
                }
            },
            emphasis : {
                color: 'rgba(0,0,0,0)'
            }
        }
    }
    var refreshHQTimeout = true; //启动及关闭
    var DSQ;
    var stockDataList = [];
    $(function() {
        $('.searchUl').jScrollPane();
        new Vue({
            el: '#big_data',
            methods: {
                handleSelect: function (item) {
                    var market = (item.secMarPar-1) < 0 ? 0 :(item.secMarPar-1);//0:深圳 1：上海
                    window.location.href = '/diagnose/stock?code='+item.stkCode+'&market='+market;
                }
            }
        });
        //计算波动区间
        for(var i = 1;i <= $('.progress_box').length;i++){
            progressArea(i);
            var upprob = $('#risk_chart_'+i).data('upprob');
            if (upprob){
                //绘制上涨概率
                var pieChart = echarts.init( document.getElementById('risk_chart_'+i));
                setCharts(pieChart,upprob);
            }
            zncw(i);
        }
        //刷新行情
        bindHQRefresh();
        // $.getHQData(stockDataList,setHQStyle);
        // setTimeout(refreshHQ,10000);
    });
    //智能仓位
    function zncw(positionNum) {
        var positionDom = '.position_'+positionNum+' ';
        var advisePosition =  $( positionDom).data('advise-position');
        var grade = parseFloat(0.3*advisePosition).toFixed(2);  //grade  1-30
        var degree = 0;
        grade = grade < 1 ? 1 : grade;
        if(grade > 15){
            $(positionDom+".meter_box").css("opacity","1");
            $(positionDom+".gray_left").css("display","none");
            $(positionDom+".gray_right").css("display","none");
            degree = (grade -15)*6;
            $(positionDom+".gray").css("transform",`rotate(${degree}deg)`);
        }else if(grade <= 15){
            $(positionDom+".meter_box").css("opacity","1");
            $(positionDom+".gray_left").css("display","none");
            $(positionDom+".gray_right").css("display","block");
            degree = -(5*8 + (8 - grade)*6)
            $(positionDom+".gray").css("transform",`rotate(${degree}deg)`);
        }
    }
    //绑定定时刷新行情数据
    function bindHQRefresh() {
        var stockDomList = $('.hqObj');
        for(var i = 0;i < stockDomList.length; i++){
            var obj = $(stockDomList[i]);
            var stockData = {
                shtSetcode:obj.data('market'),
                sCode:obj.data('code').toString()
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
            DSQ = setTimeout(refreshHQ,10000);
            return;
        }
        //刷新行情
        $.getHQData(stockDataList,setHQStyle);
        DSQ = setTimeout(refreshHQ,10000); //10秒刷新一次
    }
    //设置行情样式
    function setHQStyle(data) {
        if (!data || data.length === 0){
            return;
        }
        for(var i in data){
            var obj = data[i];
            var hq = $.converHQFormat(obj.hqData.fChgRatio);
            $('.hqObj-'+obj.sCode).removeClass('height middle low').addClass(hq.rHQ||'middle');
            if (obj.transactionStatus == '80'){
                $('.hqObj-'+obj.sCode+' #hq_xj').html('--');
                $('.hqObj-'+obj.sCode+' #hq_zdf').html('--');
            }else {
                $('.hqObj-'+obj.sCode+' #hq_xj').html(parseFloat(obj.hqData.fNowPrice).toFixed(2));
                $('.hqObj-'+obj.sCode+' #hq_zdf').html(hq.rNum+'%');
            }
            $('.hqObj-'+obj.sCode+' #hq_name').html(obj.sName);
            $('.hqObj-'+obj.sCode+' #hq_zde').html(parseFloat(obj.hqData.fChgValue).toFixed(2));
        }
    }
    //设置图形
    function setCharts(pieChart,upprob) {
        pieChart.setOption({
            //backgroundColor:'', //图片背景色
            legend: {
                show:false,
                x : 'center',
                y : 'center',
                data:[]
            },
            animation:false,
            series : [
                {
                    type : 'pie',
                    silent:true,//不响应和触发鼠标事件
                    center : ['50%', '50%'],//圆心坐标（div中的%比例）
                    radius : [30, 35],//半径
                    minAngle:0,//最小角度，可用于防止某item的值过小而影响交互
                    startAngle:90,//开始角度, 饼图（90）、仪表盘（225），有效输入范围：[-360,360]
                    x: '0%', // for funnel
                    itemStyle :upprob>=50?echartsZD.labelRed:echartsZD.labelGreen,
                    data : [
                        {name:'', value:upprob},
                        {name:'', value:100-upprob,itemStyle : echartsZD.labelBottom}
                    ]
                }
            ]
        });
    }
    // 波动区间
    function progressArea(index) {
        var low= $(".progress_box_"+index+" .left_price").text();
        var high= $(".progress_box_"+index+" .right_price").text();
        var pointer = $(".progress_box_"+index+" .progress .pointer");
        var left = $(".progress_box_"+index+" .low");
        var right = $(".progress_box_"+index+" .height");
        progress(low,high,pointer,left,right);
    }
    function progress(low,high,pointer,left,right){
        var poin =$(pointer).text();
        var difference1 = parseFloat(high - low);
        var difference2 = parseFloat(poin - low);
        var difference_green = parseInt((difference2 / difference1) * 100) + '%';
        var difference_red =100 - parseInt((difference2 / difference1) * 100) + '%';
        var poin_num = (parseInt((difference2 / difference1) * 100)) + '%';
        left.css("width",difference_green);
        right.css("width",difference_red);
        pointer.css("left",poin_num);
    }
})();