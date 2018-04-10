//https://bl.ocks.org/mbostock/2368837


BarChartNegative.defaultSettings = {
    "label" : "key",
    "value": "negative",
    "labelNames" : []
};

BarChartNegative.settings = EnebularIntelligence.SchemaProcessor([
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
    ], BarChartNegative.defaultSettings);

function BarChartNegative(settings, options) {
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

    this.x = d3.scale.linear()
      .range([0, width]);

    this.y = d3.scale.ordinal()
      .rangeRoundBands([0, height], .1);

    this.xAxis = d3.svg.axis()
      .scale(this.x)
      .orient("bottom");

    this.yAxis = d3.svg.axis()
      .scale(this.y)
      .orient("left")
      .tickSize(0)
      .tickPadding(6);

    this.svg = d3.select(this.el).append("svg")
                  .attr('class', 'svgWrapper barchart')
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom);

    this.base = this.svg.append("g")
      .attr("transform", "scale(1,1)translate(" + margin.left + "," + margin.top + ")");

    this.base.append("g")
        .attr("class", "x barchart_nega__axis")
        .attr("transform", "translate(0," + that.height + ")")
        .call(that.xAxis)
        .append("text")
        .attr("transform", "rotate(0)")
        .attr("x", width + margin.left)
        .attr("y", 12)
        .attr("dy", "0.71em")
        .style("text-anchor", "end");

    this.yAxis_tick = this.base.append("g")
        .attr("class", "y barchart_nega__axis");
    this.yAxis_tick.append("path").attr("class", "domain");
}

BarChartNegative.prototype.onDrillDown = function(cb) {
    this.onDrillDownListener = cb;
}


BarChartNegative.prototype.addData = function(data) {
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

BarChartNegative.prototype.clearData = function() {
    this.data = [];
    this.refresh( );
}

BarChartNegative.prototype.calculate = function() {
    var that = this;
    var newdata = {};
    this.data.forEach(function(d) {
        var k = d[that.settings.label],
            val = d[that.settings.value];
        if(!k) return;
        if(!newdata[k]) newdata[k] = 0;
        newdata[k] += (isNaN(val))? 0 : val;
    });
    return Object.keys(newdata).map(function(k) {
        return {
            key : k,
            value : newdata[k]
        }
    });
}

BarChartNegative.prototype.refresh = function() {
    var that = this;
    var data = this.calculate();
    var xextent = d3.extent(data, function(d) { return d.value; });
    if(isNaN(xextent[0])) xextent[0] = 0;
    if(isNaN(xextent[1])) xextent[1] = 0;
    this.x.domain(xextent).nice();
    this.y.domain(data.map(function(d) { return d.key; }));

    var bar = this.base.selectAll(".barchart__bar").data(data);
    bar.enter().append("rect");

    bar.attr("class", function(d) { return "barchart__bar bar__" + (d.value < 0 ? "negative" : "positive"); })
        .attr("x", function(d) { return that.x(Math.min(0, d.value)); })
        .attr("y", function(d) { return that.y(d.key); })
        .attr("width", function(d) { return Math.abs(that.x(d.value) - that.x(0)); })
        .attr("height", that.y.rangeBand());

    bar.exit().remove();

    this.svg = d3.select(this.el).transition();

    this.svg.select(".x.barchart_nega__axis")
        .attr("transform", "translate(0," + that.height + ")")
        .call(this.xAxis);

    this.yAxis_tick
        .attr("transform", "translate(" + that.x(0) + ",0)");
    this.yAxis_tick.selectAll(".domain")
        .attr("d", "M0,0H0V"+that.height+"H0");

    var ytick = this.yAxis_tick.selectAll(".tick").data(data);
    ytick.enter().append("g")
        .attr("class", "tick")
        .attr("transform", function(d) { return "translate(0," + (that.y(d.key)+that.y.rangeBand()/2) + ")"; })
        .style("opacity", 1);
    ytick.selectAll("line").remove();
    ytick.append("line").attr("x2", 0).attr("y2", 0);
    ytick.selectAll("text").remove();
    ytick.append("text").attr("dy", ".32em").attr("y", 0)
        .attr("x", function(d) { return (d.value < 0)? 6 : -6; })
        .style("text-anchor", function(d) { return (d.value < 0)? "start" : "end"; })
        .text(function(d) { return d.key; });

}

BarChartNegative.prototype.resize = function(options) {
    var that = this;

    this.height = options.height - that.margin.top - that.margin.bottom;
    this.width = options.width - that.margin.left - that.margin.right;

    this.x.range([0, this.width]);
    this.y.rangeRoundBands([0, this.height], .1);

    this.refresh();

}

BarChartNegative.prototype.getEl = function() {
  return this.el;
}

window.EnebularIntelligence.register('bar-chart-negative', BarChartNegative);

module.exports = BarChartNegative;
