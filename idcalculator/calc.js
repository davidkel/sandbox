const fs = require('fs');
const { KEYUTIL, KJUR, X509 } = require('jsrsasign');

(async () => {
const certpem = fs.readFileSync(process.argv[2]);
const certificate = new X509();
certificate.readCertPEM(certpem.toString());
//const publicKey = KEYUTIL.getPEM(certificate.getPublicKey());
const identifier = KJUR.crypto.Util.hashHex(certificate.getPublicKey().pubKeyHex, 'sha256');

console.log('cert has id:', identifier);
})();
