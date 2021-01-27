'use strict'

const {AdminConnection} = require('composer-admin');

const newConnect = async (ac, cardName) => {
    console.log('In new connection');
    const card = await ac.cardStore.get(cardName);
    const wallet = await ac.cardStore.getWallet(cardName);
    ac.connection = await ac.connectionProfileManager.connectWithData(
        card.getConnectionProfile(),
        card.getBusinessNetworkName(),
        { cardName, wallet }
    );
    let secret = card.getEnrollmentCredentials();
    if (!secret) {
        secret = 'na';
    } else {
        secret = secret.secret;
    }
    ac.securityContext = await ac.connection.login(card.getUserName(), secret);
    ac.securityContext.card = card;
}

async function main() {
    const cardName = process.argv[2];
    const adminConn = new AdminConnection();
    await newConnect(adminConn, cardName);
    const connection = adminConn.connection;
    let res;
    try {
        res = await connection.invokeChainCode(adminConn.securityContext, 'any', []);
        console.log('SUCCESS');
        console.log(res);
    } catch(err) {
        console.log('Error:', err);
    }
}

main();
