//http://bl.ocks.org/mbostock/3883245

LineChartNagative.defaultSettings = {
    "label" : "date",
    "value": "negative",
    "labelNames" : []
};

LineChartNagative.settings = EnebularIntelligence.SchemaProcessor([
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
    ], LineChartNagative.defaultSettings);

function LineChartNagative(settings, options) {
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

    this.line = d3.svg.line()
        .x(function(d) { return that.x(d.key)+that.x.rangeBand()/2; })
        .y(function(d) { return that.y(d.value); });

    this.svg = d3.select(this.el).append("svg")
                  .attr('class', 'linechart')
                  .attr('class', 'svgWrapper')
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom);

    this.base = this.svg.append("g")
      .attr("transform", "scale(1,1)translate(" + margin.left + "," + margin.top + ")");

    this.base.append("g")
        .attr("class", "x linechart_nega__axis")
        .attr("transform", "translate(0," + that.height + ")")
        .call(that.xAxis)
        .append("text")
        .attr("transform", "rotate(0)")
        .attr("x", width + margin.left)
        .attr("y", 12)
        .attr("dy", "0.71em")
        .style("text-anchor", "end");

    this.base.append("g")
        .attr("class", "y linechart_nega__axis")
        .call(that.yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", "0.71em")
        .style("text-anchor", "end");

    this.base.append("g")
        .attr("class", "linechart__labels");
}

LineChartNagative.prototype.onDrillDown = function(cb) {
    this.onDrillDownListener = cb;
}


LineChartNagative.prototype.addData = function(data) {
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

LineChartNagative.prototype.clearData = function() {
    this.data = [];
    this.refresh( );
}

LineChartNagative.prototype.calculate = function() {
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

LineChartNagative.prototype.refresh = function() {
    var that = this;
    var data = this.calculate();
    var yextent = d3.extent(data, function(d) { return d.value; });
    if(isNaN(yextent[0])) yextent[0] = 0;
    if(isNaN(yextent[1])) yextent[1] = 0;
    this.x.domain(data.map(function(d) { return d.key; }));
    this.y.domain(yextent);

    var line = this.base.selectAll(".linechart__line").data(new Array(data));
    line.enter().append("path");
    line.datum(data)
        .attr("class", "linechart__line line")
        .attr("d", that.line);

    this.svg = d3.select(this.el).transition();

    this.svg.select(".x.linechart_nega__axis")
        .duration(500)
        .attr("transform", "translate(0," + this.y(0) + ")")
        .call(this.xAxis);

    this.svg.select(".y.linechart_nega__axis")
        .duration(500)
        .call(this.yAxis);
}

LineChartNagative.prototype.resize = function(options) {
    var that = this;

    this.height = options.height - that.margin.top - that.margin.bottom;
    this.width = options.width - that.margin.left - that.margin.right;

    this.x.rangeRoundBands([0, this.width], .1);
    this.y.range([this.height, 0]);

    this.refresh();

}

LineChartNagative.prototype.getEl = function() {
  return this.el;
}

window.EnebularIntelligence.register('line-chart-nagative', LineChartNagative);

module.exports = LineChartNagative;
