package bayes;

import java.awt.Rectangle;
import java.io.*;
import java.text.*;
import java.util.*;

import smile.*;

public class ModelReader
{
	private Network network;

	public ModelReader()
	{
	}
	
	public Network getNetwork()
	{
		return network;
	}
	
	public void setNetwork(Object network)
	{
		this.network = (Network) network;
	}
	
	public String read(String modelName)
	{
		loadModel(modelName);
		return getModelStr();
	}
	
	public String getModelStr()
	{
		NumberFormat formatter = new DecimalFormat("#0.00");
		
		//System.out.println("read!");
		StringBuilder strBlder = new StringBuilder("[");
		try {
			//System.out.println(System.getProperty("java.library.path"));
			
			network.updateBeliefs();
			
			//nodes
			strBlder.append("{\"nodes\":[");
			List<int[]> edgeList = new ArrayList<int[]>();
			
			int[] nodes = network.getAllNodes();
			for (int i=0; i<nodes.length; i++) {
				int node = nodes[i];
				String nodeID = network.getNodeId(node);
				String nodeName = network.getNodeName(node);
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
				
				outcomeBlder.append("{\"nodename\":\"" + nodeName + "\", \"id\":\"" + network.getNodeId(nodes[i]) + "\", \"values\":[");
				String[] outcomeIDs = network.getOutcomeIds(nodes[i]);
				double[] values = network.getNodeValue(nodes[i]);
				for (int j=0; j<outcomeIDs.length; j++) {
					//System.out.println("outcome: " + outcomeIDs[j] + ", value: " + values[j]);
					if (j > 0)
						outcomeBlder.append(",");
					outcomeBlder.append("{\"outcomeid\":\"" + outcomeIDs[j] + "\",\"value\":" + formatter.format((values[j])) + "}");
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
		catch(Exception e)
		{
			e.printStackTrace();
		}
		
		strBlder.append("]");
		return strBlder.toString();
	}
	
	public String setEvidence(String modelName, String nodeID, String outcomeID)
	{
		loadModel(modelName);
		network.setEvidence(nodeID, outcomeID);
		
		return getModelStr();
	}
	
	public String setVirtualEvidence(String modelName, String nodeID, double[] outcomeVals)
	{
		loadModel(modelName);
		network.setVirtualEvidence(nodeID, outcomeVals);
		
		return getModelStr();
	}
	
	public String clearAllEvidence(String modelName)
	{
		loadModel(modelName);
		network.clearAllEvidence();
		
		return getModelStr();
	}
	
	public String clearEvidence(String modelName, String nodeID)
	{
		loadModel(modelName);
		network.clearEvidence(nodeID);
		
		return getModelStr();
	}
	
	public String setAsTarget(String modelName, String nodeID)
	{
		loadModel(modelName);
		network.setTarget(nodeID, true);
		
		return getModelStr();
	}
	
	public String clearAllTargets(String modelName)
	{
		loadModel(modelName);
		network.clearAllTargets();
		
		return getModelStr();
	}
	
	private void loadModel(String modelName)
	{
		if (network == null) {
			network = new Network();
			network.readFile("public/models/" + modelName);
		}
	}
}
