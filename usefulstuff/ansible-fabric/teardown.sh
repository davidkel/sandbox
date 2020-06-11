#!/bin/bash

set -e -o nounset -o pipefail

baseDirectory=$(dirname "$0")
networkName="hub_default"

if [[ ! -x "$(command -v jq)" ]]; then
  echo "'jq' was not found in PATH"
  exit 1
fi

directoriesToCleanup="${baseDirectory}/gateways ${baseDirectory}/nodes ${baseDirectory}/wallet ${baseDirectory}/zips ${baseDirectory}/contracts"

if [[ "$OSTYPE" == "darwin"* ]]; then
  rm -rf ${directoriesToCleanup}
elif [[ "$OSTYPE" == "linux-gnu" ]]; then
  sudo rm -rf ${directoriesToCleanup}
fi

networks=$(docker network ls --format '{{ .Name }}')
contractVersion=$(jq --raw-output '.version' "${baseDirectory}/../../smart-contract/package.json")
tradeNetworkContainers=("peer0.banka.example.com" "ca.bankb.example.com" "orderer.example.com" "wt-bankaPeer1-trade-network-${contractVersion}" "couchdb0.banka.example.com" "couchdb0.bankb.example.com" "peer0.bankb.example.com" "wt-bankbPeer1-trade-network-${contractVersion}" "ca.banka.example.com" "ca.orderer.example.com")

if [[ "${networks}"  =~ "${networkName}" ]]; then
  runningContainers=$(docker network inspect "${networkName}" | jq --raw-output '.[0].Containers[].Name')
  tradeNetworkRunningContainers=$(comm -12 <(printf '%s\n' "${tradeNetworkContainers[@]}" | sort) <(printf '%s\n' "${runningContainers}" | sort))

  if [[ -n "${tradeNetworkRunningContainers}" ]]; then
    docker rm --force ${tradeNetworkRunningContainers}
  fi

  if [ "${#tradeNetworkRunningContainers}" -eq "${#runningContainers}" ]; then
    docker network rm "${networkName}"
  fi
fi

echo y | docker volume prune

# remove all chaincode images to avoid reusing old ones which isn't expected
chaincodeImages=$(docker images wt-* --quiet)

if [[ -n "${chaincodeImages}" ]]; then
  docker rmi ${chaincodeImages}
fi
