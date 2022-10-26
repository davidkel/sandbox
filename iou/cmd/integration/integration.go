/*
Copyright IBM Corp All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
*/

package main

import (
	"example.com/iou/topology"
	"github.com/hyperledger-labs/fabric-smart-client/integration/nwo/cmd"
	"github.com/hyperledger-labs/fabric-smart-client/integration/nwo/cmd/network"
	view "github.com/hyperledger-labs/fabric-smart-client/platform/view/services/client/view/cmd"
)

func main() {
	m := cmd.NewMain("IOU", "0.1")
	mainCmd := m.Cmd()
	mainCmd.AddCommand(network.NewCmd(topology.Topology()...))
	mainCmd.AddCommand(view.NewCmd())
	m.Execute()
}
