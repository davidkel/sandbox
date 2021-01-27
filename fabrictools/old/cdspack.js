const Pack = require('fabric-client/lib/Package');
const fs = require('fs');

const cdsfile = process.argv[2];
const name = process.argv[3];
const version = process.argv[4];
const path = process.argv[5];
const type = process.argv[6];
const metadataPath = process.argv[7];

if (!cdsfile | !name | !version | !path | !type) {
    console.log('node cdspack cdsfile name version path type [metadataPath]');
    process.exit(0);
}

(async () => {
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
})();
