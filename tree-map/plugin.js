//https://bl.ocks.org/mbostock/4063582


TreeMap.defaultSettings = {
    "mode": "size",
    "label" : "name",
    "value" : "value",
    "hierarchy" : "children"
};

TreeMap.settings = EnebularIntelligence.SchemaProcessor([
        {
          type : "select", name : "mode", options: ["size","count"], help : "表示モードを選択してください。"
        },{
          type : "key", name : "label", help : "ラベルとなるデータのkeyを指定してください。"
        },{
          type : "key", name : "value", help : "値を表すデータのkeyを指定してください。"
        },{
          type : "key", name : "hierarchy", help : "階層を表すデータのkeyを指定してください。"
        }
    ], TreeMap.defaultSettings);

function TreeMap(settings, options) {
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

    var mode = this.settings.mode;
    this.treemap = d3.layout.treemap()
        .value(function(d) { return (mode == "size")? d.value : d.count; })
        .size([this.width, this.height])
        .round(true)
        .padding(1);

    this.svg = d3.select(this.el).append("svg")
                  .attr('class', 'treemap')
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

TreeMap.prototype.onDrillDown = function(cb) {
    this.onDrillDownListener = cb;
}


TreeMap.prototype.addData = function(data) {
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

TreeMap.prototype.clearData = function() {
    this.data = [];
    this.refresh( );
}

TreeMap.prototype.calculate = function() {
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
            var newdata = { 
                "packageName": "",
                "className": "",
                "value": 0,
                "count": 0
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
            newdata["value"] += node[value];
            newdata["count"] += 1;
            classes.push(newdata);
        }
    }

    this.data.forEach(function(d) {
        recurse(d[label], d);
    });

    return { children: classes };
}

TreeMap.prototype.refresh = function() {

    var that = this;
    var data = this.calculate();
    data.children.sort(function(a, b) { return b.value - a.value; });

    this.color.domain(data.children.map(function(d) { return d.packageName; }));

    var root = that.treemap.nodes(data).filter(function(d) { return !d.children; });

    var cell = this.base.selectAll(".treemap__cell").data(root);
    cell.enter().append("g");
    cell.attr("class", "treemap__cell");

    cell.exit().remove();

    cell.selectAll("rect").remove();
    cell.append("rect")
        .attr("x", function(d) { return d.x; })
        .attr("y", function(d) { return d.y; })
        .attr("width", function(d) { return d.dx; })
        .attr("height", function(d) { return d.dy; })
        .attr("fill", function(d) { return that.color(d.packageName); })
        .attr("stroke", "#fff")
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

    cell.selectAll("text").remove();
    cell.append("text")
        .attr("x", function(d) { return d.x + (d.dx/2); })
        .attr("y", function(d) { return d.y + (d.dy/2); })
        .style("text-anchor", "middle")
        .text(function(d) { return d.className; });

    this.svg = d3.select(this.el).transition();

}

TreeMap.prototype.resize = function(options) {
    var that = this;

    this.height = options.height - that.margin.top - that.margin.bottom;
    this.width = options.width - that.margin.left - that.margin.right;

    this.treemap.size([this.width, this.height]);

    this.refresh();

}

TreeMap.prototype.getEl = function() {
  return this.el;
}

window.EnebularIntelligence.register('tree-map', TreeMap);

module.exports = TreeMap;
