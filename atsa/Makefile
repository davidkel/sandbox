

chaincode:
	cd cc
	go build

nodes: alice approver bob issuer client

alice:
	cd cmd/alice && go build

approver:
	cd cmd/approver && go build

bob:
	cd cmd/bob && go build

issuer:
	cd cmd/issuer && go build

client:
	cd cmd/client && go build

.PHONY : clean
clean:
	-rm cmd/alice/alice
	-rm cmd/approver/approver
	-rm cmd/approver/bob
	-rm cmd/approver/issuer
	-rm cmd/client/client