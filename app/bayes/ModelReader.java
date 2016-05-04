package bayes;

import java.awt.Rectangle;
import java.io.*;
import java.text.*;
import java.util.*;

import com.google.gson.Gson;

import play.Logger;
import smile.*;

public class ModelReader
{
	private Network network;
	private Gson gson;
	private String modelPath;

	public ModelReader()
	{
		gson = new Gson();
	}
	
	public Network getNetwork()
	{
		return network;
	}
	
	public void setNetwork(Object network)
	{
		this.network = (Network) network;
	}

	public void setModelPath(String path) {this.modelPath = path;}

	
	public String read(String modelPath)
	{
		loadModel(modelPath);
		return getModelStr();
	}

	public String readUpload(String modelPath, String modelName)
	{
		uploadModel(modelPath, modelName);
		return getModelStr();
	}

	public String readModelFromFileContent ( String modelFullName, String modelXdslContent ) {
		if (network == null) {
			network = new Network();
			network.readString( modelXdslContent );
			network.setName(modelFullName);
		}
		return getModelStr();
	}

	public String getModelStr()
	{
		//Logger.info("before getModelStr().");
		NumberFormat formatter = new DecimalFormat("#0.00");
		
		//System.out.println("read!");
		StringBuilder strBlder = new StringBuilder("[");
		//List<String> targetIdList = new ArrayList<String>();
		try {
			//System.out.println(System.getProperty("java.library.path"));
			//System.out.println(network.getName());
			//network.clearAllTargets();

			//get original value before updating beliefs
			Network networkLast = network;
			int[] nodesLast = networkLast.getAllNodes();

			network.updateBeliefs();

			//nodes
			strBlder.append("{\"nodes\":[");
			List<int[]> edgeList = new ArrayList<int[]>();

			int[] nodes = network.getAllNodes();

			for (int i=0; i<nodes.length; i++) {
				int node = nodes[i];
				String nodeID = network.getNodeId(node);
				String nodeName = network.getNodeName(node);

				if(!isAllUpperCase(nodeName)) {
					//modify all first character of node name to lower case
					String nodeNameLastPart = nodeName.substring(1);
					String nodeNameFirstPart = nodeName.substring(0, 1);
					nodeName = nodeNameFirstPart.toLowerCase() + nodeNameLastPart;
				}

				Rectangle rect = network.getNodePosition(node);

				if (i > 0)
					strBlder.append(",");

				strBlder.append("{\"data\":{\"id\":\"" + nodeID + "\",\"name\":\"" + nodeName + "\"}, \"position\":{\"x\":" + rect.x + ", \"y\":" + rect.y + "}}");

				//edges
				int[] childrenIDs = network.getChildren(node);
				for (int j=0; j<childrenIDs.length; j++) {
					int[] arcIDs = new int[2];
					arcIDs[0] = node;
					arcIDs[1] = childrenIDs[j];
					edgeList.add(arcIDs);
				}
			}
			strBlder.append("], \"edges\":[");

			//edges
			int count = 0;
			for (int[] arcIDs : edgeList) {
				if (count > 0)
					strBlder.append(",");
				strBlder.append("{\"data\":{\"id\":\"" + arcIDs[0] + "|" + arcIDs[1] + "\",\"source\":\"" + network.getNodeId(arcIDs[0]) + "\",\"target\":\"" + network.getNodeId(arcIDs[1]) + "\"}}");
				count++;
			}

			strBlder.append("]},");

			//node values
			strBlder.append("[");
			Map<String, String> outcomeMap = new TreeMap<String, String>();

			for (int i=0; i<nodes.length; i++) {
				StringBuilder outcomeBlder = new StringBuilder();
				String nodeName = network.getNodeName(nodes[i]);
				String nodeID = network.getNodeId(nodes[i]);

				if( !isAllUpperCase(nodeName) ) {
					//modify all first character of node name to lower case
					String nodeNameLastPart = nodeName.substring(1);
					String nodeNameFirstPart = nodeName.substring(0, 1);
					nodeName = nodeNameFirstPart.toLowerCase() + nodeNameLastPart;
				}
				outcomeBlder.append("{\"nodename\":\"" + nodeName + "\", \"id\":\"" + network.getNodeId(nodes[i]) + "\", ");

				//adding isVirtualEvidence, is RealEvidence and isTarget for each node
				outcomeBlder.append("\"isVirtualEvidence\":\"" + network.isVirtualEvidence(nodeID) + "\", ");
				outcomeBlder.append("\"isRealEvidence\":\"" + network.isRealEvidence(nodeID) + "\", ");
				//outcomeBlder.append("\"isPropagatedEvidence\":\"" + network.isPropagatedEvidence(nodeID) + "\", ");
				//outcomeBlder.append("\"isEvidence\":\"" + network.isEvidence(nodeID) + "\", ");
				outcomeBlder.append("\"isTarget\":\"" + network.isTarget(nodeID) + "\", ");

				String[] outcomeIDs = network.getOutcomeIds(nodes[i]);

				//adding virtualEvidenceValue
				if( network.isVirtualEvidence(nodeID) ) {
					outcomeBlder.append("\"virtualEvidenceValues\":[");
					double[] virtualEvidenceValues = network.getVirtualEvidence(nodes[i]);

					//double[] values = network.getNodeValue(nodes[i]);

					for (int j = 0; j < outcomeIDs.length; j++) {
						//System.out.println("virtualEvidence value: " + virtualEvidenceValues[j]);
						if (j > 0)
							outcomeBlder.append(",");
						outcomeBlder.append("{\"outcomeid\":\"" + outcomeIDs[j] + "\",\"value\":" +
								formatter.format((virtualEvidenceValues[j])) + "}");
					}

					outcomeBlder.append("], ");
				}
				//end of adding virtual evidence values

				outcomeBlder.append("\"values\":[");
				//String[] outcomeIDs = network.getOutcomeIds(nodes[i]);

				double[] values = network.getNodeValue(nodes[i]);
				double[] valuesLast = networkLast.getNodeValue(nodesLast[i]);

				for (int j=0; j<outcomeIDs.length; j++) {
					//System.out.println("outcome: " + outcomeIDs[j] + ", value: " + values[j]);
					String change = "no";
					if(values[j] > valuesLast[j]) {
						change = "increase";
					}
					if(values[j] < valuesLast[j]){
						change = "decrease";
					}
					if (j > 0)
						outcomeBlder.append(",");
					outcomeBlder.append("{\"outcomeid\":\"" + outcomeIDs[j] + "\",\"value\":" + formatter.format((values[j])) + "}");
				}

				outcomeBlder.append("]}");
				outcomeMap.put(nodeName, outcomeBlder.toString());
				//Logger.info(nodeName + ": values " + outcomeBlder.toString());
			}

			count = 0;
			for (Map.Entry<String, String> entry : outcomeMap.entrySet()) {
				if (count > 0)
					strBlder.append(",");
				strBlder.append(entry.getValue());
				count++;
			}

			strBlder.append("]");
			/*
			//model name
			String modelPath = network.getName();
			String[]tokens = modelPath.split("/|\\\\");
			String modelName = tokens[tokens.length-1];
			modelName = modelName.substring(0,modelName.length()-5);
			strBlder.append(", [{\"modelname\":\"" + modelName +"\"}]");


			//raw data column names
			String csvFile = "public/raw-data/" + modelName + ".csv";

			BufferedReader br = null;
			String line = "";
			try {
				File csvFilePath = new File(csvFile);
				if( csvFilePath.exists() ) {
					br = new BufferedReader(new FileReader(csvFile));
					line = br.readLine();

					String[] columnNames = line.split(",");
					strBlder.append(", [{\"columnnames\":[");
					for (int i = 0; i < columnNames.length; i++) {
						if (i > 0) {
							strBlder.append(",");
						}
						strBlder.append("\"" + columnNames[i] + "\"");
					}
					strBlder.append("]}]");
				}
			}
			catch (FileNotFoundException e) {
				//e.printStackTrace();
			}
			catch (IOException e) {
				e.printStackTrace();
			} finally {
				if (br != null) {
					try {
						br.close();
					} catch (IOException e) {
						e.printStackTrace();
					}
				}
			}
			*/
		}
		catch(Exception e)
		{
			e.printStackTrace();
		}
		/*for (String nodeID : targetIdList){
			network.setTarget(nodeID, true);
		}*/
		strBlder.append("]");
		return strBlder.toString();
	}

	public boolean isAllUpperCase( String nodeName) {
		for(int i=0; i<nodeName.length(); i++) {
			if(Character.isLowerCase(nodeName.charAt(i))) {
				return false;
			}
		}
		return true;
	}
	public String setEvidence(String modelName, String nodeID, String outcomeID)
	{
		loadModel(modelName);
		network.setEvidence(nodeID, outcomeID);
		
		return getModelStr();
	}
	
	public String setVirtualEvidence(String modelName, String nodeID, double[] outcomeVals)
	{
		/*for( int i=0; i< outcomeVals.length; i++) {
			Logger.info("ModelReader, setVirtualEvidence:" + outcomeVals[i]);
		}*/
		loadModel(modelName);
		network.setVirtualEvidence(nodeID, outcomeVals);
		return getModelStr();
	}
	
	public String clearAllEvidence(String modelName)
	{
		loadModel(modelName);
		network.clearAllTargets();
		network.clearAllEvidence();
		//Logger.info("clearAllEvidence.");
		return getModelStr();
	}
	
	public String clearEvidence(String modelName, String nodeID)
	{
		loadModel(modelName);
		network.clearAllTargets();
		network.clearEvidence(nodeID);
		
		return getModelStr();
	}
	
	public String setAsTarget(String modelName, String nodeID)
	{
		loadModel(modelName);
		if( !hasEvidence(network) ){
			return "Error: Please set an evidence first.";
		}
		network.setTarget(nodeID, true);
		//Logger.info("set a target.");
		return getModelStr();
	}

	public boolean hasEvidence(Network network) {
		boolean hasEvidence = false;
		try {
			int[] nodes = network.getAllNodes();
			for (int i = 0; i < nodes.length; i++) {
				String nodeID = network.getNodeId(nodes[i]);
				if(network.isRealEvidence(nodeID) || network.isVirtualEvidence(nodeID)){
					hasEvidence = true;
					break;
				}
			}
		} catch(Exception e){
			e.printStackTrace();
		}
		return hasEvidence;
	}

	public String removeTarget(String modelName, String nodeID)
	{
		loadModel(modelName);
		network.setTarget(nodeID, false);

		return getModelStr();
	}
	
	public String clearAllTargets(String modelName)
	{
		loadModel(modelName);
		network.clearAllTargets();
		
		return getModelStr();
	}
	
	public String getCPT(String modelName, String nodeID)
	{
		loadModel(modelName);
		
		StringBuilder strBlder = new StringBuilder("{\"parents\":[");				
		String[] parentIDs = network.getParentIds(nodeID);
		for (int i=0; i<parentIDs.length; i++) {
			String parentName = network.getNodeName(parentIDs[i]);
			if (i > 0)
				strBlder.append(",");
			
			strBlder.append("{\"parentName\":\"" + parentName + "\",\"outcomeIDs\":[");
			String[] outcomeIDs  = network.getOutcomeIds(parentIDs[i]);
			
			for (int j=0; j<outcomeIDs.length; j++) {
				if (j > 0)
					strBlder.append(",");
				strBlder.append("\"" + outcomeIDs[j] + "\"");
			}
			
			strBlder.append("]}");
		}
		
		strBlder.append("],\"outcomeIDs\":[");
		
		String[] outcomeIDs = network.getOutcomeIds(nodeID);
		for (int i=0; i<outcomeIDs.length; i++) {
			if (i > 0)
				strBlder.append(",");
			strBlder.append("\"" + outcomeIDs[i] + "\"");
		}
		
		strBlder.append("],\"definition\":[");
		double[] definition = network.getNodeDefinition(nodeID);
		for (int i=0; i<definition.length; i++) {
			if (i > 0)
				strBlder.append(",");
			strBlder.append(definition[i]);
		}
		
		strBlder.append("]}");
		
		return strBlder.toString();
	}

	private void loadModel(String modelName)
	{
		if (network == null) {
			network = new Network();
			network.readFile(modelName);

			truncateNames();
			network.setName(modelName);
		}
	}

	private void uploadModel(String modelPath, String modelName)
	{
		if (network == null) {
			network = new Network();
			network.readFile(modelPath);

			truncateNames();
			network.setName(modelName);
		}
	}

	private void truncateNames() {
		int[] nodes = network.getAllNodes();
		int maxLength = 10;
		for (int i=0; i<nodes.length; i++) {
			int node = nodes[i];
			String nodeID = network.getNodeId(node);
			String nodeName = network.getNodeName(node);

			if (nodeName.length() > maxLength) {
				nodeName = nodeName.substring(0, maxLength);
			} else {
				nodeName = String.format("%-" + maxLength + "s", nodeName);
			}
			network.setNodeName(nodeID, nodeName);
		}
	}

}
