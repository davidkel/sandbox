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
    const name = process.argv[3];
    const version = process.argv[4];
    const adminConn = new AdminConnection();
    await newConnect(adminConn, cardName);
    const connection = adminConn.connection;
    let res;
    try {
        res = await connection.upgrade(adminConn.securityContext, name, version);
        console.log('Upgrade Successful');
    } catch(err) {
        console.log('Error:', err);
    }
}

main();
