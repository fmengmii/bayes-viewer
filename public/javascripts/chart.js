function drawCharts(nodesInfoArray)
{
	var chartDiv = d3.select("#chartDiv")
	$('#chartDiv').empty();
	var i;
	for (i=0; i<nodesInfoArray.length; i++) {
		//chartDiv.append("<svg class='chart" + i + "'></svg>");
		var nodeInfoArrayValue = nodesInfoArray[i];
		var nodeOutcomes = nodeInfoArrayValue["values"];
		var barHeight = 15;
	    var height = barHeight * nodeOutcomes.length ;
        var svgH =  height + 20 + 50;

		var oneCellDiv = chartDiv.append("div").attr("class", "cell").attr("style", "width:250px");
		//    .attr("style", "height:"+svgH);

		var oneChartDiv = oneCellDiv.append("div").attr("class", "chart");
		oneChartDiv.append("svg").attr("class", "chart"+i);
        /*if( i == 0 ) {
            console.log("drawChart input type=" + typeof nodesInfoArray[i] );
        }*/
		drawChart(nodesInfoArray[i], '.chart' + i);
	}

	wall.refresh();
}


function drawChart(nodeInfoArray, divSelect)
{
	var outcomes = [];
	var finalData = [];

	var nodeName = nodeInfoArray["nodename"];
	var nodeID = nodeInfoArray["id"];
	var nodeOutcomes = nodeInfoArray["values"];
	var isSearch = "false";
	var isRealEvidence = nodeInfoArray["isRealEvidence"];
	var isVirtualEvidence = nodeInfoArray["isVirtualEvidence"];
	var isTarget = nodeInfoArray["isTarget"];
	var queryNodeNameArray = $("#queryNodeNameSelect").val();
	if( queryNodeNameArray != null &&
	        queryNodeNameArray.contains(nodeID)){
	    isSearch = "true";
	}
	//var i;

    for (var i=0; i<nodeOutcomes.length; i++) {
	    outcomes.push(truncateOutcome((nodeOutcomes[i])["outcomeid"]));
		var item = {};  //JSON object
		item["value"] = (nodeOutcomes[i])["value"];
		item["change"] = (nodeOutcomes[i])["change"];
		finalData.push(item);
	}

	/*
	console.log("data value= " + JSON.stringify(data));
	console.log("change value= " + JSON.stringify(change));
	console.log("final data= " + JSON.stringify(finalData));
	*/
	var margins = {
		    top: 27, //original 20
		    left: 48,
		    right: 24,  //original 24
		    bottom: 50  //original 50
		},
	
	width = 200,
    barHeight = 15,
	height = barHeight * outcomes.length ;
    svgH =  height + margins.top + margins.bottom;

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

	var chart = d3.select(divSelect)
	    .attr("width", width + 50 + margins.left + margins.right)  //original width+50+margins.left+margins.right
	    .attr("height", height + margins.top + margins.bottom )
	    .append('g')
        .attr('transform', 'translate(' + margins.left + ',' + margins.top + ')');

	var bar = chart.selectAll("g")
	    .data(finalData) // .data(data)
	    .enter().append("g")
	    .attr("transform", function(d, i) { return "translate(0," + i * barHeight + ")"; });

    if( isSearch == "true" ) {
        setNodeColor(nodeID, '#dd99ff');
        bar.append("rect")
	    .style("fill", "#dd99ff")
	    .attr("width", function(d){ return x(d.value);})
	    .attr("height", barHeight - 1);
    } else if(isRealEvidence == "true"){
        setNodeColor(nodeID, 'Green');
	    bar.append("rect")
	    .style("fill", "Green")
	    .attr("width", function(d){ return x(d.value);})
	    .attr("height", barHeight - 1);
	}else if( isVirtualEvidence == "true"){
	    setNodeColor(nodeID, '#8FBC8F');
	    bar.append("rect")
	    .style("fill", "#8FBC8F")
	    .attr("width", function(d){ return x(d.value);})
	    .attr("height", barHeight - 1);
	}else if(isTarget == "true"){
	    setNodeColor(nodeID, 'DarkSalmon');
	    bar.append("rect")
	    .style("fill", "DarkSalmon")
	    .attr("width", function(d){ return x(d.value);})
	    .attr("height", barHeight - 1);
	} else {
	    setNodeColor(nodeID, '#74a9d8'); //#4c91cd, lightblue, steelblue
	    bar.append("rect")
	    .style("fill", "#74a9d8")
	    .attr("width", function(d){ return x(d.value);})
	    .attr("height", barHeight - 1);
	}

	bar.append("text")
	    .attr("x", function(d) { return x(d.value) + 30; })
	    .attr("y", barHeight / 2)
	    .attr("dy", ".35em")
	    .text(function(d) { return d.value; });

    bar.append("defs").append("marker")
        .attr("id", "arrow")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 6)
        .attr("markerWidth", 4)
        .attr("markerHeight", 4)
        .attr("orient", "auto")
        .append("path")
        .attr("class", "marker")
        .attr("d", "M0,-5L10,0L0,5");

    if( isTarget == "true" && isRealEvidence=="false" &&
        isVirtualEvidence == "false" ) {

        bar.append("line")
        .attr("class", "arrow")
        .attr("x1", function (d) {
            if( d.change == "increase") {
                return x(d.value) + 40;
            } else if( d.change == "decrease" ) {
                return x(d.value) + 50;
            } else {
                return 0;
            }
        })
        .attr("x2", function (d) {
            if( d.change == "increase") {
                return x(d.value) + 50;
            } else if( d.change == "decrease" ) {
                return x(d.value) + 40;
            } else {
                return 0;
            }
        })
        .attr("y1", barHeight / 2)
        .attr("y2", barHeight / 2)
        .attr("stroke-width", 1)
        .attr("stroke", "black")
        .attr("marker-end", function(d){
            if( d.change == "no") {
                return "";
            } else {
                return "url(#arrow)";
            }
        });
    }

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
