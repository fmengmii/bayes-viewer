package controllers;

import bayes.ModelReader;
import play.*;
import play.cache.Cache;
import play.data.Form;
import play.libs.Json;
import play.mvc.*;
import play.mvc.Http.*;
import play.mvc.Http.MultipartFormData.*;
import play.data.validation.*;
import views.html.*;

import java.io.*;
import java.util.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.google.gson.Gson;

import static play.data.Form.form;
import models.*;

public class Application extends Controller
{
	private Gson gson;
	public Application()
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

	public static Result index() {
		/*
		File folder = new File("public/models");
    	String[] files = folder.list();
    	List<String> fileList = new ArrayList<String>();
		fileList.add("");
    	for (int i=0; i<files.length; i++)
    		fileList.add(files[i]);
		return ok(index.render(fileList));
		*/
		return ok(index.render());
	}

	public static Result underConstruction() {
		return ok(underConstruction.render());
	}

	public static Result login() {
		return ok(login.render(Form.form(Login.class)));
	}

	public static Result changePassword() {
		return ok(changePassword.render(Form.form(ChangePassword.class)));
	}

	public static Result saveNewPassword() {
		Form<ChangePassword> passwordForm = Form.form(ChangePassword.class).bindFromRequest();
		if (passwordForm.hasErrors()) {
			//flash("error", "Please input correct field.");
			//return redirect("/changePassword");
			return ok(changePassword.render(passwordForm));
		}

		String oldPassword = passwordForm.get().oldPassword;
		User user = User.findByUserName(session().get("user"));
		if( user == null ||
				!user.password.equals(User.passwordDecoded(oldPassword)) ) {
			flash("error", "The old password is not correct!");
			return redirect("/changePassword");
		}

		String newPassword = passwordForm.get().newPassword;
		user.password = User.passwordDecoded(newPassword);
		user.update();
		flash("success", "The password has been updated. ");
		return redirect("/");
	}

	public static Result authenticate() {
		Form<Login> loginForm = Form.form(Login.class).bindFromRequest();
		if (loginForm.hasErrors()) {
			//flash("error", "Please correct the form below.");
			//return redirect("/login");
			//return badRequest(login.render(loginForm));
			return ok(login.render(loginForm));
		}
		String userName = loginForm.get().userName;
		String password = loginForm.get().password;

		String resultOfAuthenticate = User.authenticate(userName, password);
		if (resultOfAuthenticate.equals("userNotExist")) {
			flash("error", "We don't have the user, please register!");
			return redirect("/register");
		} else if (resultOfAuthenticate.equals("notMatch")) {
			flash("error", "Invalid password, please try again!");
			return redirect("/login");
		} else if( resultOfAuthenticate.equals("notApproved") ) {
			flash("alert", "Please wait for your account approval. We will notify you by email. ");
			return redirect("/");
		} else {
			//flash("success", "login successful.");
			session().clear();
			session("user", userName);
			return redirect("/bn/home"); // or redirect("/");
		}
	}

	public static Result register() {
		return ok(register.render(Form.form(Register.class)));
	}

	public static Result logout() {
		session().clear();
		return ok(index.render());
	}

	public static Result saveRegistration() {
		Form<Register> registerForm = Form.form(Register.class).bindFromRequest();
		if (registerForm.hasErrors()) {
			flash("error", "Please fully complete the form below.");
			//return badRequest(register.render(registerForm));
			return ok(register.render(registerForm));
		}

		String userName = registerForm.get().userName;
		String email = registerForm.get().email;
		if( User.findByUserName(userName) == null ) {
			//check email unique
			User oldUser = User.findByEmail(email);
			if( oldUser != null ) {
				flash("error", "The email has been registered with another " +
						"user name. If you forget the user name, " +
						"please contact our administrator. ");
				return badRequest(login.render(Form.form(Login.class)));
			}
			String password = registerForm.get().password;

			String firstName = registerForm.get().firstName;
			String lastName = registerForm.get().lastName;
			String title = registerForm.get().title;
			String organization = registerForm.get().organization;
			User user = new User(userName, password, email, firstName,
									lastName, title, organization);
			user.save();

			session().clear();
			flash("success", "The registration has been submitted. " +
					"We will send an email to confirm that later.");
			return redirect("/");
		} else {
			flash("error", "The user name has been registered. " +
					"Please change the user name. ");
			return badRequest(register.render(registerForm));
		}
	}
	/*
    //public static Result network(String loadFileName) {
	public static Result network(String dataType) {
		List<String> modelFileList = new ArrayList<String>();
		if( dataType.equals("private") && ! session().containsKey("user") ) {
			return ok(login.render(Form.form(Login.class)));
		}

		List<User> users = new ArrayList<User>();
		if( dataType.equals("private")){
			User user = User.findByUserName(session("user"));
			modelFileList = getModelFileList(user);
			users = User.findAllApprovedList();
			users.remove(user);
			return ok(network.render(modelFileList, dataType, users));
		} else if( dataType.equals("public") ){
			List<NetworkFile> networkFileList = NetworkFile.findAllPublicNetworkFileList();
			for( int i=0; i<networkFileList.size(); i++ ){
				modelFileList.add( networkFileList.get(i).fileName + "." +
					networkFileList.get(i).fileType);
			}

			return ok(network.render(modelFileList, dataType, users));
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

    //public static Result loadModel(String modelPath) {
	public static Result loadModel(String modelName) {
    	ModelReader modelReader = new ModelReader();

		String[] modelFullName = modelName.split("\\.");
		NetworkFile networkFile = NetworkFile.findByFileNameAndType(
				modelFullName[0], modelFullName[1]);

		String modelContent = networkFile.fileContent;
		String modelStr = modelReader.readModelFromFileContent(
				modelName, modelContent);

    	Object network = modelReader.getNetwork();
    	Cache.set("network", network);
		session("modelName", modelName);
    	//session("modelName", modelPath);
		String modelStrClean = modelReader.clearAllEvidence(modelName);

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

		//Logger.info("modelSharedByArray=" + modelSharedByArray);
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



		//flash("success", "The files have been uploaded successfully.");
		return ok("success");
		//return ok(modelStr);
	}
	*/
	/*
	public static Result deleteModel(String modelName) {
		String[] parseFullFileName = modelName.split("\\.");

		String fileName = parseFullFileName[0];
		String fileType = parseFullFileName[1];
		User user = User.findByUserName(session("user"));
		NetworkFile networkFile = NetworkFile.findByFileNameAndType(
					fileName, fileType);


		if( networkFile != null ) {
			Logger.info("delete file " + networkFile);
			List<Log> logList = Log.findByNetworkFile(networkFile);
			if( logList.size() > 0 ) {
				for( Log log : logList) {
					log.networkFile = null;
					log.update();
				}
			}
			Logger.info("before delete");
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
		System.out.println(modelName);
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
	*/
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
}

