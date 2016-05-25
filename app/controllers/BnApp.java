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
import views.html.*;

import java.io.*;
import java.util.*;
import java.lang.reflect.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.google.gson.Gson;

import static play.data.Form.form;
import models.*;
import controllers.Application.*;

public class BnApp extends Controller {
       private Gson gson;
	public BnApp()
	{
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
			"REMOTE_ADDR" };

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
		if( user != null ) {
			Log log = new Log(networkFile, user, "",  operation);
			log.save();
		} else {
			String ip = getClientIpAddress(request());
			Log log = new Log(networkFile, user, ip,  operation);
			log.save();
		}
	}

	public static Result home() {
		/*
		File folder = new File("public/models");
    	String[] files = folder.list();
    	List<String> fileList = new ArrayList<String>();
		fileList.add("");
    	for (int i=0; i<files.length; i++)
    		fileList.add(files[i]);
		return ok(index.render(fileList));
		*/
		return ok(views.html.bn.home.render());
	}

    //public static Result network(String loadFileName) {
	public static Result network(String dataType) {
		List<String> modelFileList = new ArrayList<String>();
		Field[] fields = Network.BayesianAlgorithmType.class.getDeclaredFields();
		//List<String> bnAlgorithmTypeNameList = new ArrayList<String>();
		//List<String> bnAlgorithmTypeDisplayNameList = new ArrayList<String>();

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

		//bnAlgorithmNameMap.put("HeuristicImportance", "Heuristic Importance");
		//bnAlgorithmNameMap.put("????", "Relevance-based Decomposition");
		/*
		for( int i=0; i < fields.length; i++ ) {
			if( Modifier.isPublic(fields[i].getModifiers()) &&
				Modifier.isFinal(fields[i].getModifiers()) &&
				!fields[i].getName().equals("LBP")	){

				bnAlgorithmTypeNameList.add(fields[i].getName());
				bnAlgorithmTypeDisplayNameList.add(bnAlgorithmNameMap.get(fields[i].getName()));
			}
		}*/

		if( dataType.equals("private") && ! session().containsKey("user") ) {
			//return ok(login.render(Form.form(Login.class)));
			return redirect("/login");
		}

		/*
    	File folder = new File("public/models");
    	String[] files = folder.list();
    	List<String> fileList = new ArrayList<String>();
		fileList.add("");
    	for (int i=0; i<files.length; i++)
    		fileList.add(files[i]);

        return ok(network.render(fileList, loadFileName));
        */
		List<User> users = new ArrayList<User>();
		if( dataType.equals("private")){
			User user = User.findByUserName(session("user"));
			modelFileList = getModelFileList(user);
			users = User.findAllApprovedList();
			users.remove(user);
			return ok(views.html.bn.network.render(modelFileList, dataType,
					users, bnAlgorithmNameMap));
		} else if( dataType.equals("public") ){
			List<NetworkFile> networkFileList = NetworkFile.findAllPublicNetworkFileList();
			for( int i=0; i<networkFileList.size(); i++ ){
				modelFileList.add( networkFileList.get(i).fileName + "." +
					networkFileList.get(i).fileType);
			}

			return ok(views.html.bn.network.render(modelFileList, dataType,
					users, bnAlgorithmNameMap));
		} else {
			flash("error", "The dataType has to be private or public.");
			return redirect("/network/" + dataType);
		}
    }

	private static List<String> getModelFileList ( User user ) {
		if( user == null ) {
			return null;
		}
		List<NetworkFile> networkFileList = user.networkFiles;
		List<String> fileList = new ArrayList<String>();
		for( int i=0; i<networkFileList.size(); i++ ){
			NetworkFile modelFile = networkFileList.get(i);
			fileList.add( modelFile.fileName + "." +
						modelFile.fileType);
		}
		List<NetworkFile> sharedNetworkFileList = user.sharedNetworkFiles;
		for( int i=0; i<sharedNetworkFileList.size(); i++ ){
			NetworkFile modelFile = sharedNetworkFileList.get(i);
			fileList.add( modelFile.fileName + "." +
					modelFile.fileType + " sharedBy " +
					modelFile.user.firstName + " " +
					modelFile.user.lastName);
		}
		return fileList;
	}

	public static Result getModelStatus ( String modelName ) {
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
		networkFileMap.put("uploadTime", networkFile.updateTime.toString());
		//Logger.info("rawdata file is " + networkFile.rawDataFile);

		if( networkFile.rawDataFile != null ) {
			String rawDataFileName = networkFile.rawDataFile.fileName + "." +
					networkFile.rawDataFile.fileType;
			networkFileMap.put("rawDataFileName", rawDataFileName);
		} else {
			networkFileMap.put("rawDataFileName", "");
		}
		String sharedWith = "";
		if( networkFile.modelSharedUsers != null &&
				networkFile.modelSharedUsers.size() > 0 ) {
			for(User sharedUser : networkFile.modelSharedUsers ) {
				if( sharedWith.equals("")) {
					sharedWith += sharedUser.firstName + " " + sharedUser.lastName;
				} else {
					sharedWith += ", " + sharedUser.firstName + " " + sharedUser.lastName;
				}
			}
		}
		networkFileMap.put("sharedWith", sharedWith);
		return ok(Json.toJson(networkFileMap));
	}

	public static Result getRawData ( String modelName ) {
		String[] parseFullFileName = modelName.split("\\.");

		String fileName = parseFullFileName[0];
		String fileType = parseFullFileName[1];
		NetworkFile networkFile = NetworkFile.findByFileNameAndType(
				fileName, fileType);

		if( networkFile != null ) {
			RawDataFile rawDataFile = networkFile.rawDataFile;

			if( rawDataFile != null ) {
				String content = rawDataFile.fileContent;
				return ok(content);
			} else {
				return ok("Error:The raw data file didn't uploaded by the file owner yet.");
			}
		} else {
			return ok("Error:The network file didn't exist in database.");
		}
	}

	public static Result getModelHistory ( String modelName ) {
		String[] parseFullFileName = modelName.split("\\.");

		String fileName = parseFullFileName[0];
		String fileType = parseFullFileName[1];
		NetworkFile networkFile = NetworkFile.findByFileNameAndType(
					fileName, fileType);
		//Logger.info("before query log...");
		List<Log> logList = Log.findByNetworkFile(networkFile);
		Map logMap = new HashMap();
		logMap.put("logList", logList);
		//List<Log> simpleLogList = new ArrayList<Log>();

		//Logger.info("after query logList=" + logList);
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
			algorithmType = field.getInt( object);
		} catch( IllegalAccessException ex ) {
			Logger.info( ex.toString());
		} catch( Exception ex ) {
			Logger.info( ex.toString());
		}

		if( network == null ){
			Logger.info("changeAlgorithm network is null.");
			return ok("Error");
		} else if( algorithmType == -1 ) {
			Logger.info("changeAlgorithm algorithmtype is -1.");
			return ok("Error");
		} else {
			network.setBayesianAlgorithm(algorithmType);
			Cache.set("network", network);
			//Logger.info("change algorithm return success.");
			modelReader.modifyNetworkLast();
			String modelString = modelReader.getModelStr();
			//Logger.info("changeAlgorithm return modelString=" + modelString);
			return ok(modelString);
		}
	}
    //public static Result loadModel(String modelPath) {
	public static Result loadModel(String modelName, String algorithm) {
		//Logger.info("before loadMode.");
    	ModelReader modelReader = new ModelReader();

		String[] modelFullName = modelName.split("\\.");
		NetworkFile networkFile = NetworkFile.findByFileNameAndType(
				modelFullName[0], modelFullName[1]);

		String modelContent = networkFile.fileContent;
		String modelStr = modelReader.readModelFromFileContent(
				modelName, modelContent, algorithm);

    	Object network = modelReader.getNetwork();

    	Cache.set("network", network);
		session("modelName", modelName);
    	//session("modelName", modelPath);
		//Logger.info("before clean all evidence in loadModel.");
		//String modelStrClean = modelReader.clearAllEvidence(modelName);
		String modelStrClean = modelReader.getModelStr();
		//logging
		logAdvice(networkFile, "view");

    	return ok(modelStrClean);
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
	//public static Result uploadModel() throws IOException
	public static Result uploadModel(
			Boolean updateModelFile, Boolean updateDataFile,
			Boolean isModelPublic, Boolean isRawDataPublic,
			String modelSharedByArray, String rawDataSharedByArray) {

		ModelReader modelReader = new ModelReader();

		MultipartFormData body = request().body().asMultipartFormData();

		List<FilePart> filePartList = body.getFiles();

		FilePart modelUpload = filePartList.get(0);

		File file = modelUpload.getFile();
		String fullFileName = modelUpload.getFilename();
		String[] parseFullFileName = fullFileName.split("\\.");

		String fileName = parseFullFileName[0];
		String fileType = parseFullFileName[1];
		User user = User.findByUserName(session("user"));

		String fileContent = null;
		try{
			fileContent = new Scanner(file).useDelimiter("\\Z").next();
		} catch (FileNotFoundException ex ) {
			return badRequest("The file is not found.");
		}

		NetworkFile networkFile = NetworkFile.findByFileNameAndType(
					fileName, fileType);

		if( networkFile != null ) {
			if( updateModelFile) {
				List<User> sharedUsers = networkFile.modelSharedUsers;
				if( !isModelPublic && modelSharedByArray != null ) {
					List<String> modelsharedWith = new ArrayList<String>(
							Arrays.asList(modelSharedByArray.split(",")));
					for (String userName : modelsharedWith) {
						User sharedUser = User.findByUserName(userName);
						if (!sharedUsers.contains(sharedUser)) {
							sharedUsers.add(sharedUser);
						}
					}
				}
				networkFile.modelSharedUsers = sharedUsers;
				networkFile.fileContent = fileContent;
				networkFile.isPublic = isModelPublic;
				networkFile.update();

				//logging
				logAdvice(networkFile,"update");
				flash("success", "The file has been updated successfully.");
				Logger.info("after flash success.");
			} else {
				return badRequest("The model file is not allowed to update.");
			}
		} else {
			List<User> sharedUsers = new ArrayList<User>();
			if( !isModelPublic && modelSharedByArray != null ) {
				List<String> modelsharedWith = new ArrayList<String>(
						Arrays.asList(modelSharedByArray.split(",")));
				for (String userName : modelsharedWith) {
					User sharedUser = User.findByUserName(userName);
					sharedUsers.add(sharedUser);
				}
			}
			networkFile = new NetworkFile(user,
					fileName, fileType, fileContent, isModelPublic, sharedUsers);

			networkFile.save();
			//logging
			logAdvice(networkFile, "upload");
			flash("success", "The file has been uploaded successfully.");
		}

		if( filePartList.size() == 2 ) {
			FilePart dataUpload = filePartList.get(1);
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

			RawDataFile rawDataFile = RawDataFile.findByNetworkFile(networkFile);

			if( rawDataFile != null ) {
				if( updateDataFile ) {
					List<User> sharedUsers = rawDataFile.rawDataSharedUsers;
					if( !isRawDataPublic && rawDataSharedByArray != null ) {
						List<String> rawDatasharedWith = new ArrayList<String>(
								Arrays.asList(rawDataSharedByArray.split(",")));
						for(String userName: rawDatasharedWith) {
							User sharedUser = User.findByUserName(userName);
							if( !sharedUsers.contains(sharedUser)) {
								sharedUsers.add(sharedUser);
							}
						}
					}
					networkFile.modelSharedUsers = sharedUsers;
					rawDataFile.fileContent = dataFileContent;
					rawDataFile.isPublic = isRawDataPublic;
					rawDataFile.update();
					flash("success", "The files have been updated successfully.");
				}else{
					return badRequest("The raw data file is not allowed to update.");
				}
			} else {
				List<User> sharedUsers = new ArrayList<User>();
				if( !isRawDataPublic && rawDataSharedByArray != null ) {
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
		}
		//Logger.info("save OR update successful.");

			/*
			File modelTemp = null;
			try
			{
				modelTemp = File.createTempFile("tempmodel", ".xdsl");
				file.renameTo(modelTemp);
			} catch (IOException e){
				e.printStackTrace();
			}
			String modelStr = modelReader.readUpload(modelTemp.getAbsolutePath(), modelUpload.getFilename());
			System.out.println("temp file path=" + modelTemp.getAbsolutePath() );

			Object network = modelReader.getNetwork();
			Cache.set("network", network);
			session("modelName", modelTemp.getAbsolutePath());
			*/

		//flash("success", "The files have been uploaded successfully.");
		return ok("success");
		//return ok(modelStr);
	}

	public static Result deleteModel(String modelName) {
		String[] parseFullFileName = modelName.split("\\.");

		String fileName = parseFullFileName[0];
		String fileType = parseFullFileName[1];
		User user = User.findByUserName(session("user"));
		NetworkFile networkFile = NetworkFile.findByFileNameAndType(
					fileName, fileType);

		if( networkFile != null ) {
			List<Log> logList = Log.findByNetworkFile(networkFile);
			if( logList.size() > 0 ) {
				for( Log log : logList) {
					log.networkFile = null;
					log.update();
				}
			}
			networkFile.delete();
			//logAdvice(networkFile, "delete");
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

    	String modelStr = modelReader.setEvidence(modelName, nodeID, outcomeID);

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
