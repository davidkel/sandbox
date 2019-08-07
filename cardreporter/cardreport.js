const { zulutodate, KEYUTIL, KJUR, X509 } = require('jsrsasign');
//const jsr = require('jsrsasign');
const AdminConnection = require('composer-admin').AdminConnection;

(async () => {
    const adminConnection = new AdminConnection();
    const cards = await adminConnection.getAllCards();
    //console.log(cards);
    for (const [cardname, card] of cards.entries()) {
        const cert = card.getCredentials().certificate;
        const secret = card.getEnrollmentCredentials();
        const xtype = card.getConnectionProfile()['x-type']
        console.log(cardname);
        if (cert) {
            const certificate = new X509();
            certificate.readCertPEM(cert);
            const identifier = KJUR.crypto.Util.hashHex(certificate.getPublicKey().pubKeyHex, 'sha256');
            const notAfter = zulutodate(certificate.getNotAfter());
            console.log(notAfter);
        }
    }
})();
