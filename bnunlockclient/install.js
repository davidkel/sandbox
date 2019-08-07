const {AdminConnection} = require('composer-admin');
const fs = require('fs');
const path = require('path');

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

const newInstall = async (connection, installDir, chaincodeId, chaincodeVersion) => {
    let txId = connection.client.newTransactionID();

    const request = {
        chaincodeType: 'node',
        chaincodePath: installDir,
        metadataPath: installDir,
        chaincodeVersion,
        chaincodeId,
        txId: txId,
        channelNames: connection.channel.getName()
    };

    try {
        const results = await connection.client.installChaincode(request);
        const {ignoredErrors, validResponses, invalidResponseMsgs} = connection._validatePeerResponses(results[0], false, null);


        // if we failed to install the runtime on all the peers that don't have a runtime installed, throw an error
        if (validResponses.length !== results[0].length) {
            const allRespMsgs = invalidResponseMsgs.join('\n');
            const errorMsg = `The chaincode failed to install on 1 or more peers: ${allRespMsgs}`;
            throw new Error(errorMsg);
        }
        console.log(`installed recovery chaincode name=${chaincodeId}, version=${chaincodeVersion}`);
    } catch(error) {
        const newError = new Error(`Error trying install chaincode. ${error}`);
        throw newError;
    }
}

async function main() {
    const cardName = process.argv[2];
    const installDir = process.argv[3];
    const name = process.argv[4];
    const ver = process.argv[5];
    const adminConn = new AdminConnection();
    await newConnect(adminConn, cardName);
    const connection = adminConn.connection;
    let res;
    try {
        res = await newInstall(connection, installDir, name, ver);
        console.log('Chaincode successfully installed');
        console.log(res);
    } catch(err) {
        console.log('Error:', err);
    }
}

main();
