package bayes;

import java.awt.*;
import java.io.*;
import java.lang.reflect.Field;
import java.text.*;
import java.util.*;
import java.util.List;

import com.google.gson.Gson;

import play.Logger;
import play.api.libs.json.Json;
import smile.*;
import smile.learning.*;

public class ModelReader
{
	private Network network;
	private DataSet dataSetForRawData;
	private DataSet dataSetForTestData;
	private int foldNum = 10;
	private int foldingRandSeed = 2;
	private Map<Integer, double[]> networkLastMap = new HashMap();
	private Map<Integer, Boolean> networkTargetMap = new HashMap();

	private Map<String, Map<String, Integer>> dataSetStateMapForRawData = new HashMap();
	private Map<String, Map<String, Integer>> dataSetStateMapForTestData = new HashMap();

	private Map<String, String> originalNodeAccuracyMap = new HashMap<String, String>();
	private Map<String, String> testNodeAccuracyMap = new HashMap<String, String>();
	private String[][] validationResultArrayForRawData = null;
	private String[][] validationResultArrayForTestData = null;

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

	public DataSet getDataSetForRawData() { return dataSetForRawData; }
	public DataSet getDataSetForTestData() { return dataSetForTestData;}

	public void setFoldNum( int num ){
		this.foldNum = num;
	}

	public void setNetwork(Object network)
	{
		this.network = (Network) network;
	}

	public void setDataSetForRawData ( DataSet dataSet ) {
		this.dataSetForRawData = dataSet;
	}

	public void setDataSetForTestData ( DataSet dataSet) {
		this.dataSetForTestData = dataSet;
	}

	public void setDataSetStateMapForRawData( Map<String, Map<String, Integer>> dataSetStateMap ) {
		this.dataSetStateMapForRawData = dataSetStateMap;
	}

	public void setDataSetStateMapForTestData( Map<String, Map<String, Integer>> dataSetStateMap ) {
		this.dataSetStateMapForTestData = dataSetStateMap;
	}

	public Map<String, Map<String, Integer>> getDataSetStateMapForRawData() { return dataSetStateMapForRawData; }

	public Map<String, Map<String, Integer>> getDataSetStateMapForTestData() {
		return dataSetStateMapForTestData;
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

	private String resultArrayToCsvString ( String[][] resultArray ) {
		String resultString = "";
		//Logger.info("resultArray i length=" + resultArray.length);
		//Logger.info("resultArray j length=" + resultArray[0].length);
		for( int i = 0; i < resultArray.length; i++) {
		//for( int i = 0; i < 4; i++) {
			for( int j = 0; j < resultArray[i].length; j++) {
				resultString += resultArray[i][j];
				if( j < resultArray[i].length - 1 ) {
					resultString += "$";
				}
			}
			if( i < resultArray.length - 1) {
			//if( i < 4 -1 ) {
				resultString += "@";
			}
		}
		//Logger.info("resultString=" + resultString);
		return resultString;
	}

	public String getModelStr() {
		NumberFormat formatter = new DecimalFormat("#0.00");
		StringBuilder strBlder = new StringBuilder("[");

		if( dataSetForRawData != null ) {
			originalNodeAccuracyMap = getValidationMap( dataSetForRawData,
					dataSetStateMapForRawData, false );
		}

		if( dataSetForTestData != null) {
			testNodeAccuracyMap = getValidationMap(
					dataSetForTestData, dataSetStateMapForTestData, true );
		}

		try {
			recordNetworkTarget();
			network.clearAllTargets();
			network.updateBeliefs();
			recoverNetworkTarget();

			List<int[]> edgeList = new ArrayList<int[]>();
			boolean accuracyExist = false;

			if( originalNodeAccuracyMap.size() > 0 ) {
				strBlder.append("{\"originalNodeAcc\":\"true\"");
				accuracyExist = true;
				if (validationResultArrayForRawData != null &&
						validationResultArrayForRawData.length > 0) {

					String rawDataValidationResultString =
						resultArrayToCsvString(validationResultArrayForRawData);

					//strBlder.append(",\"rawDataValidationResult\":" +
					//	rawDataValidationResultString );
					//String test = "result,comma";
					strBlder.append(",\"rawDataValidationResult\":\"" + rawDataValidationResultString + "\"");
					//strBlder.append(",\"rawDataValidationResult\":\"" + "myResult&#13;" + "\"");
				}
			}

			if( testNodeAccuracyMap.size() > 0 ) {
				if( originalNodeAccuracyMap.size() > 0 ) {
					strBlder.append(",");
				} else {
					strBlder.append("{");
				}
				strBlder.append("\"testNodeAcc\":\"true\"");
				accuracyExist = true;
				if (validationResultArrayForTestData != null &&
						validationResultArrayForTestData.length > 0) {

					String testDataValidationResultString =
						resultArrayToCsvString(validationResultArrayForTestData);

					strBlder.append(",\"testDataValidationResult\":\"" +
						testDataValidationResultString + "\"");
				}
			}

			if(accuracyExist) {
				strBlder.append(",\"nodes\":[");
			}
			else {
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
				if( originalNodeAccuracyMap.size() > 0 || testNodeAccuracyMap.size() > 0 ) {
					strBlder.append("(");
					if( originalNodeAccuracyMap.size() > 0 ) {
						strBlder.append("IO:" + originalNodeAccuracyMap.get("internal" + nodeID));
						strBlder.append(", ");
						strBlder.append("EO:" + originalNodeAccuracyMap.get("external" + nodeID));
					}
					if( testNodeAccuracyMap.size() > 0 ) {
						if( originalNodeAccuracyMap.size() > 0 ) {
							strBlder.append(", ");
						}
						strBlder.append("IT:" + testNodeAccuracyMap.get("internal" + nodeID));
						strBlder.append(", ");
						strBlder.append("ET:" + testNodeAccuracyMap.get("external" + nodeID));
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
				/*boolean isSearch = false;
				if( network.getNodeBgColor(nodeID) == java.awt.Color.PINK ) {
					isSearch = true;
				}*/
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
		} catch (Exception e) {
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
												  Map<String, Map<String, Integer>> dataSetStateMap,
												  boolean isTestData) {

		Map<String, String> validationNodeAccuracyMap = new HashMap<String, String>();
		int numDataSetColumn = dataSet.getVariableCount();
		int totalRecord = dataSet.getRecordCount();
		DecimalFormat numberFormat = new DecimalFormat("0.00");
		String[][] validationResultArray = new String[totalRecord+2][numDataSetColumn*3];

		try {
			recordNetworkTarget();
			ArrayList<DataMatch> tempMatching = new ArrayList<DataMatch>();

			for (int col = 0; col < numDataSetColumn; col++) {
				//get name of current column in the data set
				String colName = dataSet.getVariableId(col);

				validationResultArray[0][col] = colName;
				validationResultArray[0][numDataSetColumn+col] = colName +"_internal_predicted";
				validationResultArray[0][numDataSetColumn*2+col] = colName +"_external_predicted";

				String[] stateNameArray = dataSet.getStateNames(col);

				for( int row=0; row < totalRecord; row++ ) {
					int stateSeqNum = dataSet.getInt(col, row);
					String stateLabel = stateNameArray[stateSeqNum];
					validationResultArray[row+1][col] = stateLabel;
				}
				validationResultArray[totalRecord+1][col] = "";

				String curNodeName = colName;
				int curSlice = 0;

				if (Arrays.asList(network.getAllNodeIds()).contains(curNodeName)) {
					int nodeNum = network.getNode(curNodeName);
					tempMatching.add(new DataMatch(col, nodeNum, curSlice)); //associate: column, node, slice
				} else {
					Logger.info("getValidationMap: No node found for columnname: " + colName);
				}
			}

			//Convert dataMatch array
			DataMatch[] matches = tempMatching.toArray(new DataMatch[tempMatching.size()]);
			int[] nodes = network.getAllNodes();
			for (int i = 0; i < nodes.length; i++) {
				int node = nodes[i];
				String nodeID = network.getNodeId(node);
				String nodeName = network.getNodeName(node);

				Validator validator = new Validator(network, dataSet, matches);
				validator.addClassNode(nodeID);
				EM em = new EM();
				em.setEqSampleSize(1);  //same as confidence in GeNIe
				em.setRandomizeParameters(false);
				em.setUniformizeParameters(true);

				validator.kFold(em, foldNum, foldingRandSeed);  //10 is K-foldCount

				int totalCorrectCaseNum = 0;
				String stateAccSummary = "";
				String[] outcomeIDs = network.getOutcomeIds(nodes[i]);
				String[] curNodeStateNameArray = dataSet.getStateNames(i);
				String[] totalStateNameArray = new String[outcomeIDs.length];

				if( totalStateNameArray.length != curNodeStateNameArray.length) {
					System.arraycopy(curNodeStateNameArray, 0,
							totalStateNameArray, 0, curNodeStateNameArray.length);
					int stateIndex = curNodeStateNameArray.length;
					for (int m = 0; m < outcomeIDs.length; m++) {
						String state = outcomeIDs[m];
						List<String> totalStateList =
								Arrays.asList(totalStateNameArray);
						if (!totalStateList.contains(state)) {
							totalStateNameArray[stateIndex] = state;
							stateIndex++;
						}
					}
				} else {
					totalStateNameArray = curNodeStateNameArray;
				}

				//deal with missed state by finding index corresponding to the state
				Map<String, Integer> stateToIndexMap = new HashMap<String, Integer>();
				for( int m=0; m<totalStateNameArray.length; m++ ){
					stateToIndexMap.put(totalStateNameArray[m], m);
				}
				for (int j = 0; j < outcomeIDs.length; j++) {
					String outcomeIdLabel = outcomeIDs[j];
					int index = stateToIndexMap.get(outcomeIdLabel);
					String networkStateLabel = outcomeIDs[index];

					double accuracy = validator.getAccuracy(nodeID,  networkStateLabel); //real state label
					Map<String, Integer> stateCountMap = dataSetStateMap.get(nodeID);

					if (stateCountMap.get(outcomeIdLabel) != null) {
						int stateCount = stateCountMap.get(outcomeIdLabel);
						int correctCaseNum = (int) (accuracy * stateCount);

						totalCorrectCaseNum += correctCaseNum;
						stateAccSummary += outcomeIdLabel + " = " +
								numberFormat.format(accuracy).toString();
						stateAccSummary += " (" + correctCaseNum + "/" + stateCount + ")  ";
					} else {
						stateAccSummary += outcomeIdLabel + " = -nan(ind)";
						stateAccSummary += " (0/0)  ";
					}
				}
				/*
				//The following output is not sequential for state
				for (int j = 0; j < outcomeIDs.length; j++) {
					double accuracy = validator.getAccuracy(nodeID, outcomeIDs[j]); //real state label
					Map<String, Integer> stateCountMap = dataSetStateMap.get(nodeID);
					//String outcomeIdLabel = outcomeIDs[j];
					String outcomeIdLabel = totalStateNameArray[j];
					if(stateCountMap.get(outcomeIdLabel) != null ) {
						int stateCount = stateCountMap.get(outcomeIdLabel);
						int correctCaseNum = (int)(accuracy * stateCount);

						totalCorrectCaseNum += correctCaseNum;
						stateAccSummary += outcomeIdLabel + " = " +
							numberFormat.format(accuracy).toString();
						stateAccSummary += " (" + correctCaseNum + "/" + stateCount + ")  ";
					} else {
						stateAccSummary += outcomeIdLabel + " = -nan(ind)";
						stateAccSummary += " (0/0)  ";
					}
				}*/

				double nodeAccuracy = (double)totalCorrectCaseNum / (double)totalRecord;

				String nodeAccuracyFormat = numberFormat.format(nodeAccuracy).toString();
				String internalValidationNodeID = "internal" + nodeID;
				validationNodeAccuracyMap.put(internalValidationNodeID, nodeAccuracyFormat);

				DataSet resultDataSet = validator.getResultDataSet();

				for( int row=0; row < totalRecord ; row++ ) {
					//validationResultArray[row+1][col] = dataSet.getInt(row, col);
					int stateSeqNum = resultDataSet.getInt(numDataSetColumn+outcomeIDs.length, row);
					//String stateLabel = outcomeIDs[stateSeqNum];
					String stateLabel = totalStateNameArray[stateSeqNum];
					validationResultArray[row+1][i+numDataSetColumn] = stateLabel;
				}

				String accSummary = nodeName + " = " + nodeAccuracyFormat +
						//" (" + totalCorrectCaseNum + "/" + totalRecord + ")\\\\r\\\\n" +
						" (" + totalCorrectCaseNum + "/" + totalRecord + ")  " +
						stateAccSummary;

				validationResultArray[totalRecord+1][i+numDataSetColumn] = accSummary;
				/*
				if( i == 1 && totalRecord == 103 ) {
					File tmpFile = new File("/tmp/validationResultDataSetNewTest_new");
					if( !tmpFile.exists() ) {
						tmpFile.createNewFile();
					}
					resultDataSet.writeFile(tmpFile.getAbsolutePath());
				}*/
			}
		} catch (Exception ex) {
			Logger.info("getValidationMap: cross validation matches exception is " + ex.toString());
		}

		//The followings are the external validation
		try{
			for(int col = 0; col < numDataSetColumn; col++) {
				String curNodeId = dataSet.getVariableId(col);
				String curNodeName = network.getNodeName(curNodeId);
				String[] curOutcomeIDs = network.getOutcomeIds(curNodeId);

				int[] curStatePredictCorrectNum = new int[curOutcomeIDs.length];
				for(int i=0; i<curStatePredictCorrectNum.length; i++) {
					curStatePredictCorrectNum[i] = 0;
				}

				Map<String, Integer> stateCountMap = dataSetStateMap.get(curNodeId);
				String[] curNodeStateNameArray = dataSet.getStateNames(col);
				int totalCorrectPredictiveCase = 0;

				for( int row=0; row < totalRecord ; row++ ) {
					network.clearAllEvidence();
					int realStateSeqNum = dataSet.getInt(col, row);

					for (int i = 0; i < dataSet.getVariableCount(); i++) {
						if( i != col ) {
							int stateSeqNum = dataSet.getInt( i, row );
							String[] nodeStateNameArray = dataSet.getStateNames(i);
							network.setEvidence(dataSet.getVariableId(i), nodeStateNameArray[stateSeqNum]);
						}
					}
					recordNetworkTarget();
					network.updateBeliefs();
					recoverNetworkTarget();

					double[] values = network.getNodeValue(curNodeId);
					double max = values[0];
					int maxIndex = 0;
					for( int count = 1; count < values.length; count++ ) {
						if( values[count] > max ) {
							max = values[count];
							maxIndex = count;
						}
					}

					String[] outcomeIDs = network.getOutcomeIds(curNodeId);
					validationResultArray[row+1][col+numDataSetColumn*2] =
							outcomeIDs[maxIndex];
					if( curNodeStateNameArray[realStateSeqNum].equals(outcomeIDs[maxIndex])){
						totalCorrectPredictiveCase++;
						curStatePredictCorrectNum[maxIndex]++;
					}
				}

				double nodeAcc = (double) totalCorrectPredictiveCase /
						(double) dataSet.getRecordCount();
				String externalValidationProb = numberFormat.format(nodeAcc);
				String externalValidationNodeId = "external" + curNodeId;
				validationNodeAccuracyMap.put(externalValidationNodeId,
						externalValidationProb);
				String stateAccSummary = "";

				for( int i=0; i<curOutcomeIDs.length; i++) {
					String outcomeIdLabel = curOutcomeIDs[i];
					if(stateCountMap.get(outcomeIdLabel) != null) {
						int stateCount = stateCountMap.get(outcomeIdLabel);
						double accuracy = (double) curStatePredictCorrectNum[i] /
								(double)stateCount;
						stateAccSummary += outcomeIdLabel + " = " +
								numberFormat.format(accuracy).toString() + " (";
						stateAccSummary += curStatePredictCorrectNum[i] + "/" +
								stateCount + ")  ";
					} else {
						stateAccSummary += outcomeIdLabel + " = " ;
						stateAccSummary += "-nan(ind) (0/0)  ";
					}
				}

				String accSummary = curNodeName + " = " + externalValidationProb +
						" (" + totalCorrectPredictiveCase + "/" + dataSet.getRecordCount() + ")  " +
						stateAccSummary;

				validationResultArray[totalRecord+1][col+numDataSetColumn*2] = accSummary;
			}
			network.clearAllEvidence();
		} catch(Exception ex ){
			Logger.error("getValidationMap: external validation exception=" + ex.toString());
		}

		if( isTestData ) {
			this.validationResultArrayForTestData = validationResultArray;
		} else {
			this.validationResultArrayForRawData = validationResultArray;
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

	public String setEvidence(String nodeID, String outcomeID) {
		//loadModel(modelName);
		modifyNetworkLast();
		network.setEvidence(nodeID, outcomeID);
		return getModelStr();
	}
	
	public String setVirtualEvidence(String modelName, String nodeID, double[] outcomeVals) {
		modifyNetworkLast();
		network.setVirtualEvidence(nodeID, outcomeVals);
		return getModelStr();
	}
	
	public String clearAllEvidence(String modelName) {
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

	public String clearAll(String modelName)
	{
		//loadModel(modelName);
		network.clearAllTargets();
		network.clearAllEvidence();
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
