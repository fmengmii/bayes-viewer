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
	private DataSet dataSetExternal;
	//private DataSet dataSetInternal;
	private int foldNum = 10;
	private int foldingRandSeed = 2;
	private Map<Integer, double[]> networkLastMap = new HashMap();
	private Map<Integer, Boolean> networkTargetMap = new HashMap();

	private Map<String, Map<String, Integer>> dataSetStateMap = new HashMap();
	private Map<String, Map<String, Integer>> dataSetExternalStateMap = new HashMap();

	private Map<String, String> nodeAccuracyMap = new HashMap<String, String>();
	private Map<String, String> internalValidationNodeAccuracyMap = new HashMap<String, String>();
	private Map<String, String> externalValidationNodeAccuracyMap = new HashMap<String, String>();
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
	public DataSet getDataSetExternal() { return dataSetExternal;}

	public void setNetwork(Object network)
	{
		this.network = (Network) network;
	}

	public void setDataSet ( DataSet dataSet ) {
		this.dataSet = dataSet;
	}

	public void setDataSetExternal ( DataSet dataSetExternal) {
		this.dataSetExternal = dataSetExternal;
	}

	public void setDataSetStateMap( Map<String, Map<String, Integer>> dataSetStateMap ) {
		this.dataSetStateMap = dataSetStateMap;
	}

	public void setDataSetExternalStateMap( Map<String, Map<String, Integer>> dataSetStateMap ) {
		this.dataSetExternalStateMap = dataSetStateMap;
	}

	public Map<String, Map<String, Integer>> getDataSetStateMap() { return dataSetStateMap; }

	public Map<String, Map<String, Integer>> getDataSetExternalStateMap() {
		return dataSetExternalStateMap;
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
		NumberFormat formatter = new DecimalFormat("#0.00");
		StringBuilder strBlder = new StringBuilder("[");

		if( dataSet != null ) {
			nodeAccuracyMap = getValidationMap( dataSet, dataSetStateMap );
		}

		if( dataSetExternal != null) {
			internalValidationNodeAccuracyMap = getValidationMap(
					dataSetExternal, dataSetExternalStateMap );
			try{
				int numDataSetColumn = dataSetExternal.getVariableCount();
				double allNodeAccuracy = 0;
				int numNodes = network.getNodeCount();
				for(int col = 0; col < numDataSetColumn; col++) {
					//get name of current column in the data set
					String curNodeId = dataSetExternal.getVariableId(col);
					String[] curNodeStateNameArray = dataSetExternal.getStateNames(col);

					int totalCorrectPredictiveCase = 0;

					for( int row=0; row < dataSetExternal.getRecordCount() ; row++ ) {
						network.clearAllEvidence();
						int realStateSeqNum = dataSetExternal.getInt(col, row);
						for (int i = 0; i < dataSetExternal.getVariableCount(); i++) {
							if( i != col ) {
								int stateSeqNum = dataSetExternal.getInt( i, row);
								String stateLabel = "State" + stateSeqNum;
								network.setEvidence(dataSetExternal.getVariableId(i), stateLabel);
							}
						}
						recordNetworkTarget();
						network.updateBeliefs();
						recoverNetworkTarget();
						int[] nodes = network.getAllNodes();
						for (int i=0; i<nodes.length; i++) {
							int node = nodes[i];
							String nodeID = network.getNodeId(node);
							if( nodeID.equals(curNodeId) ) {
								double[] values = network.getNodeValue(nodes[i]);
								double max = values[0];
								int maxIndex = 0;
								for( int count = 1; count < values.length; count++ ) {
									if( values[count] > max ) {
										max = values[count];
										maxIndex = count;
									}
								}
								String maxStateLabel = "State" + maxIndex;
								if( curNodeStateNameArray[realStateSeqNum].equals(maxStateLabel) ) {
									totalCorrectPredictiveCase++;
								}
							}
						}
					}
					double nodeAcc = (double) totalCorrectPredictiveCase / dataSetExternal.getRecordCount();
					String externalValidationProb = formatter.format(nodeAcc);
					externalValidationNodeAccuracyMap.put(curNodeId, externalValidationProb);
				}
				double totalExternalValidation = allNodeAccuracy / numNodes;
				String totalExternalValidationProb =  formatter.format(totalExternalValidation);
				externalValidationNodeAccuracyMap.put("total", totalExternalValidationProb);
				network.clearAllEvidence();
			} catch(Exception ex ){
				Logger.error("external validation exception=" + ex.toString());
			}
		}

		try {
			recordNetworkTarget();
			network.clearAllTargets();
			network.updateBeliefs();
			recoverNetworkTarget();

			List<int[]> edgeList = new ArrayList<int[]>();
			boolean accuracyExist = false;

			if( nodeAccuracyMap.size() > 0 ) {
				strBlder.append("{\"allNodeAcc\":\"" + nodeAccuracyMap.get("total") + "\"");
				accuracyExist = true;
			}
			if( internalValidationNodeAccuracyMap.size() > 0 ) {
				if( nodeAccuracyMap.size() > 0 ) {
					strBlder.append(",");
				} else {
					strBlder.append("{");
				}
				strBlder.append("\"allNodeAccInternal\":\"" + externalValidationNodeAccuracyMap.get("total") + "\"");
				accuracyExist = true;
			}
			if( externalValidationNodeAccuracyMap.size() > 0 ) {
				if( nodeAccuracyMap.size() > 0  || internalValidationNodeAccuracyMap.size() > 0 ) {
					strBlder.append(",");
				} else {
					strBlder.append("{");
				}
				strBlder.append("\"allNodeAccExternal\":\"" + externalValidationNodeAccuracyMap.get("total") + "\"");
				accuracyExist = true;
			}
			if(accuracyExist) {
				strBlder.append(",\"nodes\":[");
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
						"\"name\":\"" + nodeName + "\"," );

				strBlder.append("\"nameLabel\":\"" + nodeName );
				if( nodeAccuracyMap.size() > 0 ||
						internalValidationNodeAccuracyMap.size() > 0 ||
						externalValidationNodeAccuracyMap.size() > 0 ) {

					strBlder.append("(");
					if( nodeAccuracyMap.size() > 0 ) {
						strBlder.append("O:" + nodeAccuracyMap.get(nodeID));
						//Logger.info("O append...");
					}

					if( internalValidationNodeAccuracyMap.size() > 0 ) {
						if( nodeAccuracyMap.size() > 0 ) {
							strBlder.append(", ");
						}
						strBlder.append("I:" + internalValidationNodeAccuracyMap.get(nodeID));
					}

					if( externalValidationNodeAccuracyMap.size() > 0 ) {
						if( nodeAccuracyMap.size() > 0 || internalValidationNodeAccuracyMap.size() > 0 ) {
							strBlder.append(", ");
						}
						strBlder.append("E:" + externalValidationNodeAccuracyMap.get(nodeID));
					}
					strBlder.append(")");
				}
				strBlder.append("\"}, \"position\":{\"x\":" + rect.x + ", \"y\":" + rect.y + "}}");

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
				outcomeBlder.append("\"isTarget\":\"" + network.isTarget(nodeID) + "\", ");

				String[] outcomeIDs = network.getOutcomeIds(nodes[i]);
				double[] valuesLast = networkLastMap.get(nodes[i]);

				//adding virtualEvidenceValue
				if( network.isVirtualEvidence(nodeID) ) {
					outcomeBlder.append("\"values\":[");
					double[] virtualEvidenceValues = network.getVirtualEvidence(nodes[i]);

					for (int j = 0; j < outcomeIDs.length; j++) {
						String change = "no";
						if( valuesLast != null ){
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
				} else {
					outcomeBlder.append("\"values\":[");
					double[] values = network.getNodeValue(nodes[i]);
					for (int j = 0; j < outcomeIDs.length; j++) {
						String change = "no";
						if (valuesLast != null) {
							if( Double.valueOf(formatter.format(values[j])) >
									Double.valueOf(formatter.format(valuesLast[j])) ) {
								change = "increase";
							} else if ( Double.valueOf(formatter.format(values[j])) <
									Double.valueOf(formatter.format(valuesLast[j])) ) {
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
			}

			count = 0;
			for (Map.Entry<String, String> entry : outcomeMap.entrySet()) {
				if (count > 0)
					strBlder.append(",");
				strBlder.append(entry.getValue());
				count++;
			}

			strBlder.append("]");
		}
		catch(Exception e) {
			recoverNetworkTarget();
			String message = e.toString();
			if( message.contains("Logged information:") ) {
				String[] infoArray = message.split("Logged information:");
				message = infoArray[1];
			}
			return "Error:" + message + " Please try to change another inference algorithm."; // value is not valid.
		}
		strBlder.append("]");
		return strBlder.toString();
	}

	private Map<String, String> getValidationMap (DataSet dataSet,
												  Map<String, Map<String, Integer>> dataSetStateMap) {

		Map<String, String> validationNodeAccuracyMap = new HashMap<String, String>();
		try {
			recordNetworkTarget();
			ArrayList<DataMatch> tempMatching = new ArrayList<DataMatch>();
			int numDataSetColumn = dataSet.getVariableCount();
			int numNodes = network.getNodeCount();
			for (int col = 0; col < numDataSetColumn; col++) {
				//get name of current column in the data set
				String colName = dataSet.getVariableId(col);
				String curNodeName = colName;
				int curSlice = 0;

				if (Arrays.asList(network.getAllNodeIds()).contains(curNodeName)) {
					int nodeNum = network.getNode(curNodeName);
					tempMatching.add(new DataMatch(col, nodeNum, curSlice)); //associate: column, node, slice
				} else {
					Logger.info("No node found for columnname: " + colName);
				}
			}
			//Convert dataMatch array
			DataMatch[] matches = tempMatching.toArray(new DataMatch[tempMatching.size()]);
			/*EM em = new EM();
			em.setEqSampleSize(dataSet.getRecordCount());
			em.setRandomizeParameters(false);
			em.setUniformizeParameters(true);
			*/
			//Validator validator = new Validator(network, dataSet, matches);
			int[] nodes = network.getAllNodes();
			for (int i = 0; i < nodes.length; i++) {
				int node = nodes[i];
				String nodeID = network.getNodeId(node);
				Validator validator = new Validator(network, dataSet, matches);
				validator.addClassNode(nodeID);
				EM em = new EM();
				//em.setEqSampleSize(dataSet.getRecordCount());
				//em.setEqSampleSize(347);
				em.setEqSampleSize(1);
				//em.setEqSampleSize(0);
				em.setRandomizeParameters(false);
				//em.setSeed(2);
				em.setUniformizeParameters(true);

				validator.kFold(em, foldNum, foldingRandSeed);  //10 is K-foldCount

				int totalCorrectCaseNum = 0;
				int totalRecord = dataSet.getRecordCount();
				String[] outcomeIDs = network.getOutcomeIds(nodes[i]);

				for (int j = 0; j < outcomeIDs.length; j++) {
					double accuracy = validator.getAccuracy(nodeID, outcomeIDs[j]);
					//Logger.info("internalValidation for nodeId="+ nodeID +
					//		", state=" + outcomeIDs[j]+", accuracy="+accuracy);

					Map<String, Integer> stateCountMap = dataSetStateMap.get(nodeID);
					if(stateCountMap.get(outcomeIDs[j]) != null && !Double.isNaN(accuracy)) {
						int stateCount = stateCountMap.get(outcomeIDs[j]);
						//Logger.info("stateCount=" + stateCount);
						totalCorrectCaseNum += accuracy * stateCount;
					}
					/*if( i == 1) {
						Logger.info("totalCorrectCaseNum for state=" + outcomeIDs[j] + " is " + totalCorrectCaseNum);
					}*/
				}
				double nodeAccuracy = (double)totalCorrectCaseNum / (double)totalRecord;
				//Logger.info("nodeAccuracy=" + nodeAccuracy );
				DecimalFormat numberFormat = new DecimalFormat("0.00");
				String nodeAccuracyFormat = numberFormat.format(nodeAccuracy).toString();
				validationNodeAccuracyMap.put(nodeID, nodeAccuracyFormat);
				DataSet resultDataSet = validator.getResultDataSet();
				if( i == 1 && totalRecord == 103 ) {
					File tmpFile = new File("/tmp/validationResultDataSetNewTest");
					if( !tmpFile.exists() ) {
						tmpFile.createNewFile();
					}
					resultDataSet.writeFile(tmpFile.getAbsolutePath());
				}
			}
		} catch (Exception ex) {
			Logger.info("cross validation matches exception is " + ex.toString());
		}
		return validationNodeAccuracyMap;
	}

	public boolean isAllUpperCase( String nodeName) {
		for(int i=0; i<nodeName.length(); i++) {
			if(Character.isLowerCase(nodeName.charAt(i))) {
				return false;
			}
		}
		return true;
	}

	public String setEvidence(String nodeID, String outcomeID)
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
