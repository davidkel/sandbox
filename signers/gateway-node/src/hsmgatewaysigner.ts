/* */

'use strict';

import * as crypto from 'crypto';
import * as pkcs11js from 'pkcs11js';
import jsrsa = require('jsrsasign');
import * as elliptic from 'elliptic';
import BN = require("bn.js");
const ecSignature = require('elliptic/lib/elliptic/ec/signature.js');  // eslint-disable-line
type DER = string | number[];
type SignerFunction = (digest: Buffer) => Buffer; // to match node-sdk for testing, doesn't match gateway at the moment

let hsmSignerFactory: HSMSignerFactory | undefined;


// TODO: Design choices
// 1. Single session
// 2. Session per signer
// 3. Session pool

// 1. Option 1 for prototype is single session
// Given node is single threaded I don't know if there is any point in having multiple sessions
// having multiple sessions might be needed to allow interleaving between a sign init and a sign (wrapped in promises) but
// sign init may not even go to the HSM and the sign itself will block the node thread until it returns anyway
// single session is also how the current SDK does things
// This restricts you to 1 slot in your application. You can't have multiple slots

export interface HSMInitializationOptions {
    library: string;
    label: string;
    pin: string;
    userType?: number;
    readWrite?: boolean;
}

//export interface HSMSignerIdentifiers {
//    identity: string;
// TODO: Could add label and pin in the future and allow a more granular solution ?
//}

/**
 * Initialize the HSM signer implementation to use a specific pkcs11 library, label and pin.
 * <p>
 * This must be called before trying to obtain an HSM Signer
 *
 * @param hsmOptions - The HSM initialization options
 */
export const initializeHSMSigners = (hsmOptions: HSMInitializationOptions): void => {
    if (hsmSignerFactory) {
        return;
    }
    hsmSignerFactory = new HSMSignerFactory(hsmOptions.library, hsmOptions.label, hsmOptions.pin, hsmOptions.userType, hsmOptions.readWrite);
    try {
        hsmSignerFactory.initialize();
    } catch(error) {
        hsmSignerFactory = undefined;
        throw error;
    }
}

/**
 * This returns a signer that will use the private key stored in an HSM as configured via the initializeHSMSigners call.
 * The identifier should match the value used for the CKA_ID attribute of the private key object that is stored in the
 * HSM.
 * <p>
 * Fabric by default uses an SKI derived from the public certificate for the CKA_ID which means you can just pass the public
 * certificate as the identifier. If however you make use of the AltID feature then you would need to pass the value that
 * was specified for AltID when the keypair were generated.
 *
 * @param identifier - The identifier associated with the private key stored in the HSM. This can be the public certificate
 * in PEM format if you used the default fabric-ca-client mechanism for generating keypairs.
 * @returns An HSM Signing implementation
 */
export const getHSMSignerFunction = (identifier: string): SignerFunction => {
    if (!hsmSignerFactory) {
        throw Error('initializeHSMSigners has not been called or disposeHSMSigners has been called, cannot get a signer withouy an initialized HSM Signers environment');
    }
    return hsmSignerFactory.getSigner(identifier);
}

/**
 * performs a cleanup of the HSM Signer implementation.
 * <p>
 * Once called you won't be able to get or use an existing HSM Signer until you call initializeHSMSigners again
 */
export const disposeHSMSigners = (): void => {
    if (!hsmSignerFactory) {
        return;
    }
    hsmSignerFactory.dispose();
    hsmSignerFactory = undefined;
}

// Only support 256 bit keySizes although technically fabric has code to try to handle 384 but unknown on it's
// state of testing
const supportedKeySize = 256;

class HSMSignerFactory {

    #pkcs: pkcs11js.PKCS11;
    #slot: Buffer | null = null;
    #session: Buffer = Buffer.from('NOT INIT');
    #signerCache = new Map<string, SignerFunction>();

    // TEMP CODE
    private globalSigner: SignerFunction | undefined;

    constructor(
        private readonly library: string,
        private readonly label: string,
        private readonly pin: string,
        private readonly usertype: number = pkcs11js.CKU_USER,
        private readonly readwrite: boolean = true
    ) {
        this.#pkcs = new pkcs11js.PKCS11()
    }

    public initialize(): void {
        if (!this.library || this.library.trim() === '') {
            throw new Error('pkcs11 library property must be provided');
        }

        if (!this.label || this.label.trim() === '') {
            throw new Error('pkcs11 label property must be provided');
        }

        if (!this.pin || this.pin.trim() === '') {
            throw new Error('pkcs11 pin property must be provided');
        }

        this.#pkcs.load(this.library);
        this.#pkcs.C_Initialize();

        // TODO: Logging ?
        // console.log(this.#pkcs.C_GetInfo());

        this.#slot = this.findSlotForLabel(this.label);
        let flags = pkcs11js.CKF_SERIAL_SESSION;
        if (this.readwrite) {
            flags = flags | pkcs11js.CKF_RW_SESSION;
        }

        this.#session = this.#pkcs.C_OpenSession(this.#slot, flags);

        // TODO: Logging ?
        // console.log(this.#pkcs.C_GetSessionInfo(this.#session));

        this.#pkcs.C_Login(this.#session, this.usertype, this.pin);
    }

    public getSigner(identifier: string): SignerFunction {
        // TEMP CODE
        if (this.globalSigner) {
            return this.globalSigner;
        }

        // if the identifier is a certificate then calculate the ski and use that, otherwise this is the identifier to find the HSM object
        // hex ski is the standard fabric mechanism, however altId is supported and this provides the option to use an equivalent id
        let hsmIdentifier: string | Buffer = identifier;

        if (identifier.startsWith('-----BEGIN CERTIFICATE-----')) {
            hsmIdentifier = Buffer.from(this.getSKIFromCertificate(identifier), 'hex');
        }

        // We must cache the object handle to ensure that signers who are interested in the same HSM object don't
        // always try to find the object in the HSM, so that can be achieved by caching the signer function.
        const cacheKey = this.getCacheKey(pkcs11js.CKO_PRIVATE_KEY, hsmIdentifier);
        let signer = this.#signerCache.get(cacheKey);

        if (!signer) {
            signer = this.createSignerFunction(hsmIdentifier);
            this.#signerCache.set(cacheKey, signer);

            // TEMP CODE
            this.globalSigner = signer;
        }

        return signer;
    }

    public dispose(): void {
        this.#pkcs.C_CloseSession(this.#session);
        this.#pkcs.C_Finalize();
    }

    private findSlotForLabel(pkcs11Label: string): Buffer {
        const slots = this.#pkcs.C_GetSlotList(true);

        // TODO: Logging ?
        // console.log(slots);

        if (!slots || slots.length === 0) {
            throw new Error('No pkcs11 slots have been created');
        }

        let slot: Buffer | undefined;
        let tokenInfo: pkcs11js.TokenInfo | undefined;  // TODO: shouldn't have to do this tokenInfo will always be assigned

        for (const slotToCheck of slots) {
            tokenInfo = this.#pkcs.C_GetTokenInfo(slotToCheck);
            if (tokenInfo && tokenInfo.label && tokenInfo.label.trim() === pkcs11Label) {
                slot = slotToCheck;
                break;
            }
        }

        if (!slot) {
            throw new Error(`label ${pkcs11Label} cannot be found in the pkcs11 slot list`);
        }

        // TODO: Is there any sort of logging ?
        // Getting info about slot
        // console.log(this.#pkcs.C_GetSlotInfo(slot));
        // Getting info about token
        // console.log(tokenInfo);
        // Getting info about Mechanism
        // console.log(this.#pkcs.C_GetMechanismList(slot));

        return slot;
    }

    private getCacheKey(keytype: number, identifier: string | Buffer): string {
        let key = keytype.toString();
        if (identifier instanceof Buffer) {
            key += identifier.toString('hex');
        } else {
            key += identifier;
        }

        return key;
    }

    private findObjectInHSM(keytype: number, identifier: string | Buffer): Buffer {
        const pkcs11Template: pkcs11js.Template = [
            { type: pkcs11js.CKA_ID, value: identifier },
            { type: pkcs11js.CKA_CLASS, value: keytype },
            { type: pkcs11js.CKA_KEY_TYPE, value: pkcs11js.CKK_EC }
        ]
        this.#pkcs.C_FindObjectsInit(this.#session, pkcs11Template);
        const hsmObjects = this.#pkcs.C_FindObjects(this.#session, 1);

        if (!hsmObjects || hsmObjects.length === 0) {
            this.#pkcs.C_FindObjectsFinal(this.#session);
            throw new Error(`Unable to find object in HSM with ID ${identifier.toString()}`);
        }

        this.#pkcs.C_FindObjectsFinal(this.#session);

        return hsmObjects[0];
    }

    private getSKIFromCertificate(pem: string): string {
        const key = jsrsa.KEYUTIL.getKey(pem);
        const uncompressedPoint = this.getUncompressedPointOnCurve(key as jsrsa.KJUR.crypto.ECDSA);
        const hashBuffer = crypto.createHash('sha256');
        hashBuffer.update(uncompressedPoint);

        return hashBuffer.digest('hex');
    }

    private getUncompressedPointOnCurve(key: jsrsa.KJUR.crypto.ECDSA): Buffer {
        const xyhex = key.getPublicKeyXYHex();
        const xBuffer = Buffer.from(xyhex.x, 'hex');
        const yBuffer = Buffer.from(xyhex.y, 'hex');
        const uncompressedPrefix = Buffer.from('04', 'hex');
        const uncompressedPoint = Buffer.concat([uncompressedPrefix, xBuffer, yBuffer]);
        return uncompressedPoint;
    }

    private createSignerFunction(hsmIdentifier: Buffer | string): SignerFunction {

        // get values required for signer for use within the closure
        const privateKeyHandle = this.findObjectInHSM(pkcs11js.CKO_PRIVATE_KEY, hsmIdentifier);
        const pkcs = this.#pkcs;
        const session = this.#session;
        const definedCurves = elliptic.curves as unknown as { [key: string]: elliptic.curves.PresetCurve };
        const ecdsaCurve = definedCurves[`p${supportedKeySize}`];
        const bigNum = ecdsaCurve.n!; // eslint-disable-line
        const halfOrder = bigNum.shrn(1);

        const signer: SignerFunction = (digest: Buffer) => {
            pkcs.C_SignInit(session, { mechanism: pkcs11js.CKM_ECDSA }, privateKeyHandle);
            const sig = pkcs.C_Sign(session, digest, Buffer.alloc(supportedKeySize));

            // ASN1 DER encoding against malleability.
            const r = new BN(sig.slice(0, sig.length / 2).toString('hex'), 16);
            let s = new BN(sig.slice(sig.length / 2).toString('hex'), 16);

            if (s.cmp(halfOrder) === 1) {
                s = bigNum.sub(s);
            }

            const signatureInput: elliptic.SignatureInput = {
                r,
                s
            }

            const der = new ecSignature(signatureInput).toDER() as DER; // eslint-disable-line
            return Buffer.from(der);
        }
        return signer;
    }
}