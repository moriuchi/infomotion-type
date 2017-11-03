//https://bl.ocks.org/mbostock/8d2112a115ad95f4a6848001389182fb

var scaleRadial = require('./d3-scale-radial.js');


RadialStackedChart.defaultSettings = {
    "label" : "State",
    "values":[
        {"header":"Under 5 Years", "value":"Under5Years"},
        {"header":"5 to 13 Years", "value":"5to13Years"},
        {"header":"14 to 17 Years", "value":"14to17Years"},
        {"header":"18 to 24 Years", "value":"18to24Years"},
        {"header":"25 to 44 Years", "value":"25to44Years"},
        {"header":"45 to 64 Years", "value":"45to64Years"},
        {"header":"65 Years and Over", "value":"65YearsandOver"}
    ]
};

RadialStackedChart.settings = EnebularIntelligence.SchemaProcessor([
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
    ], RadialStackedChart.defaultSettings);

function RadialStackedChart(settings, options) {
    var that = this;
    this.el = document.createElement('div');
    this.settings = settings;
    this.options = options;
    this.data = [];

    var margin = {top: 50, right: 50, bottom: 50, left: 50},
        width = (options.width || 700) - margin.left - margin.right,
        height = (options.height || 500) - margin.top - margin.bottom;

    this.width = width;
    this.height = height;
    this.margin = margin;
    this.outerRadius = Math.round(Math.min(width, height) / 2) + 20;
    this.innerRadius = this.outerRadius * 0.45;

    this.x = d3.scale.ordinal()
        .rangeBands([0, 2 * Math.PI]);

    this.y = scaleRadial()
        .range([this.innerRadius, this.outerRadius]);

    this.color = d3.scale.ordinal()
        .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

    this.svg = d3.select(this.el).append("svg")
                  .attr('class', 'svgWrapper')
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom);

    this.base = this.svg.append("g")
      .attr("transform", "scale(1,1)translate(" + margin.left + "," + margin.top + ")");

    this.radial = this.base.append("g").attr("class", "stackedchart__radial");
    this.labels = this.base.append("g").attr("class", "stackedchart__labels");
    this.ticks = this.base.append("g").attr("class", "stackedchart__ticks").attr("text-anchor", "middle");
    this.legends = this.base.append("g").attr("class", "stackedchart__legends");

//------ drawing tick marks ------
    var yTick = this.ticks.selectAll("g").data(that.y.ticks(5).slice(1));
    yTick.enter().append("g");

    yTick.append("circle")
    .attr("fill", "none")
    .attr("stroke", "#000")
    .attr("r", that.y);

    yTick.append("text")
    .attr("y", function(d) { return -that.y(d); })
    .attr("dy", "0.35em")
    .attr("fill", "none")
    .attr("stroke", "#fff")
    .attr("stroke-width", 5)
    .attr("stroke-linejoin", "round")
    .text(that.y.tickFormat(5, "%"));

    yTick.append("text")
    .attr("y", function(d) { return -that.y(d); })
    .attr("dy", "0.35em")
    .text(that.y.tickFormat(5, "%"));
//--------------


//------ drawing legend ------
    var legend = this.legends.selectAll("g").data(that.settings.values);
    legend.enter().append("g")
        .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

    legend.append("rect")
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", function(d) { return that.color(d.value); });

    legend.append("text")
        .attr("x", 24)
        .attr("y", 9)
        .attr("dy", "0.35em")
        .text(function(d) { return d.header; });

//--------------

}

RadialStackedChart.prototype.onDrillDown = function(cb) {
    this.onDrillDownListener = cb;
}


RadialStackedChart.prototype.addData = function(data) {
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

RadialStackedChart.prototype.clearData = function() {
    this.data = [];
    this.refresh();
}

RadialStackedChart.prototype.calculate = function() {
    var that = this;

    if (!this.data) {
        return { total : 0 };
    }

    var newdata = {};
    this.data.forEach(function(d) {
        var k = d[that.settings.label];
        var keydata = {};
        if(!newdata[k]) {
            newdata[k] = {};
            that.keys.forEach(function(v) { keydata[v] = 0; });
            keydata["total"] = 0;
        } else {
            keydata = newdata[k];
        }
        that.keys.forEach(function(v) { 
            keydata[v] += d[v]; 
            keydata["total"] += d[v];
        });
        newdata[k] = keydata;
    });

    var returndata = [];
    Object.keys(newdata).map(function(k) {
        var newresdata = {};
        newresdata["key"] = k;
        newresdata["total"] = newdata[k]["total"];
        Object.keys(newdata[k]).map(function(v) {
            newresdata[v] = newdata[k][v];
        });
        returndata.push(newresdata);
    });
    return returndata;

}

RadialStackedChart.prototype.refresh = function() {
    var that = this;
    this.keys = that.settings.values.map(function(d) { return d.value; });
    var data = this.calculate();

    this.x.domain(data.map(function(d) { return d.key; }));
    this.color.domain(this.keys);

    var _data = d3.layout.stack().offset("expand")
                    (that.keys.map(function(k, i){ return that.getValue(data, k, i) }));

    var stack = this.radial.selectAll("g").data(_data);
    stack.enter().append("g");
    stack.attr("fill", function(d) { return (d[0])? that.color(d[0].key) : "#fff"; });

    var arc = d3.svg.arc()
          .innerRadius(function(d) { return that.y(d.y0); })
          .outerRadius(function(d) { return that.y(d.y0 + d.y); })
          .startAngle(function(d) { return that.x(d.x); })
          .endAngle(function(d) { return that.x(d.x) + that.x.rangeBand(); })
          .padAngle(0.01)
          .padRadius(that.innerRadius);

    var path = stack.selectAll("path").data(function(d) { return d; });
    path.enter().append("path");
    path.attr("d", arc);

    stack.exit().remove();

//------ drawing the label ------
    var label = this.labels.selectAll("g").data(data);
    label.enter().append("g")
        .attr("text-anchor", "middle")
        .attr("transform", function(d) { 
                return "rotate(" + ((that.x(d.key) + that.x.rangeBand() / 2) * 180 / Math.PI - 90) + ")translate(" + that.innerRadius + ",0)"; 
        });

    label.selectAll("line").remove();
    label.append("line")
        .attr("x2", -5)
        .attr("stroke", "#000");

    label.selectAll("text").remove();
    label.append("text")
        .attr("transform", function(d) { 
                return (that.x(d.key) + that.x.rangeBand() / 2 + Math.PI / 2) % (2 * Math.PI) < Math.PI ? "rotate(90)translate(0,16)" : "rotate(-90)translate(0,-9)"; 
            })
        .text(function(d) { return d.key; });

    label.exit().remove();

//--------------

    this.radial.attr("transform", "translate(" + that.width/2 + "," + that.height/2 + ")");
    this.labels.attr("transform", "translate(" + that.width/2 + "," + that.height/2 + ")");
    this.ticks.attr("transform", "translate(" + that.width/2 + "," + that.height/2 + ")");
    this.ticks.selectAll("circle").attr("r", that.y);
    this.ticks.selectAll("text").attr("y", function(d) { return -that.y(d); });
    this.legends.attr("transform", "translate(" + (that.width*0.8+that.margin.right) + ",0)");

    this.svg = d3.select(this.el).transition();

}


RadialStackedChart.prototype.getValue = function(_data, _key, _idx) {
    var returndata = [];
    _data.map(function(d, j) {
        var newresdata = {
	        key : _key,
            x : d.key,
	        y : d[_key],
	        data: d
        };
        returndata.push(newresdata);
    });
    return returndata;
}


RadialStackedChart.prototype.resize = function(options) {
    var that = this;

    this.height = options.height - that.margin.top - that.margin.bottom;
    this.width = options.width - that.margin.left - that.margin.right;

    this.outerRadius = Math.round(Math.min(this.width, this.height) / 2) + 20;
    this.innerRadius = this.outerRadius * 0.45;

    this.x.rangeBands([0, 2 * Math.PI]);
    this.y.range([this.innerRadius, this.outerRadius]);

    this.refresh();

}

RadialStackedChart.prototype.getEl = function() {
  return this.el;
}

window.EnebularIntelligence.register('radial-stacked-chart', RadialStackedChart);

module.exports = RadialStackedChart;
