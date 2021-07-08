import * as crypto from 'crypto';

import jsrsa = require('jsrsasign');

import * as fs from 'fs';


class ski {
    public getSKIFromCertificate(pem: string): string {
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

const fb = fs.readFileSync('cert.pem');
console.log(new ski().getSKIFromCertificate(fb.toString()));