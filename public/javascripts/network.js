
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
	        'font-size': 12
	        
	      })
	      
	    .selector('edge')
	      .css({
	        'target-arrow-shape': 'triangle',
	        'width': 2,
	        'line-color': 'lightgray',
	        'target-arrow-color': '#ddd'
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

function centerNetwork()
{
	cy.center();
	cy.fit();
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
	cy.load(networkInfoArray[0]);
}



