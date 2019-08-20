const NodesdkClient = require('fabric-client');
const fs = require('fs');

// the ccp file to use
//const ccpFile = './byfn.json';
const ccpFile = './byfn-dyn.json';

// define the organisation name we will represent
const orgName = 'Org1';

// define the channel/contract and discovery requirements
const channel = 'mychannel';
const ccName = 'mycc';
const useDiscovery = true;
const convertDiscoveredToLocalHost = true;

(async () => {
    // load the connection profile
    const buffer = fs.readFileSync(ccpFile);
    const ccp = JSON.parse(buffer.toString());
    const mspid = ccp.organizations[orgName].mspid;
    const client = NodesdkClient.loadFromConfig(ccp);

    // manage identities
    const defKVStore = await NodesdkClient.newDefaultKeyValueStore({path: '/tmp/fu'});
    client.setStateStore(defKVStore);
    const cSuite = NodesdkClient.newCryptoSuite();
    const cStore = NodesdkClient.newCryptoKeyStore();
    cSuite.setCryptoKeyStore(cStore);
    client.setCryptoSuite(cSuite);

    const CAClient = client.getCertificateAuthority();
    const enrolled = await CAClient.enroll({
        enrollmentID: 'admin',
        enrollmentSecret: 'adminpw'
    })
    await client.createUser({
        skipPersistence: true,
        username: 'admin',
        mspid,
        cryptoContent: {
            privateKeyPEM: enrolled.key.toBytes(),
            signedCertPEM: enrolled.certificate
        }
    });
    console.log('user created');

    // get the channel
    // const channel = client.getChannel(); //get the first in the ccp
    // const initOptions = null;
    // if using a dynamic ccp the above will cause this error
    // TypeError: Cannot convert undefined or null to object

    // const channel = client.getChannel('daveschannel'); //get the first in the ccp
    // const initOptions = null;
    // if using a dynamic ccp the above will cause this error
    // Error: Channel not found for name davechannel

    // new stuff
    const channel = client.newChannel('davechannel');
    const orgPeers = client.getPeersForOrg();
    const initOptions = {target: orgPeers[0], discover: true, asLocalhost: true};

    // init options here
    await channel.initialize(initOptions);
    console.log('channel initialized');

    const request = {
        chaincodeId: ccName,
        txId: client.newTransactionID(),
        fcn: 'invoke',
        args: ['a', 'b', '47']
    };

    const end_res = await channel.sendTransactionProposal(request);
    const commit_req = {
        proposalResponses: end_res[0],
        proposal: end_res[1]
    };
    // setup the event hub
    eventHub = channel.newChannelEventHub(client.getPeersForOrg()[0]);

    const connected = new Promise((resolve, reject) => {
        eventHub.connect(false, (err) => {
            if (err === null) {
                console.log('connected');
                resolve();
            }
            else {
                reject();
            }
        });
    });
    await connected;

    const eventReceived = new Promise((resolve, reject) => {
        eventHub.registerTxEvent(request.txId.getTransactionID(), (tx, code) => {
            console.log('transaction comitted with ', code);
            resolve();
        });
    })
    await channel.sendTransaction(commit_req);
    await eventReceived;

    const qrequest = {
        targets: ['peer0.org1.example.com:7051'],
        chaincodeId: ccName,
        txId: client.newTransactionID(),
        fcn: 'query',
        args: ['a']
    };

    const res = await channel.queryByChaincode(qrequest);
    console.log('res', res.toString());
    eventHub.disconnect();
    channel.close();
})();
