//http://bl.ocks.org/mbostock/3884955

MultiLineChart.defaultSettings = {
    "label" : "date",
    "values":[
        {"header":"New York", "value":"NewYork"},
        {"header":"San Francisco", "value":"SanFrancisco"},
        {"header":"Austin", "value":"Austin"}
    ]
};

MultiLineChart.settings = EnebularIntelligence.SchemaProcessor([
        {
          type : "key", name : "label", help : "ラベルとなるデータのkeyを指定してください。"
        },
        {
          type : "list", name : "values", help : "値を表すデータのkeyを指定してください。", children:[{ 
              type : "text", name : "header"
          },{
              type : "key", name : "value"
          }]
        }
    ], MultiLineChart.defaultSettings);

function MultiLineChart(settings, options) {
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

    this.line = d3.svg.line()
//        .x(function(d) { return that.x(d.key); })
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
        .attr("class", "x linechart__axis")
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
        .attr("class", "y linechart__axis")
        .call(that.yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", "0.71em")
        .style("text-anchor", "end");
//        .text(that.settings.value);

    this.base.append("g")
        .attr("class", "linechart__labels");
}

MultiLineChart.prototype.onDrillDown = function(cb) {
    this.onDrillDownListener = cb;
}


MultiLineChart.prototype.addData = function(data) {
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

MultiLineChart.prototype.clearData = function() {
    this.data = [];
    this.refresh( );
}

MultiLineChart.prototype.calculate = function() {
    var that = this;
    var newdata = {};
    this.data.forEach(function(d) {
        var k = d[that.settings.label];
        if(!k) return;
        var keydata = {};
        if(!newdata[k]) {
            newdata[k] = {};
            that.keys.forEach(function(v) { keydata[v] = 0; });
        } else {
            keydata = newdata[k];
        }
        that.keys.forEach(function(v) { 
//            keydata[v] += d[v];
            keydata[v] += (isNaN(d[v]))? 0 : d[v];
        });
        newdata[k] = keydata;
    });
    var returndata = that.keys.map(function(v) { 
        return {
            id: v,
            values: Object.keys(newdata).map(function(k) {
                return {
                    key: k,
                    value: newdata[k][v]
                }
            })
        }
    });
    returndata["valuekeys"] = Object.keys(newdata);
    return returndata;
}

MultiLineChart.prototype.refresh = function() {
    var that = this;
    this.keys = that.settings.values.map(function(d) { return d.value; });
    var data = this.calculate();
    var valuekeys = data.valuekeys;
    delete data.valuekeys;

    var maxValue = d3.max(data, function(d) { return d3.max(d.values, function(d) { return d.value; }); });
    var minValue = d3.min(data, function(d) { return d3.min(d.values, function(d) { return d.value; }); });

    this.x.domain(valuekeys);
//    this.x.domain(d3.extent(valuekeys));
//    this.y.domain([0, maxValue]);
    this.y.domain([minValue, maxValue]);
    this.color.domain(that.keys);

    var line = this.base.selectAll(".linechart__line").data(data);
    line.enter().append("g");
    line.attr("class", "linechart__line");
    line.exit().remove();

    line.selectAll(".line").remove();
    line.append("path")
        .attr("class", "line")
        .attr("d", function(d) { return that.line(d.values); })
        .style("stroke", function(d) { return that.color(d.id); });

    line.selectAll("text").remove();
    line.append("text")
        .datum(function(d) { 
            return {id: d.id, 
                    value: d.values[d.values.length - 1], 
                    value2: d.values[d.values.length - 2]
        };})
        .attr("transform", function(d) {
            var ydiff = that.y(d.value2.value)-that.y(d.value.value);
            return "translate(" + that.x(d.value.key) + "," + (that.y(d.value.value)+ydiff/2) + ")"; 
        })
        .attr("x", 3)
        .attr("dy", "0.71em")
        .attr("fill", function(d) { return that.color(d.id); })
        .attr("font-family", "sans-serif")
        .text(function(d) { return d.id; });

    this.svg = d3.select(this.el).transition();

    this.svg.select(".x.linechart__axis")
        .duration(500)
        .attr("transform", "translate(0," + that.height + ")")
        .call(this.xAxis);

    this.svg.select(".y.linechart__axis")
        .duration(500)
        .call(this.yAxis);
}

MultiLineChart.prototype.resize = function(options) {
    var that = this;

    this.height = options.height - that.margin.top - that.margin.bottom;
    this.width = options.width - that.margin.left - that.margin.right;

    this.x.rangeRoundBands([0, this.width], .1);
    this.y.range([this.height, 0]);

    this.refresh();

}

MultiLineChart.prototype.getEl = function() {
  return this.el;
}

window.EnebularIntelligence.register('multi-line-chart', MultiLineChart);

module.exports = MultiLineChart;
