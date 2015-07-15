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
    
    public static Result loadModel(String modelPath)
    {
    	ModelReader modelReader = new ModelReader();
		modelReader.setModelPath(modelPath);
    	String modelStr = modelReader.read(modelPath);
    	Object network = modelReader.getNetwork();
    	Cache.set("network", network);
    	session("modelName", modelPath);

    	return ok(modelStr);
    }

	public static Result uploadModel() throws IOException
	{
		ModelReader modelReader = new ModelReader();

		MultipartFormData body = request().body().asMultipartFormData();
		List<FilePart> files = body.getFiles();

		//data
		if (files.size() > 1) {
			FilePart dataUpload = files.get(1);
			if (dataUpload != null) {
				File file = dataUpload.getFile();
				System.out.println(file.getName());

				File dataTemp = null;
				try {
					dataTemp = File.createTempFile("tempdata", ".cvs");
					file.renameTo(dataTemp);
				} catch (IOException e) {
					e.printStackTrace();
				}

				modelReader.setDataUploadPath(dataTemp.getAbsolutePath());

			}
		}

		//model
		FilePart modelUpload = files.get(0);
		if (modelUpload != null)
		{
			File file = modelUpload.getFile();
			File modelTemp = null;
			try
			{
				modelTemp = File.createTempFile("tempmodel", ".xdsl");
				file.renameTo(modelTemp);
			} catch (IOException e){
				e.printStackTrace();
			}
			String modelStr = modelReader.readUpload(modelTemp.getAbsolutePath(), modelUpload.getFilename());
			Object network = modelReader.getNetwork();
			Cache.set("network", network);
			session("modelName", modelTemp.getAbsolutePath());

			return ok(modelStr);
		} else {
			return ok("Model file NOT uploaded");
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

}
