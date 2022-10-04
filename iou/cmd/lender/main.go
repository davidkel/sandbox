/*
Copyright IBM Corp. All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
*/

package main

import (
	fscnode "github.com/hyperledger-labs/fabric-smart-client/node"
	fabric "github.com/hyperledger-labs/fabric-smart-client/platform/fabric/sdk"

	views "example.com/iou/views"
	viewregistry "github.com/hyperledger-labs/fabric-smart-client/platform/view"
)

func main() {
	n := fscnode.New()
	n.InstallSDK(fabric.NewSDK(n))
	n.Execute(func() error {
		registry := viewregistry.GetRegistry(n)
		if err := registry.RegisterFactory("query", &views.QueryViewFactory{}); err != nil {
			return err
		}
		registry.RegisterResponder(&views.CreateIOUResponderView{}, &views.CreateIOUView{})
		registry.RegisterResponder(&views.UpdateIOUResponderView{}, &views.UpdateIOUView{})

		return nil
	})
}
