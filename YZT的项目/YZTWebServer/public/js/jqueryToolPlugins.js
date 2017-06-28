/**
 * 常用工具类插件
 * 作者：蔡旭东
 * 版本：1.0
 */
(function($, window, document, undefined) {
  $.extend({
    /* Cookie的相关操作 */
    setCookie: function(key, val, time) {
      //设置cookie方法
      var date = new Date(); //获取当前时间
      var expiresDays = time; //将date设置为n天以后的时间
      date.setTime(date.getTime() + expiresDays * 24 * 3600 * 1000); //格式化为cookie识别的时间
      document.cookie =
        key +
        "=" +
        encodeURI(val) +
        ";expires=" +
        date.toGMTString() +
        ";path=/"; //设置cookie
    },
    getCookie: function(key) {
      //获取cookie方法
      /*获取cookie参数*/
      var getCookie = document.cookie.replace(/[ ]/g, ""); //获取cookie，并且将获得的cookie格式化，去掉空格字符
      var arrCookie = getCookie.split(";"); //将获得的cookie以"分号"为标识 将cookie保存到arrCookie的数组中
      var tips; //声明变量tips
      for (var i = 0; i < arrCookie.length; i++) {
        //使用for循环查找cookie中的tips变量
        var arr = arrCookie[i].split("="); //将单条cookie用"等号"为标识，将单条cookie保存为arr数组
        if (key == arr[0]) {
          //匹配变量名称，其中arr[0]是指的cookie名称，如果该条变量为tips则执行判断语句中的赋值操作
          tips = arr[1]; //将cookie的值赋给变量tips
          break; //终止for循环遍历
        }
      }
      return decodeURI(tips);
    },
    deleteCookie: function(key) {
      //删除cookie方法
      var date = new Date(); //获取当前时间
      date.setTime(date.getTime() - 10000); //将date设置为过去的时间
      document.cookie = key + "=v; expires =" + date.toGMTString() + ";path=/"; //设置cookie
    },
    /**单位换算,保留2位小数
         * @param num
         * @returns {*}
         */
    converBigNumFormat: function(num) {
      var res = {
        rNum: "0.00",
        rHQ: ""
      };
      if (isNaN(num) || num == 0) {
        return res;
      }
      if (parseFloat(num) > 0) {
        res.rHQ = "height";
      } else if (parseFloat(num) < 0) {
        res.rHQ = "low";
      }
      var wNum = (num / 10000).toFixed(2);
      var eNum = (num / 100000000).toFixed(2);
      if (Math.abs(num) >= 10000 && Math.abs(num) < 100000000) {
        res.rNum = wNum + "万";
        return res;
      } else if (Math.abs(num) >= 100000000) {
        res.rNum = eNum + "亿";
        return res;
      } else {
        res.rNum = Number(num).toFixed(2);
        return res;
      }
    },
    //百分比
    converHQFormat: function(num) {
      var res = {
        rNum: Number(num).toFixed(2),
        rHQ: ""
      };
      if (num > 0) {
        res.rHQ = "height";
      } else if (num < 0) {
        res.rHQ = "low";
      } else {
        res.rHQ = "";
      }
      return res;
    },
    /**
         * 转换行情代码
         * 市场 0：上海 1：深圳
         */
    converHQCodeByMarketCode: function(market, code) {
      return "0" + market + code;
    },
    //检查是否在刷新时间段 true 可以刷新
    isRefreshDate: function() {
      var date = new Date();
      //上午9点到12点刷新 下午13到16点刷新
      // if ((date.getHours() >= 9 && date.getHours() < 12) || (date.getHours() >= 13 && date.getHours() < 15)){
      return true;
      // }
      return false;
    },
    /**
         * 转换d3图表里的股票代码
         * @param code
         */
    converHQCodeByD3: function(code) {
      var market = code.substring(0, 2);
      var stokcode = code.substring(4, 10);
      var sc = "SZ";
      if (market == "01") {
        //00：深圳，01沪A
        sc = "SH"; //上海
      }
      sc += stokcode;
      return sc;
    },
    /**
         * 获取行情数据
         * @param data  股票市场 股票代码
         * @param func  回调函数
         */
    getHQData: function(data, func) {
      if (!data || data.length === 0) {
        return;
      }
      $.ajax({
        type: "POST",
        url: "/hq/sim?_t=" + new Date().getTime(),
        data: { socketData: JSON.stringify(data) },
        async: true,
        timeout: 3000,
        dataType: "json",
        success: function(data) {
          func(data);
          return;
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
          if (textStatus == "timeout") {
            console.log("【获取行情数据】操作请求已经超时");
          } else {
            console.log("【获取行情数据】其他错误。", textStatus);
          }
          func(null);
        }
      });
    },
    /**
         * PC客户端打开股票行情页
         * @param market
         * @param code
         */
    openStockHQ: function() {
      $(".main")
        .off("click", ".open_stock")
        .on("click", ".open_stock", function(e) {
          var _this = this;

          // jquery的data不能用于动态改变的节点
          //   getOpenStockHQURL(

          //     $(_this).data("stock-market"),

          //     $(_this).data("stock-code")

          //   );
          console.log(e.target.dataset.stockMarket, e.target.dataset.stockCode);
          getOpenStockHQURL(
            e.target.dataset.stockMarket,
            e.target.dataset.stockCode
          );
        });
    }
  });

  //分页插件
  var ms = {
    init: function(obj, args) {
      return (function() {
        ms.fillHtml(obj, args);
        ms.bindEvent(obj, args);
      })();
    },
    //填充html
    fillHtml: function(obj, args) {
      return (function() {
        obj.empty();
        //上一页
        if (args.current > 1) {
          obj.append('<div class="btn_prev prevPage">上一页</div>');
        } else {
          obj.remove(".prevPage");
          obj.append('<div class="btn_prev btn_disabled">上一页</div>');
        }
        //中间页码
        if (args.current != 1 && args.current >= 4 && args.pageCount != 4) {
          obj.append('<div class="pageindex pagenum">' + 1 + "</div>");
        }
        if (
          args.current - 1 > 1 &&
          args.current <= args.pageCount &&
          args.pageCount >= 5
        ) {
          obj.append('<div class="pageindex ellipses" >...</div>');
        }
        var start = args.current - 1, end = args.current + 1;
        if ((start > 1 && args.current < 4) || args.current == 1) {
          end++;
        }
        if (
          args.current > args.pageCount - 4 && args.current >= args.pageCount
        ) {
          start--;
        }
        for (; start <= end; start++) {
          if (start <= args.pageCount && start >= 1) {
            if (start != args.current) {
              obj.append('<div class="pageindex pagenum">' + start + "</div>");
            } else {
              obj.append(
                '<div class="pageindex in active">' + start + "</div>"
              );
            }
          }
        }
        if (
          args.current + 1 < args.pageCount - 1 &&
          args.current >= 1 &&
          args.pageCount >= 5
        ) {
          obj.append('<div class="pageindex ellipses">...</div>');
        }
        if (
          args.current != args.pageCount &&
          args.current < args.pageCount - 2 &&
          args.pageCount != 4
        ) {
          obj.append(
            '<div class="pageindex pagenum">' + args.pageCount + "</a>"
          );
        }
        //下一页
        if (args.current < args.pageCount) {
          obj.append('<div class="btn_next nextPage">下一页</div>');
        } else {
          obj.remove(".nextPage");
          obj.append('<div class="btn_next btn_disabled">下一页</div>');
        }
      })();
    },
    //绑定事件
    bindEvent: function(obj, args) {
      return (function() {
        obj.off("click"); //解除绑定事件，避免再次绑定
        obj.on("click", "div.pagenum", function() {
          var current = parseInt($(this).text());
          ms.fillHtml(obj, { current: current, pageCount: args.pageCount });
          if (typeof args.backFn == "function") {
            args.backFn(current);
          }
        });
        //上一页
        obj.on("click", "div.prevPage", function() {
          var current = parseInt(obj.children("div.in").text());
          ms.fillHtml(obj, { current: current - 1, pageCount: args.pageCount });
          if (typeof args.backFn == "function") {
            args.backFn(current - 1);
          }
        });
        //下一页
        obj.on("click", "div.nextPage", function() {
          var current = parseInt(obj.children("div.in").text());
          ms.fillHtml(obj, { current: current + 1, pageCount: args.pageCount });
          if (typeof args.backFn == "function") {
            args.backFn(current + 1);
          }
        });
      })();
    }
  };
  $.fn.createPage = function(options) {
    var args = $.extend(
      {
        pageCount: 10,
        current: 1,
        backFn: function() {}
      },
      options
    );
    ms.init(this, args);
  };

  /**
     * 获取打开股票行情地址
     * @param market
     * @param code
     */
  function getOpenStockHQURL(market, code) {
    //市场和代码一体
    if (market.length === 10 && market === code) {
      code = market.slice(4, 10);
      market = Number(market.slice(0, 2));
    }
    var sc = "SZ";
    if (market == "1") {
      sc = "SH";
    }
    sc += code;
    window.location.href = "iwin://cmd=kline&stockcode=" + sc;
  }

  $(document).ready(function() {
    $.openStockHQ();
  });
})(jQuery, window, document);
