package controllers;

/**
 * Created by wyu on 4/15/16.
 * That controller used dor bayesian network.
 */

import bayes.ModelReader;
import play.*;
import play.cache.Cache;
import play.data.Form;
import play.libs.Json;
import play.mvc.*;
import play.mvc.Http.*;
import play.mvc.Http.MultipartFormData.*;
import play.data.validation.*;
import smile.Network;
import smile.learning.DataMatch;
import smile.learning.DataSet;
import smile.learning.EM;
import views.html.*;

import java.io.*;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.*;
import java.lang.reflect.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.google.gson.Gson;

import static play.data.Form.form;
import models.*;
import controllers.Application.*;

public class BnApp extends Controller {
	private Gson gson;

	public BnApp() {
		gson = new Gson();
	}

	private static final String[] HEADERS_TO_TRY = {
			"X-Forwarded-For",
			"Proxy-Client-IP",
			"WL-Proxy-Client-IP",
			"HTTP_X_FORWARDED_FOR",
			"HTTP_X_FORWARDED",
			"HTTP_X_CLUSTER_CLIENT_IP",
			"HTTP_CLIENT_IP",
			"HTTP_FORWARDED_FOR",
			"HTTP_FORWARDED",
			"HTTP_VIA",
			"REMOTE_ADDR"};

	public static String getClientIpAddress(Http.Request request) {
		for (String header : HEADERS_TO_TRY) {
			String ip = request.getHeader(header);
			if (ip != null && ip.length() != 0 && !"unknown".equalsIgnoreCase(ip)) {
				return ip;
			}
		}
		return request.remoteAddress();
	}

	private static void logAdvice(NetworkFile networkFile, String operation) {
		User user = User.findByUserName(session("user"));
		if (user != null) {
			Log log = new Log(networkFile, user, "", operation);
			log.save();
		} else {
			String ip = getClientIpAddress(request());
			Log log = new Log(networkFile, user, ip, operation);
			log.save();
		}
	}

	public static Result home() {
		return ok(views.html.bn.home.render());
	}

	public static Result network(String dataType) {
		List<String> modelFileList = new ArrayList<String>();
		Field[] fields = Network.BayesianAlgorithmType.class.getDeclaredFields();

		//map algorithm in GeNIE interface to Network.BayesianAlgorithmType properties
		Map<String, String> bnAlgorithmNameMap = new HashMap<String, String>();
		bnAlgorithmNameMap.put("Lauritzen", "Clustering");
		bnAlgorithmNameMap.put("Pearl", "Polytree");
		bnAlgorithmNameMap.put("Henrion", "Logic Sampling");
		bnAlgorithmNameMap.put("LSampling", "Likelihood Sampling");
		bnAlgorithmNameMap.put("SelfImportance", "Self-Importance");
		bnAlgorithmNameMap.put("BackSampling", "Backward Sampling");
		bnAlgorithmNameMap.put("AisSampling", "AIS Sampling");
		bnAlgorithmNameMap.put("EpisSampling", "EPIS Sampling");

		if (dataType.equals("private") && !session().containsKey("user")) {
			//return ok(login.render(Form.form(Login.class)));
			return redirect("/login");
		}

		List<User> users = new ArrayList<User>();
		if (dataType.equals("private")) {
			User user = User.findByUserName(session("user"));
			modelFileList = getModelFileList(user);
			users = User.findAllApprovedList();
			users.remove(user);
			return ok(views.html.bn.network.render(modelFileList, dataType,
					users, bnAlgorithmNameMap));
		} else if (dataType.equals("public")) {
			List<NetworkFile> networkFileList = NetworkFile.findAllPublicNetworkFileList();
			for (int i = 0; i < networkFileList.size(); i++) {
				modelFileList.add(networkFileList.get(i).fileName + "." +
						networkFileList.get(i).fileType);
			}

			return ok(views.html.bn.network.render(modelFileList, dataType,
					users, bnAlgorithmNameMap));
		} else {
			flash("error", "The dataType has to be private or public.");
			return redirect("/network/" + dataType);
		}
	}

	private static List<String> getModelFileList(User user) {
		if (user == null) {
			return null;
		}
		List<NetworkFile> networkFileList = user.networkFiles;
		List<String> fileList = new ArrayList<String>();
		for (int i = 0; i < networkFileList.size(); i++) {
			NetworkFile modelFile = networkFileList.get(i);
			if (modelFile.isActive) {
				fileList.add(modelFile.fileName + "." +
						modelFile.fileType);
			}
		}
		List<NetworkFile> sharedNetworkFileList = user.sharedNetworkFiles;
		for (int i = 0; i < sharedNetworkFileList.size(); i++) {
			NetworkFile modelFile = sharedNetworkFileList.get(i);
			if (modelFile.isActive) {
				fileList.add(modelFile.fileName + "." +
						modelFile.fileType + " sharedBy " +
						modelFile.user.firstName + " " +
						modelFile.user.lastName);
			}
		}
		return fileList;
	}

	public static Result getModelStatus(String modelName) {
		String[] parseFullFileName = modelName.split("\\.");

		String fileName = parseFullFileName[0];
		String fileType = parseFullFileName[1];
		User user = User.findByUserName(session("user"));
		NetworkFile networkFile = NetworkFile.findByFileNameAndType(
				fileName, fileType);

		String userName = networkFile.user.firstName + " " +
				networkFile.user.lastName;
		String fileFullName = networkFile.fileName + "." +
				networkFile.fileType;

		Map networkFileMap = new HashMap();
		networkFileMap.put("fileFullName", fileFullName);
		networkFileMap.put("uploadedBy", userName);
		networkFileMap.put("isPublic", networkFile.isPublic);
		networkFileMap.put("annotation", networkFile.annotation);
		networkFileMap.put("uploadTime", networkFile.updateTime.toString());
		//Logger.info("rawdata file is " + networkFile.rawDataFile);

		if (networkFile.rawDataFile != null) {
			String rawDataFileName = networkFile.rawDataFile.fileName + "." +
					networkFile.rawDataFile.fileType;
			networkFileMap.put("rawDataFileName", rawDataFileName);
			networkFileMap.put("rawDataIsPublic", networkFile.rawDataFile.isPublic);
		} else {
			networkFileMap.put("rawDataFileName", "");
		}
		String sharedWith = "";
		if (networkFile.modelSharedUsers != null &&
				networkFile.modelSharedUsers.size() > 0) {
			for (User sharedUser : networkFile.modelSharedUsers) {
				if (sharedWith.equals("")) {
					sharedWith += sharedUser.firstName + " " + sharedUser.lastName;
				} else {
					sharedWith += ", " + sharedUser.firstName + " " + sharedUser.lastName;
				}
			}
		}
		networkFileMap.put("sharedWith", sharedWith);
		return ok(Json.toJson(networkFileMap));
	}

	public static Result getRawData(String modelName) {
		String[] parseFullFileName = modelName.split("\\.");

		String fileName = parseFullFileName[0];
		String fileType = parseFullFileName[1];
		NetworkFile networkFile = NetworkFile.findByFileNameAndType(
				fileName, fileType);

		if (networkFile != null) {
			RawDataFile rawDataFile = networkFile.rawDataFile;

			if (rawDataFile != null) {
				String content = rawDataFile.fileContent;
				return ok(content);
			} else {
				return ok("Error:The raw data file didn't uploaded by the file owner yet.");
			}
		} else {
			return ok("Error:The network file didn't exist in database.");
		}
	}

	public static Result getModelHistory(String modelName) {
		String[] parseFullFileName = modelName.split("\\.");

		String fileName = parseFullFileName[0];
		String fileType = parseFullFileName[1];
		NetworkFile networkFile = NetworkFile.findByFileNameAndType(
				fileName, fileType);
		//Logger.info("before query log...");
		List<Log> logList = Log.findByNetworkFile(networkFile);
		Map logMap = new HashMap();
		logMap.put("logList", logList);

		return ok(Json.toJson(logMap));
	}

	public static Result changeAlgorithm(String modelName, String algorithm) {
		ModelReader modelReader = new ModelReader();
		modelReader.setNetwork(Cache.get("network"));
		Network network = modelReader.getNetwork();

		int algorithmType = -1;
		try {
			Field field = Network.BayesianAlgorithmType.class.getDeclaredField(algorithm);
			Object object = field.get(Network.BayesianAlgorithmType.class);
			algorithmType = field.getInt(object);
		} catch (IllegalAccessException ex) {
			Logger.info(ex.toString());
		} catch (Exception ex) {
			Logger.info(ex.toString());
		}

		if (network == null) {
			Logger.info("changeAlgorithm network is null.");
			return ok("Error");
		} else if (algorithmType == -1) {
			Logger.info("changeAlgorithm algorithmtype is -1.");
			return ok("Error");
		} else {
			network.setBayesianAlgorithm(algorithmType);
			Cache.set("network", network);
			//Logger.info("change algorithm return success.");
			modelReader.modifyNetworkLast();
			String modelString = modelReader.getModelStr();
			return ok(modelString);
		}
	}

	public static Result loadModel(String modelName, String algorithm) {
		ModelReader modelReader = new ModelReader();

		String[] modelFullName = modelName.split("\\.");
		NetworkFile networkFile = NetworkFile.findByFileNameAndType(
				modelFullName[0], modelFullName[1]);

		String modelContent = networkFile.fileContent;

		//handle raw data
		RawDataFile rawDataFile = RawDataFile.findByNetworkFile(networkFile);

		if (rawDataFile != null) {
			modelReader =  getDataSetAndStateMap( modelReader, rawDataFile, false);
		}

		String modelStr = modelReader.readModelFromFileContent(
				modelName, modelContent, algorithm);

		Network network = modelReader.getNetwork();

		Cache.set("network", network);
		session("modelName", modelName);
		logAdvice(networkFile, "view");
		return ok(modelStr);
	}

	private static ModelReader getDataSetAndStateMap( ModelReader modelReader,
													  RawDataFile rawDataFile,
													  boolean isExternalDataSet ) {

		try {
			File tmpFile = new File("/tmp/" +
					rawDataFile.fileName + "." + rawDataFile.fileType);
			if (tmpFile.exists()) {
				Logger.info("tmpFile exist.");
				tmpFile.delete();
			}
			tmpFile.createNewFile();


			PrintWriter writer = new PrintWriter(tmpFile);
			writer.print(rawDataFile.fileContent);
			writer.close();

			DataSet dataSet = new DataSet();
			dataSet.readFile(tmpFile.getAbsolutePath());

			Map<String, Map<String, Integer>> dataSetStateMap = new HashMap<String, Map<String, Integer>>();
			for (int i = 0; i < dataSet.getVariableCount(); i++) {
				String nodeId = dataSet.getVariableId(i);
				String[] stateNameArray = dataSet.getStateNames(i);
				Map<String, Integer> stateCountMap = new HashMap<String, Integer>();

				for (int j = 0; j < dataSet.getRecordCount(); j++) {
					int stateSeqNum = dataSet.getInt(i, j);
					//String stateLabel = stateNameArray[stateSeqNum]; // that's wrong for incomplete state in test file
					String stateLabel = "State" + stateSeqNum;

					if (stateCountMap.containsKey(stateLabel)) {
						int count = stateCountMap.get(stateLabel);
						stateCountMap.put(stateLabel, ++count);
					} else {
						stateCountMap.put(stateLabel, 1);
					}
				}
				dataSetStateMap.put(nodeId, stateCountMap);
			}

			if( isExternalDataSet ) {
				modelReader.setDataSetExternal(dataSet);
				modelReader.setDataSetExternalStateMap(dataSetStateMap);
				Cache.set("dataSetExternal", dataSet);
			} else {
				modelReader.setDataSet(dataSet);
				modelReader.setDataSetStateMap(dataSetStateMap);
				Cache.set("dataSet", dataSet);
			}
			tmpFile.delete();
		} catch (Exception ex) {
			Logger.error("loadModel:" + ex.toString());
		}

		return modelReader;
	}

	public static Result uploadTestRawData(String modelFileName,
										   String algorithm ){
		ModelReader modelReader = new ModelReader();
		Network network;
		MultipartFormData body = request().body().asMultipartFormData();

		List<FilePart> filePartList = body.getFiles();
		if( filePartList.size() == 0 ) {
			return badRequest("The raw data file is not chosen.");
		}

		NetworkFile networkFile;

		String[] parseFullFileName = modelFileName.split("\\.");
		String fileName = parseFullFileName[0];
		String fileType = parseFullFileName[1];
		networkFile = NetworkFile.findByFileNameAndType(
				fileName, fileType);

		//Logger.info("testRawData model fileName=" + fileName + "modelFile id=" + networkFile.id);
		if( networkFile != null ) {
			modelReader.readModelFromFileContent(modelFileName,
				networkFile.fileContent, algorithm);
			network = modelReader.getNetwork();
			Cache.set("network", network);
			//handle raw data
			RawDataFile oriRawDataFile = RawDataFile.findByNetworkFile(networkFile);
			//Logger.info("uploadTestRawData...oriRawDataFile...");
			if (oriRawDataFile != null) {
				modelReader = getDataSetAndStateMap( modelReader, oriRawDataFile, false);
			}
		} else {
			return badRequest("The model file can't be found.");
		}

		FilePart dataUpload = filePartList.get(0);

		if( dataUpload == null ) {
			return badRequest("The raw data file is not chosen.");
		}

		File dataFile = dataUpload.getFile();
		String dataFullFileName = dataUpload.getFilename();
		String[] parseDataFullFileName = dataFullFileName.split("\\.");

		String dataFileName = parseDataFullFileName[0];
		String dataFileType = parseDataFullFileName[1];

		String dataFileContent = null;

		try{
			dataFileContent = new Scanner(dataFile).useDelimiter("\\Z").next();
		} catch ( FileNotFoundException ex ) {
			return badRequest("The file is not found.");
		}

		if( !isRawDataMatchWithModel(dataFullFileName, dataFileContent, network) ) {
			return badRequest("The raw data does not match with the model.");
		}

		RawDataFile rawDataFileTest = new RawDataFile();
		rawDataFileTest.fileName = dataFileName;
		rawDataFileTest.fileType = dataFileType;
		rawDataFileTest.fileContent = dataFileContent;
		rawDataFileTest.isPublic = false;

		Cache.set("testRawDataFileObj", rawDataFileTest);

		//Logger.info("start for test raw data ...");
		modelReader = getDataSetAndStateMap( modelReader, rawDataFileTest, true);

		String modelStr = modelReader.readModelFromFileContent(
				modelFileName, networkFile.fileContent, algorithm );

		session("modelName", modelFileName);
		logAdvice(networkFile, "test");

		return ok(modelStr);
	}

	public static Result checkModel() {
		boolean modelFileExist = false;
		boolean dataFileExist = false;

		MultipartFormData body = request().body().asMultipartFormData();

		List<FilePart> filePartList = body.getFiles();

		FilePart modelUpload = filePartList.get(0);
		File file = modelUpload.getFile();
		String fullFileName = modelUpload.getFilename();
		String[] parseFullFileName = fullFileName.split("\\.");

		String fileName = parseFullFileName[0];
		String fileType = parseFullFileName[1];
		User user = User.findByUserName(session("user"));

		NetworkFile networkFile = NetworkFile.findByFileNameAndType(
				fileName, fileType);

		if( networkFile != null ) {
			modelFileExist = true;
		}

		if( filePartList.size() == 2 ) {
			FilePart dataUpload = filePartList.get(1);
			File dataFile = dataUpload.getFile();
			String dataFullFileName = dataUpload.getFilename();
			//Logger.info("data filePart dataFullFileName=" + dataFullFileName );
			String[] parseDataFullFileName = dataFullFileName.split("\\.");
			//Logger.info("parseFull name = " + parseDataFullFileName);

			String dataFileName = parseDataFullFileName[0];
			String dataFileType = parseDataFullFileName[1];

			RawDataFile rawDataFile = RawDataFile.findByNetworkFile(networkFile);
			//Logger.info("rawDataFile=" + rawDataFile );

			if( rawDataFile != null ) {
				dataFileExist = true;
			}
		}

		if( modelFileExist && dataFileExist ) {
			if( user.id == networkFile.user.id ) {
				return ok("modelAndDataFileExist");
			} else {
				return ok("modelFileNameDuplicate");
			}
		} else if( modelFileExist ) {
			if( user.id == networkFile.user.id) {
				return ok("modelFileExist");
			} else {
				return ok("modelFileNameDuplicate");
			}
		} else if( dataFileExist ) {
			return ok("dataFileExist");
		} else {
			return ok("noExist");
		}
	}

	public static Result uploadModel(
			Boolean updateModelFile, Boolean updateDataFile,
			Boolean isModelPublic, Boolean isRawDataPublic,
			String modelSharedByArray, String rawDataSharedByArray,
			String modelFileName, String annotation) {

		ModelReader modelReader = new ModelReader();
		Network network;
		MultipartFormData body = request().body().asMultipartFormData();

		List<FilePart> filePartList = body.getFiles();

		NetworkFile networkFile;

		Logger.info("updateModelFile=" + updateModelFile);
		if( updateModelFile ) {
			FilePart modelUpload = filePartList.get(0);

			File file = modelUpload.getFile();
			String fullFileName = modelUpload.getFilename();
			String[] parseFullFileName = fullFileName.split("\\.");

			//Logger.info("uploadModel: fullFileName=" + fullFileName);
			String fileName = parseFullFileName[0];
			String fileType = parseFullFileName[1];

			User user = User.findByUserName(session("user"));

			if( user == null ) {
				return badRequest("The user is not registered. Please sign out then sign in.");
			}

			String fileContent = null;
			try {
				fileContent = new Scanner(file).useDelimiter("\\Z").next();
			} catch (FileNotFoundException ex) {
				return badRequest("The file is not found.");
			}

			networkFile = NetworkFile.findByFileNameAndType(
					fileName, fileType);

			if (networkFile != null) {
				if (updateModelFile) {
					long id = networkFile.id;
					List<User> sharedUsers = networkFile.modelSharedUsers;

					if (!isModelPublic && modelSharedByArray != null &&
							!modelSharedByArray.equals("null")) {

						List<String> modelSharedWith = new ArrayList<String>(
								Arrays.asList(modelSharedByArray.split(",")));
						for (String userName : modelSharedWith) {
							User sharedUser = User.findByUserName(userName);
							if (!sharedUsers.contains(sharedUser)) {
								sharedUsers.add(sharedUser);
							}
						}
					}
					networkFile.modelSharedUsers = sharedUsers;
					networkFile.fileContent = fileContent;
					networkFile.annotation = annotation;
					networkFile.isPublic = isModelPublic;
					networkFile.update(id);

					//logging
					logAdvice(networkFile, "update");
					flash("success", "The file has been updated successfully.");
				}
			} else {
				List<User> sharedUsers = new ArrayList<User>();
				if (!isModelPublic && modelSharedByArray != null &&
						!modelSharedByArray.equals("null")) {

					List<String> modelsharedWith = new ArrayList<String>(
							Arrays.asList(modelSharedByArray.split(",")));
					for (String userName : modelsharedWith) {
						User sharedUser = User.findByUserName(userName);
						sharedUsers.add(sharedUser);
					}
				}
				networkFile = new NetworkFile(user,
						fileName, fileType, fileContent, annotation,
						isModelPublic, sharedUsers);

				networkFile.save();
				//logging
				logAdvice(networkFile, "upload");
				flash("success", "The file has been uploaded successfully.");
			}
			modelReader.readModelFromFileContent(fullFileName,
					fileContent, "Lauritzen");
			network = modelReader.getNetwork();
		} else {
			//Logger.info("update model file is false. only update user access privilege.");
			String[] parseFullFileName = modelFileName.split("\\.");
			String fileName = parseFullFileName[0];
			String fileType = parseFullFileName[1];
			networkFile = NetworkFile.findByFileNameAndType(
					fileName, fileType);

			if( networkFile != null ) {
				long id = networkFile.id;
				List<User> sharedUsers = networkFile.modelSharedUsers;

				if (!isModelPublic && modelSharedByArray != null &&
						!modelSharedByArray.equals("null")) {

					List<String> modelSharedWith = new ArrayList<String>(
								Arrays.asList(modelSharedByArray.split(",")));
					for (String userName : modelSharedWith) {
						User sharedUser = User.findByUserName(userName);
						if (!sharedUsers.contains(sharedUser)) {
							sharedUsers.add(sharedUser);
						}
					}
				}
				networkFile.modelSharedUsers = sharedUsers;
				networkFile.isPublic = isModelPublic;
				networkFile.annotation = annotation;
				networkFile.update(id);
				flash("success", "The file has been updated successfully.");
			}

			modelReader.readModelFromFileContent(modelFileName,
					networkFile.fileContent, "Lauritzen");
			network = modelReader.getNetwork();
		}

		if( updateDataFile ) {
			Logger.info("update Raw data here.");
			FilePart dataUpload = null ;
			if( filePartList.size() == 2 ) {
				dataUpload = filePartList.get(1);
			} else if( filePartList.size() == 1 && !updateModelFile ) {
				dataUpload = filePartList.get(0);
			}

			if( dataUpload == null ) {
				return badRequest("The raw data file is not chosen.");
			}

			File dataFile = dataUpload.getFile();
			String dataFullFileName = dataUpload.getFilename();
			String[] parseDataFullFileName = dataFullFileName.split("\\.");

			String dataFileName = parseDataFullFileName[0];
			String dataFileType = parseDataFullFileName[1];

			String dataFileContent = null;
			try{
				dataFileContent = new Scanner(dataFile).useDelimiter("\\Z").next();
			} catch ( FileNotFoundException ex ) {
				return badRequest("The file is not found.");
			}

			if( !isRawDataMatchWithModel(dataFullFileName, dataFileContent, network) ) {
				return badRequest("The raw data uploading failed because its column name doesn't match with the model's node id.");
			}

			RawDataFile rawDataFile = RawDataFile.findByNetworkFile(networkFile);

			if( rawDataFile != null ) {
				long id = rawDataFile.id;
				List<User> sharedUsers = rawDataFile.rawDataSharedUsers;
				if( !isRawDataPublic && rawDataSharedByArray != null &&
						!rawDataSharedByArray.equals("null")) {

					List<String> rawDatasharedWith = new ArrayList<String>(
							Arrays.asList(rawDataSharedByArray.split(",")));
					for(String userName: rawDatasharedWith) {
						User sharedUser = User.findByUserName(userName);
						if( !sharedUsers.contains(sharedUser)) {
							sharedUsers.add(sharedUser);
						}
					}
					//rawDataFile.rawDataSharedUsers = sharedUsers;
				}
				rawDataFile.fileName = dataFileName;
				rawDataFile.fileType = dataFileType;
				rawDataFile.rawDataSharedUsers = sharedUsers;
				rawDataFile.fileContent = dataFileContent;
				rawDataFile.isPublic = isRawDataPublic;

				rawDataFile.update(id);
				Logger.info("rawDataFile has been updated.");
				flash("success", "The files have been updated successfully.");
			} else {
				List<User> sharedUsers = new ArrayList<User>();
				if( !isRawDataPublic && rawDataSharedByArray != null &&
						!rawDataSharedByArray.equals("null")) {

					List<String> rawDatasharedWith = new ArrayList<String>(
							Arrays.asList(rawDataSharedByArray.split(",")));
					for (String userName : rawDatasharedWith) {
						User sharedUser = User.findByUserName(userName);
						sharedUsers.add(sharedUser);
					}
				}

				rawDataFile = new RawDataFile(networkFile, dataFileName,
						dataFileType, dataFileContent, isRawDataPublic, sharedUsers);

				rawDataFile.save();
				flash("success", "The files have been uploaded successfully.");
			}
		} else {
			RawDataFile rawDataFile = RawDataFile.findByNetworkFile(networkFile);
			if( rawDataFile != null) {
				long id = rawDataFile.id;
				List<User> sharedUsers = new ArrayList<User>();

				if( !isRawDataPublic && rawDataSharedByArray != null &&
						!rawDataSharedByArray.equals("null")) {

					List<String> rawDatasharedWith = new ArrayList<String>(
							Arrays.asList(rawDataSharedByArray.split(",")));
					for (String userName : rawDatasharedWith) {
						User sharedUser = User.findByUserName(userName);
						sharedUsers.add(sharedUser);
					}
				}
				rawDataFile.rawDataSharedUsers = sharedUsers;
				rawDataFile.isPublic = isRawDataPublic;
				rawDataFile.update(id);
				flash("success", "The files have been updated successfully.");
			}
		}

		return ok("success");
	}

	public static Result saveNewModel( String modelFileName, Boolean combineRawData ) {
		ModelReader modelReader = new ModelReader();
		Network network = (Network)Cache.get("network");
		RawDataFile uploadRawDataFileObj = (RawDataFile)Cache.get("testRawDataFileObj");
		Network networkNew = network;
		DataSet dataSet = (DataSet)Cache.get("dataSetExternal");
		DataSet dataSetNew = new DataSet();
    	modelReader.setNetwork(network);
		DateFormat dateFormat = new SimpleDateFormat("yyyyMMddHHmmss"); //year month day hour minute second
		Date date = new Date();

		String[] parseFullFileName = modelFileName.split("\\.");
		String fileName = parseFullFileName[0];
		String fileType = parseFullFileName[1];
		String tmpFileName = "/tmp/" + fileName + "_rawDataCombine" +
				dateFormat.format(date) + "_" + session("user") + ".csv";

		dataSet.writeFile(tmpFileName, ',', null, true); //default separator \t missingValueToken:null columnIdsPresent:true
		File tmpFile = new File(tmpFileName);
		dataSetNew.readFile(tmpFileName);
		tmpFile.delete();

		if( combineRawData ) {
			//combine the original raw data with the testing raw data
			NetworkFile networkFile = NetworkFile.findByFileNameAndType(
					fileName, fileType);

			if( networkFile == null ) {
				return badRequest("The model file didn't exist in database.");
			}
			RawDataFile rawDataFile = RawDataFile.findByNetworkFile(networkFile);
			if( rawDataFile != null ) {
				String rawDataContent = rawDataFile.fileContent;
				String uploadRawDataContent = uploadRawDataFileObj.fileContent;
				//remove rawData first line with column name
				String[] rawDataContentArray = uploadRawDataContent.split("\n");
				List<String> rawDataContentList =
						Arrays.asList(Arrays.copyOfRange(
								rawDataContentArray, 1, rawDataContentArray.length));

				rawDataContent += "\n" + String.join("\n", rawDataContentList);
				uploadRawDataFileObj.fileContent = rawDataContent;
			}
		}


		DataMatch[] matches = dataSetNew.matchNetwork(network);
		EM em = new EM();
		em.setRandomizeParameters(false);  //default is true, it will randomize the CPTs of the nodes before learning
		em.setUniformizeParameters(true); //default is false

		//em.setEqSampleSize(dataSetNew.getRecordCount());
		em.setEqSampleSize(1);
		em.learn(dataSetNew, networkNew, matches);


		String newModelName = "/tmp/" + fileName + "_" +
				dateFormat.format(date) + "_" + session("user") + ".xdsl" ;
		File newModelFile = new File(newModelName);

		networkNew.writeFile(newModelName);

		String[] parseFullNewModelFileName = newModelName.replace("/tmp/", "").split("\\.");
		String newModelFileName = parseFullNewModelFileName[0];
		String newModelFileType = parseFullFileName[1];
		User user = User.findByUserName(session("user"));

		String newModelFileContent = null;
		try {
			newModelFileContent = new Scanner(newModelFile).useDelimiter("\\Z").next();
		} catch (FileNotFoundException ex) {
			return badRequest("The new model file is not found.");
		}

		newModelFile.delete();
		NetworkFile networkFile = new NetworkFile();
		//List<User> sharedUsers = networkFile.modelSharedUsers;

		networkFile.user = user;
		networkFile.fileName = newModelFileName;
		networkFile.fileType = newModelFileType;
		networkFile.isPublic = false;
		//networkFile.modelSharedUsers = sharedUsers;
		networkFile.fileContent = newModelFileContent;
		networkFile.save();

		uploadRawDataFileObj.networkFile = networkFile;
		uploadRawDataFileObj.save();

		//logging
		logAdvice(networkFile, "save");
		return ok(newModelFileName + "." + newModelFileType);
	}

	public static boolean isRawDataMatchWithModel(String rawDataFileName,
										   String rawDataFileContent,
										   Network network) {

		List<String> nodeIdList = new ArrayList<String>(
							Arrays.asList(network.getAllNodeIds()));
		String[] rawDataRows = rawDataFileContent.split("\n");
		String[] rawDataColumnTitleArray = rawDataRows[0].split(",");
		if( nodeIdList.size() != rawDataColumnTitleArray.length ) {
			return false; //column number does not match with the number of node ids
		}

		for( int i = 0; i < rawDataColumnTitleArray.length; i++) {
			if( !nodeIdList.contains(rawDataColumnTitleArray[i]) ) {
				return false; // column name does not match with node id
			}
		}

		try {
			File tmpFile = new File("/tmp/" + rawDataFileName);
			if( !tmpFile.exists() ) {
				tmpFile.createNewFile();
			}

			PrintWriter writer = new PrintWriter(tmpFile);
			writer.print(rawDataFileContent);
			writer.close();

			DataSet dataSet = new DataSet();
			dataSet.readFile(tmpFile.getAbsolutePath());
			tmpFile.delete();
			Cache.set("dataSet", dataSet);

			DataMatch[] matches = dataSet.matchNetwork(network);

			//check if state match between dataSet and network
			for( int i=0; i < dataSet.getVariableCount(); i++ ) {
				String nodeId = dataSet.getVariableId(i);
				String[] stateNameArray = dataSet.getStateNames(i);
				String[] outcomeIDs = network.getOutcomeIds(nodeId);
				List<String> outcomeIDsList = new ArrayList<String>(Arrays.asList(outcomeIDs));
				for( int j=0; j<stateNameArray.length; j++ ) {
					if( !outcomeIDsList.contains(stateNameArray[j]) ) {
						return false;
					}
				}
			}
		} catch( Exception ex ) {
			Logger.info("check rawData if match with model: matches return=" + ex.toString());
			return false;
		}
		return true;
	}

	public static Result deleteModel(String modelName) {
		String[] parseFullFileName = modelName.split("\\.");

		String fileName = parseFullFileName[0];
		String fileType = parseFullFileName[1];
		User user = User.findByUserName(session("user"));
		NetworkFile networkFile = NetworkFile.findByFileNameAndType(
					fileName, fileType);

		if( networkFile != null ) {
			logAdvice(networkFile, "delete");
			networkFile.isActive = false;
			networkFile.update();
			return ok("success");
		} else {
			return ok("The network file does not exist in database.");
		}
	}

    public static Result setEvidence()
    {
    	Map<String, String[]> values = request().body().asFormUrlEncoded();
    	String nodeID = values.get("nodeID")[0];
    	String outcomeID = values.get("outcomeID")[0];


    	ModelReader modelReader = new ModelReader();
    	modelReader.setNetwork(Cache.get("network"));
    	String modelName = session("modelName");

    	String modelStr = modelReader.setEvidence(nodeID, outcomeID);

    	return ok(modelStr);
    }

    public static Result setVirtualEvidence()
    {
    	Map<String, String[]> values = request().body().asFormUrlEncoded();

    	String nodeID = values.get("nodeID")[0];
    	String[] outcomeStrArray = values.get("outcomeVals[]");

    	double[] outcomeVals = new double[outcomeStrArray.length];

    	for (int i=0; i<outcomeStrArray.length; i++) {
    		outcomeVals[i] = Double.parseDouble(outcomeStrArray[i]);
			//Logger.info("setVirtualEvidence: value=" + outcomeVals[i]);
    	}

    	ModelReader modelReader = new ModelReader();
    	modelReader.setNetwork(Cache.get("network"));
    	String modelName = session("modelName");

    	String modelStr = modelReader.setVirtualEvidence(modelName, nodeID, outcomeVals);

    	return ok(modelStr);
    }

    public static Result clearAllEvidence()
    {
    	ModelReader modelReader = new ModelReader();
    	modelReader.setNetwork(Cache.get("network"));
    	String modelName = session("modelName");
		//System.out.println(modelName);
    	String modelStr = modelReader.clearAllEvidence(modelName);

    	return ok(modelStr);
    }

    public static Result clearEvidence(String nodeID)
    {
    	ModelReader modelReader = new ModelReader();
    	modelReader.setNetwork(Cache.get("network"));
    	String modelName = session("modelName");
    	String modelStr = modelReader.clearEvidence(modelName, nodeID);

    	return ok(modelStr);
    }

    public static Result setAsTarget(String nodeID)
    {
    	//Logger.info("setAsTarget in with nodeID=" + nodeID);
		ModelReader modelReader = new ModelReader();
    	modelReader.setNetwork(Cache.get("network"));
    	String modelName = session("modelName");
    	String modelStr = modelReader.setAsTarget(modelName, nodeID);

    	return ok(modelStr);
    }

	public static Result removeTarget(String nodeID)
	{
		ModelReader modelReader = new ModelReader();
		modelReader.setNetwork(Cache.get("network"));
		String modelName = session("modelName");
		String modelStr = modelReader.removeTarget(modelName, nodeID);

		return ok(modelStr);
	}

    public static Result clearAllTargets()
    {
    	ModelReader modelReader = new ModelReader();
    	modelReader.setNetwork(Cache.get("network"));
    	String modelName = session("modelName");
    	String modelStr = modelReader.clearAllTargets(modelName);

    	return ok(modelStr);
    }

    public static Result getCPT(String nodeID)
    {
    	ModelReader modelReader = new ModelReader();
    	modelReader.setNetwork(Cache.get("network"));
    	String modelName = session("modelName");
    	String cptStr = modelReader.getCPT(modelName, nodeID);
    	//System.out.println(cptStr);

    	return ok(cptStr);
    }

	public static Result readMe() {
		return ok();
	}

    /*
	public static class Login {
		@Constraints.Required
		public String userName;

		@Constraints.Required
		@Constraints.MinLength(6)
		@Constraints.MaxLength(32)
		public String password;
	}

	public static class Register {
		@Constraints.Required
		public String userName;

		@Constraints.Required
		@Constraints.MinLength(6)
		@Constraints.MaxLength(32)
		public String password;

		@Constraints.Required
    	@Constraints.Email
		public String email;

		@Constraints.Required
		public String firstName;

		@Constraints.Required
		public String lastName;

		@Constraints.Required
		public String title;

		@Constraints.Required
		public String organization;
	}

	public static class ChangePassword {
		@Constraints.Required
		@Constraints.MinLength(6)
		@Constraints.MaxLength(32)
		public String oldPassword;

		@Constraints.Required
		@Constraints.MinLength(6)
		@Constraints.MaxLength(32)
		public String newPassword;
	}
	*/
}
