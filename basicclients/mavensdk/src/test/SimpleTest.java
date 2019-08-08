package test;

import java.io.File;
import java.util.Collection;
import java.util.Collections;
import java.util.Set;

import org.hyperledger.fabric.sdk.ChaincodeID;
import org.hyperledger.fabric.sdk.Channel;
import org.hyperledger.fabric.sdk.Enrollment;
import org.hyperledger.fabric.sdk.HFClient;
import org.hyperledger.fabric.sdk.NetworkConfig;
import org.hyperledger.fabric.sdk.NetworkConfig.CAInfo;
import org.hyperledger.fabric.sdk.Orderer;
import org.hyperledger.fabric.sdk.Peer;
import org.hyperledger.fabric.sdk.ProposalResponse;
import org.hyperledger.fabric.sdk.TransactionProposalRequest;
import org.hyperledger.fabric.sdk.User;
import org.hyperledger.fabric.sdk.security.CryptoSuite;
import org.hyperledger.fabric_ca.sdk.HFCAClient;

public class SimpleTest {
	
	static class MyUser implements User {
		String mspId;
		Enrollment enrollment;
		
		@Override
		public String getName() {
			return "gateway";
		}

		@Override
		public Set<String> getRoles() {
			return Collections.emptySet();
		}

		@Override
		public String getAccount() {
			return "";
		}

		@Override
		public String getAffiliation() {
			return "";
		}

		@Override
		public Enrollment getEnrollment() {
			return enrollment;
		}
		
		public void setEnrollment(Enrollment e) {
			this.enrollment = e;
		}
		
		public void setMspId(String m) {
			mspId = m;
		}

		@Override
		public String getMspId() {
			return mspId;
		}		
	}

	public static void main(String[] args) throws Exception {
		HFClient client = HFClient.createNewInstance();
		client.setCryptoSuite(CryptoSuite.Factory.getCryptoSuite());


		File configFile = new File("/home/dave/localfabric/ccp.json");
		NetworkConfig conf = NetworkConfig.fromJsonFile(configFile);
		CAInfo cai = conf.getClientOrganization().getCertificateAuthorities().get(0);
		HFCAClient ca = HFCAClient.createNewInstance(cai);
		ca.setCryptoSuite(CryptoSuite.Factory.getCryptoSuite());
		
		Enrollment admin = ca.enroll("admin", "adminpw");
		MyUser user = new MyUser();
		user.setEnrollment(admin);
		user.setMspId("Org1MSP");
		client.setUserContext(user);

		Channel c = client.loadChannelFromConfig("mychannel", conf);
		Collection<Peer> cp = c.getPeers();
		Collection<Orderer> co = c.getOrderers();
		// at this point it appears no connection has been made so should
		// be able to modify the peers/orderers with the properties
		System.out.println("stop me here");
		c.initialize();
		
		TransactionProposalRequest request = client.newTransactionProposalRequest();
		ChaincodeID ccid = ChaincodeID.newBuilder().setName("Downloads").build();
		request.setChaincodeID(ccid);
		request.setFcn("readMyAsset");
		String[] arguments = { "a" };
		request.setArgs(arguments);
		request.setProposalWaitTime(1000);		
		
		
		Collection<ProposalResponse> resps = c.sendTransactionProposal(request);
		System.out.println("stop me here");
		
	}

}
