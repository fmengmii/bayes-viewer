
var cy;
var networkInfoArray;

$(function(){ // on dom ready

	cy = cytoscape({
	  container: document.getElementById('cy'),
	  
	  style: cytoscape.stylesheet()
	    .selector('node')
	      .css({
	        'content': 'data(name)',
	        'background-color': 'lightblue',
	        'font-size': 12
	      })
	    .selector('edge')
	      .css({
	        'target-arrow-shape': 'triangle',
	        'width': 2,
	        'line-color': 'lightgray',
	        'target-arrow-color': '#ddd'
	      }),
	      
	        layout: {
	        	name: 'preset'
	        }
	  ,
	  boxSelectionEnabled:false
	});
  
	cy.on('tap', 'node', function(evt) {
		console.log(evt.cyTarget.id());
		nodeSelected(evt.cyTarget.id(), evt.cyTarget.data('name'));
	});
	
	cy.on('cxttap', 'node', function(evt) {
		console.log(evt.cyTarget.id());
		var scrollTop = $(window).scrollTop();
        var scrollLeft = $(window).scrollLeft();
		$('#nodeMenu').jqxMenu('open', parseInt(event.clientX) + 5 + scrollLeft, parseInt(event.clientY) + 5 + scrollTop);
		$('#nodeMenu #nodeID').val(evt.cyTarget.id());
	});

}); // on dom ready


function loadModel(model)
{
	var loadModelAjax = jsRoutes.controllers.Application.loadModel(model);
	$.ajax({
		   url: loadModelAjax.url
		}).done(function(data) {
			console.log(data);
			networkInfoArray = JSON.parse(data);
			cy.load(networkInfoArray[0]);
			drawCharts(networkInfoArray[1]);
		}).fail(function() {
		});
	
	//cy.load({nodes:[{data: {id:'a'}},{data: {id:'b'}}],edges:[{data:{id:'ab',source:'a',target:'b'}}]});
}

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
		outcomes.push((nodeOutcomes[i])["outcomeid"]);
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
	    .attr("x", (width / 2))             
	    .attr("y", -2)
	    .attr("text-anchor", "middle")  
	    .style("font-size", "10px") 
	    .text(nodeName);
}

function nodeSelected(nodeID, nodeName)
{
	$('#dialogTabs').jqxTabs('select', 0);
	$('#dialogSetValues').jqxWindow('title', nodeName);
	$("#dialogGeneralPanel").jqxPanel('clearcontent');
	$("#dialogSetEvidencePanel #formDiv").empty();
	$("#dialogSetVirtualEvidencePanel #formDiv").empty();
	
	$("#dialogGeneralPanel").jqxPanel('append', '<div id="evidenceChart"></div>');
	var chartDiv = d3.select("#evidenceChart");
	var oneChartDiv = chartDiv.append("div").attr("class", "chart");
	oneChartDiv.append("svg").attr("class", "chartEvidence");
	
	$form = $("<form id='setEvidenceForm'></form>");
	$form.append('<input id="nodeID" type="hidden" value="' + nodeID + '" />');
	
	$formVirtual = $("<form id='setVirtualEvidenceForm'></form>");
	$formVirtual.append('<input id="nodeID" type="hidden" value="' + nodeID + '" />');
	
	var outcomeValues = networkInfoArray[1];
	var nodeOutcomes = outcomeValues.filter(function(e) {
		if (e.id == nodeID)
			return e;
	});
	
	drawChart(nodeOutcomes[0], '.chartEvidence');
	
	var i;
	for (i=0; i<nodeOutcomes[0].values.length; i++) {
		//$form.append(nodeOutcomes[0].values[i].outcomeid + ": ");
		$form.append('<input name="outcomeids" type="radio" value="' + nodeOutcomes[0].values[i].outcomeid + '" />' + nodeOutcomes[0].values[i].outcomeid + '<br>');
		$formVirtual.append(nodeOutcomes[0].values[i].outcomeid + ': <input name="voutcomeids" type="text" value="' + nodeOutcomes[0].values[i].value + '"/><br>');
	}
	
	$("#dialogSetEvidencePanel #formDiv").append($form);
	$("#dialogSetVirtualEvidencePanel #formDiv").append($formVirtual);
	//$('#dialogTabs').jqxTabs('focus');
	$('#dialogSetValues').jqxWindow('open');
}

function clearAllEvidence()
{
	var clearAllEvidenceAjax = jsRoutes.controllers.Application.clearAllEvidence();
	$.ajax({
		   url: clearAllEvidenceAjax.url
		}).done(function(data) {
			console.log(data);
			networkInfoArray = JSON.parse(data);
			drawCharts(networkInfoArray[1]);
			
			$('#chartDiv').trigger('resize');

		}).fail(function() {
		});

}

function clearEvidence()
{
	var form = document.getElementById("setEvidenceForm");
	var i;
	var nodeID = '';
   for (i = 0; i < form.length; i++) {
	   if (form.elements[i].id == 'nodeID') {
	   		nodeID = form.elements[i].value;
	   		break;
	   }
   }
	
	var clearEvidenceAjax = jsRoutes.controllers.Application.clearEvidence(nodeID);
	$.ajax({
		   url: clearEvidenceAjax.url
		}).done(function(data) {
			console.log(data);
			networkInfoArray = JSON.parse(data);
			drawCharts(networkInfoArray[1]);
			
			var outcomeValues = networkInfoArray[1];
			var nodeOutcomes = outcomeValues.filter(function(e) {
				if (e.id == nodeID)
					return e;
			});
			
			$('.chartEvidence').empty();
			drawChart(nodeOutcomes[0], '.chartEvidence');
			
			var formV = document.getElementById("setVirtualEvidenceForm");
			var j = 0;
			for (i = 0; i < formV.length; i++) {
				if (formV.elements[i].id != 'nodeID') {
					formV.elements[i].value = nodeOutcomes[0].values[j].value;
					j++;
				}
		   }
			
			$('input[name=outcomeids]').attr('checked',false);
		}).fail(function() {
		});
}

function setEvidence()
{
	var outcomeID = $('input[name=outcomeids]:checked').val()
   console.log(outcomeID);
   
   var form = document.getElementById("setEvidenceForm");
   var i;
   var nodeID = '';
   for (i = 0; i < form.length; i++) {
	   if (form.elements[i].id == 'nodeID') {
	   		nodeID = form.elements[i].value;
	   		break;
	   }
   }
   
   console.log(nodeID);
   
   var values = {nodeID:nodeID, outcomeID:outcomeID};
   
   var setEvidenceAjax = jsRoutes.controllers.Application.setEvidence();
	$.ajax({
		type: 'POST',
		url: setEvidenceAjax.url,
		data: values
	}).done(function(data) {
		networkInfoArray = JSON.parse(data);
		drawCharts(networkInfoArray[1]);
		
		var outcomeValues = networkInfoArray[1];
		var nodeOutcomes = outcomeValues.filter(function(e) {
			if (e.id == nodeID)
				return e;
		});
		
		$('.chartEvidence').empty();
		drawChart(nodeOutcomes[0], '.chartEvidence');		
		
		var formV = document.getElementById("setVirtualEvidenceForm");
		var j = 0;
		for (i = 0; i < formV.length; i++) {
			if (formV.elements[i].id != 'nodeID') {
				formV.elements[i].value = nodeOutcomes[0].values[j].value;
				j++;
			}
	   }
		
		$('#chartDiv').trigger('resize');
	}).fail(function() {
	});
}

function setVirtualEvidence()
{   
   var form = document.getElementById("setVirtualEvidenceForm");
   var i;
   var nodeID = '';
   var outcomeVals = [];
   for (i = 0; i < form.length; i++) {
	   if (form.elements[i].id == 'nodeID') {
	   		nodeID = form.elements[i].value;
	   }
	   else {
		   outcomeVals.push(form.elements[i].value);
	   }
   }
   
   console.log(nodeID);
   
   var values = {nodeID:nodeID, outcomeVals:outcomeVals};
   
   var setVirtualEvidenceAjax = jsRoutes.controllers.Application.setVirtualEvidence();
	$.ajax({
		type: 'POST',
		url: setVirtualEvidenceAjax.url,
		data: values
	}).done(function(data) {
		networkInfoArray = JSON.parse(data);
		drawCharts(networkInfoArray[1]);
		
		var outcomeValues = networkInfoArray[1];
		var nodeOutcomes = outcomeValues.filter(function(e) {
			if (e.id == nodeID)
				return e;
		});
		
		$('.chartEvidence').empty();
		drawChart(nodeOutcomes[0], '.chartEvidence');
		
		var formV = document.getElementById("setVirtualEvidenceForm");
		var j = 0;
		for (i = 0; i < formV.length; i++) {
			if (formV.elements[i].id != 'nodeID') {
				formV.elements[i].value = nodeOutcomes[0].values[j].value;
				j++;
			}
	   }
		
		$('#chartDiv').trigger('resize');
	}).fail(function() {
	});
}

function setAsTarget()
{
	var nodeID = $('#nodeMenu #nodeID').val();
	console.log(nodeID);
	
	var setAsTargetAjax = jsRoutes.controllers.Application.setAsTarget(nodeID);
	$.ajax({
		url: setAsTargetAjax.url
	}).done(function(data) {
		networkInfoArray = JSON.parse(data);
		drawCharts(networkInfoArray[1]);
		
		var outcomeValues = networkInfoArray[1];
		var nodeOutcomes = outcomeValues.filter(function(e) {
			if (e.id == nodeID)
				return e;
		});
		
		$('.chartEvidence').empty();
		drawChart(nodeOutcomes[0], '.chartEvidence');

		cy.getElementById(nodeID).css('background-color', 'yellow');
		$('#chartDiv').trigger('resize');
	}).fail(function() {
	});
}

function clearAllTargets()
{
	var clearAllTargetsAjax = jsRoutes.controllers.Application.clearAllTargets();
	$.ajax({
		url: clearAllTargetsAjax.url
	}).done(function(data) {		
		networkInfoArray = JSON.parse(data);
		drawCharts(networkInfoArray[1]);
		
		var outcomeValues = networkInfoArray[1];
		var nodeOutcomes = outcomeValues.filter(function(e) {
			if (e.id == nodeID)
				return e;
		});
		
		cy.$('node').css('background-color', 'lightblue');
		$('#chartDiv').trigger('resize');

	}).fail(function() {
	});
}

function centerNetwork()
{
	cy.center();
	cy.fit();
}





