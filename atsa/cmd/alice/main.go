/*
Copyright IBM Corp. All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
*/

package main

import (
	fscnode "github.com/hyperledger-labs/fabric-smart-client/node"
	fabric "github.com/hyperledger-labs/fabric-smart-client/platform/fabric/sdk"

	views "example.com/atsa/views"
	viewregistry "github.com/hyperledger-labs/fabric-smart-client/platform/view"
)

func main() {
	n := fscnode.New()
	n.InstallSDK(fabric.NewSDK(n))
	n.Execute(func() error {
		registry := viewregistry.GetRegistry(n)
		if err := registry.RegisterFactory("transfer", &views.TransferViewFactory{}); err != nil {
			return err
		}
		if err := registry.RegisterFactory("agreeToSell", &views.AgreeToSellViewFactory{}); err != nil {
			return err
		}
		if err := registry.RegisterFactory("agreeToBuy", &views.AgreeToBuyViewFactory{}); err != nil {
			return err
		}
		registry.RegisterResponder(&views.AcceptAssetView{}, &views.IssueView{})
		registry.RegisterResponder(&views.TransferResponderView{}, &views.TransferView{})

		return nil
	})
}
