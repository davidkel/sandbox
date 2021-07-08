/* */

'use strict';

import * as crypto from 'crypto';

import * as pkcs11js from 'pkcs11js';
import { Signer } from './signer';

import jsrsa = require('jsrsasign');

let signerFactory: SignerFactory | undefined;

// type SignerFunction = (digest: Buffer) => Buffer;

// This restricts you to 1 slot in your application. You can't have multiple slots
// add the extra requirements in an object def
export const initializeHSMSigners = (lib: string, label: string, pin: string): void => {
    if (signerFactory) {
        return;
    }
    signerFactory = new SignerFactory(lib, label, pin);
    signerFactory.initialize();
}

export const getHSMSigner = (identifier: string): Signer => {
    if (!signerFactory) {
        throw Error(' HSM Signer needs to be initialized first');
    }
    return signerFactory.getSigner(identifier);
}

export const disposeHSMSigners = (): void => {
    if (!signerFactory) {
        return;
    }
    signerFactory.dispose();
    signerFactory = undefined;
}

class SignerFactory {

    private pkcs: pkcs11js.PKCS11;
    private slot: Buffer | null = null;
    private session: Buffer = Buffer.from('NOT INIT');
    private objectHandleCache = new Map<string, Buffer>();
    private signerCache = new Map<string, Signer>();

    // TEMP CODE
    private globalSigner: Signer | undefined;

    // TODO: Make it an object ?
    constructor(
        private readonly lib: string,
        private readonly label: string,
        private readonly pin: string,
        private readonly usertype: number = 1,
        private readonly readwrite: boolean = true,
        private readonly keySize: number = 256
    ) {
        this.pkcs = new pkcs11js.PKCS11()
        if (this.keySize !== 256 && this.keySize !== 384) {
            throw Error();
        }
    }

    public initialize(): void {
        this.pkcs.load(this.lib);
        this.pkcs.C_Initialize();

        console.log(this.pkcs.C_GetInfo());

        // TODO: Design choices
        // 1. Single session
        // 2. Session per signer
        // 3. Session pool

        // 1. Option 1 for prototype is single session
        // Given node is single threaded I don't know if there is any point in having multiple sessions
        // having multiple sessions might be needed to allow interleaving between a sign init and a sign (wrapped in promises) but
        // sign init may not even go to the HSM and the sign itself will block the node thread until it returns anyway
        // single session is also how the current SDK does things
        this.slot = this.findSlotForLabel(this.label);
        let flags = pkcs11js.CKF_SERIAL_SESSION;
        if (this.readwrite) {
            flags = flags | pkcs11js.CKF_RW_SESSION;
        }

        this.session = this.pkcs.C_OpenSession(this.slot, flags);
        console.log(this.pkcs.C_GetSessionInfo(this.session));
        this.pkcs.C_Login(this.session, this.usertype, this.pin);
        // TODO: need to use try catch to get an issues such as login errors
        // Should ignore ALREADY LOGGED IN Errors
    }

    public getSigner(identifier: string): Signer {
        // TEMP CODE
        if (this.globalSigner) {
            return this.globalSigner;
        }

        // if the identifier is a certificate then calculate the ski and use that, otherwise this is the identifier to find the HSM object
        // is 256 the correct value to pass ? could be configurable in the future

        let actualIdentifier: string | Buffer = identifier;
        if (identifier.startsWith('-----BEGIN CERTIFICATE-----')) {
            actualIdentifier = Buffer.from(this.getSKIFromCertificate(identifier), 'hex');
        }

        let signer = this.signerCache.get(identifier);
        if (!signer) {
            const privateKeyHandle = this.getHandleForIdentifier(pkcs11js.CKO_PRIVATE_KEY, actualIdentifier);
            signer = new Signer(this.pkcs, this.session, privateKeyHandle, this.keySize);
            this.signerCache.set(identifier, signer);

            // TEMP CODE
            this.globalSigner = signer;
        }
        return signer;
    }

    public dispose(): void {
        this.pkcs.C_CloseSession(this.session);
        this.pkcs.C_Finalize();
        this.signerCache.clear();
        this.objectHandleCache.clear();
    }

    private findSlotForLabel(pkcs11Label: string): Buffer {
        if (!pkcs11Label || pkcs11Label.trim() === '') {
            throw new Error('No pkcs11 label provided');
        }

        pkcs11Label = pkcs11Label.trim();

        const slots = this.pkcs.C_GetSlotList(true);
        console.log(slots);

        if (!slots || slots.length === 0) {
            throw new Error('PKCS11 no slots have been created');
        }

        let slot;
        let tokenInfo;

        for (const slotToCheck of slots) {
            tokenInfo = this.pkcs.C_GetTokenInfo(slotToCheck);
            if (tokenInfo && tokenInfo.label && tokenInfo.label.trim() === pkcs11Label) {
                slot = slotToCheck;
                break;
            }
        }

        if (!slot) {
            throw new Error(`PKCS11 label ${pkcs11Label} cannot be found in the slot list`);
        }

        // Getting info about slot
        console.log(this.pkcs.C_GetSlotInfo(slot));
        // Getting info about token
        console.log(tokenInfo);
        // Getting info about Mechanism
        console.log(this.pkcs.C_GetMechanismList(slot));
        return slot;
    }

    private getHandleForIdentifier(keytype: number, identifier: string | Buffer): Buffer {
        const handle = this.getCachedHandle(keytype, identifier);

        if (handle) {
            return handle;
        }

        const keyHandle = this.findObjectInHSM(keytype, identifier);
        this.cacheHandle(keytype, identifier, keyHandle);

        return keyHandle;
    }

    private cacheHandle(keytype: number, identifier: string | Buffer, handle: Buffer) {
        this.objectHandleCache.set(this.getCacheKey(keytype, identifier), handle);
    }

    private getCachedHandle(keytype: number, identifier: string | Buffer): Buffer | undefined {
        return this.objectHandleCache.get(this.getCacheKey(keytype, identifier));
    }

    private getCacheKey(keytype: number, identifier: string| Buffer): string {
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
        this.pkcs.C_FindObjectsInit(this.session, pkcs11Template);
        const obj = this.pkcs.C_FindObjects(this.session, 1);
        if (!obj || obj.length === 0) {
            this.pkcs.C_FindObjectsFinal(this.session);
            // TODO: Improve
            throw new Error('object not found');
        }
        this.pkcs.C_FindObjectsFinal(this.session);
        return obj[0];
    }

    private getSKIFromCertificate(pem: string): string {
        const key = jsrsa.KEYUTIL.getKey(pem);
        const uncompressedPoint = this.uncompressedPointOnCurve(key as jsrsa.KJUR.crypto.ECDSA);
        const hashBuffer = crypto.createHash('sha256');
        hashBuffer.update(uncompressedPoint);
        return hashBuffer.digest('hex');
    }

    private uncompressedPointOnCurve(key: jsrsa.KJUR.crypto.ECDSA): Buffer {
        const xyhex = key.getPublicKeyXYHex();
        const xBuffer = Buffer.from(xyhex.x, 'hex');
        const yBuffer = Buffer.from(xyhex.y, 'hex');
        const uncompressedPrefix = Buffer.from('04', 'hex');
        const uncompressedPoint = Buffer.concat([uncompressedPrefix, xBuffer, yBuffer]);
        return uncompressedPoint;
    }
}