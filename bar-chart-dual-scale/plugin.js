//https://github.com/liufly/Dual-scale-D3-Bar-Chart

BarChartDual.defaultSettings = {
    "label" : "key",
    "leftValue": "frequency",
    "rightValue": "volume",
    "labelNames" : []
};

BarChartDual.settings = EnebularIntelligence.SchemaProcessor([
        {
          type : "key", name : "label", help : "ラベルとなるデータのkeyを指定してください。"
        },{
          type : "key", name : "leftValue", help : "値を表すデータのkeyを指定してください。"
        },{
          type : "key", name : "rightValue", help : "値を表すデータのkeyを指定してください。"
        },{
          type : "list", name : "labelNames", help : "ラベルの表示名を設定します（オプション）", children:[{
              type : "text", name : "key"
          },{
              type : "text", name : "value"
          }]
        }
    ], BarChartDual.defaultSettings);

function BarChartDual(settings, options) {
    var that = this;
    this.el = document.createElement('div');
    this.settings = settings;
    this.options = options;
    this.data = [];

    var margin = {top: 50, right: 60, bottom: 50, left: 60},
        width = (options.width || 700) - margin.left - margin.right,
        height = (options.height || 500) - margin.top - margin.bottom;

    this.width = width;
    this.height = height;
    this.margin = margin;

    this.x = d3.scale.ordinal()
      .rangeRoundBands([0, width], .1);

    this.y0 = d3.scale.linear()
      .range([height, 0]);

    this.y1 = d3.scale.linear()
      .range([height, 0]);

    this.xAxis = d3.svg.axis()
      .scale(this.x)
      .orient("bottom");

    this.yAxisLeft = d3.svg.axis()
      .scale(this.y0)
      .orient("left");

    this.yAxisRight = d3.svg.axis()
      .scale(this.y1)
      .orient("right");

    this.svg = d3.select(this.el).append("svg")
                  .attr('class', 'barchart')
                  .attr('class', 'svgWrapper')
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom);

    this.base = this.svg.append("g")
      .attr("transform", "scale(1,1)translate(" + margin.left + "," + margin.top + ")");

    this.base.append("g")
        .attr("class", "x barchartdual__axis")
        .attr("transform", "translate(0," + that.height + ")")
        .call(that.xAxis)
        .append("text")
        .attr("transform", "rotate(0)")
        .attr("x", width + margin.left)
        .attr("y", 12)
        .attr("dy", "0.71em")
        .style("text-anchor", "end");

    this.base.append("g")
        .attr("class", "yLeft barchartdual__axis")
        .call(that.yAxisLeft.ticks(10))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", "0.71em")
        .style("fill", "steelblue")
        .style("text-anchor", "end")
        .text(that.settings.leftValue);

    this.base.append("g")
        .attr("class", "yRight barchartdual__axis")
        .call(that.yAxisRight.ticks(10))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -15)
        .attr("dy", "0.71em")
        .style("fill", "orange")
        .style("text-anchor", "end")
        .text(that.settings.rightValue);

}

BarChartDual.prototype.onDrillDown = function(cb) {
    this.onDrillDownListener = cb;
}


BarChartDual.prototype.addData = function(data) {
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

BarChartDual.prototype.clearData = function() {
    this.data = [];
    this.refresh( );
}

BarChartDual.prototype.calculate = function() {
    var that = this;
    var newdata = {};
    this.data.forEach(function(d) {
        var k = d[that.settings.label]
            left = d[that.settings.leftValue],
            right = d[that.settings.rightValue];
        if(!k) return;
        if(!newdata[k]){
            newdata[k] = {"left": 0, "right": 0};
        }
        newdata[k]["left"] += (isNaN(left))? 0 : left;
        newdata[k]["right"] += (isNaN(right))? 0 : right;
    });
    return Object.keys(newdata).map(function(k) {
        return {
            key : k,
            leftValue : newdata[k]["left"],
            rightValue : newdata[k]["right"]
        }
    });
}

BarChartDual.prototype.refresh = function() {
    var that = this;
    var data = this.calculate();
    var leftMax = (data.length === 0)? 0 : d3.max(data, function(d) { return d.leftValue; });
    var rightMax = (data.length === 0)? 0 : d3.max(data, function(d) { return d.rightValue; });
    this.x.domain(data.map(function(d) { return d.key; }));
    this.y0.domain([0, leftMax]);
    this.y1.domain([0, rightMax]);

    var bar = this.base.selectAll(".barchartdual__bar").data(data);
    bar.enter().append("g").attr("class", "barchartdual__bar");

    bar.selectAll("rect").remove();
    bar.append("rect")
        .attr("class", "bar1")
        .transition()
        .duration(500)
        .attr("x", function(d) { return that.x(d.key); })
        .attr("width", (that.x.rangeBand()/2))
        .attr("y", function(d) { return that.y0(d.leftValue); })
        .attr("height", function(d) { return that.height - that.y0(d.leftValue); });

    bar.append("rect")
        .attr("class", " bar2")
        .transition()
        .duration(500)
        .attr("x", function(d) { return (that.x(d.key) + that.x.rangeBand()/2); })
        .attr("width", (that.x.rangeBand()/2))
        .attr("y", function(d) { return that.y1(d.rightValue); })
        .attr("height", function(d) { return that.height - that.y1(d.rightValue); });

    bar.exit().remove();

    this.svg = d3.select(this.el).transition();

    this.svg.select(".x.barchartdual__axis")
        .duration(500)
        .attr("transform", "translate(0," + that.height + ")")
        .call(this.xAxis);

    this.svg.select(".yLeft.barchartdual__axis")
        .duration(500)
        .attr("transform", "translate(0,0)")
        .call(this.yAxisLeft);

    this.svg.select(".yRight.barchartdual__axis")
        .duration(500)
        .attr("transform", "translate(" + that.width + ",0)")
        .call(this.yAxisRight);
}

BarChartDual.prototype.resize = function(options) {
    var that = this;

    this.height = options.height - that.margin.top - that.margin.bottom;
    this.width = options.width - that.margin.left - that.margin.right;

    this.x.rangeRoundBands([0, this.width], .1);
    this.y0.range([this.height, 0]);
    this.y1.range([this.height, 0]);

    this.refresh();

}

BarChartDual.prototype.getEl = function() {
  return this.el;
}

window.EnebularIntelligence.register('bar-chart-dual-scale', BarChartDual);

module.exports = BarChartDual;
