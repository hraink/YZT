/**
 * Created by shinan on 2017/3/7.
 */
$(function() {
  var isTradeTime = function() {
    var now = new Date()
    var mins = now.getMinutes() + 60 * now.getHours()
    var open = 30 + 9 * 60 // 9:30
    var close = 30 + 11 * 60 // 11:30

    var open2 = 13 * 60 // 13:00
    var close2 = 15 * 60 // 15:00

    if (open < mins && mins < close) {
      return true
    }

    if (open2 < mins && mins < close2) {
      return true
    }

    return false
  }

  var app = {
    registerTopStock: function() {
      Vue.component('top-stock', {
        template: '#top-stock',
        props: ['stocks'],
        data: function() {
          return {
            // 排序字段 0:正序 1:逆序 -1:不排序
            topStockSortStatus: {
              maxRise: 1,
              nextDayRise: -1
            }
          }
        },
        computed: {
          arrow1: function() {
            switch (this.topStockSortStatus.maxRise) {
              case 0: return 'riseting';
              case 1: return 'sorting';
              case -1: return ''
            }

            return ''
          },
          arrow2: function() {
            switch (this.topStockSortStatus.nextDayRise) {
              case 0: return 'riseting';
              case 1: return 'sorting';
              case -1: return ''
            }

            return ''
          }
        },
        mounted: function() {
          var topEl = this.$el.querySelector('.scroll-pane')

          this.$nextTick(function() {
            topEl.querySelector('ul').style.width = topEl.offsetWidth + 'px'
          })
        },
        methods: {
          sortBy: function (fieldName) {
            for (var key in this.topStockSortStatus) {
              if (key != fieldName) {
                this.topStockSortStatus[key] = -1
              }
            }

            if (this.topStockSortStatus[fieldName] == -1) {
              this.topStockSortStatus[fieldName] = 0
            } else {
              this.topStockSortStatus[fieldName] = this.topStockSortStatus[fieldName] ^ 1
            }

            var orderBool = this.topStockSortStatus[fieldName]
            // 根据字段排序
            this.stocks.sort(this.sortFunc(fieldName))
            // 重新赋值 触发ui更新
            this.topStockSortStatus = Object.assign({}, this.topStockSortStatus)
          },
          sortFunc: function(fieldName) {
            var bool = this.topStockSortStatus[fieldName]
            return function(a, b) {
              if (bool === 0) {
                return a[fieldName] - b[fieldName]
              } else if (bool == 1) {
                return b[fieldName] - a[fieldName]
              } else {
                return 0
              }
            }
          }
        }
      })
    },
    registerChooseStock: function() {
      Vue.component('choose-stock', {
        template: '#choose-stock',
        props: ['stocks'],
        data: function() {
          
          return {
            sortStatus: {
              zdf: 1,
              nowPrice: -1
            }
          }
        },
        updated: function() {
          var topEl = this.$el.querySelector('.scroll-pane')
         
          this.$nextTick(function() {
            topEl.querySelector('ul').style.width = topEl.offsetWidth + 'px'
          })
        },
        filters: {
          fix: function(value) {
            if (!value.toFixed) {
              return ''
            }

            return value.toFixed(2)
          }
        },
        computed: {
          arrow1: function() {
            if (this.stocks.length < 1) return ''

            switch (this.sortStatus.zdf) {
              case 0: return 'riseting';
              case 1: return 'sorting';
              case -1: return ''
            }

            return ''
          },
          arrow2: function() {
            if (this.stocks.length < 1) return ''

            switch (this.sortStatus.nowPrice) {
              case 0: return 'riseting';
              case 1: return 'sorting';
              case -1: return ''
            }

            return ''
          }
        },
        methods: {
          sortBy: function (fieldName) {
            if (this.stocks.length < 1) return

            for (var key in this.sortStatus) {
              if (key != fieldName) {
                this.sortStatus[key] = -1
              }
            }

            if (this.sortStatus[fieldName] == -1) {
              this.sortStatus[fieldName] = 0
            } else {
              this.sortStatus[fieldName] = this.sortStatus[fieldName] ^ 1
            }

            var orderBool = this.sortStatus[fieldName]
            // 根据字段排序
            this.stocks.sort(this.sortFunc(fieldName))
            // 重新赋值 触发ui更新
            this.sortStatus = Object.assign({}, this.sortStatus)
          },
          sortFunc: function(fieldName) {
            var bool = this.sortStatus[fieldName]
            return function(a, b) {
              if (bool === 0) {
                return a[fieldName] - b[fieldName]
              } else if (bool == 1) {
                return b[fieldName] - a[fieldName]
              } else {
                return 0
              }
            }
          }
        }
      })
    },
    registerRecord: function() {
      Vue.component('record', {
        template:'#record',
        props: ['stgy'],
        data: function() {
          return {
            chooseDate: this.stgy.newChooseDateFormated,
            pickerOptions: {}
          }
        },
        mounted: function() {
          var vm = this
          var el = this.$el.querySelector('input.date')
          var start = {
            elem: '#' + el.id,
            format: 'YYYY-MM-DD',
            choose: function (date) {
              vm.chooseDate = date
            },
            start: this.chooseDate
          }

          laydate(start)

          // 组件创建时，自动获取最新价格
          if (this.stgy.chooseStock.length > 0) {
            this.startPolling()
          }
        },
        beforeDestroy: function() {
          // 组件销毁时 取消自动获取价格的计时器
          this.stopPolling()
        },
        watch: {
          chooseDate: function() {
            var vm = this

            var pms = $.ajax({
              url: '/strategy/choose',
              data: {
                stgyCode: vm.stgy.stgyCode,
                chooseDate: vm.chooseDate
              }
            })

            pms.done(function(res) {
              Vue.set(vm.stgy, 'chooseStock', res.chooseStock)

              // 返回的选股有数据的话，轮询最新行情
              if (res.chooseStock.length > 0) {
                vm.startPolling()
              } else {
                vm.stopPolling()
              }
            })
            .fail(function() {
              alert('返回错误')
            })
          }
        },
        methods: {
          startPolling() {
            if (this.timer) {
              return
            }

            var vm = this
            vm.timer = null

            function poll() {
              $.ajax({
                url: '/strategy/choose',
                data: {
                  stgyCode: vm.stgy.stgyCode,
                  chooseDate: vm.chooseDate
                }
              }).done(function(res) {
                if (res.chooseStock.length < 1) {
                  return
                }

                if (isTradeTime()) {
                  Vue.set(vm.stgy, 'chooseStock', res.chooseStock)
                }
              }).always(function() {
                vm.timer = setTimeout(poll, 5000)
              })
            }

            poll()
          },
          stopPolling() {
            if (this.timer) {
              clearTimeout(this.timer)
            }
          }
        }
      })
    },
    init: function() {
      this.registerTopStock()
      this.registerChooseStock()
      this.registerRecord()

      var vm = new Vue({
        el: '#app',
        data: function() {
          return {
            type: window.type,
            stgyInfoList: window.stgyInfoList,
            currStgy: window.currStgy
          }
        },
        filters: {
          format: function(date) {
            return ''
          }
        }
      })
    }
  }

  app.init()
})
