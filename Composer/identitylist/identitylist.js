#!/usr/bin/env node
const { zulutodate, KEYUTIL, KJUR, X509 } = require('composer-cli/node_modules/jsrsasign');
const Pretty = require('composer-cli/node_modules/prettyjson');
(async () => {
    const render = Pretty.render;
    Pretty.render = (object, options) => {
        let i = 0;
        for (const identity of object) {
            if (identity.state === 'BOUND' || identity.state === 'ACTIVATED') {
                const certificate = new X509();
                certificate.readCertPEM(identity.certificate);
                const notAfter = zulutodate(certificate.getNotAfter());
                object[i].validTo = notAfter;
            }
            i++;
        }
        //object[0].validTo = 'IVE INJECTED';
        return render(object, options);
    }
    // insert the args 'identity' and 'list'
    process.argv.splice(2, 0, 'list');
    process.argv.splice(2, 0, 'identity');
    const cli = require('composer-cli/cli.js');
})();
