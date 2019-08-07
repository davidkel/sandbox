const {Gateway, FileSystemWallet} = require('fabric-network');

const fs = require('fs');

const yargs = require('yargs');

yargs
.command('install', 'install a cds file onto all peers in your identity\'s org' , (yargs) => {
    yargs
    .option('f', {alias: 'cdsfile', description: 'the cds file to install', require: true})
})
.command('start', 'enroll the identity into a wallet', (yargs) => {
    yargs
    .option('i', {alias: 'ccid', description: 'chaincode id', require: true})
    .option('r', {alias: 'ccver', description: 'chaincode version', require: true})
    .option('t', {alias: 'cctype', description: 'chaincode language', require: true})
})
.command('upgrade', 'enroll the identity into a wallet', (yargs) => {
    yargs
    .option('i', {alias: 'ccid', description: 'chaincode id', require: true})
    .option('r', {alias: 'ccver', description: 'chaincode version', require: true})
    .option('t', {alias: 'cctype', description: 'chaincode language', require: true})
})

.option('c', {
    alias: 'ccp',
    description: 'location of common connection profile file',
    require: true
})
.option('w', {
    alias: 'walletloc',
    description: 'directory of wallet',
    require: true
})
.option('l', {
    alias: 'label',
    description: 'label of the identity to use in the wallet',
    require: true
})
.usage('Usage: $0 <cmd> [options]')
.help()
;

if (!yargs.argv._[0]) {
    console.log('No command provided');
    process.exit(0);
}

const command = yargs.argv._[0].toLowerCase();

install = async (yargs) => {
    const cdsfile = yargs.argv.f;
    const ccpfile = yargs.argv.c;
    const walletLoc = yargs.argv.w;
    const identity = yargs.argv.l;

    const buffer = fs.readFileSync(ccpfile);
    const ccp = JSON.parse(buffer.toString());

    const gateway = new Gateway();
    //TODO: Could we use discovery here ?
    const discoveryOptions = {enabled: false, asLocalhost: false};

    const wallet = new FileSystemWallet(walletLoc);

    await gateway.connect(ccp, {
        wallet,
        identity,
        discovery: discoveryOptions
    });


    const cdsBuffer = fs.readFileSync(cdsfile);
    const installRequest = {
        channelNames: gateway.getClient().getChannel().getName(),
        chaincodePackage: cdsBuffer,
        txId: gateway.getClient().newTransactionID()
    };

    //console.log(installRequest);

    const response = await gateway.getClient().installChaincode(installRequest);
    console.log(response);
    console.log('finished');
}

startOrUpgrade = async (yargs, isStart) => {
    const ccpfile = yargs.argv.c;
    const walletLoc = yargs.argv.w;
    const identity = yargs.argv.l;

    const ccid = yargs.argv.ccid;
    const ccver = yargs.argv.ccver;
    const cctype = yargs.argv.cctype;
    const epfile = yargs.argv.epfile;  // TODO: Need to support Endorsement Policy

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

    // minor hack to get the gateway to send the correct proposal.
    if (isStart) {
        channel.sendTransactionProposal = channel.sendInstantiateProposal;
    } else {
        channel.sendTransactionProposal = channel.sendUpgradeProposal;
    }

    const contract = network.getContract(ccid);
    const txn = contract.createTransaction('fred');

    // minor hack to get the gateway to build the correct type of request
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
}

(async () => {
    switch (command) {
        case 'install':
            install(yargs);
            break;
        case 'start':
            startOrUpgrade(yargs, true);
            break;
        case 'upgrade':
            startOrUpgrade(yargs, false);
            break;
        default:
            console.log(`${command} not known`);
    }
})();



