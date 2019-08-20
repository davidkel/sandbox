package test;

import java.io.File;
import java.util.Collection;
import java.util.Collections;
import java.util.Set;
import java.util.EnumSet;

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
import org.hyperledger.fabric.sdk.Channel.PeerOptions;
import org.hyperledger.fabric.sdk.Peer.PeerRole;

import java.util.ArrayList;
import java.util.List;
import java.util.Properties;
import org.hyperledger.fabric.sdk.exception.InvalidArgumentException;


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

		//File configFile = new File("/home/dave/my-github-repos/sandbox/basicclients/nodesdk/byfn.json");
		File configFile = new File("/home/dave/my-github-repos/sandbox/basicclients/nodesdk/byfn-dyn.json");
		NetworkConfig conf = NetworkConfig.fromJsonFile(configFile);
		CAInfo cai = conf.getClientOrganization().getCertificateAuthorities().get(0);
		HFCAClient ca = HFCAClient.createNewInstance(cai);
		ca.setCryptoSuite(CryptoSuite.Factory.getCryptoSuite());

		Enrollment admin = ca.enroll("admin", "adminpw");
		MyUser user = new MyUser();
		user.setEnrollment(admin);
		user.setMspId("Org1MSP");
		client.setUserContext(user);

        // This call will fail with Caused by: org.hyperledger.fabric.sdk.exception.NetworkConfigurationException: Channel configuration has no channels defined.
		//Channel c = client.loadChannelFromConfig("davechannel", conf);
        Channel c = createChannel(client, conf, "davechannel");

		Collection<Peer> cp = c.getPeers();
        Collection<Peer> cpsd = c.getPeers(EnumSet.of(PeerRole.ENDORSING_PEER));
		Collection<Orderer> co = c.getOrderers();
		// at this point it appears no connection has been made so should
		// be able to modify the peers/orderers with the properties
		System.out.println("stop me here");
        System.out.println(cpsd);

        System.out.println(cp.toArray(new Peer[0])[0].getProperties());
        //cp.toArray(new Peer[0])[0].getPeerOptions().setPeerRoles(EnumSet.allOf(PeerRole.class));
		c.initialize();
        System.out.println(c.getPeers());

		TransactionProposalRequest request = client.newTransactionProposalRequest();
		ChaincodeID ccid = ChaincodeID.newBuilder().setName("mycc").build();
		request.setChaincodeID(ccid);
		request.setFcn("query");
		String[] arguments = { "a" };
		request.setArgs(arguments);
		request.setProposalWaitTime(1000);


		Collection<ProposalResponse> resps = c.sendTransactionProposal(request);
		System.out.println("stop me here");
        System.out.println(resps);

	}

    /*
     * create the named channel for use with a dynamic CCP
     */
    private static Channel createChannel(HFClient client, NetworkConfig networkConfig, String channelName) throws InvalidArgumentException {
        Channel c = client.newChannel(channelName);
        List<String> peerNames = networkConfig.getClientOrganization().getPeerNames();
        for (String name: peerNames) {

            //String url = networkConfig.getPeerUrl(name);
            //Hack for now until the above is published
            String url = "NONONO";
            switch (name) {
                case "peer0.org1.example.com":
                    url = "grpcs://peer0.org1.example.com:7051";
                    break;
                case "peer1.org1.example.com":
                    url = "grpcs://peer1.org1.example.com:8051";
                    break;
                default:
                    System.out.println("not expecting " + name);
            }
            System.out.println("url=" + url);

            Properties props = networkConfig.getPeerProperties(name);
            Peer peer = client.newPeer(name, url, props);
            PeerOptions peerOptions = PeerOptions.createPeerOptions()
                .setPeerRoles(EnumSet.allOf(PeerRole.class));
            c.addPeer(peer, peerOptions);
        }
        return c;
    }
}
