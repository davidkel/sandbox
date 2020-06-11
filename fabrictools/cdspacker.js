const Pack = require('fabric-client/lib/Package');
const fs = require('fs');
const yargs = require('yargs');

yargs
.command('pack', 'package chaincode into a cds file', (yargs) => {
    yargs
    .option('n', {alias: 'ccname', description: 'the chaincode name', require: true})
    .option('x', {alias: 'ccver', description: 'the chaincode version', require: true})
    .option('p', {alias: 'path', description: 'path to the chaincode', require: true})
    .option('l', {alias: 'cctype', description: 'the chaincode language', require: true})
    .option('m', {alias: 'metaPath', description: 'the path to the metadata', require: false})
})
.command('unpack', 'unpackage a cds file')
.option('f', {
    alias: 'cdsfile',
    description: 'the path to the cds file',
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
const cdsfile = yargs.argv.f;
(async () => {

    let name;
    switch (command) {
        case 'pack':
            const name = yargs.argv.n;
            const version = yargs.argv.x;
            //TODO: Need to remove the GOPATH requirement
            const path = yargs.argv.p;
            const type = yargs.argv.l;
            const metadataPath = yargs.argv.m;
            const package = await Pack.fromDirectory({
                name,
                version,
                path,
                type,
                metadataPath
            });
            console.log(package.getFileNames());
            fs.writeFileSync(cdsfile, await package.toBuffer());
            console.log('saved');
            break;
        case 'unpack':
            const cdsBuffer = fs.readFileSync(cdsfile);
            const struct = await Pack.fromBuffer(cdsBuffer);
            console.log(struct.chaincodeDeploymentSpec.chaincode_spec.chaincode_id);
            fs.writeFileSync('/tmp/unpacked.tar', struct.chaincodeDeploymentSpec.code_package.toBuffer());
            console.log(struct.fileNames);
            console.log('tar file written to /tmp/unpacked.tar');
            break;
        default:
            console.log(`${command} not known`);
    }
})();
