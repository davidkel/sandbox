package main

import (
	//"bytes"
	//"encoding/json"
	"errors"
	"fmt"
	//"io/ioutil"
	"os"
	"strings"

	//yaml "gopkg.in/yaml.v2"

	"github.com/hyperledger/fabric-sdk-go/pkg/client/channel"
	"github.com/hyperledger/fabric-sdk-go/pkg/client/msp"
	"github.com/hyperledger/fabric-sdk-go/pkg/common/errors/retry"
	"github.com/hyperledger/fabric-sdk-go/pkg/core/config"
	"github.com/hyperledger/fabric-sdk-go/pkg/core/cryptosuite"
	"github.com/hyperledger/fabric-sdk-go/pkg/fabsdk"
	"github.com/spf13/viper"
)

// NOTE: changed /home/dave/code/sandbox/gosdk/src/code/vendor/github.com/hyperledger/fabric-sdk-go/pkg/fab/endpointconfig.go
// func (c *EndpointConfig) EventServiceType() fab.EventServiceType {
// 	etype := c.backend.GetString("client.eventService.type")
// 	switch etype {
// 	case "eventhub":
// 		return fab.EventHubEventServiceType
// 	case "deliver":
// 		return fab.DeliverEventServiceType
// 	default:
// 		//DAVE: return fab.AutoDetectEventServiceType
// 		return fab.DeliverEventServiceType
// 	}
// }

// NOTE: changed fabsdk.go options --> Options (NOT REQUIRED)

type dummy struct {
	// Have to embed the interface type otherwise it won't work because it tests to see if it can cast
	// dummy to the unexported interface field
	cryptosuite.CryptoConfigOptions
	test bool
}

// func (c *dummy) IsSecurityEnabled() bool {
//     return false
// }

// // SecurityAlgorithm returns cryptoSuite config hash algorithm
// func (c *dummy) SecurityAlgorithm() string {
// 	return ""
// }

// // SecurityLevel returns cryptSuite config security level
// func (c *dummy) SecurityLevel() int {
// 	return 0
// }

//SecurityProvider provider SW or PKCS11
func (c *dummy) SecurityProvider() string {
	fmt.Println("my security provider was called")
	return ""
}

// //SoftVerify flag
// func (c *dummy) SoftVerify() bool {
// 	return true
// }

// //SecurityProviderLibPath will be set only if provider is PKCS11
// func (c *dummy) SecurityProviderLibPath() string {
// 	return ""
// }

// //SecurityProviderPin will be set only if provider is PKCS11
// func (c *dummy) SecurityProviderPin() string {
//     return ""
// }

// //SecurityProviderLabel will be set only if provider is PKCS11
// func (c *dummy) SecurityProviderLabel() string {
//     return ""
// }

func (c *dummy) KeyStorePath() string {
	fmt.Println("I was called")
	return "/tmp/mykeystore"
}

// Definition of the Fabric SDK properties
var (
	//channelID = "mychannel"
	orgName = "Org1"
	//orgAdmin  = "Admin"
	//ccID      = "trade-network"
	//ordererID      = "orderer.example.com"
	//channelConfig  = os.Getenv("GOPATH") + "/src/github.com/hyperledger/fabric-samples/basic-network/config/channel.tx"
	//chaincodeGoPath = os.Getenv("GOPATH")
	//chaincodePath   = "github.com/hyperledger/fabric-samples/chaincode/MyChaincode/go/"
	configFile = os.Getenv("HOME") + "/code2/sandbox/gosdk/src/code/connection.json"
	//userName        = "gava"
	adminName = "admin"
)

func newViper( /*cmdRootPrefix string*/ ) *viper.Viper {
	myViper := viper.New()
	myViper.SetEnvPrefix("FABRIC_SDK")
	myViper.AutomaticEnv()
	replacer := strings.NewReplacer(".", "_")
	myViper.SetEnvKeyReplacer(replacer)
	return myViper
}

func main() {
	// Initialize the SDK with the configuration file

	// read straight from file
	//fmt.Println(configFile)

	sdk, err := fabsdk.New(config.FromFile(configFile))
	if err != nil {
		fmt.Printf("failed to create SDK: %v\n", err)
		return
	}
	fmt.Println("SDK created")

	/*
		ccp := newViper()
		ccp.SetConfigFile(configFile)
		ccp.MergeInConfig()

		// add the relevant stuff to viper
		c := ccp.AllSettings()
		bs, _ := yaml.Marshal(c)
		//bs, _ := json.Marshal(c)
		fmt.Println(string(bs))
		r := bytes.NewReader(bs)

		sdk, err := fabsdk.New(config.FromReader(r, "json"), GoodOpt())
		if err != nil {
			fmt.Printf("failed to create SDK: %v\n", err)
			return
		}
		fmt.Println("SDK created")
	*/

	/*
			dat, _ := ioutil.ReadFile(configFile)
			var f interface{}
			json.Unmarshal(dat, &f)
			m := f.(map[string]interface{})
			cc := m["client"].(map[string]interface{})
			cs := cc["credentialStore"].(map[string]interface{})
			//p := cs["path"] //.(string)
			cs["path"] = "/tmp/state2"
			//fmt.Println(p)
			// manipulate f somehow
			bs, _ := json.Marshal(f)
			fmt.Println(string(bs))
			r := bytes.NewReader(bs)

			sdk, err := fabsdk.New(config.FromReader(r, "json"), fabsdk.WithCryptoSuiteConfig(&dummy{}))
			if err != nil {
				fmt.Printf("failed to create SDK: %v\n", err)
				return
			}

		fmt.Println("SDK created")
	*/

	// The MSP client allow us to retrieve user information from their identity, enroll and register users
	mspClient, err := msp.New(sdk.Context(), msp.WithOrg(orgName))
	if err != nil {
		fmt.Println("failed to create MSP client")
		return
	}
	fmt.Println("MSP client created")

	enrolledUser, err := mspClient.GetSigningIdentity(adminName)
	err = errors.New("some error") // force re-enroll
	if err != nil {
		fmt.Printf("user not found, will attempt to enroll: %s\n", err)
		// Enroll Admin
		// Enroll function enrolls a registered user in order to receive a signed X.509 cerificate. A new key pair is generated for the user.
		// The private key and the enrollment certificate issued by the CA are stored in the SDK stores and can be retrieved by calling
		// IdentityManager.GetSigningIdentity()
		err = mspClient.Enroll(adminName, msp.WithSecret("adminpw"))
		if err != nil {
			fmt.Printf("failed to enroll the admin user: %s\n", err)
			return
		}
		enrolledUser, err = mspClient.GetSigningIdentity(adminName)
		if err != nil {
			fmt.Printf("user not found, even after successful enroll: %s\n", err)
			return
		}
		fmt.Println("enroll admin user completed")
	} else {
		fmt.Println("admin user already exists")

	}

	if enrolledUser.Identifier().ID != adminName {
		fmt.Println("enrolled user name doesn't match")
		return
	}

	channel, err := channel.New(sdk.ChannelContext("mychannel" /*fabsdk.WithIdentity(enrolledUser),*/, fabsdk.WithUser(adminName), fabsdk.WithOrg(orgName)))

	if err != nil {
		fmt.Printf("no channel: %s\n", err)
		return
	}

	executeCC(channel, "instantiate", nil)

	// Close SDK
	sdk.Close()
}

func executeCC(client *channel.Client, fcn string, args [][]byte) {
	fmt.Println("About to execute")
	_, err := client.Execute(channel.Request{ChaincodeID: "trade-network", Fcn: fcn, Args: args},
		channel.WithRetry(retry.DefaultChannelOpts))
	if err != nil {
		fmt.Printf("Guess it didn't work: %s\n", err)
	}
	fmt.Println("Guess it worked")
}
