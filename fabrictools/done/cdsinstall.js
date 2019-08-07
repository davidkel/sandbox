const {Gateway, FileSystemWallet} = require('fabric-network');

const fs = require('fs');

(async () => {
const cdsfile = process.argv[2];    
const ccpfile = process.argv[3];
const walletLoc = process.argv[4];
const identity = process.argv[5];

if (!cdsfile | !ccpfile | !walletLoc | !identity) {
    console.log('node cdsinstall cdsfile ccpfile wallet_location identity');
    process.exit(0);
}


const buffer = fs.readFileSync(ccpfile);
const ccp = JSON.parse(buffer.toString());

const gateway = new Gateway();
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

console.log(installRequest);

const response = await gateway.getClient().installChaincode(installRequest);
console.log(response);
console.log('finished');

})();
