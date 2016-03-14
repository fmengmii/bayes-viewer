package controllers;

import bayes.ModelReader;
import play.*;
import play.cache.Cache;
import play.data.Form;
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

	public static Result login() {
		return ok(login.render(Form.form(Login.class)));
	}

	public static Result changePassword() {
		return ok(changePassword.render(Form.form(ChangePassword.class)));
	}

	public static Result saveNewPassword() {
		Form<ChangePassword> passwordForm = Form.form(ChangePassword.class).bindFromRequest();
		if (passwordForm.hasErrors()) {
			flash("error", "Please input correct field.");
			//return badRequest(changePassword.render(passwordForm));
			return redirect("/changePassword");
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
			System.out.print("authenticate error: " + loginForm.errors());
			flash("error", "Please correct the form below.");
			//return badRequest(login.render(loginForm));
			return redirect("/login");
		}
		//System.out.print("authenticate, loginForm=" + loginForm);
		String userName = loginForm.get().userName;
		String password = loginForm.get().password;

		String resultOfAuthenticate = User.authenticate(userName, password);
		if (resultOfAuthenticate.equals("userNotExist")) {
			//return forbidden("invalid password");
			flash("error", "We don't have the user, please register!");
			//return badRequest(register.render(Form.form(Register.class)));
			return redirect("/register");
		} else if (resultOfAuthenticate.equals("notMatch")) {
			//return ok(login.render(Form.form(Login.class)));
			flash("error", "Invalid password, please try again!");
			//return forbidden("invalid password");
			//return badRequest(login.render(loginForm));
			return redirect("/login");
		} else if( resultOfAuthenticate.equals("notApproved") ) {
			flash("error", "Please wait for your account approval. ");
			return redirect("/");
		} else {
			flash("success", "login successful.");
			session().clear();
			session("user", userName);
			/*
			File folder = new File("public/models");
			String[] files = folder.list();
			List<String> fileList = new ArrayList<String>();
			fileList.add("");
			for (int i=0; i<files.length; i++)
				fileList.add(files[i]);
			return network("private");
			*/
			return redirect("/");
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
			System.out.print("saveRegisration error: " + registerForm.errors());
			flash("error", "Please complete the form below.");
			return badRequest(register.render(registerForm));
		}

		String userName = registerForm.get().userName;
		String email = registerForm.get().email;
		if( User.findByUserName(userName) == null ) {
			//check email unique
			User oldUser = User.findByEmail(email);
			if( oldUser != null ) {
				flash("error", "The email has been registered. " +
						"Please login directly. If you get any problem, " +
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
			//session("user", userName);

			flash("success", "The registration has been submitted. We will send email to confirm that later.");
			return ok(index.render());
		} else {
			flash("error", "The user name has been registered. Please change a user name. ");
			return badRequest(register.render(registerForm));
		}
	}

    //public static Result network(String loadFileName) {
	public static Result network(String dataType) {
		List<String> modelFileList = new ArrayList<String>();
		if( dataType.equals("private") && ! session().containsKey("user") ) {
			return ok(login.render(Form.form(Login.class)));
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
		if( dataType.equals("private")){
			User user = User.findByUserName(session("user"));
			modelFileList = getModelFileList(user);
			return ok(network.render(modelFileList, dataType));
		} else if( dataType.equals("public") ){
			List<NetworkFile> networkFileList = NetworkFile.findAllPublicNetworkFileList();
			for( int i=0; i<networkFileList.size(); i++ ){
				modelFileList.add( networkFileList.get(i).fileName + "." +
					networkFileList.get(i).fileType);
			}

			return ok(network.render(modelFileList, dataType));
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
			fileList.add( networkFileList.get(i).fileName + "." +
					networkFileList.get(i).fileType);
		}
		return fileList;
	}

    //public static Result loadModel(String modelPath) {
	public static Result loadModel(String modelName) {
    	ModelReader modelReader = new ModelReader();

		String[] modelFullName = modelName.split("\\.");
		User user = User.findByUserName(session("user"));
		NetworkFile networkFile = NetworkFile.findByUnique( user,
				modelFullName[0], modelFullName[1]);

		String modelContent = networkFile.fileContent;
		String modelStr = modelReader.readModelFromFileContent(
				modelName, modelContent);

		/*
		modelReader.setModelPath(modelPath);
    	String modelStr = modelReader.read(modelPath);
		*/
    	Object network = modelReader.getNetwork();
    	Cache.set("network", network);
    	//session("modelName", modelPath);
		String modelStrClean = modelReader.clearAllEvidence(modelName);
    	return ok(modelStrClean);
    }

	public static Result checkModel() {
		boolean modelFileExist = false;
		boolean dataFileExist = false;

		MultipartFormData body = request().body().asMultipartFormData();

		List<FilePart> filePartList = body.getFiles();
		Logger.info("upload files size=" + filePartList.size());

		FilePart modelUpload = filePartList.get(0);
		File file = modelUpload.getFile();
		String fullFileName = modelUpload.getFilename();
		Logger.info("filePart fullFileName=" + fullFileName );
		String[] parseFullFileName = fullFileName.split("\\.");
		Logger.info("parseFull name = " + parseFullFileName);

		String fileName = parseFullFileName[0];
		String fileType = parseFullFileName[1];
		User user = User.findByUserName(session("user"));
		Logger.info("user=" + user);
		Logger.info("fileName:" + fileName + "." + fileType);

		NetworkFile networkFile = NetworkFile.findByUnique(
				user, fileName, fileType);

		if( networkFile != null ) {
			modelFileExist = true;
		}

		if( filePartList.size() == 2 ) {
			FilePart dataUpload = filePartList.get(1);
			File dataFile = dataUpload.getFile();
			String dataFullFileName = dataUpload.getFilename();
			Logger.info("data filePart dataFullFileName=" + dataFullFileName );
			String[] parseDataFullFileName = dataFullFileName.split("\\.");
			Logger.info("parseFull name = " + parseDataFullFileName);

			String dataFileName = parseDataFullFileName[0];
			String dataFileType = parseDataFullFileName[1];

			//String dataFileContent = new Scanner(dataFile).useDelimiter("\\Z").next();
			//Logger.info("dataFileContent:\n" + dataFileContent);
			Logger.info("before query rawData, networkFile=" + networkFile);
			RawDataFile rawDataFile = RawDataFile.findByNetworkFile(networkFile);
			Logger.info("rawDataFile=" + rawDataFile );

			if( rawDataFile != null ) {
				dataFileExist = true;
			}
		}
		Logger.info("checkModel starts to return.");

		if( modelFileExist && dataFileExist ) {
			return ok("modelAndDataFileExist");
		} else if( modelFileExist ) {
			return ok("modelFileExist");
		} else if( dataFileExist ) {
			return ok("dataFileExist");
		} else {
			return ok("noExist");
		}
	}
	//public static Result uploadModel() throws IOException
	public static Result uploadModel(
			Boolean updateModelFile, Boolean updateDataFile,
			Boolean isModelPublic, Boolean isDataPublic ) {

		Logger.info("uploadModel:comming updateModelFile=" + updateModelFile);
		Logger.info("uploadModel: isModelPublic=" + isModelPublic);
		//alert("server got form data=" + request().Form("updateModelFile"));
		ModelReader modelReader = new ModelReader();

		MultipartFormData body = request().body().asMultipartFormData();

		List<FilePart> filePartList = body.getFiles();
		Logger.info("upload files size=" + filePartList.size());

		FilePart modelUpload = filePartList.get(0);

		//if (modelUpload != null) {
		File file = modelUpload.getFile();
		String fullFileName = modelUpload.getFilename();
		Logger.info("filePart fullFileName=" + fullFileName );
		String[] parseFullFileName = fullFileName.split("\\.");
		Logger.info("parseFull name = " + parseFullFileName);
		/*
		//verify in model.js getModelUpload() method
		if( parseFullFileName.length != 2  ) {
			Logger.info("file length is not 2.");
			flash("error", "Cann't identify the file type!");
			return redirect("/network/private");
		} else {
			Logger.info("full file name length is 2. with extension " +
					parseFullFileName[1]);

			if( !parseFullFileName[1].equals("xdsl") &&
					!parseFullFileName[1].equals("csv") ) {
				flash("error", "The file type is not xsdl nor csv!");
				return redirect("/network/private");
			}
		}
		*/
		String fileName = parseFullFileName[0];
		String fileType = parseFullFileName[1];
		User user = User.findByUserName(session("user"));
		Logger.info("user=" + user);
		Logger.info("fileName:" + fileName + "." + fileType);

		String fileContent = null;
		try{
			fileContent = new Scanner(file).useDelimiter("\\Z").next();
		} catch (FileNotFoundException ex ) {
			return badRequest("fileNotFound");
		}

		NetworkFile networkFile = NetworkFile.findByUnique(
				user, fileName, fileType);

		//Logger.info("networkFile return =" + networkFile );
		if( networkFile != null ) {
			if( updateModelFile) {
				Logger.info("netwrokFile exists.");
				networkFile.fileContent = fileContent;
				networkFile.isPublic = isModelPublic;
				networkFile.update();
			} else {
				return badRequest("model file is not allowed to update");
			}
		} else {
			networkFile = new NetworkFile(user,
					fileName, fileType, fileContent, isModelPublic);
			networkFile.save();
		}

		if( filePartList.size() == 2 ) {
			FilePart dataUpload = filePartList.get(1);
			File dataFile = dataUpload.getFile();
			String dataFullFileName = dataUpload.getFilename();
			Logger.info("data filePart dataFullFileName=" + dataFullFileName );
			String[] parseDataFullFileName = dataFullFileName.split("\\.");
			Logger.info("parseFull name = " + parseDataFullFileName);

			String dataFileName = parseDataFullFileName[0];
			String dataFileType = parseDataFullFileName[1];

			String dataFileContent = null;
			try{
				dataFileContent = new Scanner(dataFile).useDelimiter("\\Z").next();
			} catch ( FileNotFoundException ex ) {
				return badRequest("fileNotFound");
			}

			//Logger.info("dataFileContent:\n" + dataFileContent);
			Logger.info("before query rawData, networkFile=" + networkFile);
			RawDataFile rawDataFile = RawDataFile.findByNetworkFile(networkFile);
			Logger.info("rawDataFile=" + rawDataFile );

			if( rawDataFile != null ) {
				if( updateDataFile ) {
					Logger.info("rawDataFile exists.");
					rawDataFile.fileContent = dataFileContent;
					rawDataFile.isPublic = isDataPublic;
					rawDataFile.update();
				}else{
					return badRequest("raw data file is not allowed to update.");
				}
			} else {
				rawDataFile = new RawDataFile(networkFile, dataFileName,
						dataFileType, dataFileContent, isDataPublic);
				rawDataFile.save();
			}
		}
		Logger.info("save OR update successful.");
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

		Logger.info("before return...");
		flash("success", "The files have been uploaded successfully.");
		return ok("success");

		//return ok(modelStr);
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

