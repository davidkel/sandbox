/*
Copyright IBM Corp. All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
*/

package main

import (
	fscnode "github.com/hyperledger-labs/fabric-smart-client/node"
	"github.com/hyperledger-labs/fabric-smart-client/platform/fabric/sdk"

	viewregistry "github.com/hyperledger-labs/fabric-smart-client/platform/view"
	views "github.com/hyperledger-labs/fabric-smart-client/samples/fabric/iou/views"
)

func main() {
	n := fscnode.New()
	n.InstallSDK(fabric.NewSDK(n))
	n.Execute(func() error {
		registry := viewregistry.GetRegistry(n)
		registry.RegisterResponder(&views.ApproverView{}, &views.CreateIOUView{})
		registry.RegisterResponder(&views.ApproverView{}, &views.UpdateIOUView{})
		
		return nil
	})
}
