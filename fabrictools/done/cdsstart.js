const { Gateway, FileSystemWallet } = require('fabric-network');

const fs = require('fs');

(async () => {
    const command = process.argv[2];
    const ccpfile = process.argv[3];
    const walletLoc = process.argv[4];
    const identity = process.argv[5];
    const ccid = process.argv[6];
    const ccver = process.argv[7];
    const cctype = process.argv[8];
    const epfile = process.argv[9];

    if (!command | !ccpfile | !walletLoc | !identity | !ccid | !ccver | !cctype) {
        // cctype: golang, node, java
        console.log('node start start|upgrade ccp wallet_location identity ccid ccver cctype policy');
        process.exit(0);
    }


    const buffer = fs.readFileSync(ccpfile);
    const ccp = JSON.parse(buffer.toString());

    const gateway = new Gateway();
    const discoveryOptions = { enabled: false, asLocalhost: false };

    const wallet = new FileSystemWallet(walletLoc);

    await gateway.connect(ccp, {
        wallet,
        identity,
        discovery: discoveryOptions
    });

    channelName = gateway.getClient().getChannel().getName();

    const network = await gateway.getNetwork(channelName);
    const channel = network.getChannel();
    channel.sendTransactionProposal = channel.sendInstantiateProposal;

    const contract = network.getContract(ccid);
    const txn = contract.createTransaction('fred');
    txn._buildRequest = () => {
        const req = {
            chaincodeType: cctype,
            chaincodeId: ccid,
            chaincodeVersion: ccver,
            txId: txn._transactionId,
            fcn: 'instantiate', // TODO: need to expose
            args: [] // TODO: need to expose
        }
        console.log(req);
        return req;
        // TODO: Need to add endorsement policy.
    }

    const response = await txn.submit();
    console.log(response);
    console.log('finished');
    gateway.disconnect();

})();
