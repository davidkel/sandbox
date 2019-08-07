const { FileSystemWallet, X509WalletMixin } = require('fabric-network');

const fs = require('fs');
const path = require('path');

const yargs = require('yargs');

yargs
.command('import', 'import identity', (yargs) => {
    yargs
    .option('l', {alias: 'label', description: 'the label or alias for the wallet', require: true})
    .option('m', {alias: 'mspid', description: 'msp id', require: true})
    .option('c', {alias: 'cert', description: 'certificate file', require: true})
    .option('k', {alias: 'key', description: 'private key file', require: true})
})
.command('export', 'export identity', (yargs) => {
    yargs
    .option('l', {alias: 'label', description: 'the label or alias for the wallet', require: true})
    .option('d', {alias: 'dir', description: 'directory to store identity', require: true})
})
.command('exists', 'checks for existance', (yargs) => {
    yargs
    .option('l', {alias: 'label', description: 'the label or alias for the wallet', require: true})
})
.command('delete', 'delete identity', (yargs) => {
    yargs
    .option('l', {alias: 'label', description: 'the label or alias for the wallet', require: true})
})
.command('list', 'list identities in wallet')
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

const command = yargs.argv._[0].toLowerCase();
const walletLoc = yargs.argv.w;

const wallet = new FileSystemWallet(walletLoc);
if (wallet[command] === undefined) {
    console.log(`command ${command} not recognised`);
    process.exit(0);
}

(async () => {
    let label;
    switch (command) {
        case 'import':
            label = yargs.argv.l;
            const mspid = yargs.argv.m;
            const certLoc = yargs.argv.c;
            const keyLoc = yargs.argv.k;
            const cert = fs.readFileSync(certLoc);
            const key = fs.readFileSync(keyLoc);
            if (!cert | !key) {
                console.log('files not found');
                process.exit(0);
            }
            const id = X509WalletMixin.createIdentity(mspid, cert.toString(), key.toString());
            await wallet.import(label, id);
            console.log(`imported ${label} into ${walletLoc}`);
            break;
        case 'export':
            label = yargs.argv.l;
            const dir = yargs.argv.d;

            const exported = await wallet.export(label);
            const allowed = fs.existsSync(dir) && fs.statSync(dir).isDirectory();
            if (allowed) {
                fs.writeFileSync(path.join(dir, `${exported.mspId}_${label}_cert.pem`), exported.certificate);
                fs.writeFileSync(path.join(dir, `${exported.mspId}_${label}_key.pem`), exported.privateKey);
                console.log(`Files written to ${dir} successfully`);
            } else {
                console.log(`${dir} doesn't exist or is not a directory`);
            }
            break;
        case 'list':
            const idInfo = await wallet.list();
            console.log(idInfo);
            break;
        case 'exists':
            label = yargs.argv.l;
            const exists = await wallet.exists(label)
            if (exists) {
                console.log(`${label} exists in ${walletLoc}`);
            } else {
                console.log(`${label} doesn't exist in ${walletLoc}`)
            }
            break;
        case 'exists':
            label = yargs.argv.l;
            const canDelete = await wallet.exists(label)
            if (canDelete) {
                await wallet.delete(label);
                console.log(`${label} has been deleted from ${walletLoc}`);
            } else {
                console.log(`${label} doesn't exist in ${walletLoc}`)
            }
            break;

        default:
            console.log(`${command} not known`);
    }
})();
