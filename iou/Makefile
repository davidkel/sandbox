

chaincode:
	cd cc
	go build

nodes: borrower lender approver client

borrower:
	cd cmd/borrower && go build

lender:
	cd cmd/lender && go build

approver:
	cd cmd/approver && go build

client:
	cd cmd/client && go build

.PHONY : clean
clean:
	-rm cmd/borrower/borrower
	-rm cmd/lender/lender
	-rm cmd/approver/approver
	-rm cmd/client/client
	-rm cmd/iou/iou
	-rm -fr integration/cmd
    -rm integration/integration