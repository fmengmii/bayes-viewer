function drawCharts(nodesInfoArray)
{
	var chartDiv = d3.select("#chartDiv")
	$('#chartDiv').empty();
	
	var i;
	for (i=0; i<nodesInfoArray.length; i++) {
		//chartDiv.append("<svg class='chart" + i + "'></svg>");
		var oneCellDiv = chartDiv.append("div").attr("class", "cell").attr("style", "width:250px");
		var oneChartDiv = oneCellDiv.append("div").attr("class", "chart");
		oneChartDiv.append("svg").attr("class", "chart"+i);
		drawChart(nodesInfoArray[i], '.chart' + i);
	}
	
	wall.refresh();

}


function drawChart(nodeInfoArray, divSelect)
{
	var outcomes = [];
	var data = [];
	
	var nodeName = nodeInfoArray["nodename"];
	var nodeOutcomes = nodeInfoArray["values"];
	var i;
	for (i=0; i<nodeOutcomes.length; i++) {
		outcomes.push(truncateOutcome((nodeOutcomes[i])["outcomeid"]));
		//outcomes.push((nodeOutcomes[i])["outcomeid"]);
		data.push((nodeOutcomes[i])["value"]);
	}
	
	//console.log(JSON.stringify(outcomes));
	//console.log(JSON.stringify(data));
	
	var margins = {
		    top: 20,
		    left: 48,
		    right: 24,
		    bottom: 50
		},
	
	width = 200,
    barHeight = 15,
	height = barHeight * outcomes.length;

	var x = d3.scale.linear()
	    .domain([0, 1.0])
	    .range([0, width]),
	
	y = d3.scale.ordinal()
		.domain(outcomes)
	    .rangeRoundBands([0, height]),
	
	xAxis = d3.svg.axis()
	    .scale(x)
	    .orient('bottom'),
    
    yAxis = d3.svg.axis()
	    .scale(y)
	    .orient('left');
	
	var maxOutcomeLen = d3.max(outcomes, function(o) {return o.length;});
	margins.left = (maxOutcomeLen * 5) + 20;
	
	var chart = d3.select(divSelect)
	    .attr("width", width + 50 + margins.left + margins.right)
	    .attr("height", height + margins.top + margins.bottom)
	    .append('g')
        .attr('transform', 'translate(' + margins.left + ',' + margins.top + ')');
	
	var bar = chart.selectAll("g")
	    .data(data)
	  .enter().append("g")
	    .attr("transform", function(d, i) { return "translate(0," + i * barHeight + ")"; });
	
	bar.append("rect")
	    .attr("width", x)
	    .attr("height", barHeight - 1);
	
	bar.append("text")
	    .attr("x", function(d) { return x(d) + 30; })
	    .attr("y", barHeight / 2)
	    .attr("dy", ".35em")
	    .text(function(d) { return d; });
	
	chart.append('g')
	    .attr('class', 'axis')
	    .attr('transform', 'translate(0,' + height + ')')
	    .call(xAxis);

	chart.append('g')
		.attr('class', 'axis')
		.call(yAxis);
	
	chart.append("text")
	    //.attr("x", (width / 2))
	    .attr("x", width)
	    .attr("y", -2)
	    .attr("text-anchor", "end")
	    .style("font-size", "10px")
	    .text(nodeName);
}