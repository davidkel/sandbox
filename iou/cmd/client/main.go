package main

import (
	"encoding/json"
	"fmt"

	"example.com/iou/views"
	"github.com/hyperledger-labs/fabric-smart-client/integration/nwo/client"
	"github.com/hyperledger-labs/fabric-smart-client/platform/view/services/client/web"
)

func main() {

	//	webClientConfig = web.Config{
	//		URL: "borrower0:20002",
	//		TLSKey: "/root/crypto-config/peerOrganizations/fsc/peers/client1/tls/server.key", // or is this the contents of the file ?
	//		TLSCert: "/root/crypto-config/peerOrganizations/fsc/peers/client1/tls/server.crt", // or is this the contents of the file ?
	//		CACert: ,
	//	}

	webClientConfig, err := client.NewWebClientConfigFromFSC(".")
	must(err)

	webClient, err := web.NewClient(webClientConfig)
	must(err)
	payload, err := json.Marshal(&views.Create{
		Amount: 10,
	})
	must(err)

	res, err := webClient.CallView("create", payload)
	must(err)

	fmt.Printf("%v\n", res)
}

func must(err error) {
	if err != nil {
		panic(err)
	}
}
