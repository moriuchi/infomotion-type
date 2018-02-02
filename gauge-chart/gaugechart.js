module.exports = function(){
    return new loadGaugeChart();
}

function loadGaugeChart() {

    this.defaultSettings = {
        elementId: "",
        value: 0,
        minValue: 0,
        maxValue: 100,
        circleThickness: 0.05,
        circleFillGap: 0.05,
        circleColor: "#178BCA",
        waveHeight: 0.05,
        waveCount: 1,
        waveRiseTime: 1000,
        waveColor: "#178BCA",
        waveOffset: 0,
        textVertPosition: 0.8,
        textSize: 0.75,
        displayPercent: false,
        textColor: "#045681",
        waveTextColor: "#A4DBf8"
    };
}

loadGaugeChart.prototype.drawGauge = function() {
    var config = this.defaultSettings;
    var gauge = d3.select("#" + config.elementId);
    var value = config.value;

    var radius = Math.min(parseInt(gauge.attr("width")), parseInt(gauge.attr("height")))/2;
    var locationX = parseInt(gauge.attr("width"))/2 - radius;
    var locationY = parseInt(gauge.attr("height"))/2 - radius;
    var fillPercent = Math.max(config.minValue, Math.min(config.maxValue, value))/config.maxValue;

    var waveHeightScale = d3.scale.linear().range([0,config.waveHeight,0]).domain([0,50,100]);

    var textPixels = (config.textSize*radius/2);
    var textFinalValue = parseFloat(value).toFixed(2);
    var textStartValue = config.minValue;
    var percentText = config.displayPercent?"%":"";
    var circleThickness = config.circleThickness * radius;
    var circleFillGap = config.circleFillGap * radius;
    var fillCircleMargin = circleThickness + circleFillGap;
    var fillCircleRadius = radius - fillCircleMargin;
    var waveHeight = fillCircleRadius*waveHeightScale(fillPercent*100);

    var waveLength = fillCircleRadius*2/config.waveCount;
    var waveClipCount = 1+config.waveCount;
    var waveClipWidth = waveLength*waveClipCount;

    var textRounder = function(value){ return Math.round(value); };
    if(parseFloat(textFinalValue) != parseFloat(textRounder(textFinalValue))){
        textRounder = function(value){ return parseFloat(value).toFixed(1); };
    }
    if(parseFloat(textFinalValue) != parseFloat(textRounder(textFinalValue))){
        textRounder = function(value){ return parseFloat(value).toFixed(2); };
    }

    var data = [];
    for(var i = 0; i <= 40*waveClipCount; i++){
        data.push({x: i/(40*waveClipCount), y: (i/(40))});
    }

    var gaugeCircleX = d3.scale.linear().range([0,2*Math.PI]).domain([0,1]);
    var gaugeCircleY = d3.scale.linear().range([0,radius]).domain([0,radius]);

    var waveScaleX = d3.scale.linear().range([0,waveClipWidth]).domain([0,1]);
    var waveScaleY = d3.scale.linear().range([0,waveHeight]).domain([0,1]);

    var waveRiseScale = d3.scale.linear()
        .range([(fillCircleMargin+fillCircleRadius*2+waveHeight),(fillCircleMargin-waveHeight)])
        .domain([0,1]);
    var waveAnimateScale = d3.scale.linear()
        .range([0, waveClipWidth-fillCircleRadius*2])
        .domain([0,1]);

    var textRiseScaleY = d3.scale.linear()
        .range([fillCircleMargin+fillCircleRadius*2,(fillCircleMargin+textPixels*0.7)])
        .domain([0,1]);

    var gaugeGroup = gauge.append("g")
        .attr('transform','translate('+locationX+','+locationY+')');

    var gaugeCircleArc = d3.svg.arc()
        .startAngle(gaugeCircleX(0))
        .endAngle(gaugeCircleX(1))
        .outerRadius(gaugeCircleY(radius))
        .innerRadius(gaugeCircleY(radius-circleThickness));
    gaugeGroup.append("path")
        .attr("d", gaugeCircleArc)
        .style("fill", config.circleColor)
        .attr('transform','translate('+radius+','+radius+')');

    var text1 = gaugeGroup.append("text")
        .text(textRounder(textStartValue) + percentText)
        .attr("class", "loadGaugeChartText")
        .attr("text-anchor", "middle")
        .attr("font-size", textPixels + "px")
        .style("fill", config.textColor)
        .attr('transform','translate('+radius+','+textRiseScaleY(config.textVertPosition)+')');

    var clipArea = d3.svg.area()
        .x(function(d) { return waveScaleX(d.x); } )
        .y0(function(d) { return waveScaleY(Math.sin(Math.PI*2*config.waveOffset*-1 + Math.PI*2*(1-config.waveCount) + d.y*2*Math.PI));} )
        .y1(function(d) { return (fillCircleRadius*2 + waveHeight); } );
    var waveGroup = gaugeGroup.append("defs")
        .append("clipPath")
        .attr("id", "clipWave" + config.elementId);
    var wave = waveGroup.append("path")
        .datum(data)
        .attr("d", clipArea)
        .attr("T", 0);

    var fillCircleGroup = gaugeGroup.append("g")
        .attr("clip-path", "url(#clipWave" + config.elementId + ")");
    fillCircleGroup.append("circle")
        .attr("cx", radius)
        .attr("cy", radius)
        .attr("r", fillCircleRadius)
        .style("fill", config.waveColor);

    var text2 = fillCircleGroup.append("text")
        .text(textRounder(textStartValue) + percentText)
        .attr("class", "loadGaugeChartText")
        .attr("text-anchor", "middle")
        .attr("font-size", textPixels + "px")
        .style("fill", config.waveTextColor)
        .attr('transform','translate('+radius+','+textRiseScaleY(config.textVertPosition)+')');

    var textTween = function(){
        var i = d3.interpolate(this.textContent, textFinalValue);
        return function(t) { this.textContent = textRounder(i(t)) + percentText; }
    };
    text1.transition()
        .duration(config.waveRiseTime)
        .tween("text", textTween);
    text2.transition()
        .duration(config.waveRiseTime)
        .tween("text", textTween);

    var waveGroupXPosition = fillCircleMargin+fillCircleRadius*2-waveClipWidth;
    waveGroup.attr('transform','translate('+waveGroupXPosition+','+waveRiseScale(0)+')')
        .transition()
        .duration(config.waveRiseTime)
        .attr('transform','translate('+waveGroupXPosition+','+waveRiseScale(fillPercent)+')')
        .each("start", function(){ wave.attr('transform','translate(1,0)'); });

}
