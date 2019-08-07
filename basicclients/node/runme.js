const {Gateway, FileSystemWallet, X509WalletMixin} = require('fabric-network');
const fs = require('fs');

// the ccp file to use
const ccpFile = './local_fabric_connection.json';
//const ccpFile = './nodiscovery_connection.json';

// define the organisation name we will represent
const orgName = 'Org1';

// define the identity label in the wallet to use and the wallet location
const userNameWalletLabel = 'admin';
const walletLoc = './local_fabric_wallet'

// define the channel/contract and discovery requirements
const channel = 'mychannel';
const contractName = 'gocc';
const useDiscovery = true;
const convertDiscoveredToLocalHost = true;

(async () => {
    // load the connection profile
    const buffer = fs.readFileSync(ccpFile);
    const ccp = JSON.parse(buffer.toString());
    const mspid = ccp.organizations[orgName].mspid;

    // manage identities
    const filesystemWallet = new FileSystemWallet(walletLoc);

    // create the gateway
    const gateway = new Gateway();
    const discoveryOptions = {enabled: useDiscovery};
    if (useDiscovery && convertDiscoveredToLocalHost !== null) {
        discoveryOptions.asLocalhost = convertDiscoveredToLocalHost;
    }

	try {
		await gateway.connect(ccp, {
            wallet: filesystemWallet,
            identity: userNameWalletLabel,
            discovery: discoveryOptions
		});

        // invoke the various different types of tasks.
        const network = await gateway.getNetwork(channel);
        const contract = await network.getContract(contractName);

        const request = {
            chaincodeId: contractName,
            txId: gateway.getClient().newTransactionID(),
            fcn: 'fred',
            args: []
        }
        //const res = await network.getChannel().sendTransactionProposal(request);
        //const res = await network.getChannel().queryByChaincode(request);
        const res = await contract.submitTransaction('fred');
        //const res = await contract.evaluateTransaction('fred');
        console.log('res', res);
    } catch(err) {
        console.log('ERROR', err)
    } finally {
        gateway.disconnect();
		//process.exit(0);  // needed because using HSM causes app to hang at the end.
	}

})();
