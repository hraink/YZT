var SampleChart =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
	                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Created by shinan on 2016/12/29.
	                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */


	var _config = __webpack_require__(13);

	__webpack_require__(21);

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var WIN_COLOR = '#ff5b5b';
	var LOSS_COLOR = '#3ebf6d';

	var str2number = __webpack_require__(9);
	var d3 = __webpack_require__(6);
	var MARGIN_BOTTOM = 15;
	var MARGIN_RIGHT = 2;
	var TEXT_MARGIN = 5;
	var VOL_HEIGHT = 66;

	var SampleChart = function () {
	  function SampleChart(selector, options) {
	    _classCallCheck(this, SampleChart);

	    this.options = options;

	    this.svg = d3.select(selector).append('svg').attr('width', options.width).attr('height', options.height);

	    this.totalHeight = this.options.height;
	    this.candleStickAreaHeight = options.height - MARGIN_BOTTOM;
	    this.options.width = options.width - MARGIN_RIGHT;

	    if (this.options.volume) {
	      this.candleStickAreaHeight -= VOL_HEIGHT;
	    }

	    this.options.candleData = this.options.candleData.map(str2number);

	    var candleData = options.candleData;


	    var min = d3.min(candleData, function (d) {
	      return +d.low;
	    });
	    var max = d3.max(candleData, function (d) {
	      return +d.high;
	    });

	    min = min - min / 50;
	    max = max + max / 50;

	    var scaleY = d3.scaleLinear().domain([min, max]).range([this.candleStickAreaHeight, 0]);

	    this.min = min;
	    this.max = max;
	    this.scaleY = scaleY;
	    this.render();
	  }

	  // 预测线


	  _createClass(SampleChart, [{
	    key: 'predictLines',
	    value: function predictLines() {
	      var svg = this.svg,
	          scaleY = this.scaleY;
	      var _options = this.options,
	          width = _options.width,
	          candleData = _options.candleData,
	          cycle = _options.cycle;

	      var height = this.options.height;
	      var total = candleData.length;
	      var predictPercent = (total - cycle) / total;
	      var offset = width * predictPercent;

	      var g = svg.append('g').attr('transform', 'translate(' + offset + ', 0)');
	      // 预测部分虚框
	      var area = d3.area().x(function (d) {
	        return d.x;
	      }).y0(0).y1(function (d) {
	        return d.y;
	      });

	      g.append('path').datum([{
	        x: 0,
	        y: height
	      }, {
	        x: width * (1 - predictPercent),
	        y: height
	      }]).attr('d', area).attr('class', 'predict');

	      // hack 外框最后画
	      setTimeout(function () {
	        svg.append('g').attr('transform', 'translate(' + offset + ', 0)').append('path').datum([{
	          x: 0,
	          y: height - 1
	        }, {
	          x: Math.ceil(width * (1 - predictPercent)),
	          y: height - 1
	        }]).attr('d', area).attr('fill', 'none').attr('stroke', '#79c0ff');
	      }, 0);
	    }

	    // 蜡烛线

	  }, {
	    key: 'candleSticks',
	    value: function candleSticks() {
	      var svg = this.svg,
	          scaleY = this.scaleY;
	      var _options2 = this.options,
	          width = _options2.width,
	          candleData = _options2.candleData;

	      var height = this.candleStickAreaHeight;

	      var scaleX = d3.scaleBand().domain(candleData.map(function (o, i) {
	        return i;
	      })).range([0, width]).padding(0.4);

	      this.scaleBandX = scaleX;

	      var group = svg.append('g').attr('class', 'candles');
	      var calColor = function calColor(d) {
	        if (d.close > d.open) {
	          return WIN_COLOR;
	        } else if (d.close < d.open) {
	          return LOSS_COLOR;
	        } else {
	          return _config.EQUAL_COLOR;
	        }
	      };
	      group.selectAll('rect').data(candleData).enter().append('rect').attr('class', 'bar').attr('x', function (d, i) {
	        return scaleX(i);
	      }).attr('y', function (d) {
	        return scaleY(Math.max(d.open, d.close));
	      }).attr('width', scaleX.bandwidth()).attr('height', function (d) {
	        var h = scaleY(Math.min(d.open, d.close)) - scaleY(Math.max(d.open, d.close));
	        if (h < 1) {
	          h = 1;
	        }

	        return h;
	      }).attr('fill', calColor);

	      var line = d3.line().x(function (d) {
	        return d.x;
	      }).y(function (d) {
	        return d.y;
	      });
	      group.selectAll('path.shadow').data(candleData).enter().append('path').attr('class', 'shadow').attr('d', function (d, i) {
	        var x = scaleX(i) + scaleX.bandwidth() / 2;
	        var y1 = scaleY(d.high);
	        var y2 = scaleY(d.low);

	        return line([{ x: x, y: y1 }, { x: x, y: y2 }]);
	      }).attr('stroke', calColor);

	      this.candleGroup = group;
	    }

	    // 量线

	  }, {
	    key: 'volumes',
	    value: function volumes() {
	      var svg = this.svg;
	      var _options3 = this.options,
	          width = _options3.width,
	          candleData = _options3.candleData;

	      var height = this.candleStickAreaHeight;
	      var min = d3.min(candleData, function (d) {
	        return d.volume;
	      });
	      var max = d3.max(candleData, function (d) {
	        return d.volume;
	      });
	      // 增加一些
	      max += max / 10;

	      var VOL_HEIGHT = 66;
	      var scaleY = d3.scaleLinear().domain([min, max]).range([VOL_HEIGHT, 0]);
	      var group = svg.append('g').attr('transform', 'translate(0, ' + (height + MARGIN_BOTTOM - 1) + ')');

	      group.append('rect').attr('x', 0).attr('y', 0).attr('width', width).attr('height', VOL_HEIGHT).attr('class', 'volume');

	      var scaleX = this.scaleBandX;
	      group.selectAll('.bar').data(candleData).enter().append('rect').attr('class', 'bar').attr('x', function (d, i) {
	        return scaleX(i);
	      }).attr('y', function (d) {
	        return scaleY(d.volume);
	      }).attr('width', scaleX.bandwidth()).attr('height', function (d) {
	        return VOL_HEIGHT - scaleY(d.volume);
	      }).attr('fill', function (d) {
	        return d.close >= d.open ? WIN_COLOR : LOSS_COLOR;
	      });

	      group.selectAll('.bar').data(candleData).enter().append('rect').attr('class', 'bar');
	    }

	    // 数轴&辅助线

	  }, {
	    key: 'axis',
	    value: function axis() {
	      var svg = this.svg,
	          scaleY = this.scaleY;
	      var _options4 = this.options,
	          width = _options4.width,
	          candleData = _options4.candleData,
	          cycle = _options4.cycle;

	      var height = this.candleStickAreaHeight;
	      var total = candleData.length;
	      var predictPercent = (total - cycle) / total;
	      var offset = width * predictPercent;

	      console.log([candleData[0].time, candleData[total - cycle].time, '']);

	      var scaleXReal = d3.scaleOrdinal().domain([candleData[0].time, candleData[total - cycle].time, '']).range([0, offset, width]);

	      var min = this.min,
	          max = this.max;

	      min = +min;
	      max = +max;
	      var scaleYReal = d3.scaleOrdinal().domain([min, (max + min) / 2, max]).range([height, height / 2, 0]);

	      // 底部X轴
	      var axisX = d3.axisBottom(scaleXReal).tickSize(0).tickPadding(TEXT_MARGIN);
	      // 右侧Y轴
	      var axisY = d3.axisLeft(scaleYReal).tickSize(0).tickPadding(TEXT_MARGIN).tickFormat(function (d) {
	        return d.toFixed(2);
	      });
	      // 顶部X轴（辅助线）
	      var topAxis = d3.axisBottom(scaleXReal).tickSize(0).tickFormat('');
	      // 左侧Y轴
	      var leftAxis = d3.axisRight(scaleYReal).tickSize(width).tickFormat('');

	      svg.append('g').attr('class', 'axis').attr('transform', 'translate(0, 0)').call(topAxis);
	      var leftAxisElement = svg.append('g').attr('class', 'axis').attr('transform', 'translate(0, 0)').call(leftAxis);

	      var axisXElement = svg.append('g').attr('class', 'axis').attr('transform', 'translate(0, ' + height + ')').call(axisX);
	      var axisYElement = svg.append('g').attr('class', 'axis').attr('transform', 'translate(' + width + ', 0)').call(axisY);

	      axisXElement.selectAll('.tick text').attr('text-anchor', 'end');

	      // 偏移第一个值
	      axisXElement.select('.tick text').attr('text-anchor', 'start');

	      axisYElement.selectAll('.tick text').each(function (d, i) {
	        if (i == 2) {
	          d3.select(this).attr('transform', 'translate(0, 10)');
	        } else {
	          d3.select(this).attr('transform', 'translate(0, -10)');
	        }
	      });

	      // 纵向辅助线改为虚线
	      var selection = leftAxisElement.selectAll('.tick line');
	      selection.each(function (d, i) {
	        if (i != 0 || i != selection.length - 1) {
	          d3.select(this).attr("stroke-dasharray", '5, 3');
	        }
	      });
	    }

	    /* 显示折线 */

	  }, {
	    key: 'drawPolyline',
	    value: function drawPolyline() {
	      var _options5 = this.options,
	          candleData = _options5.candleData,
	          width = _options5.width;

	      var scaleX = d3.scaleLinear().domain([0, candleData.length - 1]).range([0, width * PREDICT_PERCENT]);
	      var scaleY = this.scaleY;
	      var line = d3.line().x(function (d, i) {
	        return scaleX(i);
	      }).y(function (d) {
	        return scaleY(d.close);
	      });

	      var group = this.svg.append('g').attr('class', 'poly');

	      group.append('path').datum(candleData).attr('d', line).attr('stroke', '#297cda').attr('stroke-width', 2).attr('fill', 'none');

	      this.lineGroup = group;
	    }
	  }, {
	    key: 'togglePoly',
	    value: function togglePoly(bool) {
	      if (!this.lineGroup) {
	        this.drawPolyline();
	      } else {
	        this.lineGroup.attr('class', bool ? 'poly' : 'none');
	      }
	    }
	  }, {
	    key: 'toggleCandle',
	    value: function toggleCandle(bool) {
	      this.candleGroup.attr('class', bool ? 'candle' : 'none');
	    }
	  }, {
	    key: 'events',
	    value: function events() {
	      var touch = function touch(o) {
	        var pos;
	        if ('ontouchstart' in window) {
	          pos = d3.touches(o)[0];
	        } else {
	          pos = d3.mouse(o);
	        }

	        return pos;
	      };

	      var t = this;
	      var drag = d3.drag().container(function () {
	        return this;
	      }).on('start', function () {
	        var pos = touch(this);

	        console.log(pos, d3.event.x, d3.event.y);

	        t.handleDragStart(pos[0], pos[1]);
	      }).on('drag', function () {
	        var pos = touch(this);

	        t.handleDragMove(pos[0], pos[1]);
	      }).on('end', function () {
	        t.handleDragEnd();
	      });

	      this.svg.call(drag);
	    }
	  }, {
	    key: 'getHelperLineXY',
	    value: function getHelperLineXY(x) {
	      var candleData = this.options.candleData;
	      var scaleBandX = this.scaleBandX,
	          scaleY = this.scaleY;

	      var step = scaleBandX.step();
	      var index = Math.floor(x / step);

	      if (index < 0 || index >= candleData.length) {
	        return { x: -1, y: -1 };
	      }

	      var bandWidth = scaleBandX.bandwidth();
	      x = scaleBandX(index) + bandWidth / 2;
	      var y = scaleY(candleData[index].close);

	      return { x: x, y: y };
	    }
	  }, {
	    key: 'handleDragStart',
	    value: function handleDragStart(x) {
	      var _getHelperLineXY = this.getHelperLineXY(x),
	          x = _getHelperLineXY.x,
	          y = _getHelperLineXY.y;

	      if (x === -1) return;

	      var hData = [{
	        x: 0,
	        y: y
	      }, {
	        x: this.options.width,
	        y: y
	      }];

	      var vData = [{
	        x: x,
	        y: 0
	      }, {
	        x: x,
	        y: this.options.volume ? this.totalHeight : this.candleStickAreaHeight
	      }];

	      var line = d3.line().x(function (d) {
	        return d.x;
	      }).y(function (d) {
	        return d.y;
	      });

	      var horizontalLine = this.svg.append('path');
	      var verticalLine = this.svg.append('path');

	      horizontalLine.datum(hData).attr('d', line).attr('class', 'help');
	      verticalLine.datum(vData).attr('d', line).attr('class', 'help');

	      this.horizontalLine = horizontalLine;
	      this.verticalLine = verticalLine;
	    }
	  }, {
	    key: 'handleDragMove',
	    value: function handleDragMove(x) {
	      var _getHelperLineXY2 = this.getHelperLineXY(x),
	          x = _getHelperLineXY2.x,
	          y = _getHelperLineXY2.y;

	      if (x === -1) return;

	      var hData = [{
	        x: 0,
	        y: y
	      }, {
	        x: this.options.width,
	        y: y
	      }];

	      var vData = [{
	        x: x,
	        y: 0
	      }, {
	        x: x,
	        y: this.options.volume ? this.totalHeight : this.candleStickAreaHeight
	      }];

	      var line = d3.line().x(function (d) {
	        return d.x;
	      }).y(function (d) {
	        return d.y;
	      });

	      this.horizontalLine.datum(hData).attr('d', line);
	      this.verticalLine.datum(vData).attr('d', line);
	    }
	  }, {
	    key: 'handleDragEnd',
	    value: function handleDragEnd() {
	      if (this.horizontalLine || this.verticalLine) {
	        this.horizontalLine.remove();
	        this.verticalLine.remove();
	      }
	    }
	  }, {
	    key: 'render',
	    value: function render() {
	      var _options6 = this.options,
	          volume = _options6.volume,
	          interactive = _options6.interactive;

	      this.predictLines();
	      this.axis();
	      this.candleSticks();

	      if (volume) {
	        this.volumes();
	      }

	      if (interactive) {
	        this.events();
	      }
	    }
	  }, {
	    key: 'destory',
	    value: function destory() {
	      this.svg.remove();
	    }
	  }]);

	  return SampleChart;
	}();

	module.exports = SampleChart;

/***/ },
/* 1 */,
/* 2 */,
/* 3 */
/***/ function(module, exports) {

	/*
		MIT License http://www.opensource.org/licenses/mit-license.php
		Author Tobias Koppers @sokra
	*/
	// css base code, injected by the css-loader
	module.exports = function() {
		var list = [];

		// return the list of modules as css string
		list.toString = function toString() {
			var result = [];
			for(var i = 0; i < this.length; i++) {
				var item = this[i];
				if(item[2]) {
					result.push("@media " + item[2] + "{" + item[1] + "}");
				} else {
					result.push(item[1]);
				}
			}
			return result.join("");
		};

		// import a list of modules into the list
		list.i = function(modules, mediaQuery) {
			if(typeof modules === "string")
				modules = [[null, modules, ""]];
			var alreadyImportedModules = {};
			for(var i = 0; i < this.length; i++) {
				var id = this[i][0];
				if(typeof id === "number")
					alreadyImportedModules[id] = true;
			}
			for(i = 0; i < modules.length; i++) {
				var item = modules[i];
				// skip already imported module
				// this implementation is not 100% perfect for weird media query combinations
				//  when a module is imported multiple times with different media queries.
				//  I hope this will never occur (Hey this way we have smaller bundles)
				if(typeof item[0] !== "number" || !alreadyImportedModules[item[0]]) {
					if(mediaQuery && !item[2]) {
						item[2] = mediaQuery;
					} else if(mediaQuery) {
						item[2] = "(" + item[2] + ") and (" + mediaQuery + ")";
					}
					list.push(item);
				}
			}
		};
		return list;
	};


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	/*
		MIT License http://www.opensource.org/licenses/mit-license.php
		Author Tobias Koppers @sokra
	*/
	var stylesInDom = {},
		memoize = function(fn) {
			var memo;
			return function () {
				if (typeof memo === "undefined") memo = fn.apply(this, arguments);
				return memo;
			};
		},
		isOldIE = memoize(function() {
			return /msie [6-9]\b/.test(window.navigator.userAgent.toLowerCase());
		}),
		getHeadElement = memoize(function () {
			return document.head || document.getElementsByTagName("head")[0];
		}),
		singletonElement = null,
		singletonCounter = 0,
		styleElementsInsertedAtTop = [];

	module.exports = function(list, options) {
		if(false) {
			if(typeof document !== "object") throw new Error("The style-loader cannot be used in a non-browser environment");
		}

		options = options || {};
		// Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
		// tags it will allow on a page
		if (typeof options.singleton === "undefined") options.singleton = isOldIE();

		// By default, add <style> tags to the bottom of <head>.
		if (typeof options.insertAt === "undefined") options.insertAt = "bottom";

		var styles = listToStyles(list);
		addStylesToDom(styles, options);

		return function update(newList) {
			var mayRemove = [];
			for(var i = 0; i < styles.length; i++) {
				var item = styles[i];
				var domStyle = stylesInDom[item.id];
				domStyle.refs--;
				mayRemove.push(domStyle);
			}
			if(newList) {
				var newStyles = listToStyles(newList);
				addStylesToDom(newStyles, options);
			}
			for(var i = 0; i < mayRemove.length; i++) {
				var domStyle = mayRemove[i];
				if(domStyle.refs === 0) {
					for(var j = 0; j < domStyle.parts.length; j++)
						domStyle.parts[j]();
					delete stylesInDom[domStyle.id];
				}
			}
		};
	}

	function addStylesToDom(styles, options) {
		for(var i = 0; i < styles.length; i++) {
			var item = styles[i];
			var domStyle = stylesInDom[item.id];
			if(domStyle) {
				domStyle.refs++;
				for(var j = 0; j < domStyle.parts.length; j++) {
					domStyle.parts[j](item.parts[j]);
				}
				for(; j < item.parts.length; j++) {
					domStyle.parts.push(addStyle(item.parts[j], options));
				}
			} else {
				var parts = [];
				for(var j = 0; j < item.parts.length; j++) {
					parts.push(addStyle(item.parts[j], options));
				}
				stylesInDom[item.id] = {id: item.id, refs: 1, parts: parts};
			}
		}
	}

	function listToStyles(list) {
		var styles = [];
		var newStyles = {};
		for(var i = 0; i < list.length; i++) {
			var item = list[i];
			var id = item[0];
			var css = item[1];
			var media = item[2];
			var sourceMap = item[3];
			var part = {css: css, media: media, sourceMap: sourceMap};
			if(!newStyles[id])
				styles.push(newStyles[id] = {id: id, parts: [part]});
			else
				newStyles[id].parts.push(part);
		}
		return styles;
	}

	function insertStyleElement(options, styleElement) {
		var head = getHeadElement();
		var lastStyleElementInsertedAtTop = styleElementsInsertedAtTop[styleElementsInsertedAtTop.length - 1];
		if (options.insertAt === "top") {
			if(!lastStyleElementInsertedAtTop) {
				head.insertBefore(styleElement, head.firstChild);
			} else if(lastStyleElementInsertedAtTop.nextSibling) {
				head.insertBefore(styleElement, lastStyleElementInsertedAtTop.nextSibling);
			} else {
				head.appendChild(styleElement);
			}
			styleElementsInsertedAtTop.push(styleElement);
		} else if (options.insertAt === "bottom") {
			head.appendChild(styleElement);
		} else {
			throw new Error("Invalid value for parameter 'insertAt'. Must be 'top' or 'bottom'.");
		}
	}

	function removeStyleElement(styleElement) {
		styleElement.parentNode.removeChild(styleElement);
		var idx = styleElementsInsertedAtTop.indexOf(styleElement);
		if(idx >= 0) {
			styleElementsInsertedAtTop.splice(idx, 1);
		}
	}

	function createStyleElement(options) {
		var styleElement = document.createElement("style");
		styleElement.type = "text/css";
		insertStyleElement(options, styleElement);
		return styleElement;
	}

	function createLinkElement(options) {
		var linkElement = document.createElement("link");
		linkElement.rel = "stylesheet";
		insertStyleElement(options, linkElement);
		return linkElement;
	}

	function addStyle(obj, options) {
		var styleElement, update, remove;

		if (options.singleton) {
			var styleIndex = singletonCounter++;
			styleElement = singletonElement || (singletonElement = createStyleElement(options));
			update = applyToSingletonTag.bind(null, styleElement, styleIndex, false);
			remove = applyToSingletonTag.bind(null, styleElement, styleIndex, true);
		} else if(obj.sourceMap &&
			typeof URL === "function" &&
			typeof URL.createObjectURL === "function" &&
			typeof URL.revokeObjectURL === "function" &&
			typeof Blob === "function" &&
			typeof btoa === "function") {
			styleElement = createLinkElement(options);
			update = updateLink.bind(null, styleElement);
			remove = function() {
				removeStyleElement(styleElement);
				if(styleElement.href)
					URL.revokeObjectURL(styleElement.href);
			};
		} else {
			styleElement = createStyleElement(options);
			update = applyToTag.bind(null, styleElement);
			remove = function() {
				removeStyleElement(styleElement);
			};
		}

		update(obj);

		return function updateStyle(newObj) {
			if(newObj) {
				if(newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap)
					return;
				update(obj = newObj);
			} else {
				remove();
			}
		};
	}

	var replaceText = (function () {
		var textStore = [];

		return function (index, replacement) {
			textStore[index] = replacement;
			return textStore.filter(Boolean).join('\n');
		};
	})();

	function applyToSingletonTag(styleElement, index, remove, obj) {
		var css = remove ? "" : obj.css;

		if (styleElement.styleSheet) {
			styleElement.styleSheet.cssText = replaceText(index, css);
		} else {
			var cssNode = document.createTextNode(css);
			var childNodes = styleElement.childNodes;
			if (childNodes[index]) styleElement.removeChild(childNodes[index]);
			if (childNodes.length) {
				styleElement.insertBefore(cssNode, childNodes[index]);
			} else {
				styleElement.appendChild(cssNode);
			}
		}
	}

	function applyToTag(styleElement, obj) {
		var css = obj.css;
		var media = obj.media;

		if(media) {
			styleElement.setAttribute("media", media)
		}

		if(styleElement.styleSheet) {
			styleElement.styleSheet.cssText = css;
		} else {
			while(styleElement.firstChild) {
				styleElement.removeChild(styleElement.firstChild);
			}
			styleElement.appendChild(document.createTextNode(css));
		}
	}

	function updateLink(linkElement, obj) {
		var css = obj.css;
		var sourceMap = obj.sourceMap;

		if(sourceMap) {
			// http://stackoverflow.com/a/26603875
			css += "\n/*# sourceMappingURL=data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + " */";
		}

		var blob = new Blob([css], { type: "text/css" });

		var oldSrc = linkElement.href;

		linkElement.href = URL.createObjectURL(blob);

		if(oldSrc)
			URL.revokeObjectURL(oldSrc);
	}


/***/ },
/* 5 */,
/* 6 */
/***/ function(module, exports) {

	module.exports = window.d3;

/***/ },
/* 7 */,
/* 8 */,
/* 9 */
/***/ function(module, exports) {

	'use strict';

	module.exports = function (stock) {
		var keys = ['low', 'high', 'open', 'close'];

		keys.forEach(function (key) {
			stock[key] = +stock[key];
		});

		return stock;
	};

/***/ },
/* 10 */,
/* 11 */,
/* 12 */,
/* 13 */
/***/ function(module, exports) {

	'use strict';

	var MARGIN_TABLE = {
		10: 4,
		20: 3,
		40: 1,
		60: 1
	};

	var PIXEL_FIX = 0.5;
	var OUTTER_MARGIN = 2;
	var VOL_HEIGHT = 66;
	var FONT_SIZE = 12;
	var WIN_COLOR = '#de4c39';
	var LOSS_COLOR = '#55a32d';
	var EQUAL_COLOR = '#999999';
	var STROKE_COLOR = '#d8d8d8';
	var DASH_COLOR = '#999999';
	var BOTTOM_TEXT_HEIGHT = 20;
	var TEXT_COLOR = '#0287fe';
	var TEXT_MARGIN = 10;

	module.exports = {
		MARGIN_TABLE: MARGIN_TABLE,
		OUTTER_MARGIN: OUTTER_MARGIN,
		VOL_HEIGHT: VOL_HEIGHT,
		FONT_SIZE: FONT_SIZE,
		PIXEL_FIX: PIXEL_FIX,
		WIN_COLOR: WIN_COLOR,
		LOSS_COLOR: LOSS_COLOR,
		STROKE_COLOR: STROKE_COLOR,
		DASH_COLOR: DASH_COLOR,
		BOTTOM_TEXT_HEIGHT: BOTTOM_TEXT_HEIGHT,
		TEXT_COLOR: TEXT_COLOR,
		TEXT_MARGIN: TEXT_MARGIN,
		EQUAL_COLOR: EQUAL_COLOR
	};

/***/ },
/* 14 */,
/* 15 */,
/* 16 */,
/* 17 */,
/* 18 */,
/* 19 */,
/* 20 */,
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag

	// load the styles
	var content = __webpack_require__(22);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(4)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../node_modules/css-loader/index.js!./d3.css", function() {
				var newContent = require("!!./../../node_modules/css-loader/index.js!./d3.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(3)();
	// imports


	// module
	exports.push([module.id, "* {\r\n    margin:0;\r\n    padding:0;\r\n}\r\n\r\nbody {\r\n    -webkit-user-select: none;\r\n}\r\n\r\nsvg {\r\n    overflow: visible;\r\n}\r\n\r\nsvg rect, svg line {\r\n    shape-rendering:crispEdges;\r\n}\r\n\r\n/* 数字文字颜色 */\r\n.axis text {\r\n    fill: #999999;\r\n}\r\n\r\n/* 数轴颜色 */\r\n.axis path {\r\n    stroke: #ccc;\r\n}\r\n\r\n.shadow {\r\n    stroke-width: 1px;\r\n    fill: none;\r\n}\r\n\r\n.tick line {\r\n    stroke: #ccc;\r\n}\r\n\r\n.predict {\r\n    fill: #e7f2fc;\r\n    fill-opacity: 0.6;\r\n}\r\n\r\n.ceil, .flor, .profit {\r\n    shape-rendering: auto;\r\n}\r\n\r\n.ceil, .flor {\r\n    stroke: #80b5ff;\r\n    fill: none;\r\n}\r\n\r\n.profit {\r\n    stroke: #e63232;\r\n    fill: none;\r\n}\r\n\r\n.volume {\r\n    stroke: #ccc;\r\n    fill: none;\r\n}\r\n\r\n.none {\r\n    display: none;\r\n}\r\n\r\n.poly path {\r\n    shape-rendering: auto;\r\n}\r\n\r\n/* 参考线 */\r\n.help {\r\n    stroke: #d8d8d8;\r\n}\r\n\r\n/* brush area */\r\n.brush-bar {\r\n    fill: none;\r\n    stroke: #ccc;\r\n}\r\n\r\n.selection {\r\n    fill: #2f84cc;\r\n    opacity: 0.4;\r\n    stroke: #000000;\r\n}\r\n\r\n/* #cd4343, #8c3037, #ffca53, #0055a2*/\r\n/* 均线 */\r\n.ma5, .ma10, .ma20, .ma30 {\r\n    fill:none;\r\n}\r\n\r\n.ma5 {\r\n    stroke: #cd4343;\r\n}\r\n\r\n.ma10 {\r\n    stroke: #8c3037;\r\n}\r\n\r\n.ma20 {\r\n    stroke: #ffca53;\r\n}\r\n\r\n.ma30 {\r\n    stroke: #0055a2;\r\n}\r\n\r\n/* macd */\r\n.macd {\r\n    shape-rendering:crispEdges;\r\n}\r\n.dea {\r\n    stroke: rgb(1, 67, 117);\r\n    fill: none;\r\n}\r\n.dif {\r\n    stroke: rgb(221, 34, 0);\r\n    fill: none;\r\n}", ""]);

	// exports


/***/ }
/******/ ]);