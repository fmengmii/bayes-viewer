var networkInfoArray;

//function loadModel(modelName) {
function loadModel() {
    if( $("#load").val() == null || $("#load").val() == '') {
        alertBoxShow("Please select a network file first.");
        return false;
    }
    var modelName = $("#load").val();
    $('.lowerButton').removeClass('selected');
    $('.showNetworkButton').addClass('selected');

    $('#splitter').hide();
    $('#viewLogDiv').hide();
    $('#uploadDiv').hide();
    $('#updateDiv').hide();

	if(modelName == null) {
	    alertBoxShow("Sorry, there is not an existed network yet.");
	} else {
        /*
        var modelPath = "public/models/" + modelName;
        var loadModelAjax = jsRoutes.controllers.Application.loadModel(modelPath);
        */
        if(modelName.indexOf("sharedBy") != -1){
            var modelNameArray = modelName.split("sharedBy");
            modelName = modelNameArray[0].trim();
        }
        var loadModelAjax = jsRoutes.controllers.Application.loadModel(modelName);
        $.ajax({
            url: loadModelAjax.url
        }).done(function(data) {
            //console.log(data);
            //$('#uploadDiv').hide();
            //$('#splitter').css('display', 'block');
            $('#splitter').show();
            networkInfoArray = JSON.parse(data);
            //cy.load(networkInfoArray[0]);
            //clearAllEvidence();
            networkLoadModel(networkInfoArray[0]);
            drawCharts(networkInfoArray[1]);
            $('#chartDiv').trigger('resize');

            clearAllEvidence();
            //location.reload();
            //getRawDataOptions("load");
            //console.log(networkInfoArray);
        }).fail(function() {
        });

        //clearAllEvidence();
    }
	//cy.load({nodes:[{data: {id:'a'}},{data: {id:'b'}}],edges:[{data:{id:'ab',source:'a',target:'b'}}]});
}

function showUpload() {
    $('.lowerButton').removeClass('selected');
    $('.uploadButton').addClass('selected');

    $('#splitter').hide();
    $('#viewLogDiv').hide();
    $('#updateDiv').hide();
    $('#uploadDiv').show();
    $("#load").val('');
}
/*
function showUpdate() {
    $('.lowerButton').removeClass('selected');
    $('.updateModelButton').addClass('selected');

    $('#splitter').hide();
    $('#uploadDiv').hide();
    $('#viewLogDiv').hide();
    $('#updateDiv').show();
}*/

function deleteModel(){
    var modelName = $("#load").val();
    $('.lowerButton').removeClass('selected');
    $('.deleteModelButton').addClass('selected');
    if( $("#load").val() == null || $("#load").val() == '') {
        alertBoxShow("Please select a network file first.");
        return false;
    }
	if(modelName == null) {
	    alertBoxShow("Sorry, there is not an existed network yet.");
	} else {
	    if(modelName.indexOf("sharedBy") != -1){
	        alertBoxShow("You don't have a privilege to delete the file because it's a shared file.");
	        return false;
        }
        var message="Are you sure to delete the model file?";
        confirmBoxForDelete(message,
                        modelName,
                        confirmYesFunctionForDelete,
                        confirmNoFunction);

	}
}

function updateModel() {
    var modelName = $("#load").val();
    $('.lowerButton').removeClass('selected');
    $('.updateModelButton').addClass('selected');

    $('#updateDiv').hide();
    $('#splitter').hide();
    $('#uploadDiv').hide();
    $('#viewLogDiv').hide();

    if( $("#load").val() == null || $("#load").val() == '') {
        alertBoxShow("Please select a network file first.");
        return false;
    }
    if(modelName == null) {
	    alertBoxShow("Sorry, there is not an existed network yet.");
	} else {
	    if(modelName.indexOf("sharedBy") != -1){
	        alertBoxShow("You don't have a privilege to update the file because it's a shared file.");
	        return false;
        }
        var getModelStatusAjax = jsRoutes.controllers.Application.getModelStatus(modelName);
        $.ajax({
            url: getModelStatusAjax.url
        }).done(function(data) {
            $('#updateDiv').show();
            var updateDivContent = '<p style="font-size:20px">' +
                '<strong>The current status of the file:</strong></p>';
            updateDivContent += '<p class="selectedModelFileName">' +
                'Model file name:&nbsp;' + $('#load').val() + '</p>';
            updateDivContent += '<p class="uploadedBy">' +
                'Uploaded by:&nbsp;' + data.uploadedBy + '</p>';
            updateDivContent += '<p class="uploadTime">' +
                'Upload time:&nbsp;' + data.uploadTime +'</p>';
            if( data.isPublic ) {
                updateDivContent += '<p class="isPublic">' +
                    'The model file is public.</p>';
            } else if( data.sharedWith != null && data.sharedWith != "") {
                updateDivContent += '<p class="sharedWith">' +
                    'Shared with:&nbsp;' + data.sharedWith + '</p>';
            } else {
                updateDivContent += '<p class="sharedWith">' +
                    'Shared with:&nbsp;No</p>';
            }
            if( data.rawDataFileName != null &&  data.rawDataFileName != "") {
                updateDivContent += '<p class="rawDataFileName">' +
                    'Raw data file name:&nbsp;' + data.rawDataFileName + '</p>';
            }
            $('#fileStatusDiv').html(updateDivContent);
            /*
            $('.selectedModelFileName').html("Model file name:&nbsp;" + $('#load').val());
            $('.uploadedBy').html("Uploaded by:&nbsp;" + data.uploadedBy);
            $('.uploadTime').html("Upload time:&nbsp;" + data.uploadTime);

            $('.isPublic').empty();
            $('.sharedWith').empty();
            $('.rawDataFileName').empty();
            if( data.isPublic ) {
                $('.isPublic').html("The model file is public.");
            } else if( data.sharedWith != null && data.sharedWith != "") {
                $('.sharedWith').html("Shared with:&nbsp;" + data.sharedWith);
            } else {
                $('.sharedWith').html("Shared with:&nbsp;No");
            }
            if( data.rawDataFileName != null &&  data.rawDataFileName != "") {
                $('.rawDataFileName').html(
                    "Raw data file name:&nbsp;" + data.rawDataFileName);
            }
            */
        }).fail(function() {
        });
    }
}

function viewLogHistory (){
    var modelName = $("#load").val();
    $('.lowerButton').removeClass('selected');
    $('.viewLogButton').addClass('selected');

    $('#viewLogDiv').hide();
    $('#splitter').hide();
    $('#updateDiv').hide();
    $('#uploadDiv').hide();

    if( $("#load").val() == null || $("#load").val() == '') {
        alertBoxShow("Please select a network file first.");
        return false;
    }
    if(modelName == null) {
	    alertBoxShow("Sorry, there is not an existed network yet.");
	} else {
	    if(modelName.indexOf("sharedBy") != -1){
	        alertBoxShow("You don't have a privilege to view the file because it's a shared file.");
	        return false;
        }
        var getModelHistoryAjax = jsRoutes.controllers.Application.getModelHistory(modelName);
        $.ajax({
            url: getModelHistoryAjax.url
        }).done(function(data) {
            logArray = data.logList;
            $('#viewLogDiv').show();
            var logTableContent = "";

            logTableContent += "<table id='tableSortable' class='sortable logTable'>";
            logTableContent += "<tr><th class='operationNo'>No.</th>";
            logTableContent += "<th class='operationBy'>Operation By</th>";
            logTableContent += "<th class='operation'>Operation</th>";
            logTableContent += "<th class='operationTime'>Operation Time</th>";

            for( var index = 0; index<logArray.length; index++){
                var row = index + 1;
                logTableContent += "<tr><td>" + row + "</td>";
                if(logArray[index].user != null ) {
                    logTableContent += "<td>" + logArray[index].user.firstName +
                        " " + logArray[index].user.lastName + "</td>";
                } else {
                    logTableContent += "<td>" + "public user from " +
                        logArray[index].publicUserIP + "</td>";
                }
                logTableContent += "<td>" + logArray[index].operation + "</td>";
                logTableContent += "<td>" + logArray[index].updateTime +
                    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td></tr>";
            }

            logTableContent += "</table>";
            $('#viewLogDiv').html(logTableContent);
            var newTableObject = document.getElementById("tableSortable");
            sorttable.makeSortable(newTableObject);

            /* show viewLogDiv scroll */
            var maxContentHeight = $(window).height() -
                $('#headerDiv').height() - $('#buttonsDiv').height() -
                $('#footerDiv').height();

			var logTableWidth = $('.logTable').outerWidth();
			var logTableHeight = $('.logTable').outerHeight();
			if( logTableHeight >= maxContentHeight - 50 ) {
				$('#viewLogDiv').css("height", maxContentHeight - 150 );
			} else {
				$('#viewLogDiv').css("height", logTableHeight );
			}

			$('#viewLogDiv').css("width", logTableWidth + 80 );
        }).fail(function() {
        });
    }
}
function checkSharedWith() {
    if($('#isModelPublic').is(":checked")){
        alertBoxShow("The model file has been selected as 'public'. You don't need to share again.");
        $('#modelSharedBy').attr('value', null);
    }
    if($('#isRawDataPublic').is(":checked")){
        alertBoxShow("The raw data file has been selected as 'public'. You don't need to share again.");
    }
    if($('#isSameSharedBy').is(":checked")){
        alertBoxShow("The raw data file has been selected as the same as with model file. You don't need to share again.");
    }
    if($('#isUpdateModelPublic').is(":checked")){
        alertBoxShow("The model file has been selected as 'public'. You don't need to share again.");
        $('#updateModelSharedBy').attr('value', null);
    }
    if($('#isUpdateRawDataPublic').is(":checked")){
        alertBoxShow("The raw data file has been selected as 'public'. You don't need to share again.");
    }
    if($('#isUpdateSameSharedBy').is(":checked")){
        alertBoxShow("The raw data file has been selected as the same as with model file. You don't need to share again.");
    }
}

/*
function loadNetwork(modelName) {
    //window.location.href="/network";
    //alert("loadNetwork..");
    $('.lowerButton').removeClass('selected');
    loadModel(modelName);
}*/

function alertBoxShow(message) {
    $("i").remove();
    $("#alert-box").show();
    //$("#alert-box").append(message);
    $('.alertBoxMessage').html(message);
    $('.lowerButton').removeClass('selected');
    /*
    if( $("#load").val() != '' ) {
       $("#load").focus();
    }*/
}

function hideAlertBox() {
   $("#alert-box").hide();
   /*
   if( $("#load").val() != '' ) {
       $("#load").focus();
   }*/
}

function successBoxShow(message) {
    $("i").remove();
    $("#success-box").show();
    $('.successBoxMessage').html(message);
    //$("#success-box").append(message);
    $('.lowerButton').removeClass('selected');
    /*
    if( $("#load").val() != '' ) {
       $("#load").focus();
    }*/
}

function hideSuccessBox() {
   $("#success-box").hide();
   /*
   if( $("#load").val() != '' ) {
       $("#load").focus();
   }*/
}

function confirmBoxForDelete(message,
                        modelName,
                        confirmYesFunctionForDelete,
                        confirmNoFunction
                        ) {

    $("#confirm-box").show();
    $("#confirm-box").prepend("Confirm: " + message);

    $('#btnYesConfirmYesNo, #btnNoConfirmYesNo').click(function(){
        if( this.id == 'btnYesConfirmYesNo' ) {
            confirmYesFunctionForDelete(modelName);
        } else if( this.id == 'btnNoConfirmYesNo' ) {
            confirmNoFunction();
        }
    });
}

function confirmYesFunctionForDelete(modelName) {
    $("#confirm-box").hide();

    //start spinner
    $('.deleting').show();
    var i = $('<i class="fa fa-spinner fa-pulse"></i>');
    $('.deleting').append(i);

	var deleteModelAjax = jsRoutes.controllers.Application.deleteModel(modelName);
     $.ajax({
        url: deleteModelAjax.url,
        type: 'POST',
        cache: false,
        contentType: false,
        processData: false
    }).done(function(data) {
        $('.deleting').hide();
        $("i").remove();

        if( data == "success") {
            $('#load option[value="'+modelName+'"]').remove();
            $('#load').val('');
            $('.lowerButton').removeClass('selected');
            successBoxShow("The netwrok file has been deleted successfully.");
        } else {
            alertBoxShow(data);
        }

    }).fail(function() {
        $('.deleting').hide();
        $("i").remove();
    });
}

function confirmYesFunctionForUpload(updateModelFile,
                            updateDataFile,
                            isModelPublic,
                            isRawDataPublic,
                            formData,
                            modelSharedByArray,
                            rawDataSharedByArray ) {

    $("#confirm-box").hide();
    var uploadModelAjax = jsRoutes.controllers.Application.uploadModel(
            updateModelFile, updateDataFile, isModelPublic, isRawDataPublic,
            modelSharedByArray, rawDataSharedByArray );

    $.ajax({
        url: uploadModelAjax.url,
        type: 'POST',
        data: formData,
        cache: false,
        contentType: false,
        processData: false
    }).done(function(data) {
        $('.uploading').hide();
        $('i').remove();
        if( data == "success") {
            successBoxShow("The file has been updated successfully.");
            location.href = "/network/private";
        } else {
            alertBoxShow(data);
        }
    }).fail(function(ts){
        $('.uploading').hide();
        $('i').remove();
        alertBoxShow(ts.responseText);
    });
}

function confirmNoFunction() {
    $('.uploading').hide();
    $("i").remove();
    $("#confirm-box").hide();
    location.href = "/network/private";
}

function confirmBoxForUpload(message,
                        updateModelFile,
                        updateDataFile,
                        isModelPublic,
                        isRawDataPublic,
                        formData,
                        confirmYesFunctionForUpload,
                        confirmNoFunction,
                        modelSharedByArray,
                        rawDataSharedByArray ) {

    $("#confirm-box").show();
    $("#confirm-box").prepend("Confirm: " + message);

    $('#btnYesConfirmYesNo, #btnNoConfirmYesNo').click(function(){
        if( this.id == 'btnYesConfirmYesNo' ) {
            confirmYesFunctionForUpload(updateModelFile,
                            updateDataFile,
                            isModelPublic,
                            isRawDataPublic,
                            formData,
                            modelSharedByArray,
                            rawDataSharedByArray);

        } else if( this.id == 'btnNoConfirmYesNo' ) {
            confirmNoFunction();
        }
    });
}

function getModelUpload() {
	var formData = new FormData();
	var upload = false;
	var modelFile = $('#modelFile')[0].files[0];
	var updateModelFile = false;
	var updateDataFile = false;
	var isModelPublic = $('#isModelPublic').is(":checked");
	var isRawDataPublic = $('#isRawDataPublic').is(":checked");
	var isSameSharedBy = $('#isSameSharedBy').is(":checked");
	var modelSharedByArray = $('#modelSharedBy').val();

	if( !isModelPublic && modelSharedByArray != null ) {
	    modelSharedByArray = modelSharedByArray.toString();
	} else {
	    modelSharedByArray = null;
	}
	var rawDataSharedByArray = $('#rawDataSharedBy').val();
	if( !isRawDataPublic ) {
	    if( isSameSharedBy ) {
	        rawDataSharedByArray = modelSharedByArray;
	    } else {
	        if(rawDataSharedByArray != null ) {
	            rawDataSharedByArray = rawDataSharedByArray.toString();
	        } else {
	            rawDataSharedByArray = null;
	        }
	   }
	} else {
	    rawDataSharedByArray = null;
	}

	if( modelFile != null ) {
	    var modelFileName = modelFile.name;

        formData.append('modelFile', modelFile);
	    var modelFileNameArray = modelFileName.split(".");
        if( modelFileNameArray[1] != "xdsl") {
	        alertBoxShow(
	            "The model file extension is not  '.xdsl'. \nPlease choose a correct file.");
	    } else {
	        upload = true;
	    }
	} else {
	    alertBoxShow("No model file is chosen. Please at lease choose a model file.");
	}

	var dataFile = $('#dataFile')[0].files[0];
	if( dataFile != null ) {
	    formData.append('dataFile', dataFile);
	    var dataFileName = dataFile.name;
	    var dataFileNameArray = dataFileName.split(".");
        if( dataFileNameArray[1] != "csv") {
	        alertBoxShow("The data file extension is not  '.csv'. \nPlease choose a correct file. ");
	    } else {
	        upload = true;
	    }
	}

	if( !upload ) {
	    return false;
	}

    //start spinner
    $('.uploading').show();
    var i = $('<i class="fa fa-spinner fa-pulse"></i>');
    $('#uploadButtonDiv').append(i);

	var checkModelAjax = jsRoutes.controllers.Application.checkModel();
    $.ajax({
        url: checkModelAjax.url,
        type: 'POST',
        data: formData,
        cache: false,
        contentType: false,
        processData: false
    }).done(function(data) {
        if( data == "modelFileNameDuplicate" ) {
            alertBoxShow("Model file name is duplicate with a file other user uploaded, " +
                         "please change the file name.");

        } else if( data == "modelAndDataFileExist" ) {
            var message = "Both model file and raw data file already exist. " +
                          "Do you want to update them?";

            updateModelFile = true;
            updateDataFile = true;
            confirmBoxForUpload( message,
                            updateModelFile,
                            updateDataFile,
                            isModelPublic,
                            isRawDataPublic,
                            formData,
                            confirmYesFunctionForUpload,
                            confirmNoFunction,
                            modelSharedByArray,
                            rawDataSharedByArray);

        } else if( data == "modelFileExist" ) {
            var message = "The model file already exists. " +
                            "Do you want to update it?";

            updateModelFile = true;
            confirmBoxForUpload( message,
                            updateModelFile,
                            updateDataFile,
                            isModelPublic,
                            isRawDataPublic,
                            formData,
                            confirmYesFunctionForUpload,
                            confirmNoFunction,
                            modelSharedByArray,
                            rawDataSharedByArray );

        } else if( data == "dataFileExist" ) {
            var message = "The raw data file already exists. " +
                            "Do you want to update it?";

            updateDataFile = true;
            confirmBoxForUpload( message,
                            updateModelFile,
                            updateDataFile,
                            isModelPublic,
                            isRawDataPublic,
                            formData,
                            confirmYesFunctionForUpload,
                            confirmNoFunction,
                            modelSharedByArray,
                            rawDataSharedByArray );
        } else {
            var uploadModelAjax = jsRoutes.controllers.Application.uploadModel(
                updateModelFile, updateDataFile, isModelPublic, isRawDataPublic,
                modelSharedByArray, rawDataSharedByArray );

            $.ajax({
                url: uploadModelAjax.url,
                type: 'POST',
                data: formData,
                cache: false,
                contentType: false,
                processData: false
            }).done(function(data) {
                $('.uploading').hide();
                $('i').remove();
                if( data == "success") {
                    //successBoxShow("The network file has been uploaded successfully.");
                    location.href = "/network/private";
                } else {
                    alertBoxShow(data);
                }
            }).fail(function(ts){
                 $('.uploading').hide();
                 $('i').remove();
                 alertBoxShow(ts.responseText);
            });
        }
            /*
            console.log(data);
            networkInfoArray = JSON.parse(data);
            networkLoadModel(networkInfoArray[0]);
            drawCharts(networkInfoArray[1]);
            getRawDataOptions("upload");
            */
    }).fail(function(ts) {
        $('.uploading').hide();
        $('i').remove();
        alertBoxShow(ts.responseText);
    });
	    /*
        var uploadModelAjax = jsRoutes.controllers.Application.uploadModel();
        $.ajax({
            url: uploadModelAjax.url,
            type: 'POST',
            data: formData,
            cache: false,
            contentType: false,
            processData: false
        }).done(function(data) {
            if( data == "success") {
                location.href = "/network/private";
            }

            console.log(data);
            networkInfoArray = JSON.parse(data);
            networkLoadModel(networkInfoArray[0]);
            drawCharts(networkInfoArray[1]);
            getRawDataOptions("upload");

        }).fail(function() {
        });
        */
}

function getModelUpdate() {
	var formData = new FormData();
	var upload = false;
	var modelFile = $('#updateModelFile')[0].files[0];
	var updateModelFile = true;
	var updateDataFile = true;
	var isModelPublic = $('#isUpdateModelPublic').is(":checked");
	var isRawDataPublic = $('#isUpdateRawDataPublic').is(":checked");
	var isSameSharedBy = $('#isUpdateSameSharedBy').is(":checked");
	var modelSharedByArray = $('#updateModelSharedBy').val();

	if( !isModelPublic && modelSharedByArray != null ) {
	    modelSharedByArray = modelSharedByArray.toString();
	} else {
	    modelSharedByArray = null;
	}
	var rawDataSharedByArray = $('#updateRawDataSharedBy').val();
	if( !isRawDataPublic ) {
	    if( isSameSharedBy ) {
	        rawDataSharedByArray = modelSharedByArray;
	    } else {
	        if(rawDataSharedByArray != null ) {
	            rawDataSharedByArray = rawDataSharedByArray.toString();
	        } else {
	            rawDataSharedByArray = null;
	        }
	   }
	} else {
	    rawDataSharedByArray = null;
	}

	if( modelFile != null ) {
	    var modelFileName = modelFile.name;
        if( modelFileName != $('#load').val()) {
	        alertBoxShow("The model file name you chose is not the same " +
	            "as you are updating, please change the model file name.");
	    } else {
            formData.append('modelFile', modelFile);
	        upload = true;
	    }
	} else {
	    alertBoxShow("No model file is chosen. Please choose a model file.");
	}

	var dataFile = $('#updateDataFile')[0].files[0];
	if( dataFile != null ) {
	    formData.append('dataFile', dataFile);
	    var dataFileName = dataFile.name;
	    var dataFileNameArray = dataFileName.split(".");
        if( dataFileNameArray[1] != "csv") {
	        alertBoxShow("The data file extension is not  '.csv'. \nPlease choose a correct file. ");
	    } else {
	        upload = true;
	    }
	}

	if( !upload ) {
	    return false;
	}

    //start spinner
    $('.uploading').show();
    var i = $('<i class="fa fa-spinner fa-pulse"></i>');
    $('#uploadButtonDiv').append(i);

	var checkModelAjax = jsRoutes.controllers.Application.checkModel();
    $.ajax({
        url: checkModelAjax.url,
        type: 'POST',
        data: formData,
        cache: false,
        contentType: false,
        processData: false
    }).done(function(data) {
        var uploadModelAjax = jsRoutes.controllers.Application.uploadModel(
                updateModelFile, updateDataFile, isModelPublic, isRawDataPublic,
                modelSharedByArray, rawDataSharedByArray );

        $.ajax({
            url: uploadModelAjax.url,
            type: 'POST',
            data: formData,
            cache: false,
            contentType: false,
            processData: false
        }).done(function(data) {
            $('.uploading').hide();
            $('i').remove();
            if( data == "success") {
                //successBoxShow("The network file has been uploaded successfully.");
                location.href = "/network/private";
            } else {
                alertBoxShow(data);
            }
        }).fail(function(ts){
            $('.uploading').hide();
            $('i').remove();
            alertBoxShow(ts.responseText);
        });
    }).fail(function(ts) {
        $('.uploading').hide();
        $('i').remove();
        alertBoxShow(ts.responseText);
    });
}

function clearAllEvidence(showMessage)
{
	if( $("#load").val() == null || $("#load").val() == '') {
        alertBoxShow("Please select a network file first.");
        return false;
    }

    if( !$("#splitter").is(":visible") ) {
        alertBoxShow("Please view a network first.");
        return false;
    }
	var clearAllEvidenceAjax = jsRoutes.controllers.Application.clearAllEvidence();
	$.ajax({
		url: clearAllEvidenceAjax.url
	}).done(function(data) {
		//console.log(data);
		networkInfoArray = JSON.parse(data);
		networkLoadModel(networkInfoArray[0]);
		drawCharts(networkInfoArray[1]);

		$('#chartDiv').trigger('resize');
		if(showMessage) {
            successBoxShow("All evidences have been removed.");

        }
	}).fail(function(ts) {
	    alertBoxShow(ts.responseText);
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
		//console.log(data);
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
	}).fail(function(ts) {
	    alertBoxShow(ts.responseText);
	});
}

function setEvidence()
{
	var outcomeID = $('input[name=outcomeids]:checked').val();
	//console.log(outcomeID);

	var form = document.getElementById("setEvidenceForm");
	var i;
	var nodeID = '';
	for (i = 0; i < form.length; i++) {
		if (form.elements[i].id == 'nodeID') {
			nodeID = form.elements[i].value;
			break;
		}
	}

	//console.log(nodeID);

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
	}).fail(function(ts) {
	    alertBoxShow(ts.responseText);
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

	//console.log(nodeID);

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
	}).fail(function(ts) {
	    alertBoxShow(ts.responseText);
	});
}

function setAsTarget()
{
	var nodeID = $('#nodeMenu #nodeID').val();
	//console.log(nodeID);

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

	}).fail(function(ts) {
	    alertBoxShow(ts.responseText);
	});
}

function removeTarget()
{
	var nodeID = $('#nodeMenu #nodeID').val();
	//console.log(nodeID);

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
	}).fail(function(ts) {
	    alertBoxShow(ts.responseText);
	});
}

function clearAllTargets(showMessage)
{
    if( $("#load").val() == null || $("#load").val() == '') {
        alertBoxShow("Please select a network file first.");
        return false;
    }

    if( !$("#splitter").is(":visible") ) {
        alertBoxShow("Please view a network first.");
        return false;
    }

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
		if(showMessage) {
            successBoxShow("All targets have been removed.");
        }

	}).fail(function(ts) {
	    alertBoxShow(ts.responseText);
	});
}

function getCPT(nodeID)
{
	var getCPTAjax = jsRoutes.controllers.Application.getCPT(nodeID);
	$.ajax({
		url: getCPTAjax.url
	}).done(function(data) {
		//console.log(data);
		var cpt = JSON.parse(data);
		createCPTGrid(cpt);
	}).fail(function() {
	});
}


