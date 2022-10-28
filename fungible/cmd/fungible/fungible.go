/*
Copyright IBM Corp All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
*/

package main

import (
	"github.com/hyperledger-labs/fabric-smart-client/integration/nwo/cmd"
	view "github.com/hyperledger-labs/fabric-smart-client/platform/view/services/client/view/cmd"
)

func main() {
	m := cmd.NewMain("Fungible Tokens", "0.1")
	mainCmd := m.Cmd()
	mainCmd.AddCommand(view.NewCmd())
	m.Execute()
}
