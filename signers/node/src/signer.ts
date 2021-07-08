/* */

'use strict';

//import { BN } from 'bn.js'
import * as elliptic from 'elliptic';
import * as pkcs11js from 'pkcs11js';

import BN = require("bn.js");

const ecSignature = require('elliptic/lib/elliptic/ec/signature.js');  // eslint-disable-line


type der = string | number[];

export class Signer {

    private curveName: string;
    private ecdsaCurve: elliptic.curves.PresetCurve;

    constructor(
        private readonly pkcs: pkcs11js.PKCS11,
        private readonly session: Buffer,
        private readonly privateKeyHandle: Buffer,
        private readonly keySize: number
    ) {
        this.curveName = `secp${this.keySize}r1`;
        const definedCurves = elliptic.curves as unknown as {[key:string]: elliptic.curves.PresetCurve };
        this.ecdsaCurve = definedCurves[`p${this.keySize}`];
        console.log('curveName:', this.curveName);
        console.log('curve:', this.ecdsaCurve);
    }

    private preventMalleability(sig: {r: BN, s: BN}, curve: elliptic.curves.PresetCurve) {
        const halfOrder = curve.n?.shrn(1);
        if (!halfOrder) {
            throw new Error(`Can not find the half order needed to calculate "s" value for immalleable signatures. Unsupported curve name ${this.curveName}`);
        }

        if (sig.s.cmp(halfOrder) === 1) {
            const bigNum = curve.n;
            if (!bigNum) {
                throw new Error();
            }
            sig.s = bigNum.sub(sig.s);
        }

        return sig;
    }

    public async sign(digest: Buffer): Promise<Buffer> {

        return new Promise<Buffer>((resolve, reject) => {
            try {
                resolve(this.signSync(digest));
            } catch(error) {
                reject(error);
            }
        });
    }

    public signSync(digest: Buffer): Buffer {
        this.pkcs.C_SignInit(this.session, { mechanism: pkcs11js.CKM_ECDSA }, this.privateKeyHandle);
        const sig = this.pkcs.C_Sign(this.session, digest, Buffer.alloc(this.keySize));
        console.log(`ECDSA RAW signature: ${sig.toString('hex')}`);

        // TODO: Improve this code START
        // ASN1 DER encoding against malleability.
        const r = new BN(sig.slice(0, sig.length / 2).toString('hex'), 16);
        const s = new BN(sig.slice(sig.length / 2).toString('hex'), 16);

        const signature = this.preventMalleability({ r: r, s: s }, this.ecdsaCurve);

        const sigOptions: elliptic.SignatureInput = {
            r: signature.r,
            s: signature.s
        }

        const der = new ecSignature(sigOptions).toDER() as der; // eslint-disable-line
        console.log(`ECDSA DER signature: ${Buffer.from(der).toString('hex')}`);
        // TODO: Improve this code END

        return Buffer.from(der);
    }
}