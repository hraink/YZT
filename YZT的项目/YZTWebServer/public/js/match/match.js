$(function () {
  var app = {
    init: function () {
      this.initMarket()
      this.initHotStock()
      this.initHotIndex()
      this.initChanceList()
      this.initSearch()
    },
    initSearch: function() {
      new Vue({
        el: '#searchWrap',
        data: {
          code: '',
          market: ''
        },
        methods: {
          handleSelect: function (item) {
            var form = this.$el.querySelector('form')

            this.code = item.stkCode
            this.market = item.secMarPar - 1

            this.$nextTick(function() {
              form.submit()
            })
          }
        }
      })
    },
    // 顶部大盘
    initMarket: function () {
      var marketVm = new Vue({
        el: '#market',
        data: function () {
          var marketData = window.pageData.strReq.slice(0)

          marketData.forEach(function (item) {
            item.ceil = item.ceil / 1e4
            item.flor = item.flor / 1e4
            item.profit = item.profit / 1e4
          })

          return {
            marketData: window.pageData.strReq
          }
        },
        mounted: function () {
          var vm = this
          $('.forecast_graph_wrap').each(function (index, element) {
            renderChart(vm.marketData[index], element, 261, 132)
          })
        },
        filters: {
          percent: function (n) {
            var ret = n * 100

            ret = ret.toFixed(2)
            ret += '%'

            return ret
          }
        }
      })
    },
    // 轮播组件
    createSwipeVm: function (id, dataSource) {
      var hotStockVm = new Vue({
        el: id,
        data: function () {
          var stockData = dataSource.slice(0)

          stockData.forEach(function (item) {
            item.ceil = item.ceil / 1e4
            item.flor = item.flor / 1e4
            item.profit = item.profit / 1e4
          })

          return {
            stockData: stockData,
            currStock: stockData[0]
          }
        },
        mounted: function () {
          var vm = this

          var containerElement = vm.$el.querySelector('.swiper-container')
          var paginationElement = vm.$el.querySelector('.swiper-pagination')
          var nextElement = vm.$el.querySelector('.swiper-button-next')
          var prevElement = vm.$el.querySelector('.swiper-button-prev')

          vm.$nextTick(function () {
            // 初始化轮播
            var swiper = new Swiper(containerElement, {
              pagination: paginationElement,
              paginationClickable: paginationElement,
              nextButton: nextElement,
              prevButton: prevElement,
              autoplayDisableOnInteraction: true,
              autoplay: 3000,
              speed: 500,
              onSlideChangeEnd: function (swiper) {
                vm.currStock = vm.stockData[swiper.realIndex]
              },
              onInit: function () {
                // 绘制K图
                var width = containerElement.offsetWidth - 2
                var height = containerElement.offsetHeight

                var els = vm.$el.querySelectorAll('.swiper-slide')
                for (var i = 0, j = els.length; i < j; i++) {
                  renderChart(vm.stockData[i], els[i], width, height)
                }
              }
            })
          })
        }
      })
    },
    initHotStock: function () {
      this.createSwipeVm('#hot_stocks', window.pageData.strReqHot)
    },
    initHotIndex: function () {
      this.createSwipeVm('#hot_market_index', window.pageData.strReqIndex)
    },
    // 底部组件
    initBottomList: function (id, dataSource) {
      new Vue({
        el: id,
        data: function () {
          var data = dataSource.slice(0)

          data.forEach(function (item, index) {
            item.ceil = item.ceil / 1e4
            item.flor = item.flor / 1e4
            item.profit = item.profit / 1e4

            if (index === 0) {
              item.open = true
            } else {
              item.open = false
            }
          })

          return {
            list: data
          }
        },
        methods: {
          toggle: function (index) {
            var newList = this.list.map(function (item, _index) {
              if (index === _index) {
                item.open = !item.open
              } else {
                item.open = false
              }

              return item
            })

            console.log(newList)

            this.list = newList
          }
        },
        mounted: function () {
          if (this.list.length <= 0) return

          // 第一个容器默认展开，绘制图表
          var self = this
          var els = this.$el.querySelectorAll('.shares_graph_info')
          var element = els[0]
          var width = element.offsetWidth
          var height = element.offsetHeight

          renderChart(this.list[0], element, width, height)

          this.list[0].chartRendered = true

          // 当动画播放结束时，如果未绘制图表则绘制
          var addTransitionEndListener = function (elem, index) {
            elem.addEventListener('webkitTransitionEnd', function (e) {
              if (!self.list[index].chartRendered) {
                renderChart(self.list[index], elem.querySelector('.shares_graph_info'), width, height)
                self.list[index].chartRendered = true
              }
            })
          }

          // 绑定动画结束事件
          var graphContainers = this.$el.querySelectorAll('.graph_wrap')

          console.log(graphContainers.length)

          graphContainers = [].slice.call(graphContainers)
          graphContainers.forEach(function (elem, index) {
            addTransitionEndListener(elem, index)
          })
        }
      })
    },
    initChanceList: function () {
      this.initBottomList('#chance_list', window.pageData.strReqTopUp)
      this.initBottomList('#risk_list', window.pageData.strReqTopDown)
    }
  }

  app.init()
})