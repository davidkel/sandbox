

chaincode:
	cd tcc && go build

nodes: alice bob charlie auditor issuer

alice:
	cd cmd/alice && go build

bob:
	cd cmd/bob && go build

charlie:
	cd cmd/charlie && go build

auditor:
	cd cmd/auditor && go build

issuer:
	cd cmd/issuer && go build

client:
	cd cmd/client && go build

.PHONY : clean
clean:
	-rm cmd/alice/alice
	-rm cmd/bob/bob
	-rm cmd/charlie/charlie
	-rm cmd/issuer/issuer
	-rm cmd/auditor/auditor
	-rm cmd/client/client
	-rm cmd/fungible/fungible