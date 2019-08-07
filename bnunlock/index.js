/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const shim = require('fabric-shim');
const { KJUR, X509 } = require('jsrsasign');

class BNUnlock {

    async Init(stub) {
        // Enable this only if you have the cert/private key performing the upgrade
        // so should not be enabled for IBP Starter/Enterprise usage.
        // return this.addNewIdentity(stub);
        return shim.success();
    }

    async Invoke(stub) {
        return this.addNewIdentity(stub);
    }


    async addNewIdentity(stub) {
        const creator = stub.getCreator();
        const pem = creator.getIdBytes().toString('utf8');
        if (pem && pem.startsWith('-----BEGIN CERTIFICATE-----')) {
            const certificate = new X509();
            certificate.readCertPEM(pem);
            const identifier = KJUR.crypto.Util.hashHex(certificate.getPublicKey().pubKeyHex, 'sha256');
            const key = stub.createCompositeKey('Asset:org.hyperledger.composer.system.Identity', [identifier]);
            const value = await stub.getState(key);
            if (value.length !== 0) {
                return shim.error('identity has already been registered');
            }
            const issuer = KJUR.crypto.Util.hashHex(certificate.getIssuerString(), 'sha256');
            const name = /(\/CN=)(.*?)(\/|,|$)/.exec(certificate.getSubjectString())[2];
            const identity = {
                $class: 'org.hyperledger.composer.system.Identity',
                $registryId: 'org.hyperledger.composer.system.Identity',
                $registryType: 'Asset'
            };

            Object.assign(identity, {
                name,
                issuer,
                identityId: identifier,
                certificate: pem,
                state: 'ACTIVATED',
                participant: 'org.hyperledger.composer.system.NetworkAdmin#admin'
            });

            await stub.putState(key, Buffer.from(JSON.stringify(identity)));
        } else {
            return shim.error('Unable to retrieve transaction creator');
        }
        return shim.success();
    }
}

shim.start(new BNUnlock());

