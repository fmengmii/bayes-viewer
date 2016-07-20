
var cy;

//$(window).load(function () {
$(function() { // on dom ready

	cy = cytoscape({
	  container: document.getElementById('network'),
	  
	  style: cytoscape.stylesheet()
	  
	    .selector('node')
	      .css({
	        'content': 'data(nameLabel)',
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
	      },
	      boxSelectionEnabled:false
	});
  
	cy.on('tap', 'node', function(evt) {
		console.log(evt.cyTarget.id());
		nodeSelected(evt.cyTarget.id(), evt.cyTarget.data('name'));
	});
	
	cy.on('cxttap', 'node', function(evt) {
		console.log(evt.cyTarget.id());
		var color = cy.getElementById(evt.cyTarget.id()).css('background-color');
		if (color == 'DarkSalmon') {
			console.log(color);
			$('#nodeMenu #target').css({'color':'#F8F8F8'});
			$('#nodeMenu #offTarget').css({'color':'#000000'});
			$('#nodeMenu').jqxMenu('disable', 'target', true);
			$('#nodeMenu').jqxMenu('disable', 'offTarget', false);
		} else {
			console.log(color);
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

function setNodeColor(nodeID, color)
{
	cy.getElementById(nodeID).css('background-color', color);
}

function networkLoadModel(model) {
	//cy.load(networkInfoArray[0]);
	cy.load(model);
    if( $('#queryNodeNameDiv').css('display') == "none" ) {
        addQueryNodeNameSelect(model);
    }

    if( $('#showAlgorithmChangeDiv').css('display') == "none" ) {
        $('#showAlgorithmChangeDiv').show();
    }

    drawLegend(model.allNodeAcc, model.allNodeAccInternal,
            model.allNodeAccExternal);
}

function drawLegend(allNodeAcc, allNodeAccInternal, allNodeAccExternal) {
    if( $("#network svg").length ) {
        d3.select("svg").remove();
    }
    var yValue = 11;
    var iniY = yValue + 100;
	var maxWidth = $("#network").width();

    var left = 11; //maxWidth - 180;
    var x = 20;
    var r=8;
	var svg = d3.select("#network")
	    .append("svg")
	    .attr("width", maxWidth)
	    .attr("height", 300)
	    .append("g")
	    .attr('transform', 'translate(' + left + ', 20)');

    var data = [{"x":40, "y":yValue, "color":"Lightblue", "value":"Network Node",
                    "fontSize":"12px", "fontWeight":""},
                {"x":40, "y":yValue+20, "color":"Green", "value":"Real Evidence Node",
                    "fontSize":"12px", "fontWeight":""},
                {"x":40, "y":yValue+40, "color":"#8FBC8F", "value":"Virtual Evidence Node",
                    "fontSize":"12px", "fontWeight":""},
                {"x":40, "y":yValue+60, "color":"DarkSalmon", "value":"Target Node",
                    "fontSize":"12px", "fontWeight":""},
                {"x":40, "y":yValue+80, "color":"#dd99ff", "value":"Query Node",
                    "fontSize":"12px", "fontWeight":""}];

    if(allNodeAcc && allNodeAccInternal && allNodeAccExternal) {
        data.push({"x":40,"y":iniY, "color":"white",
                        "value":"10-fold Cross Validation Accuracy for the Model Raw Data",
                        "fontSize":"12px", "fontWeight":""},
                  {"x":14, "y":iniY, "color":"white", "value":"O:", "fontSize":"14px", "fontWeight":"bold"},
                  {"x":40,"y":iniY+20, "color":"white",
                        "value":"10-fold Cross Validation Accuracy for the Test Data",
                        "fontSize":"12px", "fontWeight":""},
                  {"x":17, "y":iniY+20, "color":"white", "value":"I:", "fontSize":"14px", "fontWeight":"bold"},
                  {"x":40,"y":iniY+40, "color":"white",
                        "value":"External Validation Accuracy for the Test Data",
                        "fontSize":"12px", "fontWeight":""},
                  {"x":14, "y":iniY+40, "color":"white", "value":"E:", "fontSize":"14px", "fontWeight":"bold"});
                 // "value":"10-fold Cross Validation Accuracy for the Raw Data, the Total="+allNodeAcc,
                 // "value":"10-fold Cross Validation Accuracy for the Test Data, the Total="+allNodeAccInternal
                 //"value":"External Validation Accuracy for the Test Data, the Total="+allNodeAccExternal,
    } else if(allNodeAcc) {
        data.push({"x":40,"y":iniY, "color":"white",
                        "value":"10-fold Cross Validation Accuracy for the Model Raw Data",
                        "fontSize":"12px", "fontWeight":""},
                  {"x":14, "y":iniY, "color":"white", "value":"O:", "fontSize":"14px", "fontWeight":"bold"});
    }

    var g = svg.selectAll("g").data(data).enter().append("g");

    var circle = g.append("circle")
        .attr("cx", x)
        .attr("cy", function(d){ return d.y; })
        .attr("r", r)
        .style("fill", function(d){ return d.color;});

    var text = g.append("text")
	    .attr("x", function(d){ return d.x;})
	    .attr("y", function(d){ return d.y;})
	    .attr("dy", ".45em")
	    .attr("fill", "black")
	    .style("font-size", function(d){ return d.fontSize;})
	    .style("font-weight", function(d){ return d.fontWeight;})
	    .text(function(d){ return d.value;});

}

function addQueryNodeNameSelect( model ) {
    var nodes = model.nodes;
    var nodeIDs = [];
    var selectString = "<select size='5' id='queryNodeNameSelect' " +
        "name='queryNodeNameSelect' multiple='multiple'>";

    for( var i=0; i<nodes.length; i++ ){
	    selectString += "<option value='" + nodes[i].data.id + "'>" +
	        nodes[i].data.name + "</option>";
	}
	selectString +=	"</select>";

    selectString += "&nbsp;"
	selectString += "<button class='queryNodeNameButton' " +
	    "onclick='queryNodeName();'>query</button>";
	$("#queryNodeNameDiv").append(selectString);
	$("#queryNodeNameSelect").multiselect().multiselectfilter();
	$('#queryNodeNameDiv').show();
}

function queryNodeName(){
    var queryNodeNameArray = $("#queryNodeNameSelect").val();
    if( queryNodeNameArray.length == 0 ) {
        alertBoxShow("Please select node name first.");
    } else {
        for( var i=0; i< queryNodeNameArray.length; i++ ) {
            cy.getElementById(queryNodeNameArray[i]).css('background-color', "#dd99ff");
        }
    }
}