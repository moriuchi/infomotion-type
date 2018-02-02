//http://bl.ocks.org/NPashaP/113f7fea0751fa1513e1


StackedDensityChart.defaultSettings = {
    "distMin": -0.67930643331712,
    "distMax": 2.0725075529,
    "mean": 0.0393,
    "legends":[
        {"key": "GROUP01", "mean": -0.5063, "count": 161},
        {"key": "GROUP02", "mean": -0.3542, "count": 180},
        {"key": "GROUP03", "mean": -0.1934, "count": 172280},
        {"key": "GROUP04", "mean": -0.0435, "count": 1863},
        {"key": "GROUP05", "mean": 0.182, "count": 10}
    ]
};

StackedDensityChart.settings = EnebularIntelligence.SchemaProcessor([
        {
          type : "number", name : "distMin", help : "最低値を指定してください。"
        },{
          type : "number", name : "distMax", help : "最高値を指定してください。"
        },{
          type : "number", name : "mean", help : "平均値を指定してください。"
        },
        {
          type : "list", name : "legends", help : "値を表すデータのkeyを指定してください。", children:[{ 
              type : "key", name : "key"
          },{
              type : "number", name : "mean"
          },{
              type : "number", name : "count"
          }]
        }
    ], StackedDensityChart.defaultSettings);

function StackedDensityChart(settings, options) {
    var that = this;
    this.el = document.createElement('div');
    this.settings = settings;
    this.options = options;
    this.data = [];

    var margin = {top: 30, right: 50, bottom: 50, left: 30},
        width = (options.width || 700) - margin.left - margin.right,
        height = (options.height || 500) - margin.top - margin.bottom;

    this.width = width;
    this.height = height;
    this.margin = margin;

    this.legWidth = 150;
    this.width = this.width - this.legWidth;

    this.x = d3.scale.linear()
      .range([0, width]);

    this.y = d3.scale.linear()
      .range([height, 0]);

     this.colors = d3.scale.ordinal()
        .range(["#7D74FE","#7DFF26","#F84F1B","#28D8D5","#FB95B6","#9D9931","#F12ABF","#27EA88","#549AD5","#FEA526",
            "#7B8D8B","#BB755F","#432E16","#D75CFB","#44E337","#51EBE3","#ED3D24","#4069AE","#E1CC72","#E33E88",
            "#D8A3B3","#428B50","#66F3A3","#E28A2A","#B2594D","#609297","#E8F03F","#3D2241","#954EB3","#6A771C",
            "#58AE2E","#75C5E9","#BBEB85","#A7DAB9","#6578E6","#932C5F","#865A26","#CC78B9","#2E5A52","#8C9D79",
            "#9F6270","#6D3377","#551927","#DE8D5A","#E3DEA8","#C3C9DB","#3A5870","#CD3B4F","#E476E3","#DCAB94",
            "#33386D","#4DA284","#817AA5","#8D8384","#624F49","#8E211F","#9E785B","#355C22","#D4ADDE","#A98229",
            "#E88B87","#28282D","#253719","#BD89E1","#EB33D8","#6D311F","#DF45AA","#E86723","#6CE5BC","#765175",
            "#942C42","#986CEB","#8CC488","#8395E3","#D96F98","#9E2F83","#CFCBB8","#4AB9B7","#E7AC2C","#E96D59",
            "#929752","#5E54A9","#CCBA3F","#BD3CB8","#408A2C","#8AE32E","#5E5621","#ADD837","#BE3221","#8DA12E",
            "#3BC58B","#6EE259","#52D170","#D2A867","#5C9CCD","#DB6472","#B9E8E0","#CDE067","#9C5615","#536C4F",
            "#A74725","#CBD88A","#DF3066","#E9D235","#EE404C","#7DB362","#B1EDA3","#71D2E1","#A954DC","#91DF6E",
            "#CB6429","#D64ADC"]);

    this.format = d3.format(",d");

    d3.select(this.el).attr('class', 'distdiv');

    this.svg = d3.select(this.el).append("svg")
                  .attr("width", this.width + margin.left + margin.right/2)
                  .attr("height", height + margin.top + margin.bottom);

    this.base = this.svg.append("g")
      .attr("transform", "scale(1,1)translate(" + margin.left + "," + margin.top + ")");

    var stat = this.base.append("g").attr("class", "stat");
    stat.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", this.width)
        .attr("height", margin.top)
        .style("fill", "white");
    stat.append("text")
        .attr("class", "count")
        .attr("x", 80)
        .attr("y", -6);
    stat.append("text")
        .attr("class", "mean")
        .attr("x", 250)
        .attr("y", -6);

    // draw yellow background for graph.
    var chartBase = this.base.append("g").attr("class", "graph__area");
    chartBase.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", this.width)
        .attr("height", this.height)
        .style("fill", "rgb(235,235,209)");

    // draw vertical lines of the grid.
    chartBase.selectAll(".vlines").data(d3.range(51))
        .enter().append("line")
        .attr("class", "vlines")
        .attr("y1", 0)
        .attr("y2", function(d,i){ return d%10 ==0 && d!=50? that.height+12: that.height; });

    // draw horizontal lines of the grid.
    chartBase.selectAll(".hlines").data(d3.range(51))
        .enter().append("line")
        .attr("class", "hlines")
        .attr("x1", function(d,i){ return d%10 ==0 && d!= 50? -12: 0;});

    // make every 10th line in the grid darker.	
    chartBase.selectAll(".hlines")
        .filter(function(d){ return d%10==0})
        .style("stroke-opacity",0.7);
    chartBase.selectAll(".vlines")
        .filter(function(d){ return d%10==0})
        .style("stroke-opacity",0.7);

    // add horizontal axis labels
    var distMin = parseFloat(that.settings.distMin);
    var distMax = parseFloat(that.settings.distMax);
    this.base.append("g").attr("class","hlabels")
        .selectAll("text").data(d3.range(41).filter(function(d){ return d%10==0}))
        .enter().append("text")
        .text(function(d, i) {
            var r= distMin+i*(distMax-distMin)/5; 
            return Math.round(r*100)/100;
        });

    // add vertical axes labels.
    this.base.append("g").attr("class","vlabels")
        .selectAll("text").data(d3.range(41).filter(function(d){ return d%10==0 }))
        .enter().append("text")
        .attr("x", -10)
        .attr("y", 5);


    var legRow = d3.select(this.el).append("div").attr("class", "legend")
        .style("min-width", this.legWidth)
        .style("max-height", height)
        .style("margin-top", margin.top)
        .append("table")
        .selectAll("tr").data(that.settings.legends)
        .enter().append("tr").append("td");

    legRow.append("div")
        .style("background", function(d) { return that.colors(d.key); })
        .on("mouseover", function(d) { that.mouseoverLegend(d); })
        .on("mouseout", function(d) { that.mouseoutLegend(); })
        .style("cursor","pointer");

    legRow.append("span")
        .text(function(d){ return d.key;})
        .on("mouseover", function(d) { that.mouseoverLegend(d); })
        .on("mouseout", function(d) { that.mouseoutLegend(); })
        .style("cursor","pointer");

}


StackedDensityChart.prototype.onDrillDown = function(cb) {
    this.onDrillDownListener = cb;
}


StackedDensityChart.prototype.addData = function(data) {
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

StackedDensityChart.prototype.clearData = function() {
    this.data = [];
    this.refresh();
}

StackedDensityChart.prototype.calculate = function() {
    var that = this;

    if (!this.data) {
        return { total : 0 };
    }

    var newdata = {};
    this.data.forEach(function(d, i) {
        var k = i;
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

StackedDensityChart.prototype.refresh = function() {
    var that = this;
    this.keys = that.settings.legends.map(function(d) { return d.key; });
    var data = this.calculate();

    var maxTotal = d3.max(data, function(d) { return d.total; });
    maxTotal = (maxTotal)? maxTotal : 0;
    var maxValue = maxTotal;
    if (that.transitionKey) {
        maxValue = d3.max(data, function(d) { return d[that.transitionKey.key]} );
    }

	function tW(d){ return that.x(d * (data.length - 1) / 50); };
	function tH(d){ return that.y(d * maxTotal / 50); };

    this.x.domain([0, data.length - 1]);
    this.y.domain([0, maxValue]);

    this.colors.domain(that.keys);

//------ transition the background, lines, and labels. ------
    d3.select(this.el).select("svg")
        .attr("width", that.width + that.margin.left + that.margin.right/2)
        .attr("height", that.height + that.margin.top + that.margin.bottom);

    this.base.select(".graph__area rect")
        .attr("width", that.width)
        .attr("height", that.height);

    this.base.selectAll(".vlines")
        .transition().duration(500)
        .attr("x1", tW)
        .attr("x2", tW)
        .attr("y2", function(d,i){ return d%10 ==0 && d!=50? that.height+12: that.height; });

    this.base.selectAll(".hlines")
        .transition().duration(500)
        .attr("x2", that.width)
        .attr("y1", tH)
        .attr("y2", tH);

    this.base.selectAll(".hlabels").selectAll("text")
        .attr("x",function(d,i){ return tW(d)+5;})
        .attr("y",that.height+14);	

    this.base.selectAll(".vlabels").selectAll("text")
        .attr("transform",function(d,i){ return "translate(-10,"+(tH(d)-14)+")rotate(-90)";})
        .text(function(d, i) { return Math.round(maxTotal*i/5); })

//--------------

    this.base.select(".count").text(function() {
        var sum = d3.sum(that.settings.legends.map(function(d) { return d.count; }));
        var sumseg = sum;
        if (that.transitionKey) {
            sumseg = that.transitionKey.count;
        }
        return "Count: " +that.format(sumseg)+" / "+that.format(sum)+" ( "+Math.round(100*sumseg/sum)+" % )";
    });
    this.base.select(".mean").text(function() { 
        var mean = (that.transitionKey)? that.transitionKey.mean : that.settings.mean;    
        return "Mean: " + mean; 
    });


    var area = d3.svg.area()
        .x(function(d) { return that.x(d.x); })
        .y0(function(d) { return that.y(d.y0); })
        .y1(function(d) { return that.y(d.y0 + d.y); })
        .interpolate("basis");

    var layers = d3.layout.stack()
        .offset("zero")(that.keys.map(function(d){ 
            return that.getPoints(data, d, that.transitionKey);
        }));

    var path = this.base.selectAll("path").data(layers);
    path.enter().append("path");
    path.style("fill", function(d,i) { return (d[0])? that.colors(d[0].key) : ""; })
        .style("stroke", function(d,i) { return (d[0])? that.colors(d[0].key) : ""; })
        .transition()
        .duration(500)
        .attr("d", area);

    path.exit().remove();

    this.svg = d3.select(this.el).transition();

}

StackedDensityChart.prototype.getPoints = function(_, key, trans) {
    return _.map(function(d,j){
        var val = 0;
        if (trans && trans.key != key) {
            val = 0;
        } else {
            val = d[key];
        }
        return { x:j, y:val, key: key };
    });
}

StackedDensityChart.prototype.mouseoverLegend = function(d) {
    this.transitionKey = d;
    this.refresh();
}

StackedDensityChart.prototype.mouseoutLegend = function() {
    delete this.transitionKey;
    this.refresh();

}

StackedDensityChart.prototype.resize = function(options) {
    var that = this;

    this.height = options.height - that.margin.top - that.margin.bottom;
    this.width = options.width - that.margin.left - that.margin.right - that.legWidth;

    this.x.range([0, this.width]);
    this.y.range([this.height, 0]);

    this.refresh();

}

StackedDensityChart.prototype.getEl = function() {
  return this.el;
}

window.EnebularIntelligence.register('stacked-density-chart', StackedDensityChart);

module.exports = StackedDensityChart;
