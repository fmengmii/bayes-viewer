function documentReady() {
    //$(document).ready(function () {

    var maxContentHeight = $("body").height() - $("#headerDiv").height() -
        $('#footDiv').height() ;
    $("#centerLeftDiv").css("height", maxContentHeight);
    $("#contentDiv").css("height", maxContentHeight);

    //var maxContentWidth = $(window).width() - $(".centerLeftTd").width();
    var maxContentWidth = $("body").width() - $(".centerLeftTd").width();
    //alert("maxContentW=" + maxContentWidth);
    $(".centerRightTd").css("width", maxContentWidth);
    $("#contentDiv").css("width", maxContentWidth);
    $("#lowerButtonsDiv").css("width", maxContentWidth);


    $(".lowerButtonsTable").css("width", maxContentWidth);
    $("#txtConfirmPassword").keyup(function() {
        var password = $("#txtNewPassword").val();
        $("#divCheckPasswordMatch").html(password == $(this).val() ? "Passwords match." : "Passwords do not match!");
    });

    //multiple select
    $("#modelSharedBy").multiselect().multiselectfilter();
    $("#rawDataSharedBy").multiselect().multiselectfilter();
    $("#updateModelSharedBy").multiselect().multiselectfilter();
    $("#updateRawDataSharedBy").multiselect().multiselectfilter();
    $("#queryNodeNameSelect").multiselect().multiselectfilter();

    var location = window.location.pathname;
    if( location == "/" ) {
        $('.leftButton').removeClass('selected');
        $('.predictiveButton').addClass('selected');
        $('.topButton').removeClass('selected');
        $('.homeButton').addClass('selectedHome');
    } else if( location.startsWith("/bn/home")) {
        $('.leftButton').removeClass('selected');
        $('.bnButton').addClass('selected');
        $('.topButton').removeClass('selected');
        $('.homeButton').addClass('selectedHome');

    } else if( location == "/bn/public" ) {
        $('.leftButton').removeClass('selected');
        $('.bnButton').addClass('selected');
        $('.bnButton').addClass('selected');
        $('.topButton').removeClass('selected');
        $('.publicButton').addClass('selected');
        $('.bnButton').addClass('selected');
    } else if( location == "/bn/private" ) {
        $('.leftButton').removeClass('selected');
        $('.bnButton').addClass('selected');
        $('.bnButton').addClass('selected');
        $('.topButton').removeClass('selected');
        $('.privateButton').addClass('selected');
        $('.bnButton').addClass('selected');
    } else {
        $('.leftButton').removeClass('selected');
        $('.predictiveButton').addClass('selected');
        $('.topButton').removeClass('selected');
    }

    if($('#flashSuccessWindow').is(':visible')) {
        flashSuccessBoxShow();
    }

    if($('#flashErrorWindow').is(':visible')) {
        flashErrorBoxShow();
    }
	//init widgets (dialog window, split pane, etc)
	//$('#splitter').jqxSplitter({ width: '100%', height: '100%', panels: [{ size: '80%', min: 250 }, { size: '20%', min: 300}] });
}

$(document).ready(function () {
    var notificationWidth = 720;
    var notificationHeight = 68;
    var maxHeight = $("body").height();
    var maxWidth = $("body").width();

    if( $(".lowerButtonsTr").length ) {
        var topButtonsDivPosition = $("#topButtonsDiv").position();
        var headerDivCenterPosition = $("#headerDiv .center").position();
        var notificationX = headerDivCenterPosition.left;
        var notificationY = topButtonsDivPosition.top - 1; //+ lowerButtonsTrHeight;

	    $('#confirmWindow').jqxWindow({
	        width: notificationWidth,
		    height: notificationHeight,
		    resizable: true,
		    position: {x:notificationX, y:notificationY},
		    //okButton: $('#doneButton'),
		    autoOpen: false
	    });

        $('#confirmLearnModelWindow').jqxWindow({
	        width: notificationWidth,
		    height: notificationHeight,
		    resizable: true,
		    position: {x:notificationX, y:notificationY},
		    //okButton: $('#doneButton'),
		    autoOpen: false
	    });

        $('#successWindow').jqxWindow({
            width: notificationWidth,
            height: notificationHeight,
            resizable: true,
            position: {x:notificationX, y:notificationY},
            //okButton: $('#doneButton'),
            autoOpen: false
        });

        $('#errorWindow').jqxWindow({
            width: notificationWidth,
            height: notificationHeight,
            resizable: true,
            position: {x:notificationX, y:notificationY},
            //okButton: $('#doneButton'),
            autoOpen: false
        });

        $('.jqx-window-header').hide();
        $('.alert').css("height", notificationHeight);
        $('.alert').css("width", notificationWidth);
    }

    interfaceSizing();

    $('#splitter').on('resize', function(ev) {
    	cy.resize();
    });

	$('#dialogSetValues').jqxWindow({ width: 600,
		height: 400, resizable: true,
		okButton: $('#doneButton'), autoOpen: false
	});

	$('#dialogSetValues').on('close', function (event) {
		if (event.args.dialogResult.OK) {
			console.log("OK!");
		}
	});

	$('#rawData').jqxWindow({
		width: 800, height: 600,
		maxHeight: maxHeight,
		maxWidth: maxWidth,
		resizable: true,
		okButton: $("#rawDoneButton"),
		autoOpen: false
	});

    $('#rawData').jqxWindow('expand');

	$('#rawDataValidationSumI').jqxWindow({
		width: 1200, height: 800,
		maxHeight: maxHeight,
		maxWidth: maxWidth,
		resizable: true,
		okButton: $("#rawDataValidationSumIDoneButton"),
		autoOpen: false
	});
    $('#rawDataValidationSumI').jqxWindow('expand');

    $('#rawDataValidationSumE').jqxWindow({
		width: 1200, height: 800,
		maxHeight: maxHeight,
		maxWidth: maxWidth,
		resizable: true,
		okButton: $("#rawDataValidationSumEDoneButton"),
		autoOpen: false
	});
    $('#rawDataValidationSumE').jqxWindow('expand');

    $('#rawDataValidationResultI').jqxWindow({
		width: 1200, height: 800,
		maxHeight: maxHeight,
		maxWidth: maxWidth,
		resizable: true,
		okButton: $("#rawDataValidationResultIDoneButton"),
		autoOpen: false
	});
    $('#rawDataValidationResultI').jqxWindow('expand');

    $('#rawDataValidationResultE').jqxWindow({
		width: 1200, height: 800,
		maxHeight: maxHeight,
		maxWidth: maxWidth,
		resizable: true,
		okButton: $("#rawDataValidationResultEDoneButton"),
		autoOpen: false
	});
    $('#rawDataValidationResultE').jqxWindow('expand');

    $('#testDataValidationSumI').jqxWindow({
		width: 1200, height: 800,
		maxHeight: maxHeight,
		maxWidth: maxWidth,
		resizable: true,
		okButton: $("#testDataValidationSumIDoneButton"),
		autoOpen: false
	});
	$('#testDataValidationSumI').jqxWindow('expand');

    $('#testDataValidationSumE').jqxWindow({
		width: 1200, height: 800,
		maxHeight: maxHeight,
		maxWidth: maxWidth,
		resizable: true,
		okButton: $("#testDataValidationSumEDoneButton"),
		autoOpen: false
	});
	$('#testDataValidationSumE').jqxWindow('expand');

	$('#testDataValidationResultI').jqxWindow({
		width: 1200, height: 800,
		maxHeight: maxHeight,
		maxWidth: maxWidth,
		resizable: true,
		okButton: $("#testDataValidationResultIDoneButton"),
		autoOpen: false
	});
	$('#testDataValidationResultI').jqxWindow('expand');

	$('#testDataValidationResultE').jqxWindow({
		width: 1200, height: 800,
		maxHeight: maxHeight,
		maxWidth: maxWidth,
		resizable: true,
		okButton: $("#testDataValidationResultEDoneButton"),
		autoOpen: false
	});
	$('#testDataValidationResultE').jqxWindow('expand');

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

    $(window).resize(function(){
        documentReady();
        interfaceSizing();
    });

});

function interfaceSizing() {
    var maxModelContentDivHeight = $("#contentDiv").height() - $("#topButtonsDiv").height() -
            $("#lowerButtonsDiv").height() - $("#legendDiv").height();
    if( $('#legendDiv').css('display') == "none" ) {
        maxModelContentDivHeight = maxModelContentDivHeight + $("#legendDiv").height() ;
    }

    //alert("maxModelContentDivH=" + maxModelContentDivHeight);
    var splitterWidth = $("#contentDiv").width() - 10;
    var updateDivWidth = $("#contentDiv").width() - 10;
    var uploadDivWidth = $("#contentDiv").width() - 10;
    var testModelDivWidth = $("#contentDiv").width() - 10;
    var viewLogDivWidth = $("#contentDiv").width() - 10;

    var splitterHeight = maxModelContentDivHeight;
    var updateDivHeight = maxModelContentDivHeight;
    var uploadDivHeight = maxModelContentDivHeight;
    var testModelDivHeight = maxModelContentDivHeight;
    var viewLogDivHeight = maxModelContentDivHeight;

    $('#updateDiv').css("height", updateDivHeight);
    $('#updateDiv').css("width", updateDivWidth);
    $('#uploadDiv').css("height", uploadDivHeight);
    $('#uploadDiv').css("width", uploadDivWidth);
    $('#testModelDiv').css("height", testModelDivHeight);
    $('#testModelDiv').css("width", testModelDivWidth);
    $('#viewLogDiv').css("height", viewLogDivHeight);
    $('#viewLogDiv').css("width", viewLogDivWidth);

	var networkWidth = splitterWidth - 330;
	$("#chartJQXPanel").jqxPanel({ width: '100%', height: '100%', autoUpdate: true, sizeMode: 'fixed'});
    //$('#splitter').jqxSplitter({ width: splitterWidth, height: maxSplitterHeight, panels: [{size: networkWidth}] });
    $('#splitter').jqxSplitter({ width: splitterWidth, height: splitterHeight, panels: [{size: networkWidth}] });
}

function flashSuccessBoxShow() {
    hideConfirmBox();
    hideConfirmLearnModelBox();
    hideSuccessBox();
    hideAlertBox();
    hideFlashErrorBox();

    var notificationWidth = 720;
    var notificationHeight = 54;
    var topButtonsDivPosition = $("#topButtonsDiv").position();
    var headerDivCenterPosition = $("#headerDiv .center").position();

    var notificationX = headerDivCenterPosition.left;
    var notificationY = topButtonsDivPosition.top - 1; //+ lowerButtonsTrHeight;

    $('#flashSuccessWindow').jqxWindow({
        width: notificationWidth,
        height: notificationHeight,
        resizable: true,
        position: {x:notificationX, y:notificationY},
        //okButton: $('#doneButton'),
        autoOpen: false
    });

    $('.alert').css("height", notificationHeight);
    $('.alert').css("width", notificationWidth);

    $('.jqx-window-header').hide();
    $("#flashSuccessWindow").show();
    $("#flash-success-box").show();

}

function flashErrorBoxShow() {
    hideConfirmBox();
    hideConfirmLearnModelBox();
    hideSuccessBox();
    hideAlertBox();
    hideFlashSuccessBox();

    var notificationWidth = 720;
    var notificationHeight = 54;
    var topButtonsDivPosition = $("#topButtonsDiv").position();
    var headerDivCenterPosition = $("#headerDiv .center").position();

    var notificationX = headerDivCenterPosition.left;
    var notificationY = topButtonsDivPosition.top - 1; //+ lowerButtonsTrHeight;

    $('#flashErrorWindow').jqxWindow({
        width: notificationWidth,
        height: notificationHeight,
        resizable: true,
        position: {x:notificationX, y:notificationY},
        //okButton: $('#doneButton'),
        autoOpen: false
    });

    $('.alert').css("height", notificationHeight);
    $('.alert').css("width", notificationWidth);

    $('.jqx-window-header').hide();
    $("#flashErrorWindow").show();
    $("#flash-error-box").show();
}

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
    /*
    var nodeName = nodeOutcomes[0].nodename;
	var nodeOutcomes = nodeOutcomes[0].values;
	var nodeVirtualEvidenceValues = nodeOutcomes[0].virtaulEvidenceValues;
	*/
	var isRealEvidence = nodeOutcomes[0].isRealEvidence;
	var isVirtualEvidence = nodeOutcomes[0].isVirtualEvidence;

	var i;
	for (i=0; i<nodeOutcomes[0].values.length; i++) {
		//$form.append(nodeOutcomes[0].values[i].outcomeid + ": ");
		if(isRealEvidence == "true" && nodeOutcomes[0].values[i].value == 1) {
		    $form.append('<input name="outcomeids" type="radio" value="' +
		        nodeOutcomes[0].values[i].outcomeid + '" checked />' +
		        truncateOutcome(nodeOutcomes[0].values[i].outcomeid) + '<br>');
		} else {
		    $form.append('<input name="outcomeids" type="radio" value="' +
		        nodeOutcomes[0].values[i].outcomeid + '" />' +
		        truncateOutcome(nodeOutcomes[0].values[i].outcomeid) + '<br>');
		}

		if(isVirtualEvidence == "true") {
		    $formVirtual.append(truncateOutcome(nodeOutcomes[0].values[i].outcomeid) +
		    ': <input name="voutcomeids" type="text" value="' +
		    nodeOutcomes[0].values[i].value + '"/><br>');
		} else {
		    $formVirtual.append(truncateOutcome(nodeOutcomes[0].values[i].outcomeid) +
		    ': <input name="voutcomeids" type="text" value="0"/><br>');
		}
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
				var title =  titles[i] + '<br>' + parents[0].parentName + ': ' +
				    truncateOutcome(parents[0].outcomeIDs[j]);
				//if (parents.length == 1) {
				//	title = (count+1).toString().concat(". <br>").concat(title);
				//}
				columnTitles[count] = title;
				count++;
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
    if( $("#load").val() == null || $("#load").val() == '') {
        alertBoxShow("Please select a network file first.");
        return false;
    }
    var modelName = $("#load").val();
    if(modelName == null) {
	    alertBoxShow("Sorry, there is not an existed network yet.");
	} else {
        var getRawDataAjax = jsRoutes.controllers.BnApp.getRawData(modelName);
        $.ajax({
            url: getRawDataAjax.url
        }).done(function(data) {
            if( data.startsWith("Error:") ) {
                var message = data.replace("Error:", "");
                alertBoxShow(message);
            } else {
                getRawData(modelName, data);
                $("#rawData").jqxWindow('open');

            }
        }).fail(function(){
        });
    }

}

function getRawDataOptions(type)
{
	$("#rawDataButton").remove();
	if (type==="upload" || networkInfoArray.length > 3 ) {
		getRawData(type);
	}
}

function getRawData(modelName, fileContent)
{
	$('#rawData').jqxWindow("setTitle", "Raw Data for " + modelName);
	var fields = [];
	var columnStruct = [];

	var lines = fileContent.split('\n');
	var colNames = lines[0].split(',');

	createColumnStruct(colNames,fields,columnStruct);

	var data = csvToJSON(fileContent, "\n", ",");
	var source =
		{
			dataType: "json",
			dataFields: fields,
			localData: data
		};

	createRawTable(source,columnStruct);
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
			alertBoxShow("only .xdsl file extensions will be accepted");
			$('#modelForm').trigger("reset");
		}
	});

	$('#dataFile').change(function() {
		var dataFile = this.files[0];
		var dataFileName = dataFile.name;
		if (dataFileName.substring(dataFileName.length-4, dataFileName.length) !== ".csv") {
			alertBoxShow("only .csv file extensions will be accepted");
			$("#rawDataButton").remove();
			$('#dataForm').trigger('reset');
		}
	});
}
*/

function showHelp() {
    /*
    $('#helpDiv').on('open', function (event) {
        alertBoxShow("You opened a window");
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

function csvToJSON(csv, lineDelimiter, colDelimiter){
    if( lineDelimiter == null ) {
        lineDelimiter = "\n";
    }
    if( colDelimiter == null ) {
        colDelimiter == ",";
    }
	//var lines=csv.split("\n");
	var lines=csv.split(lineDelimiter);
	var result = [];
	//var headers=lines[0].split(",");
	var headers=lines[0].split(colDelimiter);

	for(var i=1;i<lines.length;i++){
		var obj = {};
		var currentLine = lines[i].split(colDelimiter);

		for(var j=0;j<headers.length;j++){
			obj[headers[j]] = currentLine[j];
		}

		result.push(obj);
	}
	return JSON.stringify(result);
}
/*
function homeButtonClick () {
    alert("viewer: home click.");
    location.href = "/";
    alert("viewer:button click here");
    $('.topButton').removeClass('selected');
    $('.homeButton').addClass('buttonSelected');
    //return true;
}*/

