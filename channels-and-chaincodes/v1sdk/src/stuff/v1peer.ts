import * as protos from 'fabric-protos';
import { Channel, ProposalResponse } from 'fabric-client';
const NodeSDKClient = require('fabric-client');
const TransactionID = require('fabric-client/lib/TransactionID');

export class PeerDetails {
    constructor(public readonly endpoint: string, public readonly tlsCACert: string|undefined, public readonly sslTargetNameOverride: string|undefined) { }
}

export class Identity {
    constructor(public readonly mspId: string, public readonly cert: string, public readonly key: string) { }
}

export class ChannelDetails {
    constructor(public readonly channelName: string, public readonly isV2Lifecycle: boolean) { }
}

export class InstalledSmartContract {
    constructor(public readonly packageId: string, public readonly label: string) {}
}

export class Peer {

    constructor(public readonly peerDetails: PeerDetails, public readonly identity: Identity) { }

    public async getAllInstalledV2SmartContracts(requestTimeout?: number): Promise<InstalledSmartContract[]> {
        const results: InstalledSmartContract[] = [];

        try {
            const arg: Uint8Array = protos.lifecycle.QueryInstalledChaincodesArgs.encode({}).finish();

            const buildRequest: { fcn: string; args: Buffer[] } = {
                fcn: 'QueryInstalledChaincodes',
                args: [Buffer.from(arg)]
            };

            const responses: ProposalResponse = await this.#sendRequest(buildRequest, '_lifecycle', '', requestTimeout);

            const payloads: Buffer[] = await this.#validateResponses(responses);

            // only sent to one peer so should only be one payload
            const queryAllResults: protos.lifecycle.QueryInstalledChaincodesResult = protos.lifecycle.QueryInstalledChaincodesResult.decode(payloads[0]);
            for (const queryResults of queryAllResults.installed_chaincodes) {
                const packageId = queryResults.package_id;
                const label = queryResults.label;

                const result = new InstalledSmartContract(packageId!, label!); 

                results.push(result);
            }


            return results;
        } catch (error) {
            throw new Error(`Could not get all the installed smart contract packages, received: ${(error as Error).message}`);
        }
    }        

    async getAllChannels(): Promise<ChannelDetails[]> {

        const results: ChannelDetails[] = [];
        try {

            const buildRequest: { fcn: string; args: Buffer[] } = {
                fcn: 'GetChannels',
                args: []
            };

            const responses: any = await this.#sendRequest(buildRequest, 'cscc', '');
            //console.log(responses);
            //const payloads: Buffer[] = this.#validateResponses(responses);
            //console.log(payloads[0]);

            // only sent to one peer so only one payload
            const queryTrans: protos.protos.ChannelQueryResponse = protos.protos.ChannelQueryResponse.decode(responses[0][0].response.payload);
            for (const channelInfo of queryTrans.channels) {
                const channelCapabilities = await this.#getChannelCapabilities(channelInfo.channel_id!);
                const channelDetails = new ChannelDetails(channelInfo.channel_id!, channelCapabilities.includes('V2_0'));
                results.push(channelDetails);
            }
            return results;
        } catch (error) {
            throw new Error(`Could not get all channel names, received: ${(error as Error).message}`);
        }
    }


    // if (!capabilities.includes('V2_0')) {
    async #getChannelCapabilities(channelName: string, requestTimeout?: number): Promise<string[]> {
        const buildRequest: { fcn: string; args: Buffer[] } = {
            fcn: 'GetConfigBlock',
            args: [channelName as any]
        };

        const response: any = await this.#sendRequest(buildRequest, 'cscc', '', requestTimeout);
        console.log(response[0][0].response);
        //const payload: Buffer[] = this.#validateResponses(response);
        const block: protos.common.Block = protos.common.Block.decode(response[0][0].response.payload);
        const blockData: Uint8Array = block.data!.data![0];
        const envelope: protos.common.Envelope = protos.common.Envelope.decode(blockData);
        const dataPayload: protos.common.Payload = protos.common.Payload.decode(envelope.payload);
        const configEnvelope: protos.common.ConfigEnvelope = protos.common.ConfigEnvelope.decode(dataPayload.data);
        const _capabilities: protos.common.Capabilities = protos.common.Capabilities.decode(configEnvelope.config!.channel_group!.groups!.Application.values!.Capabilities.value!);
        const capabilities: any = _capabilities.capabilities;
        const keys: string[] = Object.keys(capabilities);
        return keys;
    }

    async #sendRequest(buildRequest: any, chaincodeID: string, channelName: string, requestTimeout?: number): Promise<ProposalResponse> {
        const {fabricClient, peer} = await this.#initialize();
        buildRequest.targets = [peer];
        buildRequest.chaincodeId = chaincodeID;

            // TODO: Could use a wallet

            const user = await fabricClient.createUser({
                skipPersistence: true,
                username: 'admin',
                mspid: this.identity.mspId,
                cryptoContent: {
                    privateKeyPEM: this.identity.key,
                    signedCertPEM: this.identity.cert
                }
            });

            const txId = new TransactionID(user, false);
            fabricClient.setUserContext(user);
            buildRequest.txId = txId;


            //if (requestTimeout) {
                // use the one set in the params if set otherwise use the one set when the peer was added
             //   endorseRequest.requestTimeout = requestTimeout;
            //}


            // @ts-ignore
            const response: ProposalResponse = await Channel.sendTransactionProposal(buildRequest, channelName, fabricClient);
            return response;

    }

    #validateResponses(responses: any): Buffer[] {
        // responses[0] = array
        // responses[1] = object

        // [

        
        //     [
        //       {
        //         version: 0,
        //         timestamp: null,
        //         response: [Object],
        //         payload: <Buffer >,
        //         endorsement: null,
        //         peer: [Object]
        //       }
        //     ],


        //     {
        //       header: ByteBuffer {
        //         buffer: <Buffer 0a 5e 08 03 10 01 1a 0c 08 d7 e6 8e 90 06 10 c0 a7 89 c2 01 2a 40 65 61 37 30 63 37 35 35 33 63 33 66 31 35 31 62 35 36 36 35 38 39 63 63 62 32 34 65 ... 904 more bytes>,
        //         offset: 0,
        //         markedOffset: -1,
        //         limit: 954,
        //         littleEndian: false,
        //         noAssert: false
        //       },
        //       payload: ByteBuffer {
        //         buffer: <Buffer 0a 29 0a 27 08 01 12 06 12 04 63 73 63 63 1a 1b 0a 0e 47 65 74 43 6f 6e 66 69 67 42 6c 6f 63 6b 0a 09 6d 79 63 68 61 6e 6e 65 6c>,
        //         offset: 0,
        //         markedOffset: -1,
        //         limit: 43,
        //         littleEndian: false,
        //         noAssert: false
        //       },
        //       extension: ByteBuffer {
        //         buffer: <Buffer >,
        //         offset: 0,
        //         markedOffset: -1,
        //         limit: 0,
        //         littleEndian: false,
        //         noAssert: false
        //       }
        //     }
    
        //   ]



        const payloads: Buffer[] = [];

        if (responses.errors && responses.errors.length > 0) {
            for (const error of responses.errors) {
                throw error;
            }
        } else if (responses.responses && responses.responses.length > 0) {
            for (const response of responses.responses) {
                if (response.response && response.response.status) {
                    if (response.response.status === 200) {
                        payloads.push(response.response.payload);

                    } else {
                        throw new Error(`failed with status:${response.response.status} ::${response.response.message}`);
                    }
                } else {
                    throw new Error('failure in response');
                }
            }
        } else {
            throw new Error('No response returned');
        }

        return payloads;

    }

    async #initialize(): Promise<any> {
        const fabricClient = new NodeSDKClient();
        //required for mutualTLS
        //fabricClient.setTlsClientCertAndKey(this.clientCertKey!, this.clientKey!);

        const options: any = {
        };

        if (this.peerDetails.tlsCACert) {
            options.pem = this.peerDetails.tlsCACert;
        }

        if (this.peerDetails.sslTargetNameOverride) {
            options['ssl-target-name-override'] = this.peerDetails.sslTargetNameOverride;
        }

        const peer = fabricClient.newPeer(this.peerDetails.endpoint, options);


        // if (this.requestTimeout) {
        //     options.requestTimeout = this.requestTimeout;
        // }


        const defKVStore = await NodeSDKClient.newDefaultKeyValueStore({path: '/tmp/fu'});
        fabricClient.setStateStore(defKVStore);
        const cSuite = NodeSDKClient.newCryptoSuite();
        const cStore = NodeSDKClient.newCryptoKeyStore();
        cSuite.setCryptoKeyStore(cStore);
        fabricClient.setCryptoSuite(cSuite);

        return {fabricClient, peer};
    }


    public async getAllInstantiatedV1Chaincodes(channel: string): Promise<string[]>  {
        const definitions: string[] = [];
        try {
            const buildRequest: { fcn: string; args: Buffer[] } = {
                fcn: 'GetChaincodes',
                args: []
            };

            const result: any = await this.#sendRequest(buildRequest, 'lscc', channel);
            //const payload: Buffer[] = this.#validateResponses(result);
            const queryTrans: protos.protos.ChaincodeQueryResponse = protos.protos.ChaincodeQueryResponse.decode(result[0][0].response.payload);
            for (const chaincode of queryTrans.chaincodes) {
                definitions.push(chaincode.name!);
            }
            return definitions;
        } catch (error) {
            throw new Error(`Could not get smart contract definitions, received error: ${(error as Error).message}`);
        }
    }
    
    public async getAllCommittedV2Chaincodes(channel: string): Promise<string[]> {
        const definitions: string[] = [];

        try {
            const protoArgs: protos.lifecycle.IQueryChaincodeDefinitionsArgs = {};

            const arg: Uint8Array = protos.lifecycle.QueryChaincodeDefinitionsArgs.encode(protoArgs).finish();

            const buildRequest: { fcn: string; args: Buffer[] } = {
                fcn: 'QueryChaincodeDefinitions',
                args: [Buffer.from(arg)]
            };

            const responses: any = await this.#sendRequest(buildRequest, '_lifecycle', channel);
            //const payloads: Buffer[] = this.#validateResponses(responses);
            // only sent the request to one peer so only expect one response
            const results: protos.lifecycle.QueryChaincodeDefinitionsResult = protos.lifecycle.QueryChaincodeDefinitionsResult.decode(responses[0][0].response.payload);
            const smartContractDefinitions: protos.lifecycle.QueryChaincodeDefinitionsResult.IChaincodeDefinition[] = results.chaincode_definitions;
            for (const smartContractDefinition of smartContractDefinitions) {
                definitions.push(smartContractDefinition.name!);
            }
            return definitions;
        } catch (error) {
            throw new Error(`Could not get smart contract definitions, received error: ${(error as Error).message}`);
        }        

    }
}