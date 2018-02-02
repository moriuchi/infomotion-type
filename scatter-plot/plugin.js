//http://bl.ocks.org/mbostock/3887118

ScatterPlot.defaultSettings = {
    "label" : "species",
    "xvalue": "sepalWidth",
    "yvalue": "sepalLength"
};

ScatterPlot.settings = EnebularIntelligence.SchemaProcessor([
        {
          type : "key", name : "label", help : "ラベルとなるデータのkeyを指定してください。"
        },{
          type : "key", name : "xvalue", help : "x軸の値を表すデータのkeyを指定してください。"
        },{
          type : "key", name : "yvalue", help : "y軸の値を表すデータのkeyを指定してください。"
        }
    ], ScatterPlot.defaultSettings);

function ScatterPlot(settings, options) {
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
                  .attr('class', 'scatterplot')
                  .attr('class', 'svgWrapper')
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom);

    this.base = this.svg.append("g")
      .attr("transform", "scale(1,1)translate(" + margin.left + "," + margin.top + ")");

    this.base.append("g")
        .attr("class", "x scatterplot__axis")
        .attr("transform", "translate(0," + that.height + ")")
        .call(that.xAxis)
        .append("text")
        .attr("class", "axis__label")
        .attr("x", width)
        .attr("y", -12)
        .attr("dy", "0.71em")
        .style("text-anchor", "end")
        .text(that.settings.xvalue);

    this.base.append("g")
        .attr("class", "y scatterplot__axis")
        .call(that.yAxis)
        .append("text")
        .attr("class", "axis__label")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", "0.71em")
        .style("text-anchor", "end")
        .text(that.settings.yvalue);

}

ScatterPlot.prototype.onDrillDown = function(cb) {
    this.onDrillDownListener = cb;
}


ScatterPlot.prototype.addData = function(data) {
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

ScatterPlot.prototype.clearData = function() {
    this.data = [];
    this.refresh();
}

ScatterPlot.prototype.calculate = function() {
    var that = this;
    var newdata = [];
    this.data.forEach(function(d) {
        var k = d[that.settings.label];
        var xval = d[that.settings.xvalue];
        var yval = d[that.settings.yvalue];
        newdata.push({
            key: k,
            xvalue: xval,
            yvalue: yval
        });
    });

    return newdata;
}

ScatterPlot.prototype.refresh = function() {
    var that = this;
    var data = this.calculate();
    var extentX = d3.extent(data, function(d) { return d.xvalue; });
    if (data.length == 0) {
        extentX = [0, 0];
    }
    var extentY = d3.extent(data, function(d) { return d.yvalue; });
    if (data.length == 0) {
        extentY = [0, 0];
    }
    this.x.domain(extentX).nice();
    this.y.domain(extentY).nice();

    var dot = this.base.selectAll(".dot").data(data);
    dot.enter().append("circle");

    dot.attr("class", "dot")
        .attr("r", 5)
        .attr("cx", function(d) { return that.x(d.xvalue); })
        .attr("cy", function(d) { return that.y(d.yvalue); })
        .style("fill", function(d) { return that.color(d.key); });

    dot.exit().remove();

    var legend = this.base.selectAll(".legend").data(that.color.domain());
    legend.enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

    legend.selectAll("rect").remove();
    legend.append("rect")
        .attr("x", that.width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", that.color);

    legend.selectAll("text").remove();
    legend.append("text")
        .attr("x", that.width - 24)
        .attr("y", 9)
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .text(function(d) { return d });

    legend.exit().remove();

    this.svg = d3.select(this.el).transition();

    this.svg.select(".x.scatterplot__axis")
        .attr("transform", "translate(0," + that.height + ")")
        .attr("x", that.width)
        .call(this.xAxis);

    this.svg.select(".y.scatterplot__axis")
        .call(this.yAxis);
}

ScatterPlot.prototype.resize = function(options) {
    var that = this;

    this.height = options.height - that.margin.top - that.margin.bottom;
    this.width = options.width - that.margin.left - that.margin.right;

    this.x.range([0, this.width]);
    this.y.range([this.height, 0]);

    this.refresh();

}

ScatterPlot.prototype.getEl = function() {
  return this.el;
}

window.EnebularIntelligence.register('scatter-plot', ScatterPlot);

module.exports = ScatterPlot;
