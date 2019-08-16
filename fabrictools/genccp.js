//TODO: Add grpc only support
//TODO: Add multichannel support
//TODO: Better error handling
//TODO: Create IBP version to include identity importing both pem format and json format

const { Gateway, FileSystemWallet } = require('fabric-network');
const fs = require('fs');

const yargs = require('yargs');

yargs
/*
.command('importId', 'import an id into your wallet' , (yargs) => {
    yargs
    .option('l', {alias: 'label', description: 'the label or alias for the wallet', require: true})
    .option('m', {alias: 'mspid', description: 'msp id', require: true})
    .option('c', {alias: 'cert', description: 'certificate file', require: true})
    .option('k', {alias: 'key', description: 'private key file', require: true})
})
*/
.command('gen', 'generate a static connection profile', (yargs) => {
    yargs
    .option('p', {alias: 'ccp', description: 'location of common connection profile file', require: true})
    .option('c', {alias: 'channel', description: 'only include this channel', require: true})
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
const protocol = 'grpcs://';  // TODO: add support for grpc only (ie no tlsCACerts)

const createPeerSections = (peersByMsp, msps) => {
    const peerSections = {};
    for (const mspid in peersByMsp) {
        for (const peer of peersByMsp[mspid].peers) {
            peerSections[peer.name] = {
                'url': `${protocol}${peer.endpoint}`,
                'tlsCaCerts': {
                    pem: msps[mspid].tls_root_certs
                }
            }
        }
    }
    return peerSections;
}

const createOrdererSections = (orderers, msps) => {
    const ordererSections = {};
    for (const mspid in orderers) {
        for (const orderer of orderers[mspid].endpoints) {
            ordererSections[orderer.name] = {
                'url': `${protocol}${orderer.host}:${orderer.port}`,  // why the difference ?
                'tlsCaCerts': {
                    pem: msps[mspid].tls_root_certs
                }
            }
        }
    }
    return ordererSections;
}

const createChannelSection = (peerSections, ordererSections, channelName) => {
    const channelSection = {};
    const orderers = [];
    const peers = {}
    for (orderer in ordererSections) {
        orderers.push(orderer);
    }

    for (peer in peerSections) {
        peers[peer] = {}  // here roles would be defined
    }

    channelSection[channelName] = {
        orderers,
        peers
    }
    return channelSection;
}

const fixOrgSection = (orgs, mspid, peersInMspid) => {
    const peers = [];
    for (const peer of peersInMspid.peers) {
        peers.push(peer.name);
    }

    for (org in orgs) {
        if (orgs[org].mspid === mspid) {
            orgs[org].peers = peers;
            break;
        }
    }

    return orgs;

}

const genccp = async (yargs) => {
    const ccpfile = yargs.argv.p;
    const walletLoc = yargs.argv.w;
    const identity = yargs.argv.l;
    const channelName = yargs.argv.c;

    const buffer = fs.readFileSync(ccpfile);
    const ccp = JSON.parse(buffer.toString());

    const gateway = new Gateway();
    const discoveryOptions = { enabled: true, asLocalhost: false };

    const wallet = new FileSystemWallet(walletLoc);

    // use gateway to for wallet support to print the sdk client
    await gateway.connect(ccp, {
        wallet,
        identity,
        discovery: discoveryOptions
    });


    const client = gateway.getClient();
    const orgPeers = client.getPeersForOrg();
    const clientMSP = client.getMspid();

    //const qpRes = await client.queryPeers({target: orgPeers[0]});  // needs an admin id
    const ccRes = await client.queryChannels(orgPeers[0]);
    console.log(ccRes);

    const channel = client.newChannel(channelName);
    const initOptions = {
        target: orgPeers[0],
        discover: true
    };

    await channel.initialize(initOptions);
    const discovery_results = channel._discovery_results;

    const pl = createPeerSections(discovery_results.peers_by_org, discovery_results.msps);
    const ol = createOrdererSections(discovery_results.orderers, discovery_results.msps);
    const cs = createChannelSection(pl, ol, channelName);
    const orgs = fixOrgSection(ccp.organizations, clientMSP, discovery_results.peers_by_org[clientMSP]);

    const newccp = {
        name: 'genccp',
        version: '1.0.0',
        client: ccp.client,
        channels: cs,  // create
        organizations: orgs,   // take from dynamic ccp with a check
        orderers:ol,  // create
        peers: pl, // create
        certificateAuthorities: ccp.certificateAuthorities // take from dynamic ccp
    };

    console.log(JSON.stringify(newccp));
}


(async () => {
    switch (command) {
        //case 'importId':
        //    console.log('Not implemented yet');
        //    break;
        case 'gen':
            genccp(yargs);
            break;
        default:
            console.log(`${command} not known`);
    }
})();

