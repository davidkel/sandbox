/*
Copyright IBM Corp. All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
*/

package main

import (
	fscnode "github.com/hyperledger-labs/fabric-smart-client/node"
	fabric "github.com/hyperledger-labs/fabric-smart-client/platform/fabric/sdk"

	views "example.com/fungible/views"
	viewregistry "github.com/hyperledger-labs/fabric-smart-client/platform/view"
	sdk "github.com/hyperledger-labs/fabric-token-sdk/token/sdk"
)

func main() {
	n := fscnode.New()
	n.InstallSDK(fabric.NewSDK(n))
	n.InstallSDK(sdk.NewSDK(n))

	n.Execute(func() error {
		registry := viewregistry.GetRegistry(n)
		if err := registry.RegisterFactory("transfer", &views.TransferViewFactory{}); err != nil {
			return err
		}
		if err := registry.RegisterFactory("redeem", &views.RedeemViewFactory{}); err != nil {
			return err
		}
		if err := registry.RegisterFactory("swap", &views.SwapInitiatorViewFactory{}); err != nil {
			return err
		}
		if err := registry.RegisterFactory("unspent", &views.ListUnspentTokensViewFactory{}); err != nil {
			return err
		}
		registry.RegisterResponder(&views.AcceptCashView{}, &views.IssueCashView{})
		registry.RegisterResponder(&views.AcceptCashView{}, &views.TransferView{})
		registry.RegisterResponder(&views.SwapResponderView{}, &views.SwapInitiatorView{})

		return nil
	})
}
