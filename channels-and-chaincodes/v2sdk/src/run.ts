import { Identity, Peer, PeerDetails } from "./stuff/peer";
import { readFileSync } from "fs";

const readFile = (filename: string) => {
    const fileBuffer = readFileSync(filename);
    return fileBuffer.toString('utf-8');

}

(async (): Promise<void> => {

    const tlscacertpath = '/home/dave/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/tlsca/tlsca.org1.example.com-cert.pem';
    const user1cert = '/home/dave//fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/signcerts/User1@org1.example.com-cert.pem';
    const user1key = '/home/dave//fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/keystore/priv_sk';

    const peerDetails = new PeerDetails('grpcs://localhost:7051', readFile(tlscacertpath), 'peer0.org1.example.com');
    const identity = new Identity('Org1MSP', readFile(user1cert), readFile(user1key));
    const peer = new Peer(peerDetails, identity);
    const channelDetails = await peer.getAllChannels();
    console.log(channelDetails);
    const instantiatedCC = await peer.getAllInstantiatedV1Chaincodes(channelDetails[0].channelName);
    console.log(instantiatedCC);
    const committedCC = await peer.getAllCommittedV2Chaincodes(channelDetails[0].channelName);
    console.log(committedCC);
    const installedCC = await peer.getAllInstalledV2SmartContracts();  // requires MSP admin access
    console.log(installedCC);
})().catch(error => console.log('******** FAILED to run the application:', error));




/*    public async getInstantiatedChaincode(channelName: string): Promise<Array<FabricSmartContractDefinition>> {
        const lifecycleChannel: LifecycleChannel = this.lifecycle.getChannel(channelName, this.gateway.getOptions().wallet, this.gateway.getOptions().identity as string);
        const channelMap: Map<string, string[]> = await this.createChannelMap();
        const peerNames: string[] = channelMap.get(channelName);

        const peer: LifecyclePeer = this.lifecycle.getPeer(peerNames[0], this.gateway.getOptions().wallet, this.gateway.getOptions().identity as string);
        const capabilities: string[] = await peer.getChannelCapabilities(channelName);

        let smartContracts: DefinedSmartContract[];
        if (!capabilities.includes('V2_0')) {
            smartContracts = await lifecycleChannel.getAllInstantiatedSmartContracts(peerNames[0]);
        } else {
            smartContracts = await lifecycleChannel.getAllCommittedSmartContracts(peerNames[0]);
        }

        return smartContracts.map((smartContract: DefinedSmartContract) => {
            return { name: smartContract.smartContractName, version: smartContract.smartContractVersion, sequence: smartContract.sequence };
        });
    } */