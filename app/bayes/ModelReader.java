package bayes;

import java.awt.Rectangle;
import java.io.*;
import java.lang.reflect.Field;
import java.text.*;
import java.util.*;

import com.google.gson.Gson;

import play.Logger;
import play.api.libs.json.Json;
import smile.*;
import smile.learning.*;

public class ModelReader
{
	private Network network;
	private DataSet dataSet;

	private Map<Integer, double[]> networkLastMap = new HashMap();
	private Map<Integer, Boolean> networkTargetMap = new HashMap();

	private Map<String, int[]> dataSetStateMap = new HashMap();

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

	public DataSet getDataSet() { return dataSet; }

	public void setNetwork(Object network)
	{
		this.network = (Network) network;
	}

	public void setDataSet ( Object dataSet) {
		this.dataSet = (DataSet) dataSet; }

	public void setDataSetStateMap( Map<String, int[]> dataSetStateMap ) {
		this.dataSetStateMap = dataSetStateMap;
	}

	public Map<String, int[]> getDataSetStateMap() { return dataSetStateMap; }

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

	public String readModelFromFileContent ( String modelFullName,
											 String modelXdslContent,
											 String algorithm ) {
		int algorithmType = 0;
		try {
			Field field = Network.BayesianAlgorithmType.class.getDeclaredField(algorithm);
			Object object = field.get(Network.BayesianAlgorithmType.class);
			algorithmType = field.getInt(object);
		} catch ( Exception ex ) {
			Logger.info("get algorithm type error:" + ex.toString());
		}

		network = new Network();
		network.readString( modelXdslContent );
		network.setName(modelFullName);
		network.setBayesianAlgorithm(algorithmType);

		return getModelStr();
	}

	public void modifyNetworkLast(){
		try{
			int[] nodes = network.getAllNodes();

			for (int i=0; i<nodes.length; i++) {
				//int node = nodes[i];
				//String nodeID = network.getNodeId(node);
				//String nodeName = network.getNodeName(node);
				double[] values = network.getNodeValue(nodes[i]);
				networkLastMap.put(nodes[i], values);
			}
		}catch(Exception e) {
			e.printStackTrace();
		}
	}

	public void recordNetworkTarget(){
		try{
			int[] nodes = network.getAllNodes();

			for (int i=0; i<nodes.length; i++) {
				//int node = nodes[i];
				String nodeID = network.getNodeId(nodes[i]);
				//String nodeID = network.getNodeId(node);
				//String nodeName = network.getNodeName(node);
				networkTargetMap.put(nodes[i], network.isTarget(nodeID));
			}
		}catch(Exception e) {
			e.printStackTrace();
		}
	}

	public void recoverNetworkTarget(){
		try{
			int[] nodes = network.getAllNodes();

			for (int i=0; i<nodes.length; i++) {
				String nodeID = network.getNodeId(nodes[i]);
				if( networkTargetMap.get(nodes[i]) ) {
					//Logger.info(nodeID + " " + networkTargetMap.get(nodes[i]));
					network.setTarget(nodeID, true);
				}
			}
		}catch(Exception e) {
			e.printStackTrace();
		}
	}

	public String getModelStr()
	{
		//Logger.info("before getModelStr().");
		NumberFormat formatter = new DecimalFormat("#0.00");
		
		//System.out.println("read!");
		StringBuilder strBlder = new StringBuilder("[");
		//List<String> targetIdList = new ArrayList<String>();
		//Logger.info("ModelReader getModelStr...");
		//Logger.info("dataSet=" + dataSet);
		//Logger.info("network=" + network);
		Map<String, String> nodeAccuracyMap = new HashMap<String, String>();

		if( dataSet != null ) {
			try {
				//DataMatch[] matches = dataSet.matchNetwork(network);
				ArrayList<DataMatch> tempMatching = new ArrayList<DataMatch>();
				/*Logger.info("matches size=" + matches.length);
				Logger.info("matches0 info=" + matches[0].column + "," + matches[0].node + ", " + matches[0].slice);
				Logger.info("dataSet info=" + dataSet.getRecordCount());
				Logger.info("dataSet first record " + dataSet.getInt(0, 0) +
						", " + dataSet.getInt(1,0) + ", " + dataSet.getInt(2,0) +
						", " + dataSet.getInt(3, 0));
				*/
				int numDataSetColumn = dataSet.getVariableCount();
				int numNodes = network.getNodeCount();
				for(int col = 0; col < numDataSetColumn; col++) {
					//get name of current column in the data set
					String colName = dataSet.getVariableId(col);
					//separate string in name and slice
					//String[] nameSlice = colName.split("_");
					//String curNodeName = nameSlice[0];
					String curNodeName = colName;
					int curSlice = 0;
					/*
					if( nameSlice.length == 2 ){
						curSlice = Integer.parseInt(nameSlice[1]);
					}*/

					if(Arrays.asList(network.getAllNodeIds()).contains(curNodeName)) {
						int nodeNum = network.getNode(curNodeName);
						//Logger.info("Match -> colName " + colName + ", nodeName:" + curNodeName + ", slice: " + curSlice + ",NodeNum=" + nodeNum);
						tempMatching.add(new DataMatch(col, nodeNum, curSlice)); //associate: column, node, slice
					} else {
						Logger.info("No node found for columnname: " + colName);
					}

					/*else{
						curSlice = 0;
					}*/
				}
				//Convert dataMatch array
				DataMatch[] matches = tempMatching.toArray(new DataMatch[tempMatching.size()]);
				EM em = new EM();
				em.setEqSampleSize(dataSet.getRecordCount());
				em.setRandomizeParameters(false);
				em.setUniformizeParameters(true);
				//em.setSeed(2);
				//em.learn( dataSet, network, matches);
				//network.writeFile("/tmp/testAfterLearn.xdsl");

				Validator validator = new Validator(network, dataSet, matches);
				int[] nodes = network.getAllNodes();
				for (int i=0; i<nodes.length; i++) {
					int node = nodes[i];
					String nodeID = network.getNodeId(node);
					validator.addClassNode(nodeID);
				}
				//validator.test();
				//validator.leaveOneOut(em);
				validator.kFold( em, 10 );  //10 is K-foldCount
				//Logger.info("EM getLastScore=" + em.getLastScore() );
				//Logger.info("EM getEqSampleSize=" + em.getEqSampleSize());
				int totalCorrectCaseNum = 0;
				int totalRecordNum = 0;
				for (int i=0; i<nodes.length; i++) {
					int node = nodes[i];
					String[] outcomeIDs = network.getOutcomeIds(nodes[i]);

					String nodeID = network.getNodeId(node);
					for (int j = 0; j < outcomeIDs.length; j++) {
						double accuracy = validator.getAccuracy(nodeID, outcomeIDs[j]);
						if( Math.abs(accuracy - 1.0) <= 0.00001 ) {
							int state;
							if (outcomeIDs[j].startsWith("State") ||
									outcomeIDs[j].startsWith("state")) {
								state = Integer.parseInt(outcomeIDs[j].substring(5));
							} else {
								state = Integer.parseInt(outcomeIDs[j]);
							}
							int[] stateArray = dataSetStateMap.get(nodeID);
							int stateCount = stateArray[state];
							totalCorrectCaseNum += stateCount;
							int totalRecord = dataSet.getRecordCount();
							totalRecordNum += totalRecord;
							double nodeAccuracy = (double)stateCount / (double)totalRecord;
							DecimalFormat numberFormat = new DecimalFormat("0.00");
							String nodeAccuracyFormat = numberFormat.format(nodeAccuracy).toString();
							nodeAccuracyMap.put(nodeID, nodeAccuracyFormat);
						}
					}
				}
				if( totalRecordNum != 0 ) {
					double allNodeAccuracy = (double) totalCorrectCaseNum / (double) totalRecordNum;
					DecimalFormat numberFormat = new DecimalFormat("0.00");
					String allNodeAccuracyFormat = numberFormat.format(allNodeAccuracy).toString();
					nodeAccuracyMap.put("total", allNodeAccuracyFormat);
				}
			} catch( Exception ex ) {
				Logger.info("matches return=" + ex.toString());
			}
		} else {
			//Logger.info("dataSet is null.");
		}

		try {
			//System.out.println(System.getProperty("java.library.path"));
			//System.out.println(network.getName());
			//network.clearAllTargets();

			//get original value before updating beliefs
			//Network networkLast = network;
			recordNetworkTarget();
			network.clearAllTargets();
			network.updateBeliefs();
			recoverNetworkTarget();

			//nodes
			//strBlder.append("{\"nodes\":[");
			List<int[]> edgeList = new ArrayList<int[]>();
			if( nodeAccuracyMap.size() > 0 ) {
				strBlder.append("{\"allNodeAcc\":\"" + nodeAccuracyMap.get("total") + "\",");
				//Logger.info("strBlder="+ strBlder);
				strBlder.append("\"nodes\":[");
			} else {
				strBlder.append("{\"nodes\":[");
			}
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

				strBlder.append("{\"data\":{\"id\":\"" + nodeID + "\"," +
						"\"acc\":\"" + nodeAccuracyMap.get(nodeID) + "\"," +
						"\"name\":\"" + nodeName + "\"," +
						"\"nameLabel\":\"" + nodeName + "(" + nodeAccuracyMap.get(nodeID) + ")" + "\"}, \"position\":{\"x\":" +
						rect.x + ", \"y\":" + rect.y + "}}");

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
				double[] valuesLast = networkLastMap.get(nodes[i]);


				//adding virtualEvidenceValue
				if( network.isVirtualEvidence(nodeID) ) {
					outcomeBlder.append("\"values\":[");
					double[] virtualEvidenceValues = network.getVirtualEvidence(nodes[i]);

					//double[] values = network.getNodeValue(nodes[i]);

					for (int j = 0; j < outcomeIDs.length; j++) {
						//System.out.println("virtualEvidence value: " + virtualEvidenceValues[j]);
						String change = "no";
						if( valuesLast != null ){
							//Logger.info("nodeName:" + nodeName + " j=" + j + ", old value=" +valuesLast[j] + " and new value=" +  values[j]);
							if(virtualEvidenceValues[j] > valuesLast[j]) {
								change = "increase";
							}
							if(virtualEvidenceValues[j] < valuesLast[j]){
								change = "decrease";
							}
						}
						if (j > 0)
							outcomeBlder.append(",");
						outcomeBlder.append("{\"outcomeid\":\"" + outcomeIDs[j] + "\", " +
							"\"change\":\"" + change + "\", " +
							"\"value\":" + formatter.format((virtualEvidenceValues[j])) + "}");
					}

					//outcomeBlder.append("], ");
				} else {
					outcomeBlder.append("\"values\":[");
					double[] values = network.getNodeValue(nodes[i]);
					for (int j = 0; j < outcomeIDs.length; j++) {
						//System.out.println("outcome: " + outcomeIDs[j] + ", value: " + values[j]);
						String change = "no";
						if (valuesLast != null) {
							//Logger.info("nodeName:" + nodeName + " j=" + j + ", old value=" +valuesLast[j] + " and new value=" +  values[j]);
							//if (values[j] > valuesLast[j]) {
							if( Double.valueOf(formatter.format(values[j])) >
									Double.valueOf(formatter.format(valuesLast[j])) ) {
								change = "increase";
							} else if ( Double.valueOf(formatter.format(values[j])) <
									Double.valueOf(formatter.format(valuesLast[j])) ) {
							//if (values[j] < valuesLast[j]) {
								change = "decrease";
							}
						}
						if (j > 0)
							outcomeBlder.append(",");
						outcomeBlder.append("{\"outcomeid\":\"" + outcomeIDs[j] + "\", " +
								"\"change\":\"" + change + "\", " +
								"\"value\":" + formatter.format((values[j])) + "}");
					}
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
		catch(Exception e) {
			recoverNetworkTarget();
			String message = e.toString();
			if( message.contains("Logged information:") ) {
				String[] infoArray = message.split("Logged information:");
				message = infoArray[1];
			}
			//e.printStackTrace();
			return "Error:" + message + " Please try to change another inference algorithm."; // value is not valid.
		}
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
		//loadModel(modelName);
		modifyNetworkLast();
		network.setEvidence(nodeID, outcomeID);
		return getModelStr();
	}
	
	public String setVirtualEvidence(String modelName, String nodeID, double[] outcomeVals)
	{
		/*for( int i=0; i< outcomeVals.length; i++) {
			Logger.info("ModelReader, setVirtualEvidence:" + outcomeVals[i]);
		}*/
		//loadModel(modelName);
		modifyNetworkLast();
		network.setVirtualEvidence(nodeID, outcomeVals);
		return getModelStr();
	}
	
	public String clearAllEvidence(String modelName)
	{
		//loadModel(modelName);
		modifyNetworkLast();
		//network.clearAllTargets();
		network.clearAllEvidence();
		//Logger.info("clearAllEvidence.");
		return getModelStr();
	}
	
	public String clearEvidence(String modelName, String nodeID)
	{
		//loadModel(modelName);
		modifyNetworkLast();
		//network.clearAllTargets();
		network.clearEvidence(nodeID);
		return getModelStr();
	}
	
	public String setAsTarget(String modelName, String nodeID)
	{
		//loadModel(modelName);
		/*if( !hasEvidence(network) ){
			return "Error: Please set an evidence first.";
		}*/
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
		//loadModel(modelName);
		network.setTarget(nodeID, false);

		return getModelStr();
	}
	
	public String clearAllTargets(String modelName)
	{
		//loadModel(modelName);
		network.clearAllTargets();
		
		return getModelStr();
	}
	
	public String getCPT(String modelName, String nodeID)
	{
		//loadModel(modelName);
		
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
			Logger.info("starting loadModel...");
			network = new Network();
			network.readFile(modelName);

			truncateNames();
			network.setName(modelName);
		}
	}

	private void uploadModel(String modelPath, String modelName)
	{
		if (network == null) {
			Logger.info("starting uploadModel...");
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
