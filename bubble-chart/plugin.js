//https://bl.ocks.org/mbostock/4063269
//http://bl.ocks.org/mmattozzi/7018021


BubbleChart.defaultSettings = {
    "label" : "name",
    "value" : "value",
    "hierarchy" : "children"
};

BubbleChart.settings = EnebularIntelligence.SchemaProcessor([
        {
          type : "key", name : "label", help : "ラベルとなるデータのkeyを指定してください。"
        },{
          type : "key", name : "value", help : "値を表すデータのkeyを指定してください。"
        },{
          type : "key", name : "hierarchy", help : "階層を表すデータのkeyを指定してください。"
        }
    ], BubbleChart.defaultSettings);

function BubbleChart(settings, options) {
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

    this.format = d3.format(",d");

    this.color = d3.scale.category20c();

    this.pack = d3.layout.pack()
      .size([this.width, this.height])
      .padding(1.5);

    this.svg = d3.select(this.el).append("svg")
                  .attr('class', 'bubblechart')
                  .attr('class', 'svgWrapper')
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom);

    this.base = this.svg.append("g")
      .attr("transform", "scale(1,1)translate(" + margin.left + "," + margin.top + ")");

    this.tooltip = d3.select(this.el)
                  .append("div")
                  .style("position", "absolute")
                  .style("z-index", "10")
                  .style("visibility", "hidden")
                  .style("color", "white")
                  .style("padding", "8px")
                  .style("background-color", "rgba(0, 0, 0, 0.75)")
                  .style("border-radius", "6px")
                  .style("font", "12px sans-serif")
                  .text("tooltip");
}

BubbleChart.prototype.onDrillDown = function(cb) {
    this.onDrillDownListener = cb;
}


BubbleChart.prototype.addData = function(data) {
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

BubbleChart.prototype.clearData = function() {
    this.data = [];
    this.refresh( );
}

BubbleChart.prototype.calculate = function () {

    var that = this;
    var label = that.settings.label,
        value = that.settings.value,
        children = that.settings.hierarchy,
        classes = [];

    function recurse(name, node) {
        if (node[children]) {
            node[children].forEach(function(child) { 
                recurse(node[label], child); 
            });
        } else {
            if ((!name) && (!node[label])) return;
            var newdata = { 
                "packageName": "",
                "className": "",
                "value": 0 
            };
            classes.forEach(function(n, i) {
                if (n["packageName"] == name && n["className"] == node[label]) {
                    newdata = n;
                    classes.splice(i, 1);
                    i--;
                }
            });
            newdata["packageName"] = name;
            newdata["className"] = node[label];
//            newdata["value"] += node[value];
            newdata["value"] += (isNaN(node[value]))? 0 : node[value];
            classes.push(newdata);
        }
    }

    this.data.forEach(function(d) {
        recurse(d[label], d);
    });

    return { children: classes };
}

BubbleChart.prototype.refresh = function() {
    var that = this;
    var data = this.calculate();
    this.color.domain(data.children.map(function(d) { return d.packageName; }));

    var node = this.base.selectAll(".node")
        .data(that.pack.nodes(data)
            .filter(function(d) { return (!d.children && !isNaN(d.x)); }));
    node.enter().append("g");
    node.attr("class", "node")
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

    node.exit().remove();

    node.selectAll("circle").remove();
    node.append("circle")
        .attr("r", function(d) { return d.r; })
        .style("fill", function(d) { return that.color(d.packageName); })
        .on("mouseover", function(d) {
            var tiptext = (d.packageName == d.className)? d.className : d.packageName + ": " + d.className;
            that.tooltip.text(tiptext + ": " + that.format(d.value));
            that.tooltip.style("visibility", "visible");
        })
        .on("mousemove", function() {
            return that.tooltip.style("top", (d3.event.pageY-10)+"px")
                               .style("left",(d3.event.pageX+10)+"px");
        })
        .on("mouseout", function(){ return that.tooltip.style("visibility", "hidden"); });

    node.selectAll("text").remove();
    node.append("text")
        .attr("dy", ".3em")
        .style("text-anchor", "middle")
        .style("pointer-events", "none")
        .text(function(d) { return (d.className)? d.className.substring(0, d.r / 3) : ""; });

    this.svg = d3.select(this.el).transition();

}

BubbleChart.prototype.resize = function(options) {
    var that = this;

    this.height = options.height - that.margin.top - that.margin.bottom;
    this.width = options.width - that.margin.left - that.margin.right;

    this.pack.size([this.width, this.height]);

    this.refresh();

}

BubbleChart.prototype.getEl = function() {
  return this.el;
}

window.EnebularIntelligence.register('bubble-chart', BubbleChart);

module.exports = BubbleChart;
