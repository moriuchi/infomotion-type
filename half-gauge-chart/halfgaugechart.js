module.exports = function(){
    return new loadHalfGaugeChart();
}

function loadHalfGaugeChart() {

    this.defaultSettings = {
        elementId: "",
        value: 0,
        minValue: 0,
        maxValue: 100,
        circleThickness: 0.25,
        circleFillGap: 0.05,
        circleColor: "#DCDCDC",
        waveRiseTime: 1000,
        waveColor: "#178BCA",
        textVertPosition: 0.8,
        textSize: 0.75,
        displayPercent: false,
        textColor: "#045681"
    };
}

loadHalfGaugeChart.prototype.drawGauge = function() {
    var config = this.defaultSettings;
    var gauge = d3.select("#" + config.elementId);
    var value = config.value;

    var radius = Math.min(parseInt(gauge.attr("width")), parseInt(gauge.attr("height")))/2;
    var locationX = parseInt(gauge.attr("width"))/2 - radius;
    var locationY = parseInt(gauge.attr("height"))/2 - radius;
    var fillPercent = Math.max(config.minValue, Math.min(config.maxValue, value))/config.maxValue;

    var textFinalValue = parseFloat(value).toFixed(2);
    var textStartValue = config.minValue;
    var percentText = config.displayPercent?"%":"";
    var circleThickness = config.circleThickness * radius;
    var circleFillGap = config.circleFillGap * radius;
    var fillCircleMargin = circleThickness + circleFillGap;
    var fillCircleRadius = radius - fillCircleMargin;
    var textPixels = (config.textSize*(radius-circleThickness)/2);
    var textMinmaxY = radius + (circleThickness/2);

    var textRounder = function(value){ return Math.round(value); };
    if(parseFloat(textFinalValue) != parseFloat(textRounder(textFinalValue))){
        textRounder = function(value){ return parseFloat(value).toFixed(1); };
    }
    if(parseFloat(textFinalValue) != parseFloat(textRounder(textFinalValue))){
        textRounder = function(value){ return parseFloat(value).toFixed(2); };
    }

    var gaugeCircleX = d3.scale.linear().range([0,Math.PI]).domain([0,1]);
    var gaugeCircleY = d3.scale.linear().range([0,radius]).domain([0,radius]);

    var waveEndAngle = 0.5 - (1-(value - config.minValue) / (config.maxValue - config.minValue));

    var textRiseScaleY = d3.scale.linear()
        .range([fillCircleMargin+fillCircleRadius*2,(fillCircleMargin+textPixels*0.7)])
        .domain([0,1]);

    var gaugeGroup = gauge.append("g")
        .attr('transform','translate('+locationX+','+locationY+')');

    var gaugeCircleArc = d3.svg.arc()
        .startAngle(gaugeCircleX(-0.5))
        .endAngle(gaugeCircleX(0.5))
        .outerRadius(gaugeCircleY(radius))
        .innerRadius(gaugeCircleY(radius-circleThickness));
    gaugeGroup.append("path")
        .attr("d", gaugeCircleArc)
        .style("fill", config.circleColor)
        .attr('transform','translate('+radius+','+radius+')');

    var waveCircleArc = d3.svg.arc()
        .startAngle(gaugeCircleX(-0.5))
        .endAngle(function(d) { return d.endAngle; })
        .outerRadius(gaugeCircleY(radius))
        .innerRadius(gaugeCircleY(radius-circleThickness));
    var wave = gaugeGroup.append("path")
        .datum({endAngle: waveEndAngle})
        .attr("d", waveCircleArc)
        .style("fill", config.waveColor)
        .attr('transform','translate('+radius+','+radius+')');

    var text1 = gaugeGroup.append("text")
        .text(textRounder(textStartValue) + percentText)
        .attr("class", "loadGaugeChartText")
        .attr("text-anchor", "middle")
        .attr("font-size", textPixels + "px")
        .style("fill", config.textColor)
        .attr('transform','translate('+radius+','+textRiseScaleY(config.textVertPosition)+')');

    gaugeGroup.append("text")
        .text(textRounder(textStartValue))
        .attr("class", "loadGaugeChartText")
        .attr("x", gaugeCircleX(-0.5))
        .attr("y", textMinmaxY);

    gaugeGroup.append("text")
        .text(textRounder(config.maxValue))
        .attr("class", "loadGaugeChartText")
        .attr("x", (gaugeCircleY(radius)*2-circleThickness))
        .attr("y", textMinmaxY);

    var textTween = function(){
        var i = d3.interpolate(this.textContent, textFinalValue);
        return function(t) { this.textContent = textRounder(i(t)) + percentText; }
    };
    text1.transition()
        .duration(config.waveRiseTime)
        .tween("text", textTween);

    var arcTween = function(d){
        var i = d3.interpolate(gaugeCircleX(-0.5), gaugeCircleX(d.endAngle));
        return function(t) {
            d.endAngle = i(t);
            return waveCircleArc(d);
        }
    };
    wave.transition()
        .duration(config.waveRiseTime)
        .attrTween("d", arcTween);

}
