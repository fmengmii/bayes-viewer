var networkInfoArray;

function changeAlgorithm(){
    if( $("#load").val() == null || $("#load").val() == '') {
        //alertBoxShow("Please select a network file first.");
        return true;
    }
    var modelName = $("#load").val();
    var algorithm = $("#algorithmSelect").val();
    if(modelName.indexOf("sharedBy") != -1){
        var modelNameArray = modelName.split("sharedBy");
        modelName = modelNameArray[0].trim();
    }
    var loadModelAjax = jsRoutes.controllers.BnApp.changeAlgorithm(modelName, algorithm);
    //var loadModelAjax = jsRoutes.controllers.BnApp.loadModel(modelName, algorithm);
    $.ajax({
        url: loadModelAjax.url
    }).done(function(data) {
        //alert("changeAlgorithm return data=" + data);
        if( data.startsWith("Error:")) {
            var message = data.substr(6, data.length);
            alertBoxShow(message);
            $("#algorithmSelect").val("Lauritzen");
            return false;
        } else if( data =="Error") {
           alertBoxShow("The change of inference algorithm is failed. Please try again. ");
           $("#algorithmSelect").val("Lauritzen");
           return false;
        } else {
            networkInfoArray = JSON.parse(data);
            //networkLoadModel(networkInfoArray[0]);
		    drawCharts(networkInfoArray[1]);
		    $('#chartDiv').trigger('resize');
		    successBoxShow("The change of inference algorithm is successfully.");
		}
    }).fail(function() {
    });
}

function loadModel() {
    if( $("#load").val() == null || $("#load").val() == '') {
        alertBoxShow("Please upload a network file first.");
        return false;
    }
    var modelName = $("#load").val();
    var algorithm = $("#algorithmSelect").val();
    //alert("algorithm val=" + algorithm);
    $('.lowerButton').removeClass('selected');
    $('.showNetworkButton').addClass('selected');

    $('#splitter').hide();
    $('#viewLogDiv').hide();
    $('#uploadDiv').hide();
    $('#updateDiv').hide();
    $('#testModelDiv').hide();

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
        var loadModelAjax = jsRoutes.controllers.BnApp.loadModel(modelName, algorithm);
        $.ajax({
            url: loadModelAjax.url
        }).done(function(data) {
            if( data.startsWith("Error:")) {
                var message = data.substr(6, data.length);
                alertBoxShow(message);
                $("#algorithmSelect").val("Lauritzen");
                return false;
            } else if( data =="Error") {
                alertBoxShow("The change of inference algorithm is failed. Please try again. ");
                $("#algorithmSelect").val("Lauritzen");
                return false;
            } else {
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

                //clearAllEvidence();
                //location.reload();
                //getRawDataOptions("load");
                //console.log(networkInfoArray);
            }
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
    //alert("update..");
    var modelName = $("#load").val();
    $('.lowerButton').removeClass('selected');
    $('.updateModelButton').addClass('selected');

    $('#testModelDiv').hide();
    $('#updateDiv').hide();
    $('#splitter').hide();
    $('#uploadDiv').hide();
    $('#viewLogDiv').hide();

    if( modelName == null || modelName == '') {
        alertBoxShow("Please select a network file first.");
        return false;
    }

	if(modelName.indexOf("sharedBy") != -1){
	    alertBoxShow("You don't have a privilege to update the file because it's a shared file.");
	    return false;
    }

    var getModelStatusAjax = jsRoutes.controllers.BnApp.getModelStatus(modelName);
    $.ajax({
        url: getModelStatusAjax.url
    }).done(function(data) {
        $('#updateDiv').show();
        var updateDivContent = '<p style="font-size:20px">' +
                '<strong>The current status of the model:</strong></p>';
        updateDivContent += '<p class="selectedModelFileName">' +
                'Model file name:&nbsp;' + $('#load').val() + '</p>';
        updateDivContent += '<p class="uploadedBy">' +
                'Uploaded by:&nbsp;' + data.uploadedBy + '</p>';
        updateDivContent += '<p class="uploadTime">' +
                'Upload time:&nbsp;' + data.uploadTime +'</p>';

        if( data.annotation != null && data.annotation != '') {
            updateDivContent += '<p class="uploadedBy">' +
                'Model annotation:&nbsp;' + data.annotation + '</p>';
        }
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
            if( data.rawDataFileName != '') {
                var uploadRawDataFile = '<br><input id="updateDataFile" name="dataFile" type="file"/><br>';
                $(".rawDataFile").append("<br>");
                $(".rawDataFile").append(uploadRawDataFile);
            }*/
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
        var getModelHistoryAjax = jsRoutes.controllers.BnApp.getModelHistory(modelName);
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
            /*var maxContentHeight = $(window).height() -
                $('#headerDiv').height() - $('#buttonsDiv').height() -
                $('#footerDiv').height();*/

            var maxContentHeight = $("#contentDiv").height() - $("#topButtonsDiv").height() -
                $("#lowerButtonsDiv").height() - 44;

			var logTableWidth = $('.logTable').outerWidth();
			var logTableHeight = $('.logTable').outerHeight();
			if( logTableHeight >= maxContentHeight ) {
				$('#viewLogDiv').css("height", maxContentHeight );
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
    hideConfirmBox();
    hideSuccessBox();
    hideFlashSuccessBox();
    hideFlashErrorBox();
    $("#errorWindow").show();
    $("#alert-box").show();
    $('.alertBoxMessage').html(message);
    $('.lowerButton').removeClass('selected');
    /*
    if( $("#load").val() != '' ) {
       $("#load").focus();
    }*/
}

function hideFlashSuccessBox() {
    $("#flashSuccessWindow").hide();
    $("#flash-success-box").hide();
}

function hideFlashErrorBox() {
    $("#flashErrorWindow").hide();
    $("#flash-error-box").hide();
}

function hideConfirmBox() {
    $("#confirmWindow").hide();
    $("#confirm-box").hide();
}

function hideConfirmLearnModelBox() {
    $("#confirmLearnModelWindow").hide();
    $("#confirm-learn-box").hide();
}
function hideAlertBox() {
    $("#errorWindow").hide();
    $("#alert-box").hide();
   /*
   if( $("#load").val() != '' ) {
       $("#load").focus();
   }*/
}

function successBoxShow(message) {
    $("i").remove();
    hideConfirmBox();
    hideAlertBox();
    hideFlashSuccessBox();
    hideFlashErrorBox();
    $("#successWindow").show();
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
   $("#successWindow").hide();
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
    hideSuccessBox();
    hideAlertBox();
    hideFlashSuccessBox();
    hideFlashErrorBox();
    $("#confirmWindow").show();
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
    hideConfirmBox();
    hideSuccessBox();
    hideAlertBox();
    hideFlashSuccessBox();
    hideFlashErrorBox();
    //$("#confirmWindow").hide();
    //$("#confirm-box").hide();

    //start spinner
    $('.deleting').show();
    var i = $('<i class="fa fa-spinner fa-pulse"></i>');
    $('.deleting').append(i);

	var deleteModelAjax = jsRoutes.controllers.BnApp.deleteModel(modelName);
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
        alertBoxShow("Delete Network File failed. Please try again.");
    });
}

function confirmYesFunctionForUpload(updateModelFile,
                            updateDataFile,
                            isModelPublic,
                            isRawDataPublic,
                            formData,
                            modelSharedByArray,
                            rawDataSharedByArray,
                            annotation) {
    hideConfirmBox();
    hideSuccessBox();
    hideAlertBox();
    hideFlashSuccessBox();
    hideFlashErrorBox();
    //$("#confirmWindow").hide();
    //$("#confirm-box").hide();
    var uploadModelAjax = jsRoutes.controllers.BnApp.uploadModel(
            updateModelFile, updateDataFile, isModelPublic, isRawDataPublic,
            modelSharedByArray, rawDataSharedByArray, annotation );

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
            //alert("upload success.");
            //successBoxShow("The file has been updated successfully.");
            location.href = "/bn/private";
        } else {
            alertBoxShow(data);
        }
    }).fail(function(){
        $('.uploading').hide();
        $('i').remove();
        alertBoxShow("Upload Network File failed. Please try again.");
    });
}

function confirmNoFunction() {
    $('.uploading').hide();
    $("i").remove();
    hideConfirmBox();
    hideSuccessBox();
    hideAlertBox();
    hideFlashSuccessBox();
    hideFlashErrorBox();
    //$("#confirmWindow").hide();
    //$("#confirm-box").hide();
    location.href = "/bn/private";
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
                        rawDataSharedByArray,
                        annotation) {
    //alert("confirmBoxForUpload...");
    hideSuccessBox();
    hideAlertBox();
    hideFlashSuccessBox();
    hideFlashErrorBox();
    $("#confirmWindow").show();
    $("#confirm-box").show();
    $("#confirm-box").prepend("<strong>Confirm</strong>: " + message);

    $('#btnYesConfirmYesNo, #btnNoConfirmYesNo').click(function(){
        if( this.id == 'btnYesConfirmYesNo' ) {
            confirmYesFunctionForUpload(updateModelFile,
                            updateDataFile,
                            isModelPublic,
                            isRawDataPublic,
                            formData,
                            modelSharedByArray,
                            rawDataSharedByArray,
                            annotation);

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
	var annotation = $('#annotation').val();


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
        updateModelFile = true;
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
	    updateDataFile = true;
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

	var checkModelAjax = jsRoutes.controllers.BnApp.checkModel();
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
                            rawDataSharedByArray,
                            annotation);

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
                            rawDataSharedByArray,
                            annotation);

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
                            rawDataSharedByArray,
                            annotation);
        } else {
            var uploadModelAjax = jsRoutes.controllers.BnApp.uploadModel(
                updateModelFile, updateDataFile, isModelPublic, isRawDataPublic,
                modelSharedByArray, rawDataSharedByArray, annotation );

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
                    //alert("upload success.");
                    //successBoxShow("The network file has been uploaded successfully.");
                    //$('#flashSuccessWindow').show();
                    //$('#flash-success-box').show();
                    location.href = "/bn/private";
                    //$('#flashSuccessWindow').show();
                    //$('#flash-success-box').show();
                } else {
                    alertBoxShow(data);
                }
            }).fail(function(ts){
                 $('.uploading').hide();
                 $('i').remove();
                 alertBoxShow(ts.responseText);
            });
        }
    }).fail(function() {
        $('.uploading').hide();
        $('i').remove();
        alertBoxShow("Upload New Network File failed. Please try again.");
    });
}

function getModelUpdate() {
	var formData = new FormData();
	var upload = false;
	var modelFile = null;
	var dataFile = $('#updateDataFile')[0].files[0];

	var updateModelFile = false;
	var updateDataFile = false;
	var isModelPublic = $('#isUpdateModelPublic').is(":checked");
	var isRawDataPublic = $('#isUpdateRawDataPublic').is(":checked");
	var isSameSharedBy = $('#isUpdateSameSharedBy').is(":checked");
	var modelSharedByArray = $('#updateModelSharedBy').val();
    var annotation = $('#annotationUpdate').val();

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

    var modelFileName = $('#load').val();

	if( dataFile ) {
	    formData.append('dataFile', dataFile);
	    updateDataFile = true;
	    var dataFileName = dataFile.name;
	    var dataFileNameArray = dataFileName.split(".");
        if( dataFileNameArray[1] != "csv") {
	        alertBoxShow("The data file extension is not  '.csv'. \nPlease choose a correct file. ");
	    }
	}

    //start spinner
    $('.uploading').show();
    var i = $('<i class="fa fa-spinner fa-pulse"></i>');
    $('#uploadButtonDiv').append(i);

    var uploadModelAjax = jsRoutes.controllers.BnApp.uploadModel(
            updateModelFile, updateDataFile, isModelPublic, isRawDataPublic,
            modelSharedByArray, rawDataSharedByArray, modelFileName, annotation );

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
            location.href = "/bn/private";
        } else {
            alertBoxShow(data);
        }
    }).fail(function(ts){
        $('.uploading').hide();
        $('i').remove();
        alertBoxShow(ts.responseText);
    });
}

function saveNewModel() {
    var combineRawData = $("#combineWithOriRawData").prop("checked");
    var modelName = $('#load').val();
    var saveNewModelAjax = jsRoutes.controllers.BnApp.saveNewModel(
                modelName, combineRawData );

    $.ajax({
        url: saveNewModelAjax.url
    }).done(function(data) {
        hideConfirmLearnModelBox();
        if( data.startsWith("Error:") ) {
            var message = data.substr(6, data.length);
            alertBoxShow(message);
        }
        $('#load').append($("<option></option>").attr("value", data).text(data));
        successBoxShow("The new model has been successfully learned.");
    }).fail(function(ts){
        hideConfirmLearnModelBox();
        alertBoxShow(ts.responseText);
    });
}

function getTestRawData(){
    var formData = new FormData();
    var dataFile = $('#uploadTestRawDataFile')[0].files[0];
    var modelFileName = $('#load').val();
    if( dataFile ) {
	    formData.append('dataFile', dataFile);
	    updateDataFile = true;
	    var dataFileName = dataFile.name;
	    var dataFileNameArray = dataFileName.split(".");
        if( dataFileNameArray[1] != "csv") {
	        alertBoxShow("The data file extension is not  '.csv'. \nPlease choose a correct file. ");
	    }
	}

    var algorithm = $("#algorithmSelect").val();

    var uploadModelAjax = jsRoutes.controllers.BnApp.uploadTestRawData(
                modelFileName, algorithm );

    $.ajax({
        url: uploadModelAjax.url,
        type: 'POST',
        data: formData,
        cache: false,
        contentType: false,
        processData: false
    }).done(function(data) {
        if( data.startsWith("Error:")) {
            var message = data.substr(6, data.length);
            alertBoxShow(message);
            return false;
        } else {
            $('#uploadDiv').hide();
            $('#uploadTestRawDataForm')[0].reset();
            $('#splitter').show();
            networkInfoArray = JSON.parse(data);
            networkLoadModel(networkInfoArray[0]);
            drawCharts(networkInfoArray[1]);
            $('#chartDiv').trigger('resize');
            $("#confirmLearnModelWindow").show();
            $("#confirm-learn-box").show();
            var message = "";
            $("#confirm-box").prepend("Confirm: " + message);
        }
    }).fail(function(ts){
        $('.uploading').hide();
        $('i').remove();
        alertBoxShow(ts.responseText);
    });
}

function testModel() {
    //alert("update..");
    var modelName = $("#load").val();
    $('.lowerButton').removeClass('selected');
    $('.testModelButton').addClass('selected');

    $('#testModelDiv').hide();
    $('#updateDiv').hide();
    $('#splitter').hide();
    $('#uploadDiv').hide();
    $('#viewLogDiv').hide();

    if( modelName == null || modelName == '') {
        alertBoxShow("Please select a network file first.");
        return false;
    }

    var getModelStatusAjax = jsRoutes.controllers.BnApp.getModelStatus(modelName);
    $.ajax({
         url: getModelStatusAjax.url
    }).done(function(data) {
        $('#testModelDiv').show();
        var testModelDivContent = '<p style="font-size:20px">' +
                '<strong>The current status of the model:</strong></p>';
        testModelDivContent += '<p class="selectedModelFileName">' +
                'Model file name:&nbsp;' + $('#load').val() + '</p>';
        testModelDivContent += '<p class="uploadedBy">' +
                'Uploaded by:&nbsp;' + data.uploadedBy + '</p>';
        testModelDivContent += '<p class="uploadTime">' +
                'Upload time:&nbsp;' + data.uploadTime +'</p>';

        if( data.annotation != null && data.annotation != '') {
            alert("annotation is not null =" + data.annotation);
            testModelDivContent += '<p class="uploadedBy">' +
                'Model annotation:&nbsp;' + data.annotation + '</p>';
        }
        if( data.isPublic ) {
            testModelDivContent += '<p class="isPublic">' +
                    'The model file is public.</p>';
        } else if( data.sharedWith != null && data.sharedWith != "") {
            testModelDivContent += '<p class="sharedWith">' +
                    'Shared with:&nbsp;' + data.sharedWith + '</p>';
        } else {
            testModelDivContent += '<p class="sharedWith">' +
                    'Shared with:&nbsp;No</p>';
        }

        if( data.rawDataFileName != null &&  data.rawDataFileName != "") {
            testModelDivContent += '<p class="rawDataFileName">' +
                    'Raw data file name:&nbsp;' + data.rawDataFileName + '</p>';
        }

        $('#modelFileStatusDiv').html(testModelDivContent);
    }).fail(function() {
    });
}

function clearAllEvidence(showMessage) {
	if( $("#load").val() == null || $("#load").val() == '') {
        alertBoxShow("Please select a network file first.");
        return false;
    }

    if( !$("#splitter").is(":visible") ) {
        alertBoxShow("Please view a network first.");
        return false;
    }
	var clearAllEvidenceAjax = jsRoutes.controllers.BnApp.clearAllEvidence();
	$.ajax({
		url: clearAllEvidenceAjax.url
	}).done(function(data) {
		//console.log(data);
		networkInfoArray = JSON.parse(data);
		//networkLoadModel(networkInfoArray[0]);

		drawCharts(networkInfoArray[1]);
		var outcomeValues = networkInfoArray[1];
        for(i=0; i< outcomeValues.length; i++){
		    if( outcomeValues[i].isTarget != "true" ) {
		        //outcomeValues[i].isVirtualEvidence != "true" ){
		        setNodeColor(outcomeValues[i].id, 'lightblue');
		    }
		}

		$('#chartDiv').trigger('resize');

		if(showMessage) {
            successBoxShow("All evidences have been removed.");
        }
	}).fail(function() {
	    alertBoxShow("Clear All Evidence failed. Please try again.");
	});
}

function clearEvidence()
{
	var form = document.getElementById("setEvidenceForm");
	var nodeID = '';
	for ( var i = 0; i < form.length; i++) {
		if (form.elements[i].id == 'nodeID') {
			nodeID = form.elements[i].value;
			break;
		}
	}

	var clearEvidenceAjax = jsRoutes.controllers.BnApp.clearEvidence(nodeID);
	$.ajax({
		url: clearEvidenceAjax.url
	}).done(function(data) {
		//console.log(data);
		networkInfoArray = JSON.parse(data);
		drawCharts(networkInfoArray[1]);
        setNodeColor(nodeID, 'lightblue');
        $('#chartDiv').trigger('resize');
	}).fail(function() {
	    alertBoxShow("Clear Evidence failed. Please try again.");
	});
}

function setEvidence()
{
	var outcomeID = $('input[name=outcomeids]:checked').val();
	//console.log(outcomeID);

	var form = document.getElementById("setEvidenceForm");
	var nodeID = '';
	for (var i = 0; i < form.length; i++) {
		if (form.elements[i].id == 'nodeID') {
			nodeID = form.elements[i].value;
			break;
		}
	}
	//console.log(nodeID);

	var values = {nodeID:nodeID, outcomeID:outcomeID};

	var setEvidenceAjax = jsRoutes.controllers.BnApp.setEvidence();
	$.ajax({
		type: 'POST',
		url: setEvidenceAjax.url,
		data: values
	}).done(function(data) {
	    if( data == "Error" ) {
	        alertBoxShow("Value is not valid, Please try again.");
	        return false;
	    }
		networkInfoArray = JSON.parse(data);
		drawCharts(networkInfoArray[1]);
		setNodeColor(nodeID, 'Green');
		$('#chartDiv').trigger('resize');
	}).fail(function(){
	    alertBoxShow("Set Evidence failed. Please try again.");
	});
}

function setVirtualEvidence()
{
	var form = document.getElementById("setVirtualEvidenceForm");
	var nodeID = '';
	var outcomeVals = [];
	var sum = 0;
	for ( var i = 0; i < form.length; i++) {
		if (form.elements[i].id == 'nodeID') {
			nodeID = form.elements[i].value;
		}
		else {
			outcomeVals.push(form.elements[i].value);
			sum += Number(form.elements[i].value);
		}
	}

    if ( Math.round(sum*10) != 10 ) {
        alertBoxShow("Sum of probabilities should be equal to 1.");
        return false;
    }

	//console.log(nodeID);

	var values = {nodeID:nodeID, outcomeVals:outcomeVals};

	var setVirtualEvidenceAjax = jsRoutes.controllers.BnApp.setVirtualEvidence();

	$.ajax({
		type: 'POST',
		url: setVirtualEvidenceAjax.url,
		data: values
	}).done(function(data) {
	    if( data == "Error" ) {
	        alertBoxShow("Value is not valid, Please try again.");
	        return false;
	    }
		networkInfoArray = JSON.parse(data);
		drawCharts(networkInfoArray[1]);
		setNodeColor(nodeID, 'DarkSeaGreen');
		$('#chartDiv').trigger('resize');
	}).fail(function() {
	    alertBoxShow("Set Virtual Evidence failed. Please try again.");
	});
}

function setAsTarget()
{
	var nodeID = $('#nodeMenu #nodeID').val();

	var setAsTargetAjax = jsRoutes.controllers.BnApp.setAsTarget(nodeID);
	$.ajax({
		url: setAsTargetAjax.url
	}).done(function(data) {
	    if(data.startsWith("Error:")){
	        alertBoxShow(data.substring(7));
	    }else{
	        $('#nodeMenu').jqxMenu('close');
		    networkInfoArray = JSON.parse(data);
		    //drawCharts(networkInfoArray[1]);

		    var outcomeValues = networkInfoArray[1];
		    var nodeOutcomes;
		    var nodeIndex;
		    for( var index=0; index < outcomeValues.length; index++ ) {
		        if(outcomeValues[index].id == nodeID ) {
		            nodeOutcomes = outcomeValues[index];
		            nodeIndex = index;
		            break;
		        }
		    }
		    /*
		    var nodeOutcomes = outcomeValues.filter(function(e) {
			    if (e.id == nodeID)
			        return e;
		    });
            */

		    //$('.chartEvidence').empty();
		    var chartClass = '.chart' + nodeIndex;
		    $(chartClass).empty();
		    drawChart(nodeOutcomes, chartClass);

		    //cy.getElementById(nodeID).css('background-color', 'yellow');
		    setNodeColor(nodeID, 'DarkSalmon');
		    $('#chartDiv').trigger('resize');
		}
	}).fail(function() {
	    alertBoxShow("Set As Target failed. Please try again.");
	});
}

function removeTarget()
{
	var nodeID = $('#nodeMenu #nodeID').val();
	//console.log(nodeID);

	var removeTargetAjax = jsRoutes.controllers.BnApp.removeTarget(nodeID);
	$.ajax({
		url: removeTargetAjax.url
	}).done(function(data) {
	    $('#nodeMenu').jqxMenu('close');
		networkInfoArray = JSON.parse(data);
		//drawCharts(networkInfoArray[1]);

		var outcomeValues = networkInfoArray[1];
		/*var nodeOutcomes = outcomeValues.filter(function(e) {
			if (e.id == nodeID)
				return e;
		});
        */
        var nodeOutcomes;
		var nodeIndex;
		for( var index=0; index < outcomeValues.length; index++ ) {
		    if(outcomeValues[index].id == nodeID ) {
		        nodeOutcomes = outcomeValues[index];
		        nodeIndex = index;
		        break;
		    }
		}
		var chartClass = '.chart' + nodeIndex;
		$(chartClass).empty();
        drawChart(nodeOutcomes, chartClass);
		setNodeColor(nodeID, 'lightblue');
		$('#chartDiv').trigger('resize');
	}).fail(function() {
	    alertBoxShow("Remove Target failed. Please try again.");
	});
}

function clearAllTargets()
{
    if( $("#load").val() == null || $("#load").val() == '') {
        alertBoxShow("Please select a network file first.");
        return false;
    }

    if( !$("#splitter").is(":visible") ) {
        alertBoxShow("Please view a network first.");
        return false;
    }

	var clearAllTargetsAjax = jsRoutes.controllers.BnApp.clearAllTargets();
	$.ajax({
		url: clearAllTargetsAjax.url
	}).done(function(data) {
		networkInfoArray = JSON.parse(data);
		drawCharts(networkInfoArray[1]);

		var outcomeValues = networkInfoArray[1];
		for(i=0; i< outcomeValues.length; i++){
		    if( outcomeValues[i].isRealEvidence != "true" &&
		            outcomeValues[i].isVirtualEvidence != "true" ){
		        setNodeColor(outcomeValues[i].id, 'lightblue');
		    }
		}
		/*
		var nodeOutcomes = outcomeValues.filter(function(e) {
			if (e.id == nodeID)
				return e;
		});
        */
		//cy.$('node').css('background-color', 'lightblue');

		$('#chartDiv').trigger('resize');

	}).fail(function() {
	    alertBoxShow("Clear All Targets failed. Please try again.");
	});
}

function getCPT(nodeID)
{
	var getCPTAjax = jsRoutes.controllers.BnApp.getCPT(nodeID);
	$.ajax({
		url: getCPTAjax.url
	}).done(function(data) {
		//console.log(data);
		var cpt = JSON.parse(data);
		createCPTGrid(cpt);
	}).fail(function() {
	});
}


