import { ProposalResponse } from 'fabric-common';
import * as protos from 'fabric-protos';
import { Client, ConnectOptions, Endorser, Channel, Endorsement, Endpoint, User, IdentityContext } from 'fabric-common';

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

            const responses: ProposalResponse = await this.#sendRequest(buildRequest, 'cscc', '');
            const payloads: Buffer[] = this.#validateResponses(responses);

            // only sent to one peer so only one payload
            const queryTrans: protos.protos.ChannelQueryResponse = protos.protos.ChannelQueryResponse.decode(payloads[0]);
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

        const response: ProposalResponse = await this.#sendRequest(buildRequest, 'cscc', '', requestTimeout);
        const payload: Buffer[] = this.#validateResponses(response);
        const block: protos.common.Block = protos.common.Block.decode(payload[0]);
        const blockData: Uint8Array = block.data!.data![0];
        const envelope: protos.common.Envelope = protos.common.Envelope.decode(blockData);
        const dataPayload: protos.common.Payload = protos.common.Payload.decode(envelope.payload);
        const configEnvelope: protos.common.ConfigEnvelope = protos.common.ConfigEnvelope.decode(dataPayload.data);
        const _capabilities: protos.common.Capabilities = protos.common.Capabilities.decode(configEnvelope.config!.channel_group!.groups!.Application.values!.Capabilities.value!);
        const capabilities: any = _capabilities.capabilities;
        const keys: string[] = Object.keys(capabilities);
        return keys;
    }

    async #sendRequest(buildRequest: { fcn: string, args: Buffer[] }, chaincodeID: string, channelName: string, requestTimeout?: number): Promise<ProposalResponse> {
        const fabricClient: Client = this.#initialize();

        const endorser: Endorser = fabricClient.getEndorser(this.peerDetails.endpoint, this.identity.mspId);

        try {
            // @ts-ignore
            await endorser.connect();

            const channel: Channel = fabricClient.newChannel('noname');
            // this will tell the peer it is a system wide request
            // not for a specific channel
            // @ts-ignore
            channel['name'] = channelName;

            const endorsement: Endorsement = channel.newEndorsement(chaincodeID);

            // TODO: Could use a wallet
            const user = User.createUser('', '', this.identity.mspId, this.identity.cert, this.identity.key);
            const identityContext: IdentityContext = fabricClient.newIdentityContext(user);
            endorsement.build(identityContext, buildRequest as any);

            endorsement.sign(identityContext);

            const endorseRequest: any = {
                targets: [endorser]
            };

            if (requestTimeout) {
                // use the one set in the params if set otherwise use the one set when the peer was added
                endorseRequest.requestTimeout = requestTimeout;
            }

            const response: ProposalResponse = await endorsement.send(endorseRequest);
            return response;
        } finally {
            endorser.disconnect();
        }
    }

    #validateResponses(responses: ProposalResponse): Buffer[] {

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

    #initialize(): Client {
        const fabricClient: Client = new Client('lifecycle');
        //required for mutualTLS
        //fabricClient.setTlsClientCertAndKey(this.clientCertKey!, this.clientKey!);

        const options: ConnectOptions = {
            url: this.peerDetails.endpoint
        };

        if (this.peerDetails.tlsCACert) {
            options.pem = this.peerDetails.tlsCACert;
        }

        if (this.peerDetails.sslTargetNameOverride) {
            options['ssl-target-name-override'] = this.peerDetails.sslTargetNameOverride;
        }

        // if (this.requestTimeout) {
        //     options.requestTimeout = this.requestTimeout;
        // }

        const endpoint: Endpoint = fabricClient.newEndpoint(options);

        // this will add the peer to the list of endorsers
        const endorser: Endorser = fabricClient.getEndorser(this.peerDetails.endpoint, this.identity.mspId);
        endorser.setEndpoint(endpoint);

        return fabricClient;
    }


    public async getAllInstantiatedV1Chaincodes(channel: string): Promise<string[]>  {
        const definitions: string[] = [];
        try {
            const buildRequest: { fcn: string; args: Buffer[] } = {
                fcn: 'GetChaincodes',
                args: []
            };

            const result: ProposalResponse = await this.#sendRequest(buildRequest, 'lscc', channel);
            const payload: Buffer[] = this.#validateResponses(result);
            const queryTrans: protos.protos.ChaincodeQueryResponse = protos.protos.ChaincodeQueryResponse.decode(payload[0]);
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

            const responses: ProposalResponse = await this.#sendRequest(buildRequest, '_lifecycle', channel);
            const payloads: Buffer[] = this.#validateResponses(responses);
            // only sent the request to one peer so only expect one response
            const results: protos.lifecycle.QueryChaincodeDefinitionsResult = protos.lifecycle.QueryChaincodeDefinitionsResult.decode(payloads[0]);
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