# Example of the FSC IOU sample in an external repo
This is the code for the IOU sample, it contains
1. The IOU Namespace chaincode in `cc`
2. The Approver
3. The Borrower
4. The Lender
5. A simple client to test it


This does not include the core.yaml files that configure the FSC network, those need to be generated based on the fabric network it will work within conjunction with how you intend to deploy each of the FSC nodes, also the client expects a Web Server endpoint to be enabled

The client however does include a core.yaml file but would need changing based on how you deployed everything

```yaml
# ------------------- Web client Configuration -------------------------
fsc:
  web:
    address: borrower0:20002
    tls:
      enabled: true
      cert:
        file: /root/crypto-config/peerOrganizations/fsc/peers/client1/tls/server.crt
      # Private key used for TLS server
      key:
        file: /root/crypto-config/peerOrganizations/fsc/peers/client1/tls/server.key

      # If mutual TLS is enabled, clientRootCAs.files contains a list of additional root certificates
      # used for verifying certificates of client connections.
      clientRootCAs:
        files:
        - /root/crypto-config/peerOrganizations/fsc/peers/borrower0/tls/ca.crt
```

- address is the web endpoint of the borrower that is all the client does is a single request to the borrower
- tls.enabled must always be true, it can't be anything else as the web interface uses mutual TLS
- cert and key are the client TLS files
- clientRootCAs actually contain the CA file for the server in this case the borrower

WARNING: These keys are likely to change as they aren't consistent with the Core.yaml format for the servers and in fact are currently confusing

Note that an FSC Node has the following possible endpoints
1. a GRPC endpoint (ie a GRPC Server)
2. a HTTPS endpoint (ie a Web Server)
3. a P2P endpoint

## Info about building
go mod tidy -compat=1.17
also used a clean go mod cache





## Note that you cant install fsccli as a standalone utility (eg to use the internal cryptogen tool)
```
go install github.com/hyperledger-labs/fabric-smart-client/cmd/fsccli@latest
go install: github.com/hyperledger-labs/fabric-smart-client/cmd/fsccli@latest (in github.com/hyperledger-labs/fabric-smart-client@v0.0.0-20220829121531-bfb66997d570):
        The go.mod file for the module providing named packages contains one or
        more replace directives. It must not contain directives that would cause
        it to be interpreted differently than if it were the main module.

go build github.com/hyperledger-labs/fabric-smart-client/cmd/fsccli
../pkg/mod/github.com/hyperledger-labs/fabric-smart-client@v0.0.0-20220829121531-bfb66997d570/integration/nwo/fabric/fpc/fpc.go:21:2: missing go.sum entry for module providing package github.com/docker/docker/api/types (imported by github.com/hyperledger-labs/fabric-smart-client/integration/nwo/orion); to add:
        go get github.com/hyperledger-labs/fabric-smart-client/integration/nwo/orion@v0.0.0-20220829121531-bfb66997d570
../pkg/mod/github.com/hyperledger-labs/fabric-smart-client@v0.0.0-20220829121531-bfb66997d570/integration/nwo/fabric/fpc/fpc.go:22:2: missing go.sum entry for module providing package github.com/docker/docker/api/types/container (imported by github.com/hyperledger-labs/fabric-smart-client/integration/nwo/orion); to add:
        go get github.com/hyperledger-labs/fabric-smart-client/integration/nwo/orion@v0.0.0-20220829121531-bfb66997d570
../pkg/mod/github.com/hyperledger-labs/fabric-smart-client@v0.0.0-20220829121531-bfb66997d570/integration/nwo/fabric/fpc/fpc.go:23:2: missing go.sum entry for module providing package github.com/docker/docker/api/types/mount (imported by github.com/hyperledger-labs/fabric-smart-client/integration/nwo/orion); to add:
        go get github.com/hyperledger-labs/fabric-smart-client/integration/nwo/orion@v0.0.0-20220829121531-bfb66997d570
../pkg/mod/github.com/hyperledger-labs/fabric-smart-client@v0.0.0-20220829121531-bfb66997d570/integration/nwo/monitoring/hle/docker.go:19:2: missing go.sum entry for module providing package github.com/docker/docker/api/types/network (imported by github.com/hyperledger-labs/fabric-smart-client/integration/nwo/orion); to add:
        go get github.com/hyperledger-labs/fabric-smart-client/integration/nwo/orion@v0.0.0-20220829121531-bfb66997d570
../pkg/mod/github.com/hyperledger-labs/fabric-smart-client@v0.0.0-20220829121531-bfb66997d570/integration/nwo/monitoring/hle/docker.go:20:2: missing go.sum entry for module providing package github.com/docker/docker/api/types/volume (imported by github.com/hyperledger-labs/fabric-smart-client/integration/nwo/monitoring/hle); to add:
        go get github.com/hyperledger-labs/fabric-smart-client/integration/nwo/monitoring/hle@v0.0.0-20220829121531-bfb66997d570
../pkg/mod/github.com/hyperledger-labs/fabric-smart-client@v0.0.0-20220829121531-bfb66997d570/integration/nwo/fabric/fpc/fpc.go:24:2: missing go.sum entry for module providing package github.com/docker/docker/client (imported by github.com/hyperledger-labs/fabric-smart-client/integration/nwo/orion); to add:
        go get github.com/hyperledger-labs/fabric-smart-client/integration/nwo/orion@v0.0.0-20220829121531-bfb66997d570
../pkg/mod/github.com/hyperledger-labs/fabric-smart-client@v0.0.0-20220829121531-bfb66997d570/integration/nwo/fabric/fpc/fpc.go:25:2: missing go.sum entry for module providing package github.com/docker/go-connections/nat (imported by github.com/hyperledger-labs/fabric-smart-client/integration/nwo/orion); to add:
        go get github.com/hyperledger-labs/fabric-smart-client/integration/nwo/orion@v0.0.0-20220829121531-bfb66997d570
../pkg/mod/github.com/hyperledger-labs/fabric-smart-client@v0.0.0-20220829121531-bfb66997d570/integration/nwo/common/docker/utils.go:14:2: missing go.sum entry for module providing package github.com/fsouza/go-dockerclient (imported by github.com/hyperledger-labs/fabric-smart-client/integration/nwo/common/docker); to add:
        go get github.com/hyperledger-labs/fabric-smart-client/integration/nwo/common/docker@v0.0.0-20220829121531-bfb66997d570
../pkg/mod/github.com/hyperledger-labs/fabric-smart-client@v0.0.0-20220829121531-bfb66997d570/integration/nwo/fabric/fpc/chaincode.go:13:2: missing go.sum entry for module providing package github.com/hyperledger/fabric-private-chaincode/client_sdk/go/pkg/core/contract (imported by github.com/hyperledger-labs/fabric-smart-client/integration/nwo/fabric); to add:
        go get github.com/hyperledger-labs/fabric-smart-client/integration/nwo/fabric@v0.0.0-20220829121531-bfb66997d570
../pkg/mod/github.com/hyperledger-labs/fabric-smart-client@v0.0.0-20220829121531-bfb66997d570/integration/nwo/fabric/fpc/fpc.go:32:2: missing go.sum entry for module providing package github.com/hyperledger/fabric-private-chaincode/client_sdk/go/pkg/core/lifecycle (imported by github.com/hyperledger-labs/fabric-smart-client/integration/nwo/fabric/fpc); to add:
        go get github.com/hyperledger-labs/fabric-smart-client/integration/nwo/fabric/fpc@v0.0.0-20220829121531-bfb66997d570
../pkg/mod/github.com/hyperledger-labs/fabric-smart-client@v0.0.0-20220829121531-bfb66997d570/integration/nwo/fabric/fpc/attestation.go:10:2: missing go.sum entry for module providing package github.com/hyperledger/fabric-private-chaincode/client_sdk/go/pkg/sgx (imported by github.com/hyperledger-labs/fabric-smart-client/integration/nwo/fabric/fpc); to add:
        go get github.com/hyperledger-labs/fabric-smart-client/integration/nwo/fabric/fpc@v0.0.0-20220829121531-bfb66997d570
../pkg/mod/github.com/hyperledger-labs/fabric-smart-client@v0.0.0-20220829121531-bfb66997d570/integration/nwo/fsc/fsc.go:28:2: missing go.sum entry for module providing package github.com/miracl/conflate (imported by github.com/hyperledger-labs/fabric-smart-client/integration/nwo/fsc); to add:
        go get github.com/hyperledger-labs/fabric-smart-client/integration/nwo/fsc@v0.0.0-20220829121531-bfb66997d570
../pkg/mod/github.com/hyperledger-labs/fabric-smart-client@v0.0.0-20220829121531-bfb66997d570/integration/nwo/common/builder.go:23:2: missing go.sum entry for module providing package gopkg.in/src-d/go-git.v4 (imported by github.com/hyperledger-labs/fabric-smart-client/integration/nwo/common); to add:
        go get github.com/hyperledger-labs/fabric-smart-client/integration/nwo/common@v0.0.0-20220829121531-bfb66997d570
../pkg/mod/github.com/hyperledger-labs/fabric-smart-client@v0.0.0-20220829121531-bfb66997d570/integration/nwo/common/builder.go:24:2: missing go.sum entry for module providing package gopkg.in/src-d/go-git.v4/plumbing (imported by github.com/hyperledger-labs/fabric-smart-client/integration/nwo/common); to add:
        go get github.com/hyperledger-labs/fabric-smart-client/integration/nwo/common@v0.0.0-20220829121531-bfb66997d570
```
