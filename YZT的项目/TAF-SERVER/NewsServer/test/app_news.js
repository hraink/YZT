var Taf = require("@taf/taf-rpc").Communicator.New();
Taf.setProperty('timeout',5000);
var News = require("./NewsServerProxy.js").News;
var servant = 'AI.NewsServer.NewsServerObj';
var moment    = require('moment');
if (!process.env.TAF_CONFIG) {
    //servant += "@tcp -h 127.0.0.1 -p 14009 -t 60000";
    servant += "@tcp -h 172.16.8.185 -t 60000 -p 10014";
}

var prx = Taf.stringToProxy(News.NewsInterfProxy, servant);
var startT = new Date().getTime();


////���̷����
prx.getMarketVane().then(function(ret){

       if(ret.response.return==0){
           var rsp = ret.response.arguments.marketVaneRsp;
           console.log(rsp.iRet,rsp.iMsg);
           console.log(rsp.marketVaneList);
       }else{
            console.log('error return=',ret.response.return)
         }
       var startE = new Date().getTime();
       console.log('times-------------',startE-startT);

    },
    function(err){
        console.log('### error ###',err);
    }
);

//�����ȵ� ���
//var subJectsReq = new News.SubJectsReq();
//subJectsReq.sortType=News.SUB_SORT_TYPE.HOT_SUB;
//prx.getSubJects(subJectsReq).then(function(ret){
//        if(ret.response.return==0){
//            var rsp = ret.response.arguments.stRsp;
//            console.log(rsp.iRet,rsp.iMsg);
//            console.log(rsp.subJectList.value);
//        }else{
//            console.log('error return=',ret.response.return)
//        }
//        var startE = new Date().getTime();
//        console.log('times-------------',startE-startT);
//
//    },
//    function(err){
//        console.log('### error ###',err);
//    }
//);


//������� ����ͼ����
//prx.getSubJectsChart().then(function(ret){
//        if(ret.response.return==0){
//            var rsp = ret.response.arguments.stRsp;
//            console.log(rsp.iRet,rsp.iMsg);
//            console.log(rsp.dataJsonStr);
//        }else{
//            console.log('error return=',ret.response.return)
//        }
//        var startE = new Date().getTime();
//        console.log('times-------------',startE-startT);
//
//    },
//    function(err){
//        console.log('### error ###',err);
//    }
//);

//����������
//var lhbNewsReq = new News.LhbNewsReq();
//lhbNewsReq.type=1;
//prx.getLhbNews(lhbNewsReq).then(function(ret){
//        if(ret.response.return==0){
//            var rsp = ret.response.arguments.stRsp;
//            console.log(rsp.iRet,rsp.iMsg);
//             console.log(rsp.lhbNewsList)
//        }else{
//            console.log('error return=',ret.response.return)
//        }
//        var startE = new Date().getTime();
//        console.log('times-------------',startE-startT);
//
//    },
//    function(err){
//        console.log('### error ###',err);
//    }
//);


var lhbHistoryReq = new News.LhbHistoryReq();
let startDate = moment().subtract('30', 'days').format('YYYY-MM-DD');
let endDate = moment().subtract('1', 'days').format('YYYY-MM-DD');
console.log(startDate,endDate);
lhbHistoryReq.startDate=startDate;
lhbHistoryReq.endDate=endDate;
lhbHistoryReq.wantNum=20;

lhbHistoryReq.offset=0;  //��һҳ offset=0  ����ҳ offset=1
//�ڶ�ҳ��ʼ����
//lhbHistoryReq.beginTime='1474959600000'; //ȡ��һҳ���ص� beginTime
//lhbHistoryReq.lastNewsTime='1481680822000'; //ȡ��һҳ���һ�����ŵ�update_time ת��Ϊ�����ʱ���
//
//prx.getLhbHistory(lhbHistoryReq).then(function(ret){
//        if(ret.response.return==0){
//            var rsp = ret.response.arguments.stRsp;
//            console.log(rsp.iRet,rsp.iMsg);
//            console.log(rsp.tradeStatus)
//            console.log(rsp.hasNext)
//            console.log(rsp.beginTime)
//            console.log(rsp.total)
//            //console.log(rsp.lhbNewsList)
//        }else{
//            console.log('error return=',ret.response.return)
//        }
//        var startE = new Date().getTime();
//        console.log('times-------------',startE-startT);
//
//    },
//    function(err){
//        console.log('### error ###',err);
//    }
//);

//ÿ���ȹ�
//prx.getHotDayStock().then(function(ret){
//        if(ret.response.return==0){
//            var rsp = ret.response.arguments.stRsp;
//             console.log(rsp.iRet,rsp.iMsg);
//            console.log(rsp.hotDayList.value[0].hot);
//             console.log(rsp.hotDayList.value[0].hotChartList)
//        }else{
//            console.log('error return=',ret.response.return)
//        }
//        var startE = new Date().getTime();
//        console.log('times-------------',startE-startT);
//
//    },
//    function(err){
//        console.log('### error ###',err);
//    }
//);


//��ȡ�������������� ����ǰ��
//prx.getTopLhbNews().then(function(ret){
//        if(ret.response.return==0){
//            var rsp = ret.response.arguments.stRsp;
//            console.log(rsp.iRet,rsp.iMsg);
//             console.log(rsp.lhbNewsListLD)
//        }else{
//            console.log('error return=',ret.response.return)
//        }
//        var startE = new Date().getTime();
//        console.log('times-------------',startE-startT);
//
//    },
//    function(err){
//        console.log('### error ###',err);
//    }
//);


//ÿ���ȹ�
//prx.getHotWeekStock().then(function(ret){
//        if(ret.response.return==0){
//            var rsp = ret.response.arguments.stRsp;
//             console.log(rsp.iRet,rsp.iMsg);
//             console.log(rsp.hotWeekList)
//        }else{
//            console.log('error return=',ret.response.return)
//        }
//        var startE = new Date().getTime();
//        console.log('times-------------',startE-startT);
//
//    },
//    function(err){
//        console.log('### error ###',err);
//    }
//);

//ÿ���ȹ���ʷ
//var weekHistoryReq = new News.WeekHistoryReq();
//weekHistoryReq.startNum=0;
//weekHistoryReq.wantNum=10;
//prx.getWeekHistoryStock(weekHistoryReq).then(function(ret){
//        if(ret.response.return==0){
//            var rsp = ret.response.arguments.stRsp;
//             console.log(rsp.iRet,rsp.iMsg);
//             console.log(rsp.weekHistoryList.value);
//        }else{
//            console.log('error return=',ret.response.return)
//        }
//        var startE = new Date().getTime();
//        console.log('times-------------',startE-startT);
//
//    },
//    function(err){
//        console.log('### error ###',err);
//    }
//);

