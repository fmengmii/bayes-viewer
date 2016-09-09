var cy;

//$(window).load(function () {
$(function() { // on dom ready

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
	        name: 'preset'
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
	    .append("svg")
	    .attr("width", maxWidth)
	    .attr("height", 24)
	    .append("g")
	    .attr('transform', 'translate(' + left + ', 20)');

    var data = [{"x":xValue, "y":yValue, "color":"#74a9d8", "value":"Network Node",
                    "fontSize":"12px", "fontWeight":""},
                {"x":xValue+100, "y":yValue, "color":"Green", "value":"Real Evidence Node",
                    "fontSize":"12px", "fontWeight":""},
                {"x":xValue+234, "y":yValue, "color":"#8FBC8F", "value":"Virtual Evidence Node",
                    "fontSize":"12px", "fontWeight":""},
                {"x":xValue+376, "y":yValue, "color":"DarkSalmon", "value":"Observation Node",
                    "fontSize":"12px", "fontWeight":""},
                {"x":xValue+498, "y":yValue, "color":"#dd99ff", "value":"Searched Node",
                    "fontSize":"12px", "fontWeight":""}];

    if ( originalNodeAcc ) {
        data.push( {"x":xValue+620,"y":yValue, "color":"white",
                    "value":"Internal K-fold Cross Validation Accuracy",
                    "fontSize":"12px", "fontWeight":""});

        data.push( {"x":xValue+611,"y":yValue, "color":"white",
                    "value":"I:",
                    "fontSize":"12px", "fontWeight":"bold"});

        data.push( {"x":xValue+870,"y":yValue, "color":"white",
                    "value":"External Validation Accuracy",
                    "fontSize":"12px", "fontWeight":""});

        data.push( {"x":xValue+856,"y":yValue, "color":"white",
                    "value":"E:",
                    "fontSize":"12px", "fontWeight":"bold"});

        data.push( {"x":xValue+1055,"y":yValue, "color":"white",
                    "value":"Original Raw Data",
                    "fontSize":"12px", "fontWeight":""});
        data.push( {"x":xValue+1041,"y":yValue, "color":"white",
                    "value":"O:",
                    "fontSize":"12px", "fontWeight":"bold"});
    }

    if( testNodeAcc ) {
        data.push( {"x":xValue+1182,"y":yValue, "color":"white",
                    "value":"Test Data",
                    "fontSize":"12px", "fontWeight":""});
        data.push( {"x":xValue+1170,"y":yValue, "color":"white",
                    "value":"T:",
                    "fontSize":"12px", "fontWeight":"bold"});
    }

    var g = svg.selectAll("g").data(data).enter().append("g");

    var circle = g.append("circle")
        .attr("cx", function(d){ return d.x; })
        .attr("cy", function(d){ return d.y; })
        .attr("r", r)
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

//function addQueryNodeNameSelect( model ) {
/*function addQueryNodeNameSelect(){
    var model = networkInfoArray[0];
    var nodes = model.nodes;
    var nodeIDs = [];
    var selectString = "<label for='queryNodeNameSelect' " +
            "class='queryNodeNameLabel'>Search a node by name:&nbsp;</label>";

    selectString += "<select size='5' id='queryNodeNameSelect' " +
        "name='queryNodeNameSelect' multiple='multiple'>";

    for( var i=0; i<nodes.length; i++ ){
	    selectString += "<option value='" + nodes[i].data.id + "'>" +
	        nodes[i].data.name + "</option>";
	}
	selectString +=	"</select>";

    selectString += "&nbsp;"
	selectString += "<button class='queryNodeNameButton' " +
	    "onclick='queryNodeName();'>search</button>";
	selectString += "&nbsp;&nbsp;&nbsp;&nbsp;<button class='legendToggleButton' " +
	    "onclick='toggleLegend();'>legend</button>";

    var isTestData = true;
    if( model.originalNodeAcc == "true" ) {
        isTestData = false;
	    selectString += "&nbsp;&nbsp;&nbsp;&nbsp;<button class='viewRawDataValidationResultButton' " +
	        "onclick='viewDataValidationResult(false);'>view raw data validation result</button>";
	}
	if( model.testNodeAcc == "true" ) {
	    selectString += "&nbsp;&nbsp;&nbsp;&nbsp;<button class='viewTestDataValidationResultButton' " +
	        "onclick='viewDataValidationResult(true);'>view test data validation result</button>";
	}

	$("#queryNodeNameDiv").append(selectString);
	$("#queryNodeNameSelect").multiselect().multiselectfilter();
	$('#queryNodeNameDiv').show();
}

function addQueryNodeName( nodeID, nodeName) {
    var exist = false;
    $("#queryNodeNameSelect option").each(function(){
        if( $(this).val() == nodeID ) {
            exist = true;
        }
    });
    if( !exist ) {
	    $('#queryNodeNameSelect').append("<option value='" + nodeID + "'>" +
	            nodeName + "</option>");
	    var options = $("#queryNodeNameSelect option");     // Collect options
        options.detach().sort(function(a,b) {               // Detach from select, then Sort
            var at = $(a).text();
            var bt = $(b).text();
            return (at > bt)?1:((at < bt)?-1:0);            // Tell the sort function how to order
        });
        options.appendTo("#queryNodeNameSelect");
	    $("#queryNodeNameSelect").multiselect("refresh");
    }
}

function removeQueryNodeName( nodeID ) {
    $("#queryNodeNameSelect option").each(function(){
        if( $(this).val() == nodeID ) {
            $(this).remove();
        }
    });
    var options = $("#queryNodeNameSelect option");     // Collect options
    options.detach().sort(function(a,b) {               // Detach from select, then Sort
        var at = $(a).text();
        var bt = $(b).text();
        return (at > bt)?1:((at < bt)?-1:0);            // Tell the sort function how to order
    });
    options.appendTo("#queryNodeNameSelect");
    $("#queryNodeNameSelect").multiselect("refresh");
}


/**
 * Array.prototype.[method name] allows you to define/overwrite an objects method
 * needle is the item you are searching for
 * this is a special variable that refers to "this" instance of an Array.
 * returns true if needle is in the array, and false otherwise
 */

/*
Array.prototype.contains = function ( needle ) {
   for (i in this) {
       if (this[i] == needle) return true;
   }
   return false;
}

function queryNodeName(){
    var queryNodeNameArray = $("#queryNodeNameSelect").val();
    var outcomeValues = networkInfoArray[1];
    for( var index=0; index < outcomeValues.length; index++ ) {
		nodeOutcomes = outcomeValues[index];
		var chartClass = '.chart' + index;
		$(chartClass).empty();
		drawChart(nodeOutcomes, chartClass);
		$('#chartDiv').trigger('resize');
	}
}

function toggleLegend(){
    $('#legendDiv').toggle();
    interfaceSizing();
}

function viewRawDataValidationResult() {
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
*/
