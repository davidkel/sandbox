package main

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/sha256"
	"crypto/x509"
	"encoding/hex"
	"encoding/pem"
	"fmt"
	"io/ioutil"
	"os"
)

func main() {
	// get public key
	cert, err := ioutil.ReadFile(os.Args[1])
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
	block, _ := pem.Decode(cert)
	fmt.Println(block.Bytes)

	x590cert, _ := x509.ParseCertificate(block.Bytes)
	pk := x590cert.PublicKey

	//y, _ := x509.ParsePKIXPublicKey(block.Bytes)
	fmt.Println(hex.EncodeToString(skiForKey(pk.(*ecdsa.PublicKey))))
}

func skiForKey(pk *ecdsa.PublicKey) []byte {
	ski := sha256.Sum256(elliptic.Marshal(pk.Curve, pk.X, pk.Y))
	return ski[:]
}
