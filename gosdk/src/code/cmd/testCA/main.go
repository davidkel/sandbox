package main

import (
    "fmt"
    "os"

    "github.com/hyperledger/fabric-sdk-go/pkg/client/msp"
    "github.com/hyperledger/fabric-sdk-go/pkg/core/config"
    "github.com/hyperledger/fabric-sdk-go/pkg/fabsdk"
)

// Definition of the Fabric SDK properties
var (
    channelID      = "mychannel"
    orgName        = "Org1"
    orgAdmin       = "Admin"
    ccID           = "trade-network"
    //ordererID      = "orderer.example.com"
    //channelConfig  = os.Getenv("GOPATH") + "/src/github.com/hyperledger/fabric-samples/basic-network/config/channel.tx"
    chaincodeGoPath= os.Getenv("GOPATH")
    chaincodePath  = "github.com/hyperledger/fabric-samples/chaincode/MyChaincode/go/"
    configFile     = os.Getenv("HOME") + "/my-github-repos/sandbox/gosdk/src/code/connection.json"
    userName       = "gava"
    adminName      = "admin"
)

func main() {
    // Initialize the SDK with the configuration file
    fmt.Println(configFile)
    sdk, err := fabsdk.New(config.FromFile(configFile))
    if err != nil {
        fmt.Printf("failed to create SDK: %v\n", err)
        return
    }
    fmt.Println("SDK created")

    // The MSP client allow us to retrieve user information from their identity, enroll and register users
    mspClient, err := msp.New(sdk.Context(), msp.WithOrg(orgName))
    if err != nil {
        fmt.Println("failed to create MSP client")
        return
    }
    fmt.Println("MSP client created")

    // Enroll Admin
    // Enroll function enrolls a registered user in order to receive a signed X.509 cerificate. A new key pair is generated for the user.
    // The private key and the enrollment certificate issued by the CA are stored in the SDK stores and can be retrieved by calling
    // IdentityManager.GetSigningIdentity()
    err = mspClient.Enroll(adminName, msp.WithSecret("adminpw"))
    if err != nil {
        fmt.Printf("failed to enroll the admin user: %s\n", err)
        return
    }

    enrolledUser, err := mspClient.GetSigningIdentity(adminName)
    if err != nil {
        fmt.Printf("user not found: %s\n", err)
        return
    }

    if enrolledUser.Identifier().ID != adminName {
        fmt.Println("enrolled user name doesn't match")
        return
    }
    fmt.Println("enroll admin user completed")

    // Close SDK
    sdk.Close()
}
