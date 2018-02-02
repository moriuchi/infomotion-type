//https://bl.ocks.org/mbostock/3886394
//https://bl.ocks.org/Andrew-Reid/0aedd5f3fb8b099e3e10690bd38bd458


HorizonStackedBarChart.defaultSettings = {
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

HorizonStackedBarChart.settings = EnebularIntelligence.SchemaProcessor([
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
    ], HorizonStackedBarChart.defaultSettings);

function HorizonStackedBarChart(settings, options) {
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

    this.y = d3.scale.ordinal()
      .rangeRoundBands([0, height], .1);

    this.x = d3.scale.linear()
      .range([0, width]);

    this.xAxis = d3.svg.axis()
      .scale(this.x)
      .orient("bottom");

    this.yAxis = d3.svg.axis()
      .scale(this.y)
      .orient("left");

    this.color = d3.scale.ordinal()
        .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

    this.svg = d3.select(this.el).append("svg")
                  .attr('class', 'barchart')
                  .attr('class', 'svgWrapper')
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom);

    this.base = this.svg.append("g")
      .attr("transform", "scale(1,1)translate(" + margin.left + "," + margin.top + ")");

    this.base.append("g")
        .attr("class", "x chart__axis")
        .attr("transform", "translate(0," + that.height + ")")
        .call(that.xAxis.ticks(5, "%"))
        .append("text")
        .attr("transform", "rotate(0)")
        .attr("x", width + margin.left)
        .attr("y", 2)
        .attr("dy", "0.71em")
        .style("text-anchor", "end");

    this.base.append("g")
        .attr("class", "y chart__axis")
        .call(that.yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 12)
        .attr("dy", "0.35em")
        .style("text-anchor", "end");


    this.legends = this.base.append("g").attr("class", "chart__legends");
    var legend = this.legends.selectAll(".legend").data(that.settings.values);
    legend.enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; })
        .style("font", "10px sans-serif");

    legend.append("rect")
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", function(d) { return that.color(d.value); });

    legend.append("text")
        .attr("x", 24)
        .attr("y", 9)
        .attr("dy", "0.35em")
        .text(function(d) { return d.header; });

    this.tooltip = d3.select(this.el)
                  .append("div")
                  .attr("class", "chart__tooltip")
                  .style("font", "12px sans-serif")
                  .style('opacity', 0)
                  .text("tooltip");

}

HorizonStackedBarChart.prototype.onDrillDown = function(cb) {
    this.onDrillDownListener = cb;
}


HorizonStackedBarChart.prototype.addData = function(data) {
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

HorizonStackedBarChart.prototype.clearData = function() {
    this.data = [];
    this.refresh();
}

HorizonStackedBarChart.prototype.calculate = function() {
    var that = this;

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

HorizonStackedBarChart.prototype.refresh = function() {
    var that = this;
    this.keys = that.settings.values.map(function(d) { return d.value; });
    var data = this.calculate();

    this.y.domain(data.map(function(d) { return d.key; }));
    this.color.domain(this.keys);

    var _data = [];
    if (data.length > 0) {
        _data = d3.layout.stack().offset("expand")
                                (that.keys.map(function(k, i){ return that.getValue(data, k, i) }));
    }

    var serie = this.base.selectAll(".serie").data(_data);
    serie.enter().append("g")
        .attr("class", "serie")
        .attr("fill", function(d) { return that.color(d[0].key); });

    serie.exit().remove();

    var stack = serie.selectAll(".stack").data(function(d){ return d; });
    stack.enter().append("rect");
        stack.attr("class", "stack")
        .attr("y", function(d) { return that.y(d.x); })
        .attr("x", function(d) { return that.x(d.y0); })
        .attr("width", function(d) { return that.x(d.y); })
        .attr("height", that.y.rangeBand())
        .on("mouseover", function(d) {
            var key = d.key;
            var val = d.data[key];
            var total = d.data["total"];
            that.tooltip.text(d3.format(",d")(val) + " (" + d3.format(".2%")(val/total) + ")");
            that.tooltip.style("opacity", 1);
        })
        .on("mousemove", function() {
            return that.tooltip.style("top", (d3.event.pageY-10)+"px")
                               .style("left",(d3.event.pageX+10)+"px");
        })
        .on("mouseout", function(){ return that.tooltip.text("").style("opacity", 0); });


    stack.exit().remove();


    this.svg = d3.select(this.el).transition();

    this.svg.select(".x.chart__axis")
        .duration(500)
        .attr("transform", "translate(0," + that.height + ")")
        .call(this.xAxis);

    this.svg.select(".y.chart__axis")
        .duration(500)
        .call(this.yAxis);

    this.legends.attr("transform", "translate(" + that.width + ",0)");

}


HorizonStackedBarChart.prototype.getValue = function(_data, _key, _idx) {
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

HorizonStackedBarChart.prototype.resize = function(options) {
    var that = this;

    var maxLegendWidth = 0;
    d3.select(this.el).selectAll(".chart__legends text").each(function(d){
        var bbox = this.getBBox();
        if (maxLegendWidth < bbox.width) {
            maxLegendWidth = bbox.width;
        }
    });

    this.height = options.height - that.margin.top - that.margin.bottom;
    this.width = options.width - that.margin.left - that.margin.right - maxLegendWidth;

    this.y.rangeRoundBands([0, this.height], .1);
    this.x.range([0, (this.width -30)]);

    this.xAxis.scale(this.x);
    this.yAxis.scale(this.y);


    this.refresh();

}

HorizonStackedBarChart.prototype.getEl = function() {
  return this.el;
}

window.EnebularIntelligence.register('horizontal-stacked-bar-chart', HorizonStackedBarChart);

module.exports = HorizonStackedBarChart;
