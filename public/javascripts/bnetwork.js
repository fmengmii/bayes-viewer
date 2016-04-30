
var cy;

//$(window).load(function () {
$(function() { // on dom ready

	cy = cytoscape({
	  container: document.getElementById('network'),
	  
	  style: cytoscape.stylesheet()
	  
	    .selector('node')
	      .css({
	        'content': 'data(name)',
	        'background-color': 'lightblue',
	        'font-size': 12,
			'font-family': "Helvetica"
	        
	      })
	      
	    .selector('edge')
	      .css({
	        'target-arrow-shape': 'triangle',
	        'width': 2,
	        'line-color': '#a6a6a6',
	        //'lightgray',
	        'target-arrow-color':'#a6a6a6'
	         //'#ddd'
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
		var color = cy.getElementById(evt.cyTarget.id()).css('background-color');
		if (color == 'yellow') {
			console.log(color);
			$('#nodeMenu #target').css({'color':'#F8F8F8'});
			$('#nodeMenu #offTarget').css({'color':'black'});
			$('#nodeMenu').jqxMenu('disable', 'target', true);
			$('#nodeMenu').jqxMenu('disable', 'offTarget', false);
		} else {
			console.log(color);
			$('#nodeMenu #target').css({'color':'black'});
			$('#nodeMenu #offTarget').css({'color':'#F8F8F8'});
			$('#nodeMenu').jqxMenu('disable', 'target', false);
			$('#nodeMenu').jqxMenu('disable', 'offTarget', true);
		}
		var scrollTop = $(window).scrollTop();
        var scrollLeft = $(window).scrollLeft();
		$('#nodeMenu').jqxMenu('open', parseInt(event.clientX) + 5 + scrollLeft, parseInt(event.clientY) + 5 + scrollTop);
		$('#nodeMenu #nodeID').val(evt.cyTarget.id());
	});

}); // on dom ready

function centerNetwork(showMessage)
{
    if( $("#load").val() == null || $("#load").val() == '') {
        alertBoxShow("Please select a network file first.");
        return false;
    }

    if( !$("#splitter").is(":visible") ) {
        alertBoxShow("Please view a network first.");
        return false;
    }
	cy.center();
	cy.fit();
	if(showMessage) {
	    alert("here.");
        successBoxShow("The network has been put at the center.");
    }
}

function setNodeColorAll(color)
{
	cy.$('node').css('background-color', color);
}

function setNodeColor(nodeID, color)
{
	cy.getElementById(nodeID).css('background-color', color);
}

function networkLoadModel(model)
{
	//cy.load(networkInfoArray[0]);
	cy.load(model);
}

/*function showUpload()
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
