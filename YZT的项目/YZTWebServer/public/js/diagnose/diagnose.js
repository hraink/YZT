// 上涨概率环形饼图
function drawPieChart(upprob) {
  /**** 饼图开始 ****/
  var data = [upprob * 100, 100 - upprob * 100]
  var pie = d3.pie()
  var color = data[0] > 50 ? '#fa5959' : '#3ebf6d'

  // pie.sort(function(a, b) {
  //   return a - b
  // })

  var arcs = pie(data)
  var width = 74
  var height = 74
  var radius = Math.min(width, height) / 2

  var svg = d3.select('.rise_chart').append('svg').attr('width', width).attr('height', height)
  var g = svg.append('g').attr('transform', `translate(${width/2}, ${height/2})`)
  var arc = d3.arc().outerRadius(radius).innerRadius(radius - 4)

  g.selectAll('path')
    .data(arcs)
    .enter()
    .append('path')
    .attr('d', function(d) {
      var pathData = arc(d)

      return pathData
    })
    .attr('fill', function(d) {
      if (d.index == 0) {
        return color
      }

      return '#262626'
    })

  var text = (upprob * 100).toFixed(2)
  g.append('text').text(text + '%')
    .attr('fill', color)
    .attr("text-anchor", "middle")
    .attr('transform', 'translate(0, 5)')
  /**** 饼图结束 ****/
}

// 上涨概率波动区间定位
function wavePos(min, max, current) {
  var scale = d3.scaleLinear().domain([min, max]).range([0, 100])
  var value = parseInt(scale(current))
  var percent = value + '%'

  // 指示器
  $('#js_wave_pointer').css('left', percent)
  $('#js_low_block').css('width', percent)
  $('#js_low_block').next().css('width', (100 - value) + '%')
}

// 柱图
function drawBarChart() {
  var marginTop = 0
  var marginBottom = 16
  var marginLeft = 20
  /**** 柱图开始 ****/
  var width = document.querySelector('.assess_chart').offsetWidth
  var height = document.querySelector('.assess_chart').offsetHeight

  var data = ['son', 'ron', 'non', 'ion', 'bon']
  var colors = ['#3ebf6d', '#7cd03c', '#f4c63f', '#ec872b', '#ff5b5b']

  data = data.map(function(key, index) {
    return {
      color: colors[index],
      value: stockDiagnosis[key]
    }
  })

  var svg = d3.select('.assess_chart').append('svg').attr('width', width).attr('height', height)

  // x轴
  var domain = ['卖出', '减持', '中性', '增持', '买入']
  var range = []

  for (var i = 0; i < 6; i++) {
    var x = i * (width - marginLeft) / 5

    range.push(x)
  }

  var bottomScale = d3.scaleOrdinal()
    .domain(domain)
    .range(range)

  var axisBottom = d3.axisBottom(bottomScale).tickSize(0).tickPadding(8)
  var g = svg.append('g').attr('transform', `translate(20, ${height - marginBottom})`).call(axisBottom)
  g.select('.domain').attr('stroke', '#666666')
  g.selectAll('text').attr('text-anchor', 'start').attr('transform', 'translate(10, 0)').attr('fill', '#666666')
  // 左侧y轴
  var all = data.map(function(o) {return o.value})

  var min = Math.min.apply(Math, all)
  var max = Math.max.apply(Math, all)

  var leftScale = d3.scaleOrdinal()
    .domain([min, max])
    .range([height - marginBottom, 0])

  var axisLeft = d3.axisLeft(leftScale).tickSize(0).tickPadding(5)
  var g = svg.append('g').attr('transform', `translate(${marginLeft}, ${marginTop})`).call(axisLeft)
  g.select('.domain').attr('stroke', '#666666')
  g.selectAll('text').attr('fill', '#666666')

  g.selectAll('.tick text').attr('transform', (d, i) => {
    if (i == 1) {
      return 'translate(0, 6)'
    }
  })

  // 柱子图
  var scaleBand = d3.scaleBand()
    .domain(data.map(function(item, index) {
      return index
    }))
    .range([0, width - marginLeft])
    .padding(0.2)

  var scaleY = d3.scaleLinear().domain([
    min, max
  ]).range([height - marginBottom, 0])

  var g = svg.append('g').attr('transform', `translate(${marginLeft}, 0)`)

  g.selectAll('rect').data(data).enter().append('rect')
    .attr('width', function(d) {
      console.log(scaleBand.bandwidth())

      return scaleBand.bandwidth()
    })
    .attr('height', function(d) {
      return Math.abs(scaleY(0) - scaleY(d.value))
    })
    .attr('x', function(d, i) {
      return scaleBand(i)
    })
    .attr('y', function(d, i) {
      return scaleY(d.value)
    })
    .attr('fill', function(d) {
      return d.color
    })
}

// 买入卖出图
function buySellChart(selector, data) {
  var dom = document.querySelector('.main_chart')
  if (!dom) return
  var margin = 5
  var width = dom.offsetWidth
  var height = dom.offsetHeight

  var barWidth = (width - margin) / 2
  var max = Math.max.apply(Math, data)

  var colors = ['#ff5b5b', '#3ebf6d']
  // var shBuySell = [stockDiagnosis.shBuy, stockDiagnosis.shSell]
  var marginBetween = 10
  var scaleY = d3.scaleLinear().domain([0, max]).range([height, 0])

  var svg = d3.select(selector).append('svg').attr('width', width).attr('height', height)

  svg.selectAll('rect').data(data).enter().append('rect')
    .attr('x', function(d, i) {
      return (barWidth + margin) * i
    })
    .attr('y', function(d, i) {
      return scaleY(d)
    })
    .attr('width', barWidth)
    .attr('height', function(d) {
      return height - scaleY(d)
    })
    .attr('fill', function(d, i) {
      return colors[i]
    })
}

//交易人气刻度条,num取值 0-100
function scale(num){
  var cls1, cls2, cls3 = ''

  if( 0 < num && num <31) {
    cls1 = cls2 = 'low'
  }else if(30 < num && num <64){
    cls1 = cls2 = 'middle'
  }else if( 65<= num && num <100 ){
    cls1 = cls2 = 'height'
  }else if( num==100 ){
    cls1 = cls2 = cls3 = 'height'
  }

  $(".scale_bg").height(num+"%").addClass(cls1);
  $(".scale_bg_bottom").addClass(cls2);
  $(".scale_bg_top").addClass(cls3);
}

// 搜索框
function initSearchBar() {
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
}

// 趋势指针
function trendArrowPosition(trend) {
  console.log('trend:', trend)
  var el = $('.arror')
  var scale = d3.scaleLinear().domain([0, 100]).range([-90, 90])
  var angle = scale(trend)

  el.css({
    'transform':'rotate(' + angle + 'deg)'
  })
}

$(function() {
  initSearchBar()
  drawPieChart(stockDiagnosis.stockPredict.upprob)
  wavePos(stockDiagnosis.stockPredict.flucFlor, stockDiagnosis.stockPredict.flucCeil, stockDiagnosis.stockPredict.flucPrice)
  drawBarChart()
  trendArrowPosition(stockDiagnosis.trend)
  buySellChart('.main_chart', [stockDiagnosis.zlBuy, stockDiagnosis.zlSell])
  buySellChart('.retail_chart', [stockDiagnosis.shBuy, stockDiagnosis.shSell])
  scale(stockDiagnosis.todayHot)
})