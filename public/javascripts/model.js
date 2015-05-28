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

		//console.log(networkInfoArray);

		emptyRawDataOptions();
		if (networkInfoArray.length > 3) {
			getRawData();
		}

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
	var outcomeID = $('input[name=outcomeids]:checked').val();
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

function removeTarget()
{
	var nodeID = $('#nodeMenu #nodeID').val();
	console.log(nodeID);

	var removeTargetAjax = jsRoutes.controllers.Application.removeTarget(nodeID);
	$.ajax({
		url: removeTargetAjax.url
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

		setNodeColor(nodeID, 'lightblue');
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

		var columnrenderer = function (value) {
			return '<div style="text-align: left; vertical-align: middle; margin-top: 5px; margin-left: 5px;margin-right: 5px;">' + value + '</div>';
		}

		var widthSize = 5*15*2;

		function getMoreTitles(parents, titles) {
			parents.shift();
			if (parents.length == 0) {
				return titles;
			}
			var columnTitles = [];
			var count = 0;
			for (var i = 0; i<titles.length; i++) {
				for (j = 0; j<parents[0].outcomeIDs.length; j++) {
					var title =  titles[i] + '<br>' + parents[0].parentName + ': ' + truncateOutcome(parents[0].outcomeIDs[j]);
					columnTitles[count] = title;
					count ++;
				}
			}
			return (getMoreTitles(parents, columnTitles));
		}

		var parents = cpt.parents;
		var numParents = cpt.parents.length;
		var columnTitles = [];
		var columnStruct = [];
		if (parents.length > 0) {
			var titles = [];
			for (var i = 0; i < parents[0].outcomeIDs.length; i++){
				var title = parents[0].parentName + ': ' + truncateOutcome(parents[0].outcomeIDs[i]);
				titles[i] = title;
			}
			columnTitles = getMoreTitles(parents, titles);
			for (var j = 0; j<columnTitles.length; j++) {
				columnStruct[j] = { text: columnTitles[j], renderer: columnrenderer, datafield: columnTitles[j], width: widthSize };
			}
		}
		else {
			columnTitles[0] = "self value";
			columnStruct[0] = { text: "node has no parents", renderer: columnrenderer, datafield: columnTitles, width: widthSize };
		}

		// fill grid data
		columnStruct.unshift({text: " ", renderer: columnrenderer, datafield: "rowTitle", width: widthSize/2});
		var data = [];
		var defIter = 0;
		var start = 0;
		var numOutcomes = cpt.outcomeIDs.length;
		for (var i = 0; i < numOutcomes; i++) {
			data[i] = {};
			data[i]["rowTitle"] = truncateOutcome(cpt.outcomeIDs[i]);
			for (j = 0; j < columnTitles.length; j++) {
				data[i][columnTitles[j]] = cpt.definition[defIter];
				defIter = defIter + numOutcomes;
			}
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
		var colHeight = 20*numParents;
		if (numParents==0 || numParents==1) {
			colHeight = 30;
		}
		$("#dialogDefinitionPanel").jqxGrid( {
			source: dataAdapter,
			width: '100%',
			height: '100%',
			columnsheight: colHeight,
			columns: columnStruct
		});
	}).fail(function() {
	});
}