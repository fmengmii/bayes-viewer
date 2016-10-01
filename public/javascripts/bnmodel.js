var networkInfoArray;

function changeAlgorithm(){
    if( $("#load").val() == null || $("#load").val() == '') {
        //alertBoxShow("Please select a network file first.");
        return true;
    }
    var modelName = $("#load").val();
    var algorithm = $("#algorithmSelect").val();
    var kFold = $('#kFoldField').val();
    if( kFold == null || kFold == "" ) {
        kFold = 10;
    }
    if( kFold == 1 ) {
        alertBoxShow("K-fold count has to be greater than 1.");
        return false;
    }
    if( Number.isInteger(kFold)){
        alertBoxShow("K-fold count has to be an integer greater than 1.");
        return false;
    }
    if(modelName.indexOf("sharedBy") != -1){
        var modelNameArray = modelName.split("sharedBy");
        modelName = modelNameArray[0].trim();
    }
    var loadModelAjax = jsRoutes.controllers.BnApp.changeAlgorithm(modelName, algorithm, kFold);
    //var loadModelAjax = jsRoutes.controllers.BnApp.loadModel(modelName, algorithm);
    $.ajax({
        url: loadModelAjax.url
    }).done(function(data) {
        console.log("changeAlgorithm return data:\n" + data);
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
		    successBoxShow("The change for inference algorithm or K-fold count is successfully.");
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
    var kFold = $('#kFoldField').val();
    if( kFold == null || kFold == "" ) {
        kFold = "10";
    }
    //alert("algorithm val=" + algorithm);
    $('.lowerButton').removeClass('selected');
    $('.showNetworkButton').addClass('selected');

    $('#splitter').hide();
    $('#viewLogDiv').hide();
    $('#uploadDiv').hide();
    $('#updateDiv').hide();
    $('#testModelDiv').hide();
    $('#legendDiv').hide();

	if(modelName == null) {
	    alertBoxShow("Sorry, there is not an existed network yet.");
	} else {
        if(modelName.indexOf("sharedBy") != -1){
            var modelNameArray = modelName.split("sharedBy");
            modelName = modelNameArray[0].trim();
        }
        //alert("before load kFold=" + kFold);
        var loadModelAjax = jsRoutes.controllers.BnApp.loadModel(modelName, algorithm, kFold);
        //start spinner
        var i = $('<i class="fa fa-spinner fa-pulse"></i>');
        $('#lowerSelectDiv').append(i);

        $.ajax({
            url: loadModelAjax.url
        }).done(function(data) {
            $("#lowerSelectDiv i").remove();
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
                $('#splitter').show();
                //console.log(data);
                networkInfoArray = JSON.parse(data);
                networkLoadModel(networkInfoArray[0]);
                drawCharts(networkInfoArray[1]);
                $('#chartDiv').trigger('resize');
            }
        }).fail(function() {

        });
    }
}

function showUpload() {
    $('.lowerButton').removeClass('selected');
    $('.uploadButton').addClass('selected');

    $('#splitter').hide();
    $('#legendDiv').hide();
    $('#viewLogDiv').hide();
    $('#updateDiv').hide();
    $('#testModelDiv').hide();
    $('#queryNodeNameDiv').css("display", "none");
    $('#uploadDiv').show();
    $("#load").val('');
}

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
    $('#legendDiv').hide();
    $('#uploadDiv').hide();
    $('#viewLogDiv').hide();
    $('#queryNodeNameDiv').css("display", "none");

    if( modelName == null || modelName == '' ) {
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
            $('#isUpdateModelPublic').prop('checked', true);
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
            if( data.rawDataIsPublic ) {
                $('#isUpdateRawDataPublic').prop('checked', true);
            }
        }

        $('#fileStatusDiv').html(updateDivContent);
    }).fail(function() {
    });
}

function downloadModel() {
    var modelName = $("#load").val();
    $('.lowerButton').removeClass('selected');
    $('.downloadModelButton').addClass('selected');

    $('#testModelDiv').hide();
    $('#updateDiv').hide();
    $('#splitter').hide();
    $('#legendDiv').hide();
    $('#uploadDiv').hide();
    $('#viewLogDiv').hide();
    $('#queryNodeNameDiv').css("display", "none");

    if( modelName == null || modelName == '' ) {
        alertBoxShow("Please select a network file first.");
        return false;
    }

	if(modelName.indexOf("sharedBy") != -1){
	    alertBoxShow("You don't have a privilege to update the file because it's a shared file.");
	    return false;
    }
    window.location.href="/model/downloadmodel/" + modelName;
}

function downloadData(){
    var modelName = $("#load").val();
    if( modelName == null || modelName == '' ) {
        alertBoxShow("Please select a network file first.");
        return false;
    }

	if(modelName.indexOf("sharedBy") != -1){
	    alertBoxShow("You don't have a privilege to update the file because it's a shared file.");
	    return false;
    }
    window.location.href="/model/downloaddata/" + modelName;
}
function viewLogHistory (){
    var modelName = $("#load").val();
    $('.lowerButton').removeClass('selected');
    $('.viewLogButton').addClass('selected');

    $('#viewLogDiv').hide();
    $('#splitter').hide();
    $('#legendDiv').hide();
    $('#updateDiv').hide();
    $('#uploadDiv').hide();
    $('#testModelDiv').hide();
    $('#queryNodeNameDiv').css("display", "none");

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
    $('.lowerButton').removeClass('selected');
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
    hideSuccessBox();
    hideAlertBox();
    hideFlashSuccessBox();
    hideFlashErrorBox();
    $('#testModelDiv').hide();
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
	        upload = false;
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
	        upload = false;
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
                $('#uploadButtonDiv i').remove();
                if( data == "success") {
                    location.href = "/bn/private";
                } else {
                    alertBoxShow(data);
                }
            }).fail(function(ts){
                 $('.uploading').hide();
                 $('#uploadButtonDiv i').remove();
                 alertBoxShow(ts.responseText);
            });
        }
    }).fail(function() {
        $('.uploading').hide();
        $('#uploadButtonDiv i').remove();
        alertBoxShow("Upload New Network File failed. Please try again.");
    });
}

function getModelUpdate() {
	var formData = new FormData();
	//var upload = false;
	var modelFile = $('#updateModelFile')[0].files[0];
	var dataFile = $('#updateDataFile')[0].files[0];
    var modelFileName = $('#load').val();
	var updateModelFile = false;
	var updateDataFile = false;
	var isModelPublic = $('#isUpdateModelPublic').is(":checked");
	var isRawDataPublic = $('#isUpdateRawDataPublic').is(":checked");
	var isSameSharedBy = $('#isUpdateSameSharedBy').is(":checked");
	var modelSharedByArray = $('#updateModelSharedBy').val();
    var annotation = $('#annotationUpdate').val();
    if( modelFile != null ) {
	    var uploadedModelFileName = modelFile.name;
	    if( modelFileName != uploadedModelFileName ) {
            alertBoxShow(
                "The updated model file name is not the same as original name. " +
                "\nPlease choose a correct file.");
        }
        formData.append('modelFile', modelFile);
        updateModelFile = true;
	}

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
        $('#uploadButtonDiv i').remove();
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
            $('#testModelDiv').hide();
            $('#splitter').show();
            networkInfoArray = JSON.parse(data);
            networkLoadModel(networkInfoArray[0]);
            drawCharts(networkInfoArray[1]);
            $('#chartDiv').trigger('resize');
            if( $('.privateButton').hasClass("selected") ) {
                $("#confirmLearnModelWindow").show();
                $("#confirm-learn-box").show();
            }
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
    $('#legendDiv').hide();
    $('#uploadDiv').hide();
    $('#viewLogDiv').hide();
    $('#queryNodeNameDiv').css("display", "none");

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
		var outcomeValues = networkInfoArray[1];
		for( var index=0; index < outcomeValues.length; index++ ) {
		    if( outcomeValues[index].isRealEvidence !="true" &&
		        outcomeValues[index].isVirtualEvidence !="true" &&
		        outcomeValues[index].isTarget !="true" ) {

		        var nodeID = outcomeValues[index].id;
		        var nodeName = outcomeValues[index].nodename;
		        addQueryNodeName(nodeID, nodeName);
		    }
		}
		drawCharts(networkInfoArray[1]);
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
		var outcomeValues = networkInfoArray[1];
		for( var index=0; index < outcomeValues.length; index++ ) {
		    if(outcomeValues[index].id == nodeID ) {
		        var nodeName = outcomeValues[index].nodename;
		        addQueryNodeName(nodeID, nodeName);
		        break;
		    }
		}
		drawCharts(networkInfoArray[1]);
        setNodeColor(nodeID, '#74a9d8');
        $('#chartDiv').trigger('resize');
	}).fail(function() {
	    alertBoxShow("Clear Evidence failed. Please try again.");
	});
}

function setEvidence()
{
	var outcomeID = $('input[name=outcomeids]:checked').val();
	var form = document.getElementById("setEvidenceForm");
	var nodeID = '';
	for (var i = 0; i < form.length; i++) {
		if (form.elements[i].id == 'nodeID') {
			nodeID = form.elements[i].value;
			break;
		}
	}

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
	    removeQueryNodeName(nodeID);
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
	    removeQueryNodeName(nodeID);
		networkInfoArray = JSON.parse(data);
		drawCharts(networkInfoArray[1]);
		setNodeColor(nodeID, 'DarkSeaGreen');
		$('#chartDiv').trigger('resize');
	}).fail(function() {
	    alertBoxShow("Set Virtual Evidence failed. Please try again.");
	});
}

function setAsObservation()
{
	var nodeID = $('#nodeMenu #nodeID').val();
    var outcomeValuesOri = networkInfoArray[1];
    for( var index=0; index < outcomeValuesOri.length; index++ ) {
        if(outcomeValuesOri[index].id == nodeID ) {
            if( outcomeValuesOri[index].isVirtualEvidence == "true" ||
                outcomeValuesOri[index].isRealEvidence == "true") {

		        alertBoxShow("This is an Evidence node. If you would like " +
		            "to set as an observation node, please clear evidence first.");
		        return;
		    }
		}
    }

	var setAsTargetAjax = jsRoutes.controllers.BnApp.setAsTarget(nodeID);
	$.ajax({
		url: setAsTargetAjax.url
	}).done(function(data) {
	    if(data.startsWith("Error:")){
	        alertBoxShow(data.substring(7));
	    }else{
	        $('#nodeMenu').jqxMenu('close');
	        removeQueryNodeName(nodeID);
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

		    var chartClass = '.chart' + nodeIndex;
		    $(chartClass).empty();
		    drawChart(nodeOutcomes, chartClass, false);
		    setNodeColor(nodeID, 'DarkSalmon');
		    $('#chartDiv').trigger('resize');
		}
	}).fail(function() {
	    alertBoxShow("This is a Evidence node, it can't be set as Observation node.");
	});
}

function removeObservation()
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
		var nodeOutcomes;
		var nodeIndex;
		for( var index=0; index < outcomeValues.length; index++ ) {
		    if(outcomeValues[index].id == nodeID ) {
		        var nodeName = outcomeValues[index].nodename;
		        addQueryNodeName(nodeID, nodeName);
		        nodeOutcomes = outcomeValues[index];
		        nodeIndex = index;
		        break;
		    }
		}
		var chartClass = '.chart' + nodeIndex;
		$(chartClass).empty();
        drawChart(nodeOutcomes, chartClass, false);
		setNodeColor(nodeID, '#74a9d8');
		$('#chartDiv').trigger('resize');
	}).fail(function() {
	    alertBoxShow("Remove Observation failed. Please try again.");
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
		var outcomeValues = networkInfoArray[1];
		for( var index=0; index < outcomeValues.length; index++ ) {
		    if( outcomeValues[index].isRealEvidence !="true" &&
		        outcomeValues[index].isVirtualEvidence !="true" &&
		        outcomeValues[index].isTarget !="true" ) {

		        var nodeID = outcomeValues[index].id;
		        var nodeName = outcomeValues[index].nodename;
		        addQueryNodeName(nodeID, nodeName);
		    }
		}
		drawCharts(networkInfoArray[1]);

		$('#chartDiv').trigger('resize');
	}).fail(function() {
	    alertBoxShow("Clear All Targets failed. Please try again.");
	});
}

function clearAll()
{
    if( $("#load").val() == null || $("#load").val() == '') {
        alertBoxShow("Please select a network file first.");
        return false;
    }

    if( !$("#splitter").is(":visible") ) {
        alertBoxShow("Please view a network first.");
        return false;
    }

	var clearAllAjax = jsRoutes.controllers.BnApp.clearAll();
	$.ajax({
		url: clearAllAjax.url
	}).done(function(data) {
		networkInfoArray = JSON.parse(data);
		drawCharts(networkInfoArray[1]);

		var outcomeValues = networkInfoArray[1];
		for(i=0; i< outcomeValues.length; i++){
		    setNodeColor(outcomeValues[i].id, '#74a9d8');
		}

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

function addQueryNodeNameSelect() {
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
	selectString += "&nbsp;<button class='legendToggleButton' " +
	    "onclick='toggleLegend();'>legend</button>";

    if( model.originalNodeAcc == "true" ) {
        var isTestData = false;
        selectString += "&nbsp;<button class='viewRawDataValidationResultButton' " +
	    //    "onclick='queryValidationResult("+isTestData+", summaryI);'>summary IO</button>";
            "onclick='queryValidationResult("+isTestData+", \"summaryI\");'>summary IO</button>";
	    selectString += "&nbsp;<button class='viewRawDataValidationResultButton' " +
	        "onclick='queryValidationResult("+isTestData+", \"resultI\");'>result IO</button>";

        selectString += "&nbsp;<button class='viewRawDataValidationResultButton' " +
	        "onclick='queryValidationResult("+isTestData+", \"summaryE\");'>summary EO</button>";

	    selectString += "&nbsp;<button class='viewRawDataValidationResultButton' " +
	        "onclick='queryValidationResult("+isTestData+", \"resultE\");'>result EO</button>";
	    /*selectString += "&nbsp;<button class='viewRawDataValidationResultButton' " +
	        "onclick='queryValidationResult("+isTestData+");'>raw data validation</button>";
	    */
	}
	if( model.testNodeAcc == "true" ) {
	    var isTestData = true;
	    selectString += "&nbsp;<button class='viewTestDataValidationResultButton' " +
	        "onclick='queryValidationResult("+isTestData+", \"summaryI\");'>summary IT</button>";

	    selectString += "&nbsp;<button class='viewTestDataValidationResultButton' " +
	        "onclick='queryValidationResult("+isTestData+", \"resultI\");'>result IT</button>";

        selectString += "&nbsp;<button class='viewTestDataValidationResultButton' " +
	        "onclick='queryValidationResult("+isTestData+", \"summaryE\");'>summary ET</button>";

	    selectString += "&nbsp;<button class='viewTestDataValidationResultButton' " +
	        "onclick='queryValidationResult("+isTestData+", \"resultE\");'>result ET</button>";
	    /*
	    selectString += "&nbsp;<button class='viewTestDataValidationResultButton' " +
	        "onclick='queryValidationResult("+isTestData+");'>test data validation</button>";
	    */
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

function queryValidationResult(isTestData, queryType) {
    //alert("isTestData=" + isTestData + " and queryType=" + queryType);
    if( $("#load").val() == null || $("#load").val() == '') {
        alertBoxShow("Please select a network file first.");
        return false;
    }
    var modelName = $("#load").val();
    if(modelName == null) {
	    alertBoxShow("Sorry, there is not an existed network yet.");
	} else {
        var getRawDataAjax = jsRoutes.controllers.BnApp
                        .queryValidationResult(isTestData, queryType);
        $.ajax({
            url: getRawDataAjax.url
        }).done(function(data) {
            //console.log("validationResult return:" + data);
            if( data.startsWith("Error:") ) {
                var message = data.replace("Error:", "");
                alertBoxShow(message);
            } else {
                //console.log("before view.");
                viewDataValidationResult( isTestData, data, queryType);
            }
        }).fail(function(){
        });
    }
}

function viewDataValidationResult(isTestData, dataValidationResult, queryType) {
    var modelName = $("#load").val();
    if( isTestData ) {
        if( queryType == "summaryI" ) {
	        $('#testDataValidationResult').jqxWindow("setTitle", "Test Data Internal Validation " +
	            "Accuracy Summary for " + modelName);
	    } else if( queryType == "resultI" ) {
	        $('#testDataValidationResult').jqxWindow("setTitle", "Test Data Internal Validation " +
	            "Result for " + modelName);
	    } else if( queryType == "resultE" ) {
	        $('#testDataValidationResult').jqxWindow("setTitle", "Test Data External Validation " +
	            "Result for " + modelName);
	    } else {
	        $('#testDataValidationResult').jqxWindow("setTitle", "Test Data External Validation " +
	            "Accuracy Summary for " + modelName);
	    }
	} else {
	    if( queryType == "summaryI" ) {
	        $('#rawDataValidationResult').jqxWindow("setTitle", "Raw Data Internal Validation " +
	            "Accuracy Summary for " + modelName);
	    } else if( queryType == "resultI" ) {
	        $('#rawDataValidationResult').jqxWindow("setTitle", "Raw Data Internal Validation " +
	            "Result for " + modelName);
	    } else if( queryType.equals == "resultE" ) {
	        $('#rawDataValidationResult').jqxWindow("setTitle", "Raw Data External Validation " +
	            "Result for " + modelName);
	    } else {
	        $('#rawDataValidationResult').jqxWindow("setTitle", "Raw Data External Validation Accuracy Summary for " + modelName);
	    }
	    //$('#rawDataValidationResult').jqxWindow("setTitle", "Raw Data Validation Result for " + modelName);
	}

	var fields = [];
	var columnStruct = [];

	var lines = dataValidationResult.split('@');
	var colNames = lines[0].split('$');

	createColumnStruct(colNames,fields,columnStruct);

	var data = csvToJSON(dataValidationResult, "@", "$");
	var source =
		{
			dataType: "json",
			dataFields: fields,
			localData: data
		};

	//createDataResultTable(source,columnStruct);
	var dataAdapter = new $.jqx.dataAdapter(source);
	/*$("#dataResultTable").jqxGrid(
		{
			width: "99%",
			height: "95%",
			source: dataAdapter,
			columnsResize: true,
			columns: columnStruct
		});
	*/
	if( isTestData ) {
	    $("#testDataValidationResultTable").jqxGrid(
		{
			width: "99%",
			height: "95%",
			source: dataAdapter,
			columnsResize: true,
			columns: columnStruct
		});
	    $("#testDataValidationResult").jqxWindow('open');
	} else {
	    $("#rawDataValidationResultTable").jqxGrid(
		{
			width: "99%",
			height: "95%",
			source: dataAdapter,
			columnsResize: true,
			columns: columnStruct
		});
	    $("#rawDataValidationResult").jqxWindow('open');
	}
}

function downloadResult(isTestData) {
    //var model = networkInfoArray[0];
    var downloadResultLinkTag;
    var downloadFileName = "";

    var getRawDataAjax = jsRoutes.controllers.BnApp.queryValidationResult(isTestData);
    $.ajax({
            url: getRawDataAjax.url
    }).done(function(data) {
        //console.log("validationResult return:" + data);
        if( data.startsWith("Error:") ) {
            var message = data.replace("Error:", "");
            alertBoxShow(message);
        } else {
            //viewDataValidationResult( isTestData, data);
            var dataValidationResult = data;

            if( isTestData ) {
	            downloadFileName += "testData";
	            downloadResultLinkTag = document.getElementById("downloadTestDataValidationResult");
	        } else {
	            downloadFileName += "rawData"
	            downloadResultLinkTag = document.getElementById("downloadRawDataValidationResult");
	        }

	        downloadFileName += "ValidationResult.csv";
	        var csv = "";

            var lines = dataValidationResult.split('@');
	        var colNames = lines[0].split('$');

            for(var i=0; i<lines.length; i++) {
                var columns = lines[i].split("$");
                for(var j=0; j<columns.length; j++) {
                    if( j < columns.length - 1 ) {
                        csv += columns[j] + ",";
                    } else {
                        csv += columns[j];
                    }
                }
                csv += "\n";
            }
            var csvData = new Blob([csv]);
            downloadResultLinkTag.href = URL.createObjectURL(csvData);
            downloadResultLinkTag.download = downloadFileName;
            downloadResultLinkTag.click();
        }
    }).fail(function(){
    });
}