
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
       okButton: $('#doneButton'),
       initContent: function () {
           $("#dialogGeneralPanel").jqxPanel({ width: 590, height: 300});
           $("#dialogSetEvidencePanel").jqxPanel({ width: 590, height: 300});
       }
   });
   $('#dialogSetValues').on('close', function (event) {
	   if (event.args.dialogResult.OK) {
		   console.log("OK!");
	   }
   });
   
   $('#dialogSetValues').jqxWindow('close');
   
   $("#nodeMenu").jqxMenu({ width: '120px', height: '140px', autoOpenPopup: false, mode: 'popup'});
   
   $('#dialogTabs').jqxTabs({ width: '100%', height: 300, position: 'top'});
   $("#dialogGeneralPanel").jqxPanel({ width: '100%', height: '100%', autoUpdate: true, sizeMode: 'fixed'});
   $("#dialogSetEvidencePanel").jqxPanel({ width: '100%', height: '100%', autoUpdate: true, sizeMode: 'fixed'});
   $("#dialogSetVirtualEvidencePanel").jqxPanel({ width: '100%', height: '100%', autoUpdate: true, sizeMode: 'fixed'});
   
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