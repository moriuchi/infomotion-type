//http://bl.ocks.org/NPashaP/9994181

Donut3DChart.defaultSettings = {
    "label" : "lang",
    "value": "ss",
    "labelNames" : []
};

Donut3DChart.settings = EnebularIntelligence.SchemaProcessor([
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
    ], Donut3DChart.defaultSettings);

function Donut3DChart(settings, options) {
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

    this.color = d3.scale.category10();

    this.svg = d3.select(this.el).append("svg")
                  .attr('class', 'donut3dchart')
                  .attr('class', 'svgWrapper')
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom);

    this.base = this.svg.append("g").attr("class", "slices")
      .attr("transform", "scale(1,1)translate(" + margin.left + "," + margin.top + ")");
}

Donut3DChart.prototype.onDrillDown = function(cb) {
    this.onDrillDownListener = cb;
}


Donut3DChart.prototype.addData = function(data) {
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

Donut3DChart.prototype.clearData = function() {
    this.data = [];
    this.refresh( );
}

Donut3DChart.prototype.calculate = function() {
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


Donut3DChart.prototype.pieTop = function(d, rx, ry, ir ){
    if(d.endAngle - d.startAngle == 0 ) return "M 0 0";
    var sx = rx*Math.cos(d.startAngle),
	    sy = ry*Math.sin(d.startAngle),
	    ex = rx*Math.cos(d.endAngle),
	    ey = ry*Math.sin(d.endAngle);

    var ret =[];
    ret.push("M",sx,sy,"A",rx,ry,"0",(d.endAngle-d.startAngle > Math.PI? 1: 0),"1",ex,ey,"L",ir*ex,ir*ey);
    ret.push("A",ir*rx,ir*ry,"0",(d.endAngle-d.startAngle > Math.PI? 1: 0), "0",ir*sx,ir*sy,"z");
    return ret.join(" ");
}

Donut3DChart.prototype.pieOuter = function(d, rx, ry, h ){
    var startAngle = (d.startAngle > Math.PI ? Math.PI : d.startAngle);
    var endAngle = (d.endAngle > Math.PI ? Math.PI : d.endAngle);

    var sx = rx*Math.cos(startAngle),
	    sy = ry*Math.sin(startAngle),
	    ex = rx*Math.cos(endAngle),
	    ey = ry*Math.sin(endAngle);

	var ret =[];
	ret.push("M",sx,h+sy,"A",rx,ry,"0 0 1",ex,h+ey,"L",ex,ey,"A",rx,ry,"0 0 0",sx,sy,"z");
	return ret.join(" ");
}

Donut3DChart.prototype.pieInner = function(d, rx, ry, h, ir ){
    var startAngle = (d.startAngle < Math.PI ? Math.PI : d.startAngle);
    var endAngle = (d.endAngle < Math.PI ? Math.PI : d.endAngle);

    var sx = ir*rx*Math.cos(startAngle),
	    sy = ir*ry*Math.sin(startAngle),
	    ex = ir*rx*Math.cos(endAngle),
	    ey = ir*ry*Math.sin(endAngle);

	var ret =[];
	ret.push("M",sx, sy,"A",ir*rx,ir*ry,"0 0 1",ex,ey, "L",ex,h+ey,"A",ir*rx, ir*ry,"0 0 0",sx,h+sy,"z");
	return ret.join(" ");
}

	
Donut3DChart.prototype.refresh = function() {
    var that = this;
    var data = this.calculate();

    var _data = d3.layout.pie().sort(null).value(function(d) {return d.value;})(data);
    var radius_x = that.radius;
    var radius_y = that.radius-30;

    this.color.domain(data.map(function(d) { return d.key; }));

    this.base.selectAll(".donut3dchart__group").remove();

    var dgroup = this.base.append("g")
        .attr("class", "donut3dchart__group")
        .attr("transform", "translate(" + that.width/2 + "," + that.height/2 + ")");


    var donut = dgroup.selectAll(".donut3dchart__arc").data(_data);
    donut.enter().append("g");
    donut.attr("class", "donut3dchart__arc");


    donut.append("path").attr("class", "innerSlice")
        .style("fill", function(d) { return d3.hsl(that.color(d.data.key)).darker(0.7); })
		.attr("d",function(d){ return that.pieInner(d, radius_x+0.5, radius_y+0.5, 30, 0.4);})
		.each(function(d){this._current=d;});

    donut.append("path").attr("class", "topSlice")
		.style("fill", function(d) { return that.color(d.data.key); })
		.style("stroke", function(d) { return that.color(d.data.key); })
		.attr("d",function(d){ return that.pieTop(d, radius_x, radius_y, 0.4);})
		.each(function(d){this._current=d;});

    donut.append("path").attr("class", "outerSlice")
        .attr("fill", function(d) { return d3.hsl(that.color(d.data.key)).darker(0.7); })
        .attr("d",function(d){ return that.pieOuter(d, radius_x-.5, radius_y-.5, 30);})
		.each(function(d){this._current=d;});

    donut.append("text").attr("class", "percent")
        .attr("x",function(d){ return 0.6*radius_x*Math.cos(0.5*(d.startAngle+d.endAngle));})
        .attr("y",function(d){ return 0.6*radius_y*Math.sin(0.5*(d.startAngle+d.endAngle));})
        .text(function(d) { 
                return (d.endAngle-d.startAngle > 0.2 ? 
                    Math.round(1000*(d.endAngle-d.startAngle)/(Math.PI*2))/10+'%' : ''); 
            })
        .each(function(d){this._current=d;});

    donut.exit().remove();

    this.svg = d3.select(this.el).transition();

}

Donut3DChart.prototype.resize = function(options) {
    var that = this;

    this.height = options.height - that.margin.top - that.margin.bottom;
    this.width = options.width - that.margin.left - that.margin.right;
    this.radius = Math.min(this.width, this.height) / 2;

    this.refresh();

}

Donut3DChart.prototype.getEl = function() {
  return this.el;
}

window.EnebularIntelligence.register('donut-3d-chart', Donut3DChart);

module.exports = Donut3DChart;
