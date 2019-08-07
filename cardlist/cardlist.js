#!/usr/bin/env node
const { zulutodate, KEYUTIL, KJUR, X509 } = require('composer-cli/node_modules/jsrsasign');

const cardList = require('composer-cli/lib/cmds/card/lib/list.js');
const cmdUtil = require('composer-cli/lib/cmds/utils/cmdutils');
const chalk = require('composer-cli/node_modules/chalk');
const Table = require('composer-cli/node_modules/cli-table');

function getExpiry(card) {
    const cert = card.getCredentials().certificate;
    const secret = card.getEnrollmentCredentials();
    const xtype = card.getConnectionProfile()['x-type']
    if (cert) {
        const certificate = new X509();
        certificate.readCertPEM(cert);
        const identifier = KJUR.crypto.Util.hashHex(certificate.getPublicKey().pubKeyHex, 'sha256');
        const notAfter = zulutodate(certificate.getNotAfter());
        return notAfter.toString();
    }
    return 'NOT ENROLLED';
}

function myshowNames(cardMap){
    const cardNames = Array.from(cardMap.keys());
    cardNames.forEach(function(card){
        cmdUtil.log(card + ':' + getExpiry(cardMap.get(card)));
    });
}

function newshowtable(cardMap) {
    const cardNames = Array.from(cardMap.keys());
    let alltables = {};

    if (cardNames.length === 0) {
        cmdUtil.log('There are no Business Network Cards available.');
        return;
    }

    cmdUtil.log(chalk.bold.blue('The following Business Network Cards are available:\n'));

    cardNames.forEach((e)=>{
        let tableLine = [];
        let idCard = cardMap.get(e);
        let bnn = idCard.getConnectionProfile().name;
        let currenttable = alltables[bnn];
        if (!currenttable){
            currenttable = new Table({
                head: ['Card Name', 'Expiry', 'UserId', 'Business Network']
            });
            alltables[bnn]=currenttable;
        }

        tableLine.push(e);
        tableLine.push(getExpiry(idCard));
        tableLine.push(idCard.getUserName());
        tableLine.push(idCard.getBusinessNetworkName());
        currenttable.push(tableLine);

    });

    Object.keys(alltables).sort().forEach((n)=>{
        cmdUtil.log(chalk.blue('Connection Profile: ')+n);
        cmdUtil.log(alltables[n].toString());
        cmdUtil.log('\n');
    });

    cmdUtil.log('Issue '+chalk.magenta('composer card list --card <Card Name>')+' to get details a specific card');
}

(async () => {
    cardList.showtable = newshowtable;
    cardList.showNames = myshowNames;
    // insert the args 'card' and 'list'
    process.argv.splice(2, 0, 'list');
    process.argv.splice(2, 0, 'card');
    const cli = require('composer-cli/cli.js');
})();
