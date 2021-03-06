//http://bl.ocks.org/Caged/6476579
//https://www.npmjs.com/package/d3-tooltip

var d3tooltip = require('./d3-tooltip.js');

BarChartTooltips.defaultSettings = {
    "label" : "letter",
    "value": "frequency",
    "labelNames" : []
};

BarChartTooltips.settings = EnebularIntelligence.SchemaProcessor([
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
    ], BarChartTooltips.defaultSettings);

function BarChartTooltips(settings, options) {
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

    this.tooltip = d3tooltip(d3);

    this.svg = d3.select(this.el).append("svg")
                  .attr('class', 'barchart')
                  .attr('class', 'svgWrapper')
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom);

    this.base = this.svg.append("g")
      .attr("transform", "scale(1,1)translate(" + margin.left + "," + margin.top + ")");

    this.base.append("g")
        .attr("class", "x barchart__axis")
        .attr("transform", "translate(0," + that.height + ")")
        .call(that.xAxis)
        .append("text")
        .attr("transform", "rotate(0)")
        .attr("x", width + margin.left)
        .attr("y", 12)
        .attr("dy", "0.71em")
        .style("text-anchor", "end");
//        .text(that.settings.label);

    this.base.append("g")
        .attr("class", "y barchart__axis")
        .call(that.yAxis.ticks(10, "%"))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", "0.71em")
        .style("text-anchor", "end")
        .text(that.settings.value);

    this.base.append("g")
        .attr("class", "barchart__labels");
}

BarChartTooltips.prototype.onDrillDown = function(cb) {
    this.onDrillDownListener = cb;
}


BarChartTooltips.prototype.addData = function(data) {
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

BarChartTooltips.prototype.clearData = function() {
    this.data = [];
    this.refresh( );
}

BarChartTooltips.prototype.calculate = function() {
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

BarChartTooltips.prototype.refresh = function() {
    var that = this;
    var data = this.calculate();
    var maxValue = d3.max(data, function(d) { return d.value; });
    this.x.domain(data.map(function(d) { return d.key; }));
    this.y.domain([0, maxValue]);

    var bar = this.base.selectAll(".barchart__bar").data(data);
    bar.enter().append("rect").on('mouseover', function(d) {
            var html = "<strong>" + that.settings.value + ":</strong> "
                    + "<span style='color:red'>" + d.value + "</span>";

            that.tooltip.html(html);
            that.tooltip.show();
        })
        .on('mouseout', function(){
            that.tooltip.hide();
        });

    bar.attr("class", "barchart__bar bar")
        .transition()
        .duration(500)
        .attr("x", function(d) { return that.x(d.key); })
        .attr("width", that.x.rangeBand())
        .attr("y", function(d) { return that.y(d.value); })
        .attr("height", function(d) { return that.height - that.y(d.value); });

    bar.exit().remove();

    var valLabel = this.base.selectAll(".barchart__vallabel").data(data);
    valLabel.enter().append('text');
    valLabel.attr("class", "barchart__vallabel")
        .transition()
        .duration(500)
        .attr("x", function(d) {
            return that.x(d.key)+that.x.rangeBand()/2-d.value.toString().length*3;
        })
        .attr("y", function(d, i) { return that.height; })
        .attr("dy", "-1em");

    valLabel.exit().remove();

    this.svg = d3.select(this.el).transition();

    this.svg.select(".x.barchart__axis")
        .duration(500)
        .attr("transform", "translate(0," + that.height + ")")
        .call(this.xAxis);

    this.svg.select(".y.barchart__axis")
        .duration(500)
        .call(this.yAxis);

    var tip = d3.selectAll(".d3-tooltip")
        .attr('class', 'd3-tooltip d3-tip n');
}

BarChartTooltips.prototype.resize = function(options) {
    var that = this;

    this.height = options.height - that.margin.top - that.margin.bottom;
    this.width = options.width - that.margin.left - that.margin.right;

    this.x.rangeRoundBands([0, this.width], .1);
    this.y.range([this.height, 0]);

    this.refresh();

}

BarChartTooltips.prototype.getEl = function() {
  return this.el;
}

window.EnebularIntelligence.register('bar-chart-tooltips', BarChartTooltips);

module.exports = BarChartTooltips;
