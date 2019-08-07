// camanager register ccp walletLoc registrar name
// camanager enroll ccp walletLoc mspid user secret (aslabel)
const IDManager = require('./idmanager');
const fs = require('fs');
const { FileSystemWallet, X509WalletMixin } = require('fabric-network');

const yargs = require('yargs');

yargs
.command('register', 'register an identity with a fabric ca', (yargs) => {
    yargs
    .option('r', {alias: 'registrar', description: 'the label of the registrar stored in the wallet', require: true})
    .option('n', {alias: 'name', description: 'the name to register', require: true})
})
.command('enroll', 'enroll the identity into a wallet', (yargs) => {
    yargs
    .option('n', {alias: 'name', description: 'the name of the registered identity', require: true})
    .option('l', {alias: 'label', description: 'the label or alias for the wallet, defaults to the name of the registered identity is not provided', require: false})
    .option('m', {alias: 'mspid', description: 'the mspid of the identity', require: true})
    .option('s', {alias: 'secret', description: 'the secret of the registered identity', require: true})
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
.usage('Usage: $0 <cmd> [options]')
.help()
;

if (!yargs.argv._[0]) {
    console.log('No command provided');
    process.exit(0);
}

idManager = new IDManager();
const command = yargs.argv._[0].toLowerCase();
const walletloc = yargs.argv.w;
const ccpfile = yargs.argv.c;

const buffer = fs.readFileSync(ccpfile);
const ccp = JSON.parse(buffer.toString());
idManager.initialize(ccp);

const wallet = new FileSystemWallet(walletloc);

(async () => {

    let name;
    switch (command) {
        case 'register':
            const registrar = yargs.argv.r;
            name = yargs.argv.n;

            //TODO: Support attributes, and user specified secret
            const secretReturned = await idManager.registerUser(name, {} /*options*/, wallet, registrar);
            console.log('The secret is', secretReturned);
            break;
        case 'enroll':
            const mspid = yargs.argv.m;
            const user = yargs.argv.n;
            const secret = yargs.argv.s;
            const labelToUse = yargs.argv.l;

            const asLabel = await idManager.enrollToWallet(user, secret, mspid, wallet, labelToUse);
            console.log(`enrolled ${user} to wallet as ${asLabel}`);
            break;
        default:
            console.log(`${command} not known`);
    }
})();
