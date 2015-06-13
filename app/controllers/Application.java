package controllers;

import bayes.ModelReader;
import play.*;
import play.cache.Cache;
import play.mvc.*;
import play.mvc.Http.*;
import play.mvc.Http.MultipartFormData.*;
import views.html.*;

import java.io.*;
import java.util.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.google.gson.Gson;

public class Application extends Controller
{
	private Gson gson;
	
	public Application()
	{
		gson = new Gson();
	}
	
	
    public static Result index()
    {	
    	File folder = new File("public/models");
    	String[] files = folder.list();
    	List<String> fileList = new ArrayList<String>();
    	for (int i=0; i<files.length; i++)
    		fileList.add(files[i]);
    	
        return ok(network.render(fileList));
    }
    
    public static Result loadModel(String modelName)
    {
    	ModelReader modelReader = new ModelReader();
    	String modelStr = modelReader.read(modelName);
    	Object network = modelReader.getNetwork();
    	Cache.set("network", network);
    	session("modelName", modelName);

    	return ok(modelStr);
    }

	public static Result uploadModel() throws IOException
	{
		MultipartFormData body = request().body().asMultipartFormData();
		FilePart upload = body.getFile("file");
		if (upload != null) {
			File file = upload.getFile();

			File newFile = null;
			try {
				newFile = File.createTempFile("tempmodel", ".xdsl");
				file.renameTo(newFile);
			} catch (IOException e){
				e.printStackTrace();
			}

			ModelReader modelReader = new ModelReader();
			String modelStr = modelReader.readUpload(newFile.getAbsolutePath(), upload.getFilename());
			return ok(modelStr);
		} else {
			flash("error", "Missing file");
			return ok("File NOT uploaded");
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
}
