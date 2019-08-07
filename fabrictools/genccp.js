const { Gateway, FileSystemWallet } = require('fabric-network');

const fs = require('fs');

// node genccp ccp wallet label channel

(async () => {
    const ccpfile = process.argv[2];
    const walletLoc = process.argv[3];
    const identity = process.argv[4];
    const channelName = process.argv[5];

    if (!ccpfile | !walletLoc | !identity | !channelName) {
        console.log('node genccp ccp wallet label channel');
        process.exit(0);
    }

    const buffer = fs.readFileSync(ccpfile);
    const ccp = JSON.parse(buffer.toString());

    const gateway = new Gateway();
    const discoveryOptions = { enabled: true, asLocalhost: false };

    const wallet = new FileSystemWallet(walletLoc);

    await gateway.connect(ccp, {
        wallet,
        identity,
        discovery: discoveryOptions
    });

    const network = await gateway.getNetwork(channelName);
    const channel = network.getChannel();
    const orderers = channel.getOrderers();
    const peers = channel.getPeers();
    const orgPeers = channel.getPeersForOrg();
    /*
    console.log('---------- ORDERERS-------------')
    console.log(orderers);
    console.log('\n---------- PEERS-------------')
    console.log(peers);
    console.log('\n---------- ORG PEERS-------------')
    console.log(orgPeers);
    */
    //console.log('\n---------- SINGLE PEER INFO-------------')
    //console.log(orgPeers[0]._peer)

    console.log('\n --------- Channel --------------');
    console.log(channel._discovery_results);

    const newccp = {
        name: 'genccp',
        version: '1.0.0',
        client: {'organization': '', connection: { timeout: {peer: {}, orderer: '300'}}},
        channels: {},
        organizations: {},
        orderers: {},
        peers: {},
        certificateAuthorities: {}
    };

    const channelStructure = {
        orderers: [],
        peers: {}
    };

    const orgStructure = {
        mspid: '',
        peers: [],
        certificateAuthorities: []
    }

    const ordererStructure = {
        url: ''
    };

    const peerStructure = {
        url: ''
    }

    const caStructure = {
        url: '',
        caName: ''
    }




})();