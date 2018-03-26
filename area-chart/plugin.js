//http://bl.ocks.org/mbostock/3883195

AreaChart.defaultSettings = {
    "label" : "date",
    "value": "close",
    "labelNames" : []
};

AreaChart.settings = EnebularIntelligence.SchemaProcessor([
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
    ], AreaChart.defaultSettings);

function AreaChart(settings, options) {
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

    this.svg = d3.select(this.el).append("svg")
                  .attr('class', 'areachart')
                  .attr('class', 'svgWrapper')
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom);

    this.base = this.svg.append("g")
      .attr("transform", "scale(1,1)translate(" + margin.left + "," + margin.top + ")");

    this.base.append("g")
        .attr("class", "x areachart__axis")
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
        .attr("class", "y areachart__axis")
        .call(that.yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", "0.71em")
        .style("text-anchor", "end");
//        .text(that.settings.value);

    this.base.append("g")
        .attr("class", "areachart__labels");
}

AreaChart.prototype.onDrillDown = function(cb) {
    this.onDrillDownListener = cb;
}


AreaChart.prototype.addData = function(data) {
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

AreaChart.prototype.clearData = function() {
    this.data = [];
    this.refresh( );
}

AreaChart.prototype.calculate = function() {
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

AreaChart.prototype.refresh = function() {
    var that = this;
    var data = this.calculate();
    var maxValue = d3.max(data, function(d) { return d.value; });
    this.x.domain(data.map(function(d) { return d.key; }));
//    this.x.domain(d3.extent(data, function(d) { return d.key; }));
    this.y.domain([0, maxValue]);

    var arealayout = d3.svg.area()
        .x(function(d) { return that.x(d.key)+that.x.rangeBand()/2; })
        .y0(that.height)
        .y1(function(d) { return that.y(d.value); });


    var area = this.base.selectAll(".areachart__area").data(new Array(data));
    area.enter().append("path");
    area.datum(data)
        .attr("class", "areachart__area area")
        .attr("d", arealayout);

    this.svg = d3.select(this.el).transition();

    this.svg.select(".x.areachart__axis")
        .duration(500)
        .attr("transform", "translate(0," + that.height + ")")
        .call(this.xAxis);

    this.svg.select(".y.areachart__axis")
        .duration(500)
        .call(this.yAxis);
}

AreaChart.prototype.resize = function(options) {
    var that = this;

    this.height = options.height - that.margin.top - that.margin.bottom;
    this.width = options.width - that.margin.left - that.margin.right;

    this.x.rangeRoundBands([0, this.width], .1);
    this.y.range([this.height, 0]);

    this.refresh();

}

AreaChart.prototype.getEl = function() {
  return this.el;
}

window.EnebularIntelligence.register('area-chart', AreaChart);

module.exports = AreaChart;
