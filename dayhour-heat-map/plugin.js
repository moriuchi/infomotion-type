//http://bl.ocks.org/tjdecke/5558084

HeatMap.defaultSettings = {
    "day" : "day",
    "hour" : "hour",
    "value": "value"
};

HeatMap.settings = EnebularIntelligence.SchemaProcessor([
        {
          type : "key", name : "day", help : "曜日を表すデータのkeyを指定してください。"
        },{
          type : "key", name : "hour", help : "時間を表すデータのkeyを指定してください。"
        },{
          type : "key", name : "value", help : "値を表すデータのkeyを指定してください。"
        }
    ], HeatMap.defaultSettings);

function HeatMap(settings, options) {
    var that = this;
    this.el = document.createElement('div');
    this.settings = settings;
    this.options = options;
    this.data = [];

    var margin = {top: 25, right: 50, bottom: 50, left: 40},
        width = (options.width || 700) - margin.left - margin.right,
        height = (options.height || 500) - margin.top - margin.bottom;

    this.width = width;
    this.height = height;
    this.margin = margin;
    this.gridSize = Math.min(Math.floor(this.width / 24), Math.floor(this.height / 7));
    this.legendElementWidth = this.gridSize*2;

    this.colors = ["#ffffd9","#edf8b1","#c7e9b4","#7fcdbb","#41b6c4","#1d91c0","#225ea8","#253494","#081d58"];

    this.days = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
    this.times = ["1a", "2a", "3a", "4a", "5a", "6a", "7a", "8a", "9a", "10a", "11a", "12a", 
                  "1p", "2p", "3p", "4p", "5p", "6p", "7p", "8p", "9p", "10p", "11p", "12p"];

    this.svg = d3.select(this.el).append("svg")
                  .attr('class', 'heatmap')
                  .attr('class', 'svgWrapper')
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom);

    this.base = this.svg.append("g")
      .attr("transform", "scale(1,1)translate(" + margin.left + "," + margin.top + ")");

    this.base.append("g")
        .attr("class", "x heatmap__axis");

    this.base.append("g")
        .attr("class", "y heatmap__axis");

    this.base.append("g")
        .attr("class", "heatmap__legends");

}

HeatMap.prototype.onDrillDown = function(cb) {
    this.onDrillDownListener = cb;
}


HeatMap.prototype.addData = function(data) {
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

HeatMap.prototype.clearData = function() {
    this.data = [];
    this.refresh( );
}

HeatMap.prototype.calculate = function() {
    var that = this;
    var newdata = {};
    this.data.forEach(function(d) {
        var day = d[that.settings.day];
        var hour = d[that.settings.hour];
        var k = day + ":" + hour;
        if(!newdata[k]) newdata[k] = 0;
        newdata[k] += d[that.settings.value];
    });
    return Object.keys(newdata).map(function(k) {
        var keysplit = k.split(":");
        return {
            key : k,
            day : keysplit[0],
            hour : keysplit[1],
            value : newdata[k]
        }
    });
}

HeatMap.prototype.refresh = function() {

    var that = this;
    var data = this.calculate();
    var maxValue = d3.max(data, function(d) { return d.value; });

    var colorScale = d3.scale.quantile()
            .domain([0, that.colors.length - 1, maxValue])
            .range(that.colors);


    var dayLabels = this.base.select(".y.heatmap__axis").selectAll(".dayLabel").data(that.days);
    dayLabels.enter().append("text");
    dayLabels.text(function (d) { return d; })
        .attr("x", 0)
        .attr("y", function (d, i) { return i * that.gridSize; })
        .style("text-anchor", "end")
        .attr("transform", "translate(-6," + that.gridSize / 1.5 + ")")
        .attr("class", function (d, i) { 
            return ((i >= 0 && i <= 4) ? "dayLabel mono axis axis-workweek" : "dayLabel mono axis"); 
        });

    dayLabels.exit().remove();


    var timeLabels = this.base.select(".x.heatmap__axis").selectAll(".timeLabel").data(that.times);
    timeLabels.enter().append("text");
    timeLabels.text(function(d) { return d; })
        .attr("x", function(d, i) { return i * that.gridSize; })
        .attr("y", 0)
        .style("text-anchor", "middle")
        .attr("transform", "translate(" + that.gridSize / 2 + ", -6)")
        .attr("class", function(d, i) { 
            return ((i >= 7 && i <= 16) ? "timeLabel mono axis axis-worktime" : "timeLabel mono axis"); 
        });

    timeLabels.exit().remove();


    var cards = this.base.selectAll(".hour").data(data, function(d) {return d.key;});

    cards.enter().append("rect");
    cards.attr("x", function(d) { return (d.hour - 1) * that.gridSize; })
        .attr("y", function(d) { return (d.day - 1) * that.gridSize; })
        .attr("rx", 4)
        .attr("ry", 4)
        .attr("class", "hour bordered")
        .attr("width", that.gridSize)
        .attr("height", that.gridSize)
        .style("fill", that.colors[0]);

    cards.transition().duration(1000)
        .style("fill", function(d) { return colorScale(d.value); });

    cards.append("title");

    cards.select("title").text(function(d) { return d.value; });

    cards.exit().remove();


    var legend = this.base.select(".heatmap__legends").selectAll(".legend")
        .data([0].concat(colorScale.quantiles()), function(d) { return d; });

    legend.enter().append("g");
    legend.attr("class", "legend");

    legend.selectAll("rect").remove();
    legend.append("rect")
        .attr("x", function(d, i) { return that.legendElementWidth * i; })
        .attr("y", that.height)
        .attr("width", that.legendElementWidth)
        .attr("height", that.gridSize / 2)
        .style("fill", function(d, i) { return that.colors[i]; });

    legend.selectAll("text").remove();
    legend.append("text")
        .attr("class", "mono")
        .text(function(d) { return "≥ " + Math.round(d); })
        .attr("x", function(d, i) { return that.legendElementWidth * i; })
        .attr("y", that.height + that.gridSize*0.75)
        .attr("transform", "translate(" + that.gridSize / 2 + ", 0)");

    legend.exit().remove();


    this.svg = d3.select(this.el).transition();

}

HeatMap.prototype.resize = function(options) {
    var that = this;

    this.height = options.height - that.margin.top - that.margin.bottom;
    this.width = options.width - that.margin.left - that.margin.right;

    this.gridSize = Math.min(Math.floor(this.width / 24), Math.floor(this.height / 7));
    this.legendElementWidth = this.gridSize*2;

    this.refresh();

}

HeatMap.prototype.getEl = function() {
  return this.el;
}

window.EnebularIntelligence.register('dayhour-heat-map', HeatMap);

module.exports = HeatMap;
