#!/bin/bash

set -e -o nounset -o pipefail

echo "Creating CDS files"

baseDirectory=$(cd $(dirname ${BASH_SOURCE[0]}) && pwd)
pathToContracts="${baseDirectory}/contracts"

mkdir -p "${pathToContracts}"
cd "${baseDirectory}/../../shared-network/app/tools/cds-builder"

if [[ ! -d node_modules ]]; then
  npm install
fi

set +e
isJqInstalled=$(command -v jq)
set -e
if [[ "${isJqInstalled}" == "" ]]; then
  echo "jq is not installed, which is required to run this script"

  exit 1
fi

contractVersion=$(jq --raw-output '.version' "${baseDirectory}/../../smart-contract/package.json")

echo "Building trade network CDS"
npx ts-node index.ts build -s "${baseDirectory}/../../smart-contract/dist" -d "${pathToContracts}" -n trade-network -c "${contractVersion}" -i

cd "${baseDirectory}"

echo "Starting network..."
docker run --rm --network=host -e CONTRACT_VERSION="${contractVersion}" -v /var/run/docker.sock:/var/run/docker.sock -v "${baseDirectory}":/mount ibmblockchain/vscode-prereqs:0.0.16 ansible-playbook /mount/network.yaml
