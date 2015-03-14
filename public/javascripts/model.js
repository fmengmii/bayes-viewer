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

function getCPT(nodeID)
{
	var getCPTAjax = jsRoutes.controllers.Application.getCPT(nodeID);
	$.ajax({
		url: getCPTAjax.url
	}).done(function(data) {
		console.log(data);
		var cpt = JSON.parse(data);
		var numParents = cpt.parents.length;
		var numOutcomes = cpt.outcomeIDs.length;

		// get column names
		var colIter = 0;
		var colTitles = [];
		var col = [];

		// get CPTs
		for (var i=0; i<numParents; i++) {
			if (numParents == 1) {
				for (j=0; j<cpt.parents[0].outcomeIDs.length; j++) {
					var title = cpt.parents[0].parentID + ',' + cpt.parents[0].outcomeIDs[j];
					colTitles[colIter] = title;
					col[colIter] = { text: title, datafield: title, width: 300 };
					colIter++;
				}
			}
			else {
				for (var j=0; j<cpt.parents[i].outcomeIDs.length; j++) {
					for (var k=i+1; k<numParents; k++) {
						for (var l=0; l<cpt.parents[k].outcomeIDs.length; l++) {

							var title = cpt.parents[i].parentID + '\n :' + cpt.parents[i].outcomeIDs[j]
								+ '\n' + cpt.parents[k].parentID + '\n :' + cpt.parents[k].outcomeIDs[l];

							colTitles[colIter] = title;
							col[colIter] = { text: title, datafield: title, width: 300 };
							colIter++;
						}
					}
				}
			}
		}

		// show node values when there is no CPTs
		if (numParents == 0) {
			var title = "self value";
			colTitles[0] = title;
			col[0] = { text: "node has no parents", datafield: title, width: 300 };
			console.log("BOO");
		}

		// fill grid data
		col.unshift({text: " ", datafield: "rowTitle", width: 100});
		var data = [];
		var numCols = colIter+1;
		var defIter = 0;
		var start = 0;
		for (i=0; i<numOutcomes; i++) {
			data[i] = {};
			data[i]["rowTitle"] = cpt.outcomeIDs[i];
			for (j = 0; j < numCols; j++) {
				data[i][colTitles[j]] = cpt.definition[defIter];
				defIter = defIter + numOutcomes;
			}
			console.log(data[i]);
			start++;
			defIter = start;
		}

		// display grid
		var source = {
			localdata: data,
			datatype: "array"
		};
		var dataAdapter = new $.jqx.dataAdapter(source, {
			loadComplete: function (data) { },
			loadError: function (xhr, status, error) { }
		});
		$("#dialogDefinitionPanel").jqxGrid( {
			source: dataAdapter,
			width: '100%',
			height: '100%',
			columnsheight: 50,
			columns: col
		});
	}).fail(function() {
	});
}