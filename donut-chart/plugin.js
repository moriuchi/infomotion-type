//http://bl.ocks.org/mbostock/3887193

DonutChart.defaultSettings = {
    "label" : "lang",
    "value": "ss",
    "labelNames" : []
};

DonutChart.settings = EnebularIntelligence.SchemaProcessor([
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
    ], DonutChart.defaultSettings);

function DonutChart(settings, options) {
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
    this.radius = Math.min(this.width, this.height) / 2;

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

    this.arc = d3.svg.arc()
        .outerRadius(this.radius - 10)
        .innerRadius(this.radius - 70);

    this.pie = d3.layout.pie()
        .sort(null)
        .value(function(d) { return d.value; });

    this.svg = d3.select(this.el).append("svg")
                  .attr('class', 'donutchart')
                  .attr('class', 'svgWrapper')
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom);

    this.base = this.svg.append("g")
      .attr("transform", "scale(1,1)translate(" + margin.left + "," + margin.top + ")");

}

DonutChart.prototype.onDrillDown = function(cb) {
    this.onDrillDownListener = cb;
}


DonutChart.prototype.addData = function(data) {
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

DonutChart.prototype.clearData = function() {
    this.data = [];
    this.refresh( );
}

DonutChart.prototype.calculate = function() {
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

DonutChart.prototype.refresh = function() {
    var that = this;
    var data = this.calculate();
    var maxValue = d3.max(data, function(d) { return d.value; });
    this.x.domain(data.map(function(d) { return d.key; }));
    this.y.domain([0, maxValue]);
    this.color.domain(data.map(function(d) { return d.key; }));

    this.base.selectAll(".donutchart__group").remove();

    var dgroup = this.base.append("g")
        .attr("class", "donutchart__group")
        .attr("transform", "translate(" + that.width/2 + "," + that.height/2 + ")");

    var donut = dgroup.selectAll(".donutchart__arc").data(that.pie(data));
    donut.enter().append("g");
    donut.attr("class", "donutchart__arc");

    donut.append("path")
        .attr("d", that.arc)
        .attr("fill", function(d) { return that.color(d.data.key); });

    donut.append("text")
      .attr("transform", function(d) { return "translate(" + that.arc.centroid(d) + ")"; })
      .attr("dy", "0.35em")
      .text(function(d) { return d3.format(",")(d.data.value); });

    donut.exit().remove();

    this.svg = d3.select(this.el).transition();

    this.base.selectAll(".legend").remove();

    var legend = this.base.selectAll(".legend").data(data);
    legend.enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; })
        .style("font", "10px sans-serif");

    legend.append("rect")
        .attr("x", that.width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", function(d) { return that.color(d.key); });

    legend.append("text")
        .attr("x", that.width - 24)
        .attr("y", 9)
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .text(function(d) { return d.key; });
}

DonutChart.prototype.resize = function(options) {
    var that = this;

    this.height = options.height - that.margin.top - that.margin.bottom;
    this.width = options.width - that.margin.left - that.margin.right;
    this.radius = Math.min(this.width, this.height) / 2;

    this.x.rangeRoundBands([0, this.width], .1);
    this.y.range([this.height, 0]);

    this.refresh();

}

DonutChart.prototype.getEl = function() {
  return this.el;
}

window.EnebularIntelligence.register('donut-chart', DonutChart);

module.exports = DonutChart;
