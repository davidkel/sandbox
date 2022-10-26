```yaml
token:
  enabled: true
  tms:
  - certification: null
    channel: testchannel   # channel with token cc deployed
    namespace: tns         # chaincode id of the token cc
    network: default       # reference to the fabric-driver network I assume
    wallets:
      auditors:  # one of auditors, owners, issuers, certifiers (not used at this point)
      - default: true
        id: auditor
        opts:
          BCCSP:
            Default: SW
            PKCS11:
              Hash: SHA2
              Label: null
              Library: null
              Pin: null
              Security: 256
            SW:
              Hash: SHA2
              Security: 256
        path: /home/dave/github-mine/fabric-token-sdk/samples/fungible/testdata/token/crypto/default-testchannel-tns/auditor/auditors/peerOrganizations/Orgauditor.example.com/users/auditor@Orgauditor.example.com/msp
  ttxdb:
    persistence:
      opts:
        path: /home/dave/github-mine/fabric-token-sdk/samples/fungible/testdata/fsc/nodes/auditor/kvs
      type: badger
```


```yaml
token:
  enabled: true
  tms:
  - certification: null
    channel: testchannel
    namespace: tns
    network: default
    wallets:
      owners:  #ie not an issuer or auditor I guess
      - default: true
        id: alice
        path: /home/dave/github-mine/fabric-token-sdk/samples/fungible/testdata/token/crypto/default-testchannel-tns/idemix/alice
      - default: false
        id: alice.id1
        path: /home/dave/github-mine/fabric-token-sdk/samples/fungible/testdata/token/crypto/default-testchannel-tns/idemix/alice.id1
  ttxdb:
    persistence:
      opts:
        path: /home/dave/github-mine/fabric-token-sdk/samples/fungible/testdata/fsc/nodes/alice/kvs
      type: badger
```


go install github.com/hyperledger-labs/fabric-token-sdk/cmd/tokengen@latest