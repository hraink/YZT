/**
 * Created by 99171 on 2017/2/22.
 */
// requestAnimationFrame
var raf = window.requestAnimationFrame || function (callback) {
    setTimeout(callback, 1000 / 60)
  }

// 格式化开高收低几个字段
var formatKline = function (o) {
  var keys = ['low', 'high', 'close', 'open']
  keys.forEach(function (k) {
    o[k] = (o[k] / 100).toFixed(2)
  })

  o.time = dateConvert(String(o.date))

  return o
}

// 格式化预测高点，低点，预测收益率
var formatPredict = function (lastClose) {
  return function (o) {
    var keys = ['profit', 'flor', 'ceil']
    keys.forEach(function (k) {
      o[k] = (o[k] / 10000)
    })

    o.close = multiBy(lastClose, o.profit)
    o.low = multiBy(lastClose, o.flor)
    o.high = multiBy(lastClose, o.ceil)
    o.time = dateConvert(String(o.date))

    return o
  }
}

// 格式化数据
var format = function (predictList, klineList) {
  var klineListNew = klineList.map(formatKline)
  var lastClose = klineListNew[klineListNew.length - 1].close

  var predictListNew = predictList.map(formatPredict(lastClose))

  return [klineListNew, predictListNew]
}

// 渲染K线图到容器
var renderChart = function (data, element, width, height, interactive) {
  var predictList = data.chartDataList
  var chartDataList = data.klineList

  var predictListAndklineList = format(predictList, chartDataList)

  chartDataList = predictListAndklineList[0]
  predictList = predictListAndklineList[1]

  var chart = new PredictChartMobile(element, {
    width: width,
    height: height,
    candleData: chartDataList,
    predictData: predictList,
    interactive: interactive
  })

  return chart
}

Vue.filter('percent', function (n) {
  var ret = n * 100

  ret = ret.toFixed(2)
  ret += '%'

  return ret
})

Vue.filter('color', function (n) {
  if (n > 0) {
    return 'height'
  } else if (n < 0) {
    return 'low'
  } else {
    return 'middle'
  }
})

Vue.filter('calColor', function (value) {
  return {
    'height': value > 0,
    'low': value < 0,
    'middle': value == 0
  }
})

Vue.directive('date', {
  inserted: function (el, binding, vnode) {
    console.log(binding.value.value)

    var start = {
      elem: '#' + el.id,
      format: 'YYYY-MM-DD',
      choose: function (date) {

      },
      start: binding.value.value
    }

    laydate(start)
  }
})

// 简单分页组件
Vue.component('pager', {
  template: '#pager',
  props: ['currentPage', 'rowsPerPage', 'totalLength'],
  data: function () {
    // console.log(this.currentPage, this.rowsPerPage)
    return {
      maxDisplaySize: 8,
      totalPage: Math.ceil(this.totalLength / this.rowsPerPage)
    }
  },
  computed: {
    pages: function () {
      function pagination(c, m) {
        var current = c,
          last = m,
          delta = 2,
          left = current - delta,
          right = current + delta + 1,
          range = [],
          rangeWithDots = [],
          l;

        for (let i = 1; i <= last; i++) {
          if (i == 1 || i == last || i >= left && i < right) {
            range.push(i);
          }
        }

        for (let i of range) {
          if (l) {
            if (i - l === 2) {
              rangeWithDots.push(l + 1);
            } else if (i - l !== 1) {
              rangeWithDots.push('...');
            }
          }
          rangeWithDots.push(i);
          l = i;
        }

        return rangeWithDots;
      }

      var arr = pagination(this.currentPage, this.totalPage)

      return arr
    }
  },
  methods: {
    gotoPage: function (page) {
      console.log('page:', page)
      if (page >= 0 && page < this.totalPage) {
        this.$emit('change', page)
      }
    },
    prevPage: function () {
      this.gotoPage(this.currentPage - 1)
    },
    nextPage: function () {
      this.gotoPage(this.currentPage + 1)
    }
  }
})

var dateConvert = function (date) {
  if (date == 0) {
    return ''
  }

  var re = /(\d{4})(\d{2})(\d{2})/
  return String(date).replace(re, '$1-$2-$3')
}

var multiBy = function (n, p) {
  var ret = n * (1 + Number(p))

  return ret
}