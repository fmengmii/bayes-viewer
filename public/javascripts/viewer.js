
$(document).ready(function () {
//$(function() {
	//init widgets (dialog window, split pane, etc)
   $('#splitter').jqxSplitter({ width: '100%', height: '100%', panels: [{ size: '80%', min: 250 }, { size: '20%', min: 300}] });
   $('#splitter').on('resize', function(ev) {
	  cy.resize(); 
   });
   $("#chartJQXPanel").jqxPanel({ width: '100%', height: '100%', autoUpdate: true, sizeMode: 'fixed'});
   
   
   $('#dialogSetValues').jqxWindow({  width: 600,
       height: 400, resizable: true,
       okButton: $('#doneButton'), autoOpen: false
   });
   $('#dialogSetValues').on('close', function (event) {
	   if (event.args.dialogResult.OK) {
		   console.log("OK!");
	   }
   });
   
   //$('#dialogSetValues').jqxWindow('close');

   $("#nodeMenu").jqxMenu({ width: '140px', height: '120px', autoOpenPopup: false, mode: 'popup'});
   
   $('#dialogTabs').jqxTabs({ width: '100%', height: 300, position: 'top'});
   $("#dialogGeneralPanel").jqxPanel({ width: '100%', height: '100%', autoUpdate: true, sizeMode: 'fixed'});
   $("#dialogSetEvidencePanel").jqxPanel({ width: '100%', height: '100%', autoUpdate: true, sizeMode: 'fixed'});
   $("#dialogSetVirtualEvidencePanel").jqxPanel({ width: '100%', height: '100%', autoUpdate: true, sizeMode: 'fixed'});
	$("#dialogDefinitionPanel").jqxPanel({ width: '100%', height: '100%', autoUpdate: true, sizeMode: 'fixed'});

	//freewall
   	wall = new freewall("#chartDiv");
	wall.reset({
		selector: '.cell',
		animate: true,
		cellW: 300,
		onResize: function() {
			wall.refresh();
		}
	});
	wall.fitWidth();
});

function nodeSelected(nodeID, nodeName)
{
	$('#dialogTabs').jqxTabs('select', 0);
	$('#dialogSetValues').jqxWindow('title', nodeName);
	$("#dialogGeneralPanel").jqxPanel('clearcontent');
	$("#dialogSetEvidencePanel #formDiv").empty();
	$("#dialogSetVirtualEvidencePanel #formDiv").empty();
	$("#dialogDefinitionPanel").jqxPanel('clearcontent');
	
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
		$form.append('<input name="outcomeids" type="radio" value="' + nodeOutcomes[0].values[i].outcomeid + '" />' + truncateOutcome(nodeOutcomes[0].values[i].outcomeid) + '<br>');
		$formVirtual.append(truncateOutcome(nodeOutcomes[0].values[i].outcomeid) + ': <input name="voutcomeids" type="text" value="' + nodeOutcomes[0].values[i].value + '"/><br>');
	}
	
	$("#dialogSetEvidencePanel #formDiv").append($form);
	$("#dialogSetVirtualEvidencePanel #formDiv").append($formVirtual);
	//$('#dialogTabs').jqxTabs('focus');
	$('#dialogSetValues').jqxWindow('open');

	getCPT(nodeID);
}

function truncateOutcome(name)
{
	var maxLength = 10;
	var truncated;
	if (name.length > maxLength) {
		truncated = name.substring(0,maxLength);
	}
	else {
		truncated = name;
		for (var i=name.length; i<maxLength; i++) {
			truncated = truncated.concat(" ");
		}
	}
	return truncated;
}

function getRawData()
{
	$("#buttonsDiv").append('<input type="button" onclick="showRawData()" value="Raw Data" id="rawDataButton" />');

	$("#rawData").append('<div id="rawTable"></div>');
	$("#rawData").append('<div style="float: right"> <input type="button" onclick="turnRawButtonOn()" value="Done" id="rawDoneButton" /> </div>');
	turnRawButtonOn();
	$('#rawData').jqxWindow({
		width: 600, height: 400, resizable: true,
		okButton: $("#rawDoneButton"), autoOpen: false
	});

	var columns = networkInfoArray[3][0].columnnames;
	console.log(columns);
	var name = networkInfoArray[2][0].modelname;
	$('#rawData').jqxWindow("setTitle", name);

	var url = "assets/raw-data/" + name + ".csv";
	var data = [];
	var columnStruct = [];
	for (var i=0; i<columns.length; i++) {
		data[i] = {};
		data[i]["name"] = columns[i];
		data[i]["type"] = "float";

		columnStruct[i] = {};
		columnStruct[i]["text"] = columns[i];
		columnStruct[i]["dataField"] = columns[i];
		columnStruct[i]["cellsFormat"] = 'f';
	}

	var source =
	{
		dataType: "csv",
		dataFields: data,
		url: url
	};

	var dataAdapter = new $.jqx.dataAdapter(source);
	$("#rawTable").jqxDataTable(
		{
			width: '99%',
			height: '90%',
			source: dataAdapter,
			columnsResize: true,
			columns: columnStruct
		});
	$("#rawTable").on('bindingComplete', function () {
		$("#rawTable").jqxDataTable('deleteRow', 0);
	});
}

function emptyRawDataOptions()
{
	$("#rawData").empty();
	$("#rawDataButton").remove();
}

function showRawData()
{
	$("#rawDataButton").attr("disabled", true);
	$("#rawData").jqxWindow('open');
}

function turnRawButtonOn()
{
	$("#rawDataButton").attr("disabled", false);
}

function showUpload()
{
	$('#uploadDiv').jqxWindow({
		width: 400, height: 100, resizable: true,
		okButton: $("#uploadDone"),
		autoOpen: true
	});
	$('#uploadDiv').jqxWindow("setTitle", "Upload a model");

	$('#uploadDiv').jqxWindow('open');

	var fileName;

	$('#modelFile').change(function(){
		var file = this.files[0];
		fileName = file.name;
		if (fileName.substring(fileName.length-5,fileName.length) !== ".xdsl") {
			alert("only .xdsl file extensions will be accepted")
		}
		else {
			getUpload();
		}
	});
}

function progressHandlingFunction(e){
	if(e.lengthComputable){
		$('progress').attr({value:e.loaded,max:e.total});
	}
}


