/**
 * Created by shinan on 2017/2/28.
 */
$(function () {
  var formatMoney = function (n) {
    var a = [[1e4, '万'], [1e8, '亿']]

    for (var i = a.length - 1; i >= 0; i--) {
      let [size, unit] = a[i]

      if (n > size) {
        let ret = (n / size).toFixed(2)

        if (i == 0) {
          ret = parseInt(ret)
        }

        return ret + unit
      }
    }

    return n
  }

  var app = {
    init: function () {
      this.renderTopChart()
      this.renderSampleTabs()
      this.renderRealTimeQuotes()
      this.initMatchForm()
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
    // 匹配条件设置表单
    initMatchForm: function() {
      var tradeDaysTable = window.pageData.tradeDaysTable
      var dQuery = pageData.dQuery

      var defaultParams = {
        volumeChecked: false,
        averageChecked: false,
        locked: true,
        matchstartdate: dQuery.defaultMatchStartDate,
        matchenddate: dQuery.defaultMatchEndDate,
        querystartdate: dQuery.defaultQueryStartDate,
        queryenddate: dQuery.defaultQueryEndDate,
        cycle: 5,
        industry: '',
        semblance: 70
      }

      var matchFormVm = new Vue({
        el: '#match-pattern',
        template: '#match-form',
        data: {
          volumeChecked: dQuery.hasOwnProperty('volume') ? true : false,
          averageChecked: dQuery.hasOwnProperty('average') ? true : false,
          moreVisible: false,
          locked: true,
          matchstartdate: dQuery.matchstartdate,
          matchenddate: dQuery.matchenddate,
          querystartdate: dQuery.querystartdate,
          queryenddate: dQuery.queryenddate,
          cycle: window.pageData.cycle,
          industry: pageData.dQuery.industry == 0 ? '' : pageData.dQuery.industry,
          semblance: pageData.dQuery.semblance,
          industryList: window.pageData.industryList,
          code: pageData.code,
          market: pageData.market
        },
        mounted: function() {
          var vm = this

          // 绑定开始，结束等几个日期组件
          laydate({
            elem: '#matchstartdate',
            format: 'YYYY-MM-DD',
            choose: function (date) {
              vm.matchstartdate = date
            },
            start: vm.matchstartdate
          })

          laydate({
            elem: '#matchenddate',
            format: 'YYYY-MM-DD',
            choose: function (date) {
              vm.matchenddate = date
            },
            start: vm.matchenddate
          })

          laydate({
            elem: '#querystartdate',
            format: 'YYYY-MM-DD',
            choose: function (date) {
              vm.querystartdate = date
            },
            start: vm.querystartdate
          })

          laydate({
            elem: '#queryenddate',
            format: 'YYYY-MM-DD',
            choose: function (date) {
              vm.queryenddate = date
            },
            start: vm.queryenddate
          })
        },
        methods: {
          showMore: function() {
            this.moreVisible = !this.moreVisible
          },
          lockMatch: function() {
            this.locked = !this.locked
          },
          changeCycle: function(num, index) {
            this.cycle = num

            if (this.locked) {
              this.matchstartdate = tradeDaysTable[index]
            }
          },
          toggleVolumeCheck: function() {
            this.volumeChecked = !this.volumeChecked
          },
          toggleAverageCheck: function() {
            this.averageChecked = !this.averageChecked
          },
          restoreDefaultParams: function() {
            for (var key in defaultParams) {
              this[key] = defaultParams[key]
            }
          }
        }
      })
    },
    // 实时行情
    renderRealTimeQuotes: function () {
      new Vue({
        el: '#rt_quotes',
        data: function () {
          return {
            name: '',
            price: '',
            grow: '',
            range: '',
            rangeView: ''
          }
        },
        mounted: function () {
          var t = this

          function poll() {
            $.ajax({
              url: '/kline/realtime',
              data: {
                code: window.pageData.code,
                market: window.pageData.market
              }
            }).done(function (res) {
              try {
                var s = JSON.parse(res)[0];
              } catch (e) {
                console.log('实时行情数据解析错误')
                return
              }

              if (s === undefined) {
                console.log('实时行情数据解析错误')
                return
              }

              t.name = s["5"]
              t.price = Number(s["11"]).toFixed(2)
              t.grow = Number(s["81"]).toFixed(2)
              t.range = s["80"]
              t.rangeView = (s["80"].toFixed(2)) + "%"
            }).fail(function () {
              console.log('实时行情获取失败')
            })

            setTimeout(poll, 1000 * 60)
          }

          poll()
        }
      })
    },
    // 渲染顶部预测大图
    renderTopChart: function () {
      var tipVm = new Vue({
        el: '.income_tip2',
        data: function() {
          return {
            item: {}
          }
        },
        filters: {
          percent: function(n) {
            return (n * 100).toFixed(2) + '%'
          },
          fix: function(n) {
            return Number(n).toFixed(2)
          }
        }
      })

      new Vue({
        el: '#top-chart',
        data: function () {
          return {
            singlePredict: window.pageData.singlePredict,
            lastPredictData: window.pageData.singlePredict.chartDataList[window.pageData.singlePredict.chartDataList.length - 1],
            active: 0 // 0 蜡烛线 1 折线
          }
        },
        mounted: function () {
          var el = document.querySelector('.match_graph_wrap')
          var w = el.offsetWidth
          var h = el.offsetHeight

          var chart = renderChart(this.singlePredict, document.querySelector('.match_graph_wrap'), w, h, true)

          chart.on('drag-start', function(point) {
            var offset = $(el).offset()

            $('.income_tip2').css({
              position: 'absolute',
              left: offset.left + 10,
              top: offset.top + 10
            }).show()

            tipVm.item = point
          })

          chart.on('drag-move', function(point) {
            point.date = String(point.date).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')

            tipVm.item = point
          })

          chart.on('drag-end', function() {
            $('.income_tip2').hide()
          })

          this.chart = chart
        },
        methods: {
          showPoly: function () {
            var chart = this.chart
            this.active = 1
            this.$nextTick(function () {
              chart.togglePoly(true)
              chart.toggleCandle(false)
            })
          },
          showCandle: function () {
            var chart = this.chart
            this.active = 0
            this.$nextTick(function () {
              chart.togglePoly(false)
              chart.toggleCandle(true)
            })
          }
        }
      })

      // 表格
      new Vue({
        el: '#match_result',
        template: '#match-result-tpl',
        data: function() {
          return {
            sample: window.pageData.singlePredict.sample
          }
        },
        filters: {
          except: function(n) {
            return n / 1e4
          }
        }
      })
    },
    // 渲染样本的几个tab页
    renderSampleTabs: function () {
      // 存放样本图svg实例
      var sampleCharts = []

      // window.sampleCharts = sampleCharts

      var samplesVm = new Vue({
        el: '#samples',
        template: '#sample-tpl',
        data: function () {
          var sample = window.pageData.singlePredict.sample
          var arr = [sample.klineList1, sample.klineList2, sample.klineList3]

          arr.forEach(function(data) {
            data.forEach(function (item) {
              item.ceil = item.ceil / 1e4
              item.flor = item.flor / 1e4
              item.profit = item.profit / 1e4
            })
          })

          return {
            // 分页相关字段
            currentPage: 0,
            rowsPerPage: 9,
            // 排序字段 0 正序 1 逆序 -1 不排序
            orderBools: {
              semBlance: 0,
              profit: -1
            },
            // tab切换字段
            tabIndex: 0,
            // 三个tab用单独的数据源防止互相影响
            sampleList: sample.klineList1,
            sampleListSec: sample.klineList2,
            sampleListThr: sample.klineList3,
            // 第三个图是否渲染过,切换过去之后渲染一次
            profitChartRendered: false,
            // 第三个图的模式切换
            StatisticalType: 0 // 0 收益 1 时间
          }
        },
        computed: {
          semBlanceArrow: function () {
            return this.sortArrow('semBlance')
          },
          profitArrow: function () {
            return this.sortArrow('profit')
          },
          // 第一个TAB当前分页的数据
          samplesOfCurrentPage: function() {
            var start = this.currentPage * this.rowsPerPage
            var end = start + this.rowsPerPage

            // console.log(start, end)
            return this.sampleList.slice(start, end)
          }
        },
        filters: {
          percentLocal: function (n) {
            return Math.floor(n / 100) + '%'
          },
          format: formatMoney
        },
        methods: {
          sortArrow: function (key) {
            // console.log(this.orderBools[key])

            switch (this.orderBools[key]) {
              case 1:
                return 'riseting'
              case 0:
                return 'sorting'
              case -1:
                return ''
            }
          },
          changeTab: function (n) {
            this.tabIndex = n
          },
          // 处理分页变化
          handlePageChange: function(page) {
            this.currentPage = page
          },
          // 表格排序
          sortBy: function (fieldName) {
            this.sortKey = fieldName

            for (var key in this.orderBools) {
              if (key != fieldName) {
                this.orderBools[key] = -1
              }
            }

            if (this.orderBools[fieldName] == -1) {
              this.orderBools[fieldName] = 0
            } else {
              this.orderBools[fieldName] = this.orderBools[fieldName] ^ 1
            }

            var orderBool = this.orderBools[fieldName]
            this.sampleListSec.sort(function (a, b) {
              return orderBool ? a[fieldName] - b[fieldName] : b[fieldName] - a[fieldName]
            })
          },
          // 渲染收益分布图
          renderProfitChart: function () {
            this.profitData = this.sampleListThr
              .map(function (item) {
                console.log('profitData:', item)
                var o = {}
                o.name = item.name;
                o.code = item.code;
                o.y = item.profit;
                o.color = item.profit > 0 ? "#de4c39" : "#55a32d";
                o.borderColor = 'transparent'
                o.industry = item.industry
                o.profit = (item.profit * 100).toFixed(2)
                o.startDate = dateConvert(item.iStartTime)
                o.endDate = dateConvert(item.iEndTime)
                o.value = formatMoney(item.value)
                return o;
              })
              .sort(function (a, b) {
                return a.y - b.y
              })

            this.timeData = this.sampleListThr
              .sort(function (a, b) {
                return a.iEndTime - b.iEndTime
              })
              .map(function (item) {
                var o = {}
                o.name = item.name;
                o.code = item.code;
                o.y = item.profit;
                o.color = item.profit > 0 ? "#e63232" : "#55a500";
                o.borderColor = 'transparent'
                o.industry = item.industry
                o.profit = (item.profit * 100).toFixed(2)
                o.startDate = dateConvert(item.iStartTime)
                o.endDate = dateConvert(item.iEndTime)
                o.value = formatMoney(item.value)

                return o;
              })

            // 实例化Highcharts
            this.ch = Highcharts.chart(document.querySelector('.profit_graph_wrap'), {
              chart: {
                type: 'column',
                width: 1133,
                backgroundColor: '#1f1f1f'
              },
              plotOptions: {
                series: {
                  animation: false
                }
              },
              title: {
                text: ''
              },
              legend: {
                enabled: false,
                align: 'left'
              },
              xAxis: {
                labels: {
                  enabled: false
                },
                tickWidth: 0,
                lineColor: '#2d2d2d'
              },
              tooltip: {
                shared: true,
                useHTML: true,
                headerFormat: '',
                shadow: false,
                shape: "square",
                pointFormat:`<div class="income_tip">
                    <p><span class="code">{point.code}</span><span>{point.name}</span></p>
                    <p><span>匹配周期：</span><span>{point.startDate} 至 {point.endDate}</span></p>
                    
                    <p><span>实际收益：</span><span>{point.profit}%</span></p>
                    <p><span>所属行业：</span><span>{point.industry}</span></p>
                    <p><span>流通市值：</span><span>{point.value}</span></p>
                </div>`,
                borderWidth: 0,
                padding: 0
              },
              yAxis: {
                labels: {
                  formatter: function () {
                    return (this.value * 100).toFixed(2) + "%";
                  }
                },
                title: {
                  enabled: false
                },
                gridLineColor: '#2d2d2d'
              },
              credits: {
                enabled: false
              },
              series: [{
                data: this.profitData,
                pointWidth: 9
              }]
            })
          },
          // 切换统计方式时间or收益
          changeStatisticalType: function (type) {
            this.StatisticalType = type
            if (type == 0) {
              this.ch.series[0].update({
                data: this.profitData
              })
            } else if (type == 1) {
              this.ch.series[0].update({
                data: this.timeData
              })
            }
          },
          // 渲染样本图，多次调用
          renderSamples: function() {
            if (sampleCharts.length > 0) {
              return false
            }

            var graphWidth, graphHeight
            var i = 0
            var els = [].slice.call(this.$el.querySelectorAll('.match_k_graph'))
            var sampleList = this.samplesOfCurrentPage // 直接引用计算属性？？

            // 渲染样本图
            function renderSampleChart(elem, item) {
              var chartDataList = item.chartDataList.map(function (o, index) {
                var item = Object.assign({}, o)

                item.time = dateConvert(item.date)
                item.high = item.high / 100
                item.low = item.low / 100
                item.open = item.open / 100
                item.close = item.close / 100

                return item
              })

              var list = chartDataList
              graphWidth = graphWidth || elem.offsetWidth
              graphHeight = graphHeight || elem.offsetHeight

              var chart = new SampleChart(elem, {
                width: graphWidth,
                height: graphHeight,
                candleData: list,
                volume: true,
                cycle: window.pageData.cycle
              })

              // 推入实例数组 方便日后销毁
              sampleCharts.push(chart)
            }

            sampleList.forEach(function(item, index) {
              renderSampleChart(els[index], item)
            })
          }
        },
        // watch属性
        watch: {
          tabIndex: function (value) {
            // 第一次切换出来的时候渲染收益分布图
            if (value == 2 && !this.profitChartRendered) {
              this.renderProfitChart()
              this.profitChartRendered = true
            }

            // 第二个tab滚动条
            // if (value == 1) {
            //   this.$nextTick(function() {
            //     $('.scroll-pane').jScrollPane()
            //   })
            // }
          },
          currentPage: function() {
            // 切换分页前清空之前的svg图
            sampleCharts.forEach(function(chart) {
              chart.destory()
            })
            // 同时清空数组
            sampleCharts.length = 0

            // 重新绘图
            var vm = this
            vm.$nextTick(function() {
              vm.renderSamples()
            })
          }
        },
        mounted: function () {
          this.renderSamples()
        }
      })
    }
  }

  app.init()
})