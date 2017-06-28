var Taf = require("@taf/taf-rpc").Communicator.New();
var Strategy = require("./StrategyServerProxy.js").Strategy;
var servant = 'AI.StrategyServer.StrategyServerObj';
if (!process.env.TAF_CONFIG) {
    servant += "@tcp -h 127.0.0.1 -p 14009 -t 60000";
    //servant += "@tcp -h 172.16.8.146 -t 60000 -p 10021";
}

var prx = Taf.stringToProxy(Strategy.StrategyInterfProxy, servant);
var startT = new Date().getTime();
//核心金股池
//prx.getPerfectStock().then(function(ret){
//
//       if(ret.response.return==0){
//           var rsp = ret.response.arguments.topStockRsp;
//           console.log(rsp.iRet,rsp.iMsg);
//           console.log(rsp.topStockList);
//       }else{
//            console.log('error return=',ret.response.return)
//         }
//       var startE = new Date().getTime();
//       console.log('times-------------',startE-startT);
//
//    },
//    function(err){
//        console.log('### error ###',err);
//    }
//);

//精品策略
//prx.getTopStgyInfoList().then(function(ret){
//
//       if(ret.response.return==0){
//           var rsp = ret.response.arguments.stgyInfoRsp;
//           console.log(rsp.iRet,rsp.iMsg);
//           console.log(rsp.stgyInfoList);
//       }else{
//           console.log('error return=',ret.response.return)
//       }
//       var startE = new Date().getTime();
//       console.log('times-------------',startE-startT);
//
//    },
//    function(err){
//        console.log('### error ###',err);
//    }
//);


//分类获取策略
//prx.getStgyInfoList(Strategy.StgyCategory.Recommend).then(function(ret){
//
//       if(ret.response.return==0){
//           var rsp = ret.response.arguments.stgyInfoRsp;
//           console.log(rsp.iRet,rsp.iMsg);
//           console.log(rsp.stgyInfoList);
//       }else{
//           console.log('error return=',ret.response.return)
//       }
//       var startE = new Date().getTime();
//       console.log('times-------------',startE-startT);
//
//    },
//    function(err){
//        console.log('### error ###',err);
//    }
//);

//获取每日入选股票
//var chooseStockReq = new Strategy.ChooseStockReq();
//chooseStockReq.stgyCode='价值龙头';
//chooseStockReq.chooseDate='20150804';
//prx.getChooseStock(chooseStockReq).then(function(ret){
//
//       if(ret.response.return==0){
//           var rsp = ret.response.arguments.chooseStockRsp;
//           console.log(rsp.iRet,rsp.iMsg);
//           console.log(rsp.chooseStockList);
//       }else{
//           console.log('error return=',ret.response.return)
//       }
//       var startE = new Date().getTime();
//       console.log('times-------------',startE-startT);
//
//    },
//    function(err){
//        console.log('### error ###',err);
//    }
//);

//获取近期战绩
//prx.getTopStock('价值龙头').then(function(ret){
//
//       if(ret.response.return==0){
//           var rsp = ret.response.arguments.topStockRsp;
//           console.log(rsp.iRet,rsp.iMsg);
//           console.log(rsp.topStockList);
//       }else{
//           console.log('error return=',ret.response.return)
//       }
//       var startE = new Date().getTime();
//       console.log('times-------------',startE-startT);
//
//    },
//    function(err){
//        console.log('### error ###',err);
//    }
//);

//获取最优策略战绩
//prx.getOptiStock().then(function(ret){
//
//       if(ret.response.return==0){
//           var rsp = ret.response.arguments.optiStockRsp;
//           console.log(rsp.iRet,rsp.iMsg);
//           console.log(rsp.optiStockList);
//       }else{
//           console.log('error return=',ret.response.return)
//       }
//       var startE = new Date().getTime();
//       console.log('times-------------',startE-startT);
//
//    },
//    function(err){
//        console.log('### error ###',err);
//    }
//);

//获取 明星股 潜力股
//var stockStarReq = new Strategy.StockStarReq();
//stockStarReq.type=2;
//prx.getStockStar(stockStarReq).then(function(ret){
//
//        if(ret.response.return==0){
//            var rsp = ret.response.arguments.stRsp;
//            console.log(rsp.iRet,rsp.iMsg);
//            console.log(rsp.stockStarList);
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

//获取 智能诊股-详情
var stockDiagnosisReq = new Strategy.StockDiagnosisReq();
stockDiagnosisReq.market=0
stockDiagnosisReq.code='000001';
prx.getStockDiagnosis(stockDiagnosisReq).then(function(ret){

        if(ret.response.return==0){
            var rsp = ret.response.arguments.stRsp;
            console.log(rsp.iRet,rsp.iMsg);
            console.log(rsp);
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