
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
	$('#rawData').jqxWindow({
		width: 600, height: 400, resizable: true,
		okButton: $("#rawDoneButton"), autoOpen: false
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
	$('#dialogDefinitionPanel').jqxGrid('clear');

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

function createCPTGrid(cpt)
{
	$('#dialogDefinitionPanel').jqxGrid('clear');
	var columnrenderer = function (value) {
		return '<div style="text-align: center; vertical-align: middle;">' + value + '</div>';
	};

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
				//if (parents.length == 1) {
				//	title = (count+1).toString().concat(". <br>").concat(title);
				//}
				columnTitles[count] = title;
				count ++;
			}
		}
		return (getMoreTitles(parents, columnTitles));
	}

	var parents = cpt.parents;
	var numParents = cpt.parents.length;
	var numOutcomes = cpt.outcomeIDs.length;
	var columnTitles = [];
	var columnStruct = [];
	var titles = [];
	var count = 1;
	if (parents.length > 0) {
		for (var i = 0; i < parents[0].outcomeIDs.length; i++) {
			var title = parents[0].parentName + ': ' + truncateOutcome(parents[0].outcomeIDs[i]);
			titles[i] = title;
		}
		columnTitles = getMoreTitles(parents, titles);
	}
	else {
		columnTitles[0] = "node has no parents";
	}

	for (var j = 0; j<numOutcomes; j++) {
		columnStruct[j] = { text: truncateOutcome(cpt.outcomeIDs[j]), renderer: columnrenderer, datafield:cpt.outcomeIDs[j] , width: widthSize };
	}

	// fill grid data
	columnStruct.unshift({text: " ", renderer: columnrenderer, datafield: "rowTitle", width: widthSize});
	var data = [];
	var defIter = 0;
	for (var i = 0; i < columnTitles.length; i++) {
		data[i] = {};
		data[i]["rowTitle"] = columnTitles[i];
		for (j = 0; j < numOutcomes; j++) {
			data[i][cpt.outcomeIDs[j]] = cpt.definition[defIter];
			defIter++;
		}
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
	var rowHeight = 24*(numParents);
	if (numParents == 0 || numParents == 1) {
		rowHeight = 24;
	}

	$("#dialogDefinitionPanel").jqxGrid( {
		source: dataAdapter,
		width: '100%',
		height: '100%',
		columns: columnStruct,
		rowsheight: rowHeight
	});
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

function showRawData()
{
	$("#rawData").jqxWindow('open');
}

function getRawDataOptions(type)
{
	$("#rawDataButton").remove();
	if (type==="upload" || networkInfoArray.length > 3 ) {
		getRawData(type);
	}
}

function getRawData(type)
{
	$("#buttonsDiv").append('<input type="button" onclick="showRawData()" value="Raw Data" id="rawDataButton" />');
	$("#rawDataButton").attr("disabled", false);

	var name = networkInfoArray[2][0].modelname;
	$('#rawData').jqxWindow("setTitle", name);

	var fields = [];
	var columnStruct = [];

	if (type === "load"){
		var url = "assets/raw-data/" + name + ".csv";
		var columns = networkInfoArray[3][0].columnnames;

		createColumnStruct(columns,fields,columnStruct);

		var source = {
			dataType: "csv",
			dataFields: fields,
			url: url
		};

		createRawTable(source,columnStruct);
	}
	else {
		var reader = new FileReader();
		reader.onload = function(e)
		{
			var lines = reader.result.split('\n');
			var colNames = lines[0].split(',');

			createColumnStruct(colNames,fields,columnStruct);

			var data = csvToJSON(reader.result);
			var source =
			{
				dataType: "json",
				dataFields: fields,
				localData: data

			};

			createRawTable(source,columnStruct);
		};
		reader.readAsText($('#dataFile')[0].files[0]);
	}
}

function createColumnStruct(columns,fields,columnStruct) {
	// specific for raw data table view
	for (var i=0; i<columns.length; i++) {
		fields[i] = {};
		fields[i]["name"] = columns[i];
		fields[i]["type"] = "float";
		columnStruct[i] = {};
		columnStruct[i]["text"] = columns[i];
		columnStruct[i]["dataField"] = columns[i];
		columnStruct[i]["cellsFormat"] = 'f';
	}
}

function createRawTable(source, columnStruct) {
	var dataAdapter = new $.jqx.dataAdapter(source);
	$("#rawTable").jqxGrid(
		{
			width: "99%",
			height: "95%",
			source: dataAdapter,
			columnsResize: true,
			columns: columnStruct
		});
}
/*
function showUpload()
{
	$('#modelForm').trigger("reset");
	$('#dataForm').trigger("reset");

	$('#uploadDiv').jqxWindow({
		width: 400, height: 200, resizable: true,
		okButton: $("#uploadDone"),
		autoOpen: true
	});
	$('#uploadDiv').jqxWindow("setTitle", "Upload a model");

	$('#uploadDiv').jqxWindow('open');

	var fileName;

	$('#modelFile').change(function() {
		var file = this.files[0];
		fileName = file.name;
		if (fileName.substring(fileName.length-5,fileName.length) !== ".xdsl") {
			alert("only .xdsl file extensions will be accepted")
			$('#modelForm').trigger("reset");
		}
	});

	$('#dataFile').change(function() {
		var dataFile = this.files[0];
		var dataFileName = dataFile.name;
		if (dataFileName.substring(dataFileName.length-4, dataFileName.length) !== ".csv") {
			alert("only .csv file extensions will be accepted")
			$("#rawDataButton").remove();
			$('#dataForm').trigger('reset');
		}
	});
}
*/

function showHelp() {
    /*
    $('#helpDiv').on('open', function (event) {
        alert("You opened a window");
    });
    */
    $('#helpDiv').jqxWindow({
		width: 400, resizable: true,
		closeButtonAction: 'close',
		cancelButton: $('#helpCancelButton'),
		autoOpen: false
	});
	$('#helpDiv').jqxWindow("setTitle", "Help");

	$('#helpDiv').jqxWindow('open');

}

function csvToJSON(csv)
{
	var lines=csv.split("\n");
	var result = [];
	var headers=lines[0].split(",");

	for(var i=1;i<lines.length;i++){
		var obj = {};
		var currentline=lines[i].split(",");

		for(var j=0;j<headers.length;j++){
			obj[headers[j]] = currentline[j];
		}

		result.push(obj);
	}
	return JSON.stringify(result);
}
