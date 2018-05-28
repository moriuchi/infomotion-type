//http://bl.ocks.org/d3noob/e34791a32a54e015f57d

LineChartDual.defaultSettings = {
    "label" : "date",
    "leftValue": "frequency",
    "rightValue": "volume",
    "labelNames" : []
};

LineChartDual.settings = EnebularIntelligence.SchemaProcessor([
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
    ], LineChartDual.defaultSettings);

function LineChartDual(settings, options) {
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

    this.line = d3.svg.line()
        .x(function(d) { return that.x(d.key)+that.x.rangeBand()/2; })
        .y(function(d) { return that.y0(d.leftValue); });

    this.line2 = d3.svg.line()
        .x(function(d) { return that.x(d.key)+that.x.rangeBand()/2; })
        .y(function(d) { return that.y1(d.rightValue); });

    this.svg = d3.select(this.el).append("svg")
                  .attr('class', 'linechart')
                  .attr('class', 'svgWrapper')
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom);

    this.base = this.svg.append("g")
      .attr("transform", "scale(1,1)translate(" + margin.left + "," + margin.top + ")");

    this.base.append("g")
        .attr("class", "x linechartdual__axis")
        .attr("transform", "translate(0," + that.height + ")")
        .call(that.xAxis)
        .append("text")
        .attr("transform", "rotate(0)")
        .attr("x", width + margin.left)
        .attr("y", 12)
        .attr("dy", "0.71em")
        .style("text-anchor", "end");

    this.base.append("g")
        .attr("class", "yLeft linechartdual__axis")
        .call(that.yAxisLeft)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", "0.71em")
        .style("fill", "steelblue")
        .style("text-anchor", "end")
        .text(that.settings.leftValue);

    this.base.append("g")
        .attr("class", "yRight linechartdual__axis")
        .call(that.yAxisRight.ticks(10))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -15)
        .attr("dy", "0.71em")
        .style("fill", "orange")
        .style("text-anchor", "end")
        .text(that.settings.rightValue);

}

LineChartDual.prototype.onDrillDown = function(cb) {
    this.onDrillDownListener = cb;
}


LineChartDual.prototype.addData = function(data) {
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

LineChartDual.prototype.clearData = function() {
    this.data = [];
    this.refresh( );
}

LineChartDual.prototype.calculate = function() {
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

LineChartDual.prototype.refresh = function() {
    var that = this;
    var data = this.calculate();
    var leftMax = (data.length === 0)? 0 : d3.max(data, function(d) { return d.leftValue; });
    var rightMax = (data.length === 0)? 0 : d3.max(data, function(d) { return d.rightValue; });
    this.x.domain(data.map(function(d) { return d.key; }));
    this.y0.domain([0, leftMax]);
    this.y1.domain([0, rightMax]);

    var line = this.base.selectAll(".linechart__line").data(new Array(data));
    line.enter().append("g")
        .attr("class", "linechart__line")
        .datum(data);

    line.selectAll("path").remove();
    line.append("path")
        .attr("class", "line1")
        .attr("d", that.line);

    line.append("path")
        .attr("class", "line2")
        .attr("d", that.line2);

    line.exit().remove();

    this.svg = d3.select(this.el).transition();

    this.svg.select(".x.linechartdual__axis")
        .duration(500)
        .attr("transform", "translate(0," + that.height + ")")
        .call(this.xAxis);

    this.svg.select(".yLeft.linechartdual__axis")
        .duration(500)
        .attr("transform", "translate(0,0)")
        .call(this.yAxisLeft);

    this.svg.select(".yRight.linechartdual__axis")
        .duration(500)
        .attr("transform", "translate(" + that.width + ",0)")
        .call(this.yAxisRight);

}

LineChartDual.prototype.resize = function(options) {
    var that = this;

    this.height = options.height - that.margin.top - that.margin.bottom;
    this.width = options.width - that.margin.left - that.margin.right;

    this.x.rangeRoundBands([0, this.width], .1);
    this.y0.range([this.height, 0]);
    this.y1.range([this.height, 0]);

    this.refresh();

}

LineChartDual.prototype.getEl = function() {
  return this.el;
}

window.EnebularIntelligence.register('line-chart-dual-scale', LineChartDual);

module.exports = LineChartDual;
