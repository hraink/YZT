/**
 * Created by xudong.Cai on 2017/2/13.
 */
;(function () {
    var refreshHQTimeout = true; //启动及关闭
    var DSQ;
    var stockDataList = [];
    $(function(){
        initDateSelAndSvg();
        //绑定定时刷新行情
        bindHQRefresh();
    });
    //绑定定时刷新行情数据
    function bindHQRefresh() {
        var stockDomList = $('.about_info a');
        if (!stockDomList && stockDomList.length === 0){
            return;
        }
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
                $('.stock-id-'+obj.sCode+' #xj').html('--').attr('class',hq.rHQ||'middle');
                $('.stock-id-'+obj.sCode+' #zdf').html('--').attr('class',hq.rHQ||'middle');
            }else {
                $('.stock-id-'+obj.sCode+' #xj').html(parseFloat(obj.hqData.fNowPrice).toFixed(2)).attr('class',hq.rHQ||'middle');
                $('.stock-id-'+obj.sCode+' #zdf').html(hq.rNum+'%').attr('class',hq.rHQ||'middle');
            }
        }
    }
    //菊花图
    var cache_fdata = null;
    function initDateSelAndSvg(){
        loadSvg("pano_chart");
    }

    function loadSvg(svgName){
        $("#"+svgName).html("");
        var svgWidth = $("#"+svgName).parent().width();
        if(svgWidth > 1215){
            svgWidth = 1215;
        }
        new fChart({conc_url:"iwin://cmd=kline&stockcode=",
            stock_url:"iwin://cmd=kline&stockcode=",
            svgName:svgName,
            w:svgWidth,
            h:500}).init();
    }
    //构图
    function force(option_){

        var width=option_.w,//848,
            height=option_.h,//560,
            padding=3,
            clusterPadding=30,
            //maxRadius=70,
            riseColor='#EC4E4B',
            fallColor='#00AE66',
            zeroColor='#969696';
        //nullColor='#87CEFA';
        var n=60,
            m=6;
        //每个群集父节点
        var parentNodes = new Array(m);

        var color = d3.scale.category10().domain(d3.range(m));

        function creatA(n_,m_){
            var arr=[],a=0;

            for(var i=0;i<n_;i++){
                if(i%m_==0 && i!=0)a++;

                arr.push(a);
            }

            return arr;
        }

        var b= creatA(n,m);
        var c=0;
        var nodes = d3.range(n).map(function() {
            var i = b[c],
                r = (c%m)==0 ? 45:10;
            var d = {
                cluster: i,
                radius: r,
                name:'a',
                zf:'0',
                x: Math.cos(i / m * 2 * Math.PI) * 500 + width/2 + Math.random(),
                y: Math.sin(i / m * 2 * Math.PI) * 500 + height/2  + Math.random()
            };
            if (!parentNodes[i] || (r > parentNodes[i].radius)) parentNodes[i] = d;
            c++;
            return d;
        });

        var node;
        var clickStatus=0;
        var chuc=0;
        function _init(){
            var force = d3.layout.force().nodes(nodes)
                .size([width,height])
                .gravity(0)
                //.linkStrength(0)
                .charge(0);

            var svg = d3.select("#"+option_.svgName).html("").append("svg")
                .attr("width", width)
                .attr("height", height);
            //var drag = force.drag().on("dragstart", dragstart);
            var dragend = force.drag().on("dragend", dragendX)
                .on('dragstart', dragstart);

            var offsetX=0,offsetY=0;
            function dragendX(){
                offsetX-=d3.event.sourceEvent.x;
                offsetY-=d3.event.sourceEvent.y;

                offsetX=Math.abs(offsetX);
                offsetY=Math.abs(offsetY);
            }

            function dragstart(){
                offsetX=d3.event.sourceEvent.x;
                offsetY=d3.event.sourceEvent.y;
            }
            //构建图表和数字
            node = svg.selectAll('g')
                .data(nodes)
                .enter().append("g")
                .style('cursor','pointer')
                .style('display',function (d) {
                    //数据为空的时候不显示
                    if(d.code == '0'){
                        return "none";
                    }
                })
                .on('click',function(d){
                    var url;
                    if(d.code!=null){
                        var _code = $.converHQCodeByD3(d.code);
                        //响应点击事件
                        if(d.type === 2){
                            url=option_.stock_url+_code;
                        }else if(d.type === 1){
                            url=option_.conc_url+_code;
                        }
                        window.location.href = url;
                    }
                });

            node.append('circle')//圆圈背景色
                .style("fill",function(d){
                    // if(d.type==1)console.log(d.zf)
                    //if(d.radius>55) d.radius=44;
                    var c='#1F1F1F';
                    if(d.zf>0 && d.type!==1)c=riseColor;
                    if(d.zf<0 && d.type!==1)c=fallColor;
                    if(d.zf==0 && d.type!==1)c=zeroColor;
                    if(d.zf==null && d.type!==1)c=zeroColor;//外圈背景色
                    return c;
                })
                .style('stroke',function(d){//圆圈外框颜色
                    var c=riseColor;
                    if(d.zf>0) c=riseColor;
                    if(d.zf<0) c=fallColor;
                    if(d.zf==0)c=zeroColor;
                    if(d.zf==null) c=zeroColor;
                    return c;
                });

            node.append('text')
                .attr('alignment-baseline','middle')
                .attr('text-anchor','middle')
                .text(function(d){
                    return d.name;
                })
                .style('font-size',function(d){
                    var size='12px';
                    if(d.type==1)size='12px';
                    return size;
                })
                .style('fill',function(d){
                    var c='#ffffff';//文字颜色
                    if(d.type==1 && d.zf>0) c=riseColor;
                    if(d.type==1 && d.zf<=0) c=fallColor;
                    if(d.type==1 && d.zf==0) c=zeroColor;
                    if(d.type==1 && d.zf==null) c=zeroColor;//内圈文字颜色
                    return c;
                })
                .attr('x',function(d){
                    if(this.getComputedTextLength()>d.radius*2){
                        var top=d.name.substring(0,2);
                        var bot=d.name.substring(2,d.name.length);
                        if (d.type == 1){
                            top=d.name.substring(0,3);
                            bot=d.name.substring(3,d.name.length);
                        }
                        d3.select(this).text(function(){return '';});

                        d3.select(this).append('tspan')
                            .attr('x',0)
                            .attr('y',-5)
                            .text(function(){return top;});

                        d3.select(this).append('tspan')
                            .attr('x',0)
                            .attr('y',10)
                            .text(function(){return bot;});
                        return '';
                    }
                });

            node.interrupt();
            // node.transition()
            //     .duration(0).ease("elastic");
            //     //.delay(function(d, i) { return i * 5; })
            //     // .select('circle')
            //     .attrTween("r", function(d) {
            //         var i = d3.interpolate(0, d.radius);
            //         return function(t) { return d.radius = i(t);
            //         };
            //     });

            force.on('tick',_tick).start();
            force.on('end',function(){
                clickStatus=1;
                chuc=1;
            });
        }

        function _update(){
            //d3.select("#"+option_.svgName).remove();
            document.getElementById("#"+option_.svgName).innerHTML='';
            node=null;

            _init();
        }

        function _tick(e){

            var alpha=50 * e.alpha * e.alpha;
            node.each(function(d){
                var cluster = parentNodes[d.cluster];
                // For cluster nodes, apply custom gravity.
                if (cluster === d) return;

                if(chuc==0){
                    var bab=(d.cluster%2 == 0)? 1:2;
                    var cac= d.cluster>4 ? d.cluster-5:d.cluster;

                    cluster.x=cac*option_.w*9/48 + 160;
                    cluster.y=bab*option_.h/3;
                }

                var x = d.x - cluster.x,
                    y = d.y - cluster.y,
                    l = Math.sqrt(x * x + y * y),
                    r = d.radius + cluster.radius;
                if (l != r) {
                    l = (l - r) / l * alpha;
                    d.x -= x *= l;
                    d.y -= y *= l;
                    cluster.x += x;
                    cluster.y += y;
                }
            })
                .each(function(d){
                    var quadtree = d3.geom.quadtree(nodes);
                    var alpha2=0.5;
                    var r = d.radius + 50 + clusterPadding,
                        nx1 = d.x - r,
                        nx2 = d.x + r,
                        ny1 = d.y - r,
                        ny2 = d.y + r;

                    quadtree.visit(function(quad, x1, y1, x2, y2) {
                        if (quad.point && (quad.point !== d)) {
                            var x = d.x - quad.point.x,
                                y = d.y - quad.point.y,
                                l = Math.sqrt(x * x + y * y),
                                r = d.radius + quad.point.radius + (d.cluster === quad.point.cluster ? padding : clusterPadding);
                            if (l < r) {
                                l = (l - r) / l * alpha2;
                                d.x -= x *= l;
                                d.y -= y *= l;
                                quad.point.x += x;
                                quad.point.y += y;
                            }
                        }
                        return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
                    });
                })
                .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
                .select('circle')
                .attr('r',  function(d) { if(d.name==' ')return 0;return d.radius; });
        }

        this.nodes=nodes;
        this.init=_init;
        this.update=_update;
    }

    //处理数据
    function fChart(option_){
        //最初的时候显示加载图标
        $("#loadingImg").show();

        var _chart=new force(option_);//填充图表数据


        function _update(){
            _init(true);
        }
        function getIndexMax(dataList){
            //求最高热度值
            var hotIndexMax=0;
            for(var a=0;a<dataList.length;a++){
                var index=parseFloat(dataList[a].hotIndex);
                if(hotIndexMax<index){
                    hotIndexMax=index;
                }
            }
            return hotIndexMax;
        }
        function getIndexAvg(dataList){
            //求热度值的平均数
            var hotIndexSum=0;
            var hotIndexAvg=0;
            var hotIndexCount=0;
            for(var a=0;a<dataList.length;a++){
                if(parseFloat(dataList[a].hotIndex)!=0){
                    hotIndexSum+=parseFloat(dataList[a].hotIndex);
                    hotIndexCount++;
                    //console.log("hotIndexSum:"+hotIndexSum);
                }
            }
            hotIndexAvg=hotIndexSum/hotIndexCount;
            return hotIndexAvg;
        }
        function getDivideNum(hotIndexAvg){
            var hotIndexDivide=1;
            if(hotIndexAvg>1000000){
                hotIndexDivide=1000;
            }else if(hotIndexAvg>100000){
                hotIndexDivide=100;
            }else if(hotIndexAvg>10000){
                hotIndexDivide=10;
            }
            return hotIndexDivide;
        }
        function _init(update_){
            $.ajax({
                type: "GET",
                url: "/hot/industry/data?_t="+new Date().getTime(),
                async: true,
                timeout: 3000,
                dataType:'json',
                success:function (fdata) {
                    cache_fdata = cache_fdata;
                    if(fdata && fdata.dataObj && fdata.dataObj.length>0){
                        var indexArray=[0,36,12,48,24,30,6,42,18,54];
                        var hotIndexAvg2=getIndexAvg(fdata.dataObj);//平均热度
                        var hotIndexDivide2=getDivideNum(hotIndexAvg2);//热度压缩比例
                        var hotIndexMax2=getIndexMax(fdata.dataObj);//最高热度
                        var hotIndexAvg=getIndexAvg(fdata.dataObj1);//平均热度
                        var hotIndexDivide=getDivideNum(hotIndexAvg);//热度压缩比例
                        var hotIndexMax=getIndexMax(fdata.dataObj1);//最高热度
                        //加载题材信息
                        for(var i=0;i<fdata.dataObj.length;i++){
                            var obj1=fdata.dataObj[i];
                            var x1=indexArray[i];
                            _chart.nodes[x1].type=1;
                            _chart.nodes[x1].code=obj1.code;
                            _chart.nodes[x1].name   =obj1.name;
                            _chart.nodes[x1].zf	 =obj1.zf;
                            _chart.nodes[x1].hotIndex=obj1.hotIndex;
                            // var radius=Math.abs((obj1.hotIndex/hotIndexDivide2)/(hotIndexMax2/hotIndexDivide2/70));
                            // _chart.nodes[x1].radius=radius;
                            _chart.nodes[x1].radius=28;
                            //题材热度决定圆圈大小
                            if (0<=obj1.hotIndex && obj1.hotIndex<=1000){
                                _chart.nodes[x1].radius=28
                            }else if (1000<obj1.hotIndex && obj1.hotIndex<=3000){
                                _chart.nodes[x1].radius=34
                            }else if (3000<obj1.hotIndex && obj1.hotIndex<=5000){
                                _chart.nodes[x1].radius=39
                            }else if (5000<obj1.hotIndex){
                                _chart.nodes[x1].radius=45
                            }
                            // console.log('题材热度',obj1.hotIndex)
                            // if(radius>70){
                            //     _chart.nodes[x1].radius=90;
                            // }else if(radius<50){
                            //     _chart.nodes[x1].radius=50;
                            // }
                            //console.log(obj1.name+"-----"+i*6);
                            //console.log(Math.abs(param) +"----"+_chart.nodes[i*6].radius);
                            //_chart.nodes[i*6].stockNum=concInfo.num;//个股个数,暂时用不到
                            //console.log("题材--"+x1);
                            //加载个股信息
                            var j=0;
                            var x2=x1;
                            for(var k=i*5;k<i*5+5;k++){
                                if(k%5 == 0){
                                    j++;
                                }
                                x2++;
                                var obj2=fdata.dataObj1[k];
                                _chart.nodes[x2].type= 2;
                                _chart.nodes[x2].code= obj2.code;
                                _chart.nodes[x2].name  = obj2.name;
                                _chart.nodes[x2].zf	= obj2.zf;
                                _chart.nodes[x2].hotIndex= obj2.hotIndex;
                                // var radius=Math.abs((obj2.hotIndex/hotIndexDivide)/(hotIndexMax/hotIndexDivide/44));
                                // _chart.nodes[x2].radius= radius;
                                _chart.nodes[x2].radius= 18;
                                //console.log(obj2.name+"-----"+k+j);
                                //console.log(hotIndexDivide+"------"+obj2.hotIndex+"-------"+radius);
                                //个股热度决定圆圈大小
                                // console.log("个股热度",radius)
                                if (0<=obj2.hotIndex && obj2.hotIndex<=1000){
                                    _chart.nodes[x2].radius=18
                                }else if (1000<obj2.hotIndex && obj2.hotIndex<=3000){
                                    _chart.nodes[x2].radius=23
                                }else if (3000<obj2.hotIndex && obj2.hotIndex<=5000){
                                    _chart.nodes[x2].radius=28
                                }else if (5000<obj2.hotIndex){
                                    _chart.nodes[x2].radius=33
                                }
                                // if(radius>44){
                                //     _chart.nodes[x2].radius= 44;
                                // }else if(radius<20 && radius>0){
                                //     //if(hotIndexDivide>1 && hotIndexMax/hotIndexDivide<)
                                //     _chart.nodes[x2].radius= 20;
                                // }
                                //console.log("个股--"+x2);
                                //console.log(obj2.name+"----"+Math.abs(param) +"----"+_chart.nodes[k+j].radius);
                            }
                        }
                        //console.log(_chart);
                        update_?_chart.update():_chart.init();
                    }else{
                        $("#"+option_.svgName).html("<p style='padding-left: 550px;padding-top: 100px;'>-暂无数据-</p>");
                    }
                    //隐藏加载图标
                    $("#loadingImg").hide();
                    return;
                },
                error:function(XMLHttpRequest, textStatus, errorThrown) {
                    if(textStatus == 'timeout') {
                        console.log("操作请求已经超时");
                    } else {
                        console.log("其他错误。",textStatus);
                    }
                }
            });
        }

        this.init=_init;
        this.update=_update;
    }
})();