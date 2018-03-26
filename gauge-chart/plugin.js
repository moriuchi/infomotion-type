//http://bl.ocks.org/brattonc/5e5ce9beee483220e2f6

var gaugechart = require('./gaugechart.js');

GaugeChart.defaultSettings = {
    "label" : "lang",
    "value": "ss",
    "labelNames" : []
};

GaugeChart.settings = EnebularIntelligence.SchemaProcessor([
        {
          type : "key", name : "label", help : "ラベルとなるデータのkeyを指定してください。"
        },{
          type : "key", name : "value", help : "値を表すデータのkeyを指定してください。"
        },{
          type : "list", name : "labelNames", help : "ラベルの表示名を設定します（オプション）", children:[{
              type : "text", name : "key"
          },{
              type : "text", name : "value"
          }]
        }
    ], GaugeChart.defaultSettings);

function GaugeChart(settings, options) {
    var that = this;
    this.el = document.createElement('div');
    this.settings = settings;
    this.options = options;
    this.data = [];

    var margin = {top: 50, right: 50, bottom: 50, left: 40},
        width = (options.width || 700) - margin.left - margin.right,
        height = (options.height || 500) - margin.top - margin.bottom;

    this.width = width;
    this.height = height;
    this.margin = margin;

    this.x = d3.scale.ordinal()
      .rangeRoundBands([0, width], .1);

    this.y = d3.scale.linear()
      .range([height, 0]);

    this.xAxis = d3.svg.axis()
      .scale(this.x)
      .orient("bottom");

    this.yAxis = d3.svg.axis()
      .scale(this.y)
      .orient("left");

    this.color = d3.scale.category10();

    this.svg = d3.select(this.el).append("svg")
                  .attr('class', 'gaugechart')
                  .attr('class', 'svgWrapper')
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom);

    this.base = this.svg.append("g")
      .attr("transform", "scale(1,1)translate(" + margin.left + "," + margin.top + ")");


    this.base.append("g")
        .attr("class", "x gaugechart__axis")
        .attr("transform", "translate(0," + that.height + ")")
        .call(that.xAxis)
        .append("text")
        .attr("transform", "rotate(0)")
        .attr("x", width + margin.left)
        .attr("y", 12)
        .attr("dy", "0.71em")
        .style("text-anchor", "end");
}

GaugeChart.prototype.onDrillDown = function(cb) {
    this.onDrillDownListener = cb;
}


GaugeChart.prototype.addData = function(data) {
    var that = this;
    if(data instanceof Array) {
        data.forEach(function(d) {
            that.data.push(d);
        });
        this.refresh();
    }else{
        this.data = [];
        this.data.push(data);
        this.refresh();
    }
}

GaugeChart.prototype.clearData = function() {
    this.data = [];
    this.refresh( );
}

GaugeChart.prototype.calculate = function() {
    var that = this;
    var newdata = {};
    this.data.forEach(function(d) {
        var k = d[that.settings.label];
        if(!k) return;
        if(!newdata[k]) newdata[k] = 0;
//        newdata[k] += d[that.settings.value];
        newdata[k] += (isNaN(d[that.settings.value]))? 0 : d[that.settings.value];
    });
    return Object.keys(newdata).map(function(k) {
        return {
            key : k,
            value : newdata[k]
        }
    });
}

GaugeChart.prototype.refresh = function() {
    var that = this;
    var data = this.calculate();
    var maxValue = d3.max(data, function(d) { return d.value; });
    this.x.domain(data.map(function(d) { return d.key; }));
    this.y.domain([0, maxValue]);
    this.color.domain(data.map(function(d) { return d.key; }));

    var ggroup = this.base.selectAll(".gaugechart__group").data(data);
    ggroup.enter().append("g");

    ggroup
        .attr("id", function(d, i) { return "gaugechart" + i; })
        .attr("class", "gaugechart__group")
        .attr("transform", function(d) { return "translate(" + that.x(d.key) + ",0)"; })
        .attr("width", that.x.rangeBand())
        .attr("height", that.height);

    ggroup.selectAll("g").remove();
    var gauge = gaugechart();
    gauge.defaultSettings.maxValue = maxValue;

    data.forEach(function(d, i) {
        gauge.defaultSettings.elementId = "gaugechart"+i;
        gauge.defaultSettings.value = d.value;
        gauge.defaultSettings.circleColor = that.color(d.key);
        gauge.defaultSettings.waveColor = that.color(d.key);
        gauge.drawGauge();
    });

    ggroup.exit().remove();

    this.svg = d3.select(this.el).transition();

    this.svg.select(".x.gaugechart__axis")
        .duration(500)
        .attr("transform", "translate(0," + that.height + ")")
        .call(this.xAxis);

}

GaugeChart.prototype.resize = function(options) {
    var that = this;

    this.height = options.height - that.margin.top - that.margin.bottom;
    this.width = options.width - that.margin.left - that.margin.right;

    this.x.rangeRoundBands([0, this.width], .1);
    this.y.range([this.height, 0]);

    this.refresh();

}

GaugeChart.prototype.getEl = function() {
  return this.el;
}

window.EnebularIntelligence.register('gauge-chart', GaugeChart);

module.exports = GaugeChart;
