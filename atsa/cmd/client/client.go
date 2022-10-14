package main

import (
	"encoding/json"
	"fmt"

	"example.com/atsa/states"
	"example.com/atsa/views"

	"github.com/hyperledger-labs/fabric-smart-client/platform/view/core/id"

	"github.com/hyperledger-labs/fabric-smart-client/integration/nwo/client"
	"github.com/hyperledger-labs/fabric-smart-client/platform/view/services/client/web"
)

func main() {
	webClientConfig, err := client.NewWebClientConfigFromFSC(".")
	must(err)

	webClient, err := web.NewClient(webClientConfig)
	must(err)

	aliceIdCert, _ := id.LoadIdentity("/root/crypto-config/peerOrganizations/fsc/peers/alice0/msp/signcerts/alice0-cert.pem")
	approverIdCert, _ := id.LoadIdentity("/root/crypto-config/peerOrganizations/fsc/peers/approver0/msp/signcerts/approver0-cert.pem")

	asset := states.Asset{
		ObjectType:        "minifig",
		ID:                "aa001",
		Owner:             aliceIdCert,
		PublicDescription: "Batman Minifig",
		PrivateProperties: []byte{},
	}

	payload, err := json.Marshal(&views.Issue{
		Asset:     &asset,
		Recipient: aliceIdCert,
		Approver:  approverIdCert,
	})
	fmt.Println(string(payload))
	must(err)

	res, err := webClient.CallView("issue", payload)
	must(err)

	fmt.Printf("%v\n", res)
}

func must(err error) {
	if err != nil {
		panic(err)
	}
}
