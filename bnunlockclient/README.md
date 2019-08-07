- composer identity request -c admin@basic-sample-network -u admin -s adminpw -d .
- composer card create -n basic-sample-network -u newadmin -c admin-pub.pem -k admin-priv.pem -p channeladmin/connection.json -r PeerAdmin -r ChannelAdmin -f newadmin.card
- composer card import -f newadmin.card -c newadmin
- composer network ping -c newadmin


- node install.js PeerAdmin@hlfv1 ../bnunlock basic-sample-network recover
- node upgrade.js PeerAdmin@hlfv1 basic-sample-network recover
- node invoke newadmin
- node upgrade.js PeerAdmin@hlfv1 basic-sample-network 0.2.6-20180818002031
