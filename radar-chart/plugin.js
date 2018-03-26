//http://bl.ocks.org/tpreusse/2bc99d74a461b8c0acb1

var radarChartjs = require('./radar-chart.js');


RadarChart.defaultSettings = {
    "label" : "State",
    "values":[
        {"header":"strength", "value":"strength"},
        {"header":"intelligence", "value":"intelligence"},
        {"header":"charisma", "value":"charisma"},
        {"header":"dexterity", "value":"dexterity"},
        {"header":"luck", "value":"luck"}
    ]
};

RadarChart.settings = EnebularIntelligence.SchemaProcessor([
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
    ], RadarChart.defaultSettings);

function RadarChart(settings, options) {
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

    this.svg = d3.select(this.el).append("svg")
                  .attr('class', 'svgWrapper')
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom);

    this.base = this.svg.append("g")
      .attr("transform", "scale(1,1)translate(" + -margin.left + "," + margin.top + ")");

}

RadarChart.prototype.onDrillDown = function(cb) {
    this.onDrillDownListener = cb;
}


RadarChart.prototype.addData = function(data) {
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

RadarChart.prototype.clearData = function() {
    this.data = [];
    this.refresh( );
}

RadarChart.prototype.calculate = function() {
    var that = this;

    if (!this.data || this.data.length == 0) {
        return [{key: "", axes: []}];
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
            axes :  Object.keys(newdata[k]).map(function(v) {
		        return {
			        axis : v,
			        value : newdata[k][v]
		        }
	        })
        }
    });
}

RadarChart.prototype.refresh = function() {
    var that = this;
    this.keys = that.settings.values.map(function(d) { return d.value; });
    var data = this.calculate();

    var raderChart = radarChartjs();
    raderChart.defaultConfig.radius = 5;
    raderChart.defaultConfig.w = that.height;
    raderChart.defaultConfig.h = that.height;

    var chart = raderChart.chart();
    var cfg = chart.config();

    this.base.selectAll("." + cfg.containerClass).remove();
    this.base.append("g")
        .attr("transform", "translate(" + that.width*0.25 + "," + -that.margin.top/2 + ")")
        .datum(data).call(chart);


    this.base.selectAll(".radarchart__legends").remove();
    var legends = this.base.append("g")
                    .attr("class", "radarchart__legends")
                    .attr("transform", "translate(" + (that.width*0.8+that.margin.right) + "," + -(that.margin.top*0.75) + ")");

    var legend = legends.selectAll("g").data(data);
    legend.enter().append("g")
        .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

    legend.append("rect")
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", function(d, i) { return cfg.color(i); });

    legend.append("text")
        .attr("x", 25)
        .attr("y", 9)
        .attr("dy", "0.35em")
        .text(function(d) { return d.key; });


    this.svg = d3.select(this.el).transition();

}

RadarChart.prototype.resize = function(options) {
    var that = this;

    this.height = options.height - that.margin.top - that.margin.bottom;
    this.width = options.width - that.margin.left - that.margin.right;

    this.refresh();

}

RadarChart.prototype.getEl = function() {
  return this.el;
}

window.EnebularIntelligence.register('radar-chart', RadarChart);

module.exports = RadarChart;
