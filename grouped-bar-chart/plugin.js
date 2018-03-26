//http://bl.ocks.org/mbostock/3887051

GroupedBarChart.defaultSettings = {
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

GroupedBarChart.settings = EnebularIntelligence.SchemaProcessor([
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
    ], GroupedBarChart.defaultSettings);

function GroupedBarChart(settings, options) {
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

    this.x0 = d3.scale.ordinal()
      .rangeRoundBands([0, width], .1);

    this.x1 = d3.scale.ordinal();

    this.y = d3.scale.linear()
      .range([height, 0]);

    this.xAxis = d3.svg.axis()
      .scale(this.x0)
      .orient("bottom");

    this.yAxis = d3.svg.axis()
      .scale(this.y)
      .orient("left")
      .tickFormat(d3.format(".2s"));

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
        .attr("class", "x barchart__axis")
        .attr("transform", "translate(0," + that.height + ")")
        .call(that.xAxis)
        .append("text")
        .attr("transform", "rotate(0)")
        .attr("x", width + margin.left)
        .attr("y", 12)
        .attr("dy", "0.71em")
        .style("text-anchor", "end");

    this.base.append("g")
        .attr("class", "y barchart__axis")
        .call(that.yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", "0.71em")
        .attr("text-anchor", "end");

    this.base.append("g")
        .attr("class", "barchart__labels");

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
}

GroupedBarChart.prototype.onDrillDown = function(cb) {
    this.onDrillDownListener = cb;
}


GroupedBarChart.prototype.addData = function(data) {
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

GroupedBarChart.prototype.clearData = function() {
    this.data = [];
    this.refresh();
}

GroupedBarChart.prototype.calculate = function() {
    var that = this;

    if (!this.data) {
        return { total : 0 };
    }

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

    return Object.keys(newdata).map(function(k) {
        return {
            key : k,
            values :  Object.keys(newdata[k]).map(function(v) {
		        return {
			        key : v,
			        value : newdata[k][v]
		        }
	        })
        }
    });
}

GroupedBarChart.prototype.refresh = function() {
    var that = this;
    this.keys = that.settings.values.map(function(d) { return d.value; });
    var data = this.calculate();

    var maxValue = d3.max(data, function(d) { return d3.max(d.values, function(d) { return d.value; }); });
    this.x0.domain(data.map(function(d) { return d.key; }));
    this.x1.domain(this.keys).rangeRoundBands([0, this.x0.rangeBand()]);
    this.y.domain([0, maxValue]);

    var bar = this.base.selectAll(".barchart__bar").data(data);
    bar.enter().append("g");
    bar.attr("class", "barchart__bar")
        .transition()
        .duration(500)
        .attr("transform", function(d) { return "translate(" + that.x0(d.key) + ",0)"; });

    bar.exit().remove();

    var group = bar.selectAll("rect").data(function(d) { return d.values; });
    group.enter().append("rect");
    group.attr("fill", function(d) { return that.color(d.key); })
        .transition()
        .duration(500)
        .attr("x", function(d) { return that.x1(d.key); })
        .attr("width", that.x1.rangeBand())
        .attr("y", function(d) { return that.y(d.value); })
        .attr("height", function(d) { return that.height - that.y(d.value); });

    group.exit().remove();

    var valLabel = this.base.selectAll(".barchart__vallabel").data(data);
    valLabel.enter().append('text');
    valLabel.attr("class", "barchart__vallabel")
        .transition()
        .duration(500)
        .attr("x", function(d) {
//            return that.x0(d.key)+that.x0.rangeBand()/2-d.value.toString().length*3;
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

    this.legends.attr("transform", "translate(" + that.width + ",0)");

}

GroupedBarChart.prototype.resize = function(options) {
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

    this.x0.rangeRoundBands([0, this.width], .1);
    this.y.range([this.height, 0]);

    this.refresh();

}

GroupedBarChart.prototype.getEl = function() {
  return this.el;
}

window.EnebularIntelligence.register('grouped-bar-chart', GroupedBarChart);

module.exports = GroupedBarChart;
