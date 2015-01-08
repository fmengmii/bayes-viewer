var networkInfoArray;


function loadModel(model)
{
	var loadModelAjax = jsRoutes.controllers.Application.loadModel(model);
	$.ajax({
		   url: loadModelAjax.url
		}).done(function(data) {
			console.log(data);
			networkInfoArray = JSON.parse(data);
			//cy.load(networkInfoArray[0]);
			networkLoadModel(networkInfoArray[0]);
			drawCharts(networkInfoArray[1]);
		}).fail(function() {
		});
	
	//cy.load({nodes:[{data: {id:'a'}},{data: {id:'b'}}],edges:[{data:{id:'ab',source:'a',target:'b'}}]});
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

		//cy.getElementById(nodeID).css('background-color', 'yellow');
		setNodeColor(nodeID, 'yellow');
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
		
		//cy.$('node').css('background-color', 'lightblue');
		setNodeColorAll('lightblue');
		$('#chartDiv').trigger('resize');

	}).fail(function() {
	});
}