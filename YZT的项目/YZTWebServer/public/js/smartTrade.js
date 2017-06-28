/**
 * Created by nanshi on 2017/2/20.
 */
$(function () {
  // 高亮字符串中的关键字
  function highlightKeyword(str, key) {
    return str.replace(key, '<span class="searchLi_keyWords">' + key + '<\/span>')
  }

  var app = {
    init: function () {
      this.initSearchBar()
      this.initDataTable()
    },
    initSearchBar: function () {
      new Vue({
        el: '#searchWrap',
        data: {
          code: '',
          market: ''
        },
        methods: {
          handleSelect: function (item) {
            app.openPopup({
              stockCode: item.stkCode,
              stockMarket: item.secMarPar - 1,
              stockName: item.stkShortName
            })
          }
        }
      })
    },
    openPopup: function(stock) {
      
      var market = '0' + stock.stockMarket
      var code = stock.stockCode
      var url = 'http://stgy.upchinapro.com/stg/stgy.html?'

      url += $.param({
        code: code,
        setcode: market,
        paystate: 1
      })

      $('.pop_title p').html(stock.stockName + '(' + stock.stockCode + ')')
      $('#pop_frm').attr('src', url)
      $('.pop_box').show()
      $('.btn_colse').one('click', function(e) {
        $('.pop_box').hide()
      })
    },
    initDataTable: function () {

      var dataTableVm = new Vue({
        el: '#data-table',
        data: function () {
          return {list: window.optiStockList}
        },
        filters: {
          percent: function(n) {
            return n.toFixed(2) + '%'
          }
        },
        methods: {
          // 伪代码，需要替换成客户端接口
          toggle: function (code, bool) {
            for (var i = 0; i < this.list.length; i++) {
              var item = this.list[i]
              if (item.stockCode === code) {
                item.optioned = bool

                Vue.set(this.list, i, item)
                break
              }
            }
          },
          // 添加自选
          addToOptional: function (code) {
            this.toggle(code, true)
          },
          // 删除自选
          removeFromOptional: function (code) {
            this.toggle(code, false)
          },
          // 最优策略弹框
          redirect: function (stock) {
            app.openPopup({
              stockCode: stock.stockCode,
              stockMarket: stock.market,
              stockName: stock.stockName
            })
          }
        }
      })
    }
  }

  app.init()
})