go mod tidy -compat=1.17

also used a clean go mod cache
export GOPATH=~/github-mine/sandbox


An FSC node has
1. a grpc server endpoint
2. a p2p endpoint
3. a web REST server endpoint (optional)


shame I can't install fsccli
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

