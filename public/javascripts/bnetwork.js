var cy;
var networkNodeColor = "#74a9d8";
var realEvidenceNodeColor = "Green";
var virtualEvidenceNodeColor = "#8FBC8F";
var observationNodeColor = "DarkSalmon";
var searchNodeColor = "#dd99ff";
/*
var layoutName = "breadthfirst";
if( $("#load").val() != null && $("#load").val() != '' ) {
    var modelNameArray = $("#load").val().split(".");
    if( modelNameArray[1] == 'xdsl') {
        layoutName = "preset";
    }
}*/

//$(window).load(function () {
//$(function() { // on dom ready that the same as  $(document).ready(function(){});
function cytoscapeReady() {
    var layoutName = "breadthfirst";
    if( $("#load").val() != null && $("#load").val() != '' ) {
        //alert("model is xdsl.");
        var modelNameArray = $("#load").val().split(".");
        if( modelNameArray[1] == 'xdsl') {
            layoutName = "preset";
        }
    }
	cy = cytoscape({
	  container: document.getElementById('network'),
	  
	  style: cytoscape.stylesheet()
	  
	    .selector('node')
	      .css({
	        'content': 'data(nameLabel)',
	        'background-color': '#dd99ff',
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
	        //name: 'preset'
	        name: layoutName
	        //name: 'breadthfirst'
	      },
	      boxSelectionEnabled:false
	});

	cy.on('tap', 'node', function(evt) {
		//console.log(evt.cyTarget.id());
		nodeSelected(evt.cyTarget.id(), evt.cyTarget.data('name'));
	});
	
	cy.on('cxttap', 'node', function(evt) {
		//console.log(evt.cyTarget.id());
		//var color = cy.getElementById(evt.cyTarget.id()).css('background-color');
		var color = getNodeColor(evt.cyTarget.id());
		if (color == 'DarkSalmon') {
			//console.log(color);
			$('#nodeMenu #target').css({'color':'#F8F8F8'});
			$('#nodeMenu #offTarget').css({'color':'#000000'});
			$('#nodeMenu').jqxMenu('disable', 'target', true);
			$('#nodeMenu').jqxMenu('disable', 'offTarget', false);
		} else {
			//console.log(color);
			$('#nodeMenu #target').css({'color':'#000000'});
			$('#nodeMenu #offTarget').css({'color':'#F8F8F8'});
			$('#nodeMenu').jqxMenu('disable', 'target', false);
			$('#nodeMenu').jqxMenu('disable', 'offTarget', true);
		}
		var scrollTop = $(window).scrollTop();
        var scrollLeft = $(window).scrollLeft();
		$('#nodeMenu').jqxMenu('open', parseInt(event.clientX) + 5 + scrollLeft,
		    parseInt(event.clientY) + 5 + scrollTop);
		$('#nodeMenu #nodeID').val(evt.cyTarget.id());
	});
}
//}); // on dom ready

function saveToXdslFile() {
    var modelName = $("#load").val();
    if(modelName == null) {
	    alertBoxShow("Sorry, there is not an existed network yet.");
	} else {
	    //console.log("cy json=" + JSON.stringify(cy.json().elements.nodes));
        var saveToXdslFileAjax = jsRoutes.controllers.BnApp
                        .saveToXdslFile(modelName, JSON.stringify(cy.json().elements.nodes));
        $.ajax({
            url: saveToXdslFileAjax.url
        }).done(function(data) {
            console.log("validationResult return:" + data);
            if( data.startsWith("Error:") ) {
                var message = data.replace("Error:", "");
                alertBoxShow(message);
            } else {
                successBoxShow("The file has been successfully saved.");
            }
        }).fail(function(){
        });
    }
}

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
	    //alert("here.");
        successBoxShow("The network has been put at the center.");
    }
}

function setNodeColorAll(color)
{
	cy.$('node').css('background-color', color);
}

function setNodeColor(nodeID, color) {
	cy.getElementById(nodeID).css('background-color', color);
}

function getNodeColor( nodeID ) {
    return cy.getElementById(nodeID).css('background-color');
}

function networkLoadModel(model) {
    cytoscapeReady();
    $('#queryNodeNameDiv').empty();
    //addQueryNodeNameSelect(model);
    addQueryNodeNameSelect();
    if( $('#showAlgorithmChangeDiv').css('display') == "none" ) {
        $('#showAlgorithmChangeDiv').show();
    }

    drawLegend(model.originalNodeAcc, model.testNodeAcc);
    cy.load(model);
}

function drawLegend(originalNodeAcc, testNodeAcc) {
    if( $('#legendDiv').css('display') == "none" ) {
        $('#legendDiv').show();
        interfaceSizing();
    }
    if( $("#legendDiv svg").length ) {
        d3.select("svg").remove();
    }
    var yValue = -4; //11
    var xValue = 3;
    var maxWidth = $("#legendDiv").width();
    var left = 11; //maxWidth - 180;
    var r=8;
	var svg = d3.select("#legendDiv")
	    //**** responsive SVG
	    .classed("svg-container", true) //container class to make it responsive
	    //******
	    .append("svg")
	    //.attr("width", maxWidth)
	    //.attr("height", 24)
	    //***** using responsive SVG
	    .attr("preserveAspectRatio", "xMinYMin meet")
	    //.attr("viewBox", "0 0 600 400 " )
        .attr("viewBox", "0 0 " + maxWidth + " 24" )
        //class to make it responsive
        .classed("svg-content-responsive", true)
        //*****
	    .append("g")
	    .attr('transform', 'translate(' + left + ', 20)');

    var data = [{"x":xValue+37, "y":yValue, "color":networkNodeColor, "value":"Network",
                    "fontSize":"11px", "fontWeight":"", "r":r},
                {"x":xValue+100, "y":yValue, "color":realEvidenceNodeColor, "value":"Real Evidence",
                    "fontSize":"11px", "fontWeight":"", "r":r},
                {"x":xValue+193, "y":yValue, "color":virtualEvidenceNodeColor, "value":"Virtual Evidence",
                    "fontSize":"11px", "fontWeight":"", "r":r},
                {"x":xValue+296, "y":yValue, "color":observationNodeColor, "value":"Observation",
                    "fontSize":"11px", "fontWeight":"", "r":r},
                {"x":xValue+378, "y":yValue, "color":searchNodeColor, "value":"Search",
                    "fontSize":"11px", "fontWeight":"", "r":r}];

    if ( originalNodeAcc ) {
        data.push( {"x":xValue+429,"y":yValue, "color":"white",
                    "value":"Internal K-fold Cross Validation Accuracy",
                    "fontSize":"12px", "fontWeight":"", "r":0});

        data.push( {"x":xValue+420,"y":yValue, "color":"white",
                    "value":"I:",
                    "fontSize":"12px", "fontWeight":"bold", "r":0});

        data.push( {"x":xValue+662,"y":yValue, "color":"white",
                    "value":"External Validation Accuracy",
                    "fontSize":"12px", "fontWeight":"", "r":0});

        data.push( {"x":xValue+650,"y":yValue, "color":"white",
                    "value":"E:",
                    "fontSize":"12px", "fontWeight":"bold", "r":0});

        data.push( {"x":xValue+834,"y":yValue, "color":"white",
                    "value":"Original Raw Data",
                    "fontSize":"12px", "fontWeight":"", "r":0});
        data.push( {"x":xValue+820,"y":yValue, "color":"white",
                    "value":"O:",
                    "fontSize":"12px", "fontWeight":"bold", "r":0});
    }

    if( testNodeAcc ) {
        data.push( {"x":xValue+947,"y":yValue, "color":"white",
                    "value":"Test Data",
                    "fontSize":"12px", "fontWeight":"", "r":0});
        data.push( {"x":xValue+935,"y":yValue, "color":"white",
                    "value":"T:",
                    "fontSize":"12px", "fontWeight":"bold", "r":0});
    }

    var g = svg.selectAll("g").data(data).enter().append("g");

     var text = g.append("text")
	    .attr("x", -5)
	    .attr("y", yValue)
	    .attr("dy", ".45em")
	    .attr("fill", "black")
	    .style("font-size", "11px")
	    .text("Node:");

    var circle = g.append("circle")
        .attr("cx", function(d){ return d.x; })
        .attr("cy", function(d){ return d.y; })
        .attr("r", function(d){ return d.r; })
        .style("fill", function(d){ return d.color;});

    var text = g.append("text")
	    .attr("x", function(d){ return d.x+10;})
	    .attr("y", function(d){ return d.y;})
	    .attr("dy", ".45em")
	    .attr("fill", "black")
	    .style("font-size", function(d){ return d.fontSize;})
	    .style("font-weight", function(d){ return d.fontWeight;})
	    .text(function(d){ return d.value;});

}

