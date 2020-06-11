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
.command('importibp', 'import ibp identity', (yargs) => {
    yargs
    .option('j', {alias: 'json', description: 'the json identity file', require: true})
})
.command('export', 'export identity', (yargs) => {
    yargs
    .option('l', {alias: 'label', description: 'the label or alias for the wallet', require: true})
    .option('d', {alias: 'dir', description: 'directory to store identity', require: true})
})
.command('exportibp', 'export identity in ibp format', (yargs) => {
    yargs
    .option('l', {alias: 'label', description: 'the label or alias for the wallet', require: true})
    .option('j', {alias: 'json', description: 'the json file to generate', require: true})
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

(async () => {
    let label;
    let mspid;
    let cert;
    let key;
    let id;
    let exported;
    switch (command) {
        case 'import':
            label = yargs.argv.l;
            mspid = yargs.argv.m;
            const certLoc = yargs.argv.c;
            const keyLoc = yargs.argv.k;
            cert = fs.readFileSync(certLoc);
            key = fs.readFileSync(keyLoc);
            if (!cert | !key) {
                console.log('files not found');
                process.exit(0);
            }
            id = X509WalletMixin.createIdentity(mspid, cert.toString(), key.toString());
            await wallet.import(label, id);
            console.log(`imported ${label} into ${walletLoc}`);
            break;
        case 'importibp':
            const ibpfile = yargs.argv.j;
            const ibpid = JSON.parse(fs.readFileSync(ibpfile).toString());
            console.log(ibpid);
            cert = Buffer.from(ibpid.cert, 'base64');
            key = Buffer.from(ibpid.private_key,'base64');
            mspid = ibpid.msp_id;
            id = X509WalletMixin.createIdentity(mspid, cert.toString(), key.toString());
            await wallet.import(ibpid.name, id);
            console.log(`imported ${ibpid.name} into ${walletLoc}`);
            break;

        case 'export':
            label = yargs.argv.l;
            const dir = yargs.argv.d;

            exported = await wallet.export(label);
            const allowed = fs.existsSync(dir) && fs.statSync(dir).isDirectory();
            if (allowed) {
                fs.writeFileSync(path.join(dir, `${exported.mspId}_${label}_cert.pem`), exported.certificate);
                fs.writeFileSync(path.join(dir, `${exported.mspId}_${label}_key.pem`), exported.privateKey);
                console.log(`Files written to ${dir} successfully`);
            } else {
                console.log(`${dir} doesn't exist or is not a directory`);
            }
            break;

        case 'exportibp':
            label = yargs.argv.l;
            const outfile = yargs.argv.j;

            exported = await wallet.export(label);
            const ibpidout = {name: label};
            ibpidout.cert = Buffer.from(exported.certificate).toString('base64');
            ibpidout.private_key = Buffer.from(exported.privateKey).toString('base64');
            fs.writeFileSync(outfile, JSON.stringify(ibpidout));
            console.log(`${outfile} created/overwritten`);
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

        case 'delete':
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
