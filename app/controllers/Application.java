package controllers;

import bayes.ModelReader;
import play.*;
import play.cache.Cache;
import play.mvc.*;
import views.html.*;

import java.io.*;
import java.util.*;

import com.fasterxml.jackson.databind.JsonNode;

public class Application extends Controller
{
	
	public Application()
	{
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
    
    public static Result clearAllTargets()
    {
    	ModelReader modelReader = new ModelReader();
    	modelReader.setNetwork(Cache.get("network"));
    	String modelName = session("modelName");
    	String modelStr = modelReader.clearAllTargets(modelName);
    	
    	return ok(modelStr);
    }
}
