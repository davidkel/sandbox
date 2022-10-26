# TODO

Need to work out how to get this from token-sdk rather than copied here

rootpath is fabric-token-sdk/token/services/network/fabric/tcc

info to build it

      name: tns
      version: Version-0.0
      path: github.com/hyperledger-labs/fabric-token-sdk/token/services/network/fabric/tcc/main
      ctor: '{"Args":["init"]}'
      policy: AND ('Org1MSP.member')
      lang: golang
      collectionsconfig: ""

hopefully won't have to vendor it but I will need a go.mod file

to generate the PP json file
tokengen gen dlog -a ../testdata/token/crypto/default-testchannel-tns/auditor/auditors/peerOrganizations/Orgauditor.example.com/users/auditor@Orgauditor.example.com/msp/ -i ../testdata/token/crypto/default-testchannel-tns/idemix/ -o ./test

update params.go with info from rawdata

```
package tcc

const Params = "eyJ...NH0="
```

