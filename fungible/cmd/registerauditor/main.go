package main

import (
	"fmt"

	"github.com/hyperledger-labs/fabric-smart-client/integration/nwo/client"
	"github.com/hyperledger-labs/fabric-smart-client/platform/view/services/client/web"
)

func main() {
	webClientConfig, err := client.NewWebClientConfigFromFSC(".")
	must(err)

	webClient, err := web.NewClient(webClientConfig)
	must(err)

	res, err := webClient.CallView("register", nil)
	must(err)

	fmt.Printf("%v\n%s\n", res, string(res.([]byte)))
}

func must(err error) {
	if err != nil {
		panic(err)
	}
}
