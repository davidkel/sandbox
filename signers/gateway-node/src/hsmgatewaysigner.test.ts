
import { SessionInfo, SlotInfo, TokenInfo, CKF_SERIAL_SESSION, CKF_RW_SESSION, Template, Mechanism } from 'pkcs11js';
import { HSMInitializationOptions, initializeHSMSigners, getHSMSignerFunction, disposeHSMSigners } from './hsmgatewaysigner';
import * as fs from 'fs';

const pkcs11Stub = {
    load: (): void => { return; },
    C_Initialize: (): void => { return },
    C_GetInfo: (): string => 'Info',
    C_GetSlotList: (): Buffer[] => [],
    C_GetTokenInfo: (slot: Buffer): TokenInfo | null => null, // eslint-disable-line @typescript-eslint/no-unused-vars
    C_GetSlotInfo: (slot: Buffer): SlotInfo | string => `${slot.toString()}`,
    C_GetMechanismList: (_slot: Buffer): string[] => ['ECDSA'], // eslint-disable-line @typescript-eslint/no-unused-vars
    C_OpenSession: (): void => { return },
    C_GetSessionInfo: (): SessionInfo | void => { return },
    C_Login: (): void => { return },
    C_CloseSession: (): void => { return },
    C_Finalize: (): void => { return },
    C_FindObjectsInit: (session: Buffer, template: Template): void => { return }, // eslint-disable-line @typescript-eslint/no-unused-vars
    C_FindObjects: (session: Buffer, limit: number): Buffer[] => { return [] }, // eslint-disable-line @typescript-eslint/no-unused-vars
    C_FindObjectsFinal: (session: Buffer): void => { return }, // eslint-disable-line @typescript-eslint/no-unused-vars
    C_SignInit: (session: Buffer, mechanism: Mechanism, key: Buffer): void => { return }, //eslint-disable-line @typescript-eslint/no-unused-vars
    C_Sign: (session: Buffer, digest: Buffer, store: Buffer): Buffer => { return digest}, //eslint-disable-line @typescript-eslint/no-unused-vars
};

const resetPkcs11Stub = () => {
    pkcs11Stub.load = (): void => { return; };
    pkcs11Stub.C_Initialize = (): void => { return; };
    pkcs11Stub.C_GetInfo = (): string => 'Info';
    pkcs11Stub.C_GetSlotList = (): Buffer[] => [];
    pkcs11Stub.C_GetTokenInfo = (slot: Buffer): TokenInfo | null => null; // eslint-disable-line @typescript-eslint/no-unused-vars
    pkcs11Stub.C_GetSlotInfo = (slot: Buffer): SlotInfo | string => `${slot.toString()}`;
    pkcs11Stub.C_GetMechanismList = (slot: Buffer): string[] => ['ECDSA']; // eslint-disable-line @typescript-eslint/no-unused-vars
    pkcs11Stub.C_OpenSession = (): void => { return; };
    pkcs11Stub.C_GetSessionInfo = (): void => { return; };
    pkcs11Stub.C_Login = (): void => { return; };
    pkcs11Stub.C_CloseSession = (): void => { return; };
    pkcs11Stub.C_Finalize = (): void => { return; };
    pkcs11Stub.C_FindObjectsInit = (session: Buffer, template: Template): void => { return; }; // eslint-disable-line @typescript-eslint/no-unused-vars
    pkcs11Stub.C_FindObjects = (session: Buffer, limit: number): Buffer[] => { return [] }; //eslint-disable-line @typescript-eslint/no-unused-vars
    pkcs11Stub.C_FindObjectsFinal = (session: Buffer): void => { return }; // eslint-disable-line @typescript-eslint/no-unused-vars
    pkcs11Stub.C_SignInit = (session: Buffer, mechanism: Mechanism, key: Buffer): void => { return }; // eslint-disable-line @typescript-eslint/no-unused-vars
    pkcs11Stub.C_Sign = (session: Buffer, digest: Buffer, store: Buffer): Buffer => { return Buffer.from(digest)}; // eslint-disable-line @typescript-eslint/no-unused-vars
};

const CKO_PRIVATE_KEY = 179;
const CKA_ID = 54;
const CKA_CLASS = 67;
const CKA_KEY_TYPE = 6;
const CKK_EC = 87;
const CKM_ECDSA = 532;

const hsmOptions: HSMInitializationOptions = {
    library: 'dfdfdfd',
    label: 'ForFabric',
    pin: '98765432'
}

jest.mock('pkcs11js', () => {
    class PKCS11 {
        constructor() {
            return pkcs11Stub;
        }
    }

    // These are defined with random meaningless but unique values which have to be replicated because of jest
    const CKO_PRIVATE_KEY = 179;
    const CKA_ID = 54;
    const CKA_CLASS = 67;
    const CKA_KEY_TYPE = 6;
    const CKK_EC = 87;
    const CKM_ECDSA = 532;

    const exports = {
        PKCS11,
        CKO_PRIVATE_KEY,
        CKA_ID,
        CKA_CLASS,
        CKA_KEY_TYPE,
        CKK_EC,
        CKM_ECDSA
    }
    return exports;
});

describe('HSM Signers', () => {

    describe('When initializing the HSM Signers', () => {
        const slot1 = Buffer.from('1234');
        const slot2 = Buffer.from('5678');
        const mockTokenInfo = (slot: Buffer): TokenInfo => {
            if (slot === slot1) {
                return { label: 'ForFabric' } as TokenInfo;
            }
            return { label: 'someLabel' } as TokenInfo;
        }

        beforeEach(() => {
            resetPkcs11Stub();
            pkcs11Stub.C_GetTokenInfo = mockTokenInfo;
        })

        it('throws if pkcs11 options have not specified library, label and pin', () => {
            const badHSMOptions = {
                library : '',
                label: 'ForFabric',
                pin: '98765432'
            };

            expect(() => initializeHSMSigners(badHSMOptions))
                .toThrowError('pkcs11 library property must be provided');

            badHSMOptions.library = 'lib';
            badHSMOptions.label = '';
            expect(() => initializeHSMSigners(badHSMOptions))
                .toThrowError('pkcs11 label property must be provided');

            badHSMOptions.label = 'ForFabric';
            badHSMOptions.pin = '';
            expect(() => initializeHSMSigners(badHSMOptions))
                .toThrowError('pkcs11 pin property must be provided');

            const noLibraryOptions = {
                label: 'ForFabric',
                pin: '98765432'
            }
            expect(() => initializeHSMSigners(noLibraryOptions as HSMInitializationOptions))
                .toThrowError('pkcs11 library property must be provided');

            const noLabelOptions = {
                library: 'dfdfd',
                pin: '98765432'
            }
            expect(() => initializeHSMSigners(noLabelOptions as HSMInitializationOptions))
                .toThrowError('pkcs11 label property must be provided');

            const noPinOptions = {
                library: 'dfdfd',
                label: 'ForFabric'
            }
            expect(() => initializeHSMSigners(noPinOptions as HSMInitializationOptions))
                .toThrowError('pkcs11 pin property must be provided');

        });


        it('throws if pkcs11 initialization throws an error', () => {
            pkcs11Stub.C_Initialize = () => { throw new Error('Some Error'); }
            expect(() => initializeHSMSigners(hsmOptions))
                .toThrowError('Some Error');
        });

        it('throws an error if no slots are returned', () => {
            pkcs11Stub.C_GetSlotList = () => [];
            expect(() => initializeHSMSigners(hsmOptions))
                .toThrowError('No pkcs11 slots have been created');
        });

        it('should throw an error if label cannot be found and there are slots', () => {
            const badHSMOptions: HSMInitializationOptions = {
                library: 'dfdfdfd',
                label: 'someunknownlabel',
                pin: '98765432'
            }

            pkcs11Stub.C_GetSlotList = () => [slot1, slot2];
            expect(() => initializeHSMSigners(badHSMOptions))
                .toThrowError('label someunknownlabel cannot be found in the pkcs11 slot list');
        });

        it('finds the correct slot when the correct label is available', () => {
            pkcs11Stub.C_GetSlotList = () => [slot1, slot2];
            pkcs11Stub.C_OpenSession = jest.fn();
            expect(() => initializeHSMSigners(hsmOptions))
                .not.toThrow();
            expect(pkcs11Stub.C_OpenSession).toBeCalledWith(slot1, CKF_SERIAL_SESSION | CKF_RW_SESSION);

            disposeHSMSigners();
        });

        it('throws if pkcs11 open session throws an error', () => {
            pkcs11Stub.C_GetSlotList = () => [slot1, slot2];
            pkcs11Stub.C_OpenSession = () => { throw new Error('Some Error'); }
            expect(() => initializeHSMSigners(hsmOptions))
                .toThrowError('Some Error');
        });

        it('throws if pkcs11 login throws an error', () => {
            pkcs11Stub.C_Login = () => { throw new Error('Some Error'); }
            pkcs11Stub.C_GetSlotList = () => [slot1, slot2];
            expect(() => initializeHSMSigners(hsmOptions))
                .toThrowError('Some Error');
        });

        it('does nothing if already initialized', () => {
            pkcs11Stub.C_GetSlotList = () => [slot1, slot2];
            expect(() => initializeHSMSigners(hsmOptions))
                .not.toThrow();
            expect(() => initializeHSMSigners(hsmOptions))
                .not.toThrow();

            disposeHSMSigners();

        })

    });

    describe('When disposing the HSM Signers', () => {
        const slot1 = Buffer.from('1234');
        const mockTokenInfo = (): TokenInfo => {
            return { label: 'ForFabric' } as TokenInfo;
        }

        beforeEach(() => {
            resetPkcs11Stub();
            pkcs11Stub.C_GetTokenInfo = mockTokenInfo;
            pkcs11Stub.C_GetSlotList = () => [slot1];
        })

        it('can call dispose before initialize', () => {
            expect(() => disposeHSMSigners())
                .not.toThrow();
        });


        it('always works no matter how many times dispose is called', () => {
            initializeHSMSigners(hsmOptions);
            expect(() => disposeHSMSigners())
                .not.toThrow();
            expect(() => disposeHSMSigners())
                .not.toThrow();
            expect(() => disposeHSMSigners())
                .not.toThrow();
            expect(() => disposeHSMSigners())
                .not.toThrow();
            expect(() => disposeHSMSigners())
                .not.toThrow();
        });

        it('not be possible to get an HSM Signer after the signers have been disposed', () => {
            initializeHSMSigners(hsmOptions);
            disposeHSMSigners();
            expect(() => getHSMSignerFunction('someid'))
                .toThrowError('initializeHSMSigners has not been called or disposeHSMSigners has been called, cannot get a signer withouy an initialized HSM Signers environment');
        });

        it('disposes the session and finalizes PKCS', () => {
            const mockSession = Buffer.from('mockSession');
            pkcs11Stub.C_OpenSession = () => { return mockSession }
            pkcs11Stub.C_CloseSession = jest.fn();
            pkcs11Stub.C_Finalize = jest.fn();
            initializeHSMSigners(hsmOptions);
            disposeHSMSigners();
            expect(pkcs11Stub.C_CloseSession).toBeCalledWith(mockSession);
            expect(pkcs11Stub.C_Finalize).toBeCalled();
        });
    });

    describe('When getting and using an HSM Signer', () => {
        const slot1 = Buffer.from('1234');
        const mockTokenInfo = (): TokenInfo => {
            return { label: 'ForFabric' } as TokenInfo;
        }
        const mockSession = Buffer.from('mockSession');
        const mockPrivateKeyHandle = Buffer.from('someobject');

        const certPath = 'test/cert.pem';
        const cert = fs.readFileSync(certPath);
        const certSKI = '817b910d399094e5f4339a3be0c7be1abde1c4a3299f2ecb4ae04870b6ff7fae';
        const HSMSignature = 'a5f6e5dd8c46ee4094ebb908b719572022f64ed4bbc21f1f5aa4e49163f4f56c4c6ca8b0393836c79045b1be2f25b1cd2b2b253a213fc9248b7e18574c4170b4';
        const DERSignature = '3045022100a5f6e5dd8c46ee4094ebb908b719572022f64ed4bbc21f1f5aa4e49163f4f56c02204c6ca8b0393836c79045b1be2f25b1cd2b2b253a213fc9248b7e18574c4170b4';

        beforeEach(() => {
            resetPkcs11Stub();
            pkcs11Stub.C_GetTokenInfo = mockTokenInfo;
            pkcs11Stub.C_GetSlotList = () => [slot1];
            pkcs11Stub.C_OpenSession = () => { return mockSession }
            pkcs11Stub.C_FindObjectsInit = jest.fn();
            pkcs11Stub.C_FindObjectsFinal = jest.fn();
            pkcs11Stub.C_FindObjects = jest.fn(() => { return [mockPrivateKeyHandle] });
        });

        it('throws if HSM Signers not initialized when getting an HSM Signer', () => {
            expect(() => getHSMSignerFunction('someid'))
                .toThrowError('initializeHSMSigners has not been called or disposeHSMSigners has been called, cannot get a signer withouy an initialized HSM Signers environment');
        });

        it('cannot find the HSM object', () => {
            initializeHSMSigners(hsmOptions);
            pkcs11Stub.C_FindObjects = jest.fn(() => { return [] });
            expect(() => getHSMSignerFunction('someid'))
                .toThrowError('Unable to find object in HSM with ID someid');

            disposeHSMSigners
        })

        it('finds the HSM object when the identifier is a certificate', () => {
            initializeHSMSigners(hsmOptions);
            const signer = getHSMSignerFunction(cert.toString());
            expect(signer).toBeDefined();

            const expectedTemplate = [
                { type: CKA_ID, value: Buffer.from(certSKI, 'hex') },
                { type: CKA_CLASS, value: CKO_PRIVATE_KEY },
                { type: CKA_KEY_TYPE, value: CKK_EC },
            ];

            expect(pkcs11Stub.C_FindObjectsInit).toBeCalledWith(mockSession, expect.arrayContaining(expectedTemplate));
            expect(pkcs11Stub.C_FindObjects).toBeCalledWith(mockSession, 1);
            expect(pkcs11Stub.C_FindObjects).toBeCalledWith(mockSession, 1);
            disposeHSMSigners();
        });

        it('finds the HSM object when the identifier is not a certificate', () => {
            initializeHSMSigners(hsmOptions);
            const signer = getHSMSignerFunction('SomeAltId');
            expect(signer).toBeDefined();

            const expectedTemplate = [
                { type: CKA_ID, value: 'SomeAltId' },
                { type: CKA_CLASS, value: CKO_PRIVATE_KEY },
                { type: CKA_KEY_TYPE, value: CKK_EC },
            ];

            expect(pkcs11Stub.C_FindObjectsInit).toBeCalledWith(mockSession, expect.arrayContaining(expectedTemplate));
            expect(pkcs11Stub.C_FindObjects).toBeCalledWith(mockSession, 1);
            expect(pkcs11Stub.C_FindObjects).toBeCalledWith(mockSession, 1);
            disposeHSMSigners();
        });

        it('returns the same signer instance if the same identity is used', () => {
            initializeHSMSigners(hsmOptions);
            const certSigner = getHSMSignerFunction(cert.toString());
            const idSigner = getHSMSignerFunction('someId');

            expect(certSigner === idSigner).not.toBeTruthy();

            pkcs11Stub.C_FindObjectsInit = jest.fn();
            pkcs11Stub.C_FindObjectsFinal = jest.fn();
            pkcs11Stub.C_FindObjects = jest.fn();

            const certSigner2 = getHSMSignerFunction(cert.toString());
            const idSigner2 = getHSMSignerFunction('someId');

            expect(certSigner === certSigner2).toBeTruthy();
            expect(idSigner === idSigner2).toBeTruthy();
            expect(pkcs11Stub.C_FindObjectsInit).not.toBeCalled();
            expect(pkcs11Stub.C_FindObjects).not.toBeCalled();
            expect(pkcs11Stub.C_FindObjectsFinal).not.toBeCalled();

            disposeHSMSigners();
        });

        it('signs using the HSM', () => {
            pkcs11Stub.C_SignInit = jest.fn();
            pkcs11Stub.C_Sign = jest.fn(() => { return Buffer.from(HSMSignature, 'hex');});

            const digest = Buffer.from('some digest');

            initializeHSMSigners(hsmOptions);
            const certSigner = getHSMSignerFunction(cert.toString());
            const signed = certSigner(digest);
            console.log('Signer response:', signed.toString('hex'));
            expect(signed).toEqual(Buffer.from(DERSignature, 'hex'));

            expect(pkcs11Stub.C_SignInit).toBeCalledWith(mockSession, { mechanism: CKM_ECDSA }, mockPrivateKeyHandle);
            expect(pkcs11Stub.C_Sign).toBeCalledWith(mockSession, digest, expect.anything());

            disposeHSMSigners();
        })
    });
});
