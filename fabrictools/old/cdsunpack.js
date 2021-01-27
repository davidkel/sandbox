const Pack = require('fabric-client/lib/Package');
const fs = require('fs');

(async () => {
    const cdsBuffer = fs.readFileSync(process.argv[2]);
    const struct = await Pack.fromBuffer(cdsBuffer);
    console.log(struct.chaincodeDeploymentSpec.chaincode_spec.chaincode_id);
    fs.writeFileSync('/tmp/unpacked.tar', struct.chaincodeDeploymentSpec.code_package.toBuffer());
    console.log(struct.fileNames);
    console.log('tar file written to /tmp/unpacked.tar');
})();
