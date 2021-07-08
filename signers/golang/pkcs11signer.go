// +build pkcs11

package main

import (
	"crypto/elliptic"
	"fmt"

	"math/big"

	"github.com/miekg/pkcs11"
	"github.com/pkg/errors"
)

type HSMSignerOptions struct {
	Label      string
	Pin        string
	Identifier string
	UserType   int
}

type HSMSignerFactory struct {
	ctx *pkcs11.Ctx
}

type Sign = func(digest []byte) ([]byte, error)

type HSMSigner struct {
	ctx     *pkcs11.Ctx
	session pkcs11.SessionHandle
	Signer  Sign
}

func NewHSMSignerFactory(library string) (*HSMSignerFactory, error) {
	ctx := pkcs11.New(library)
	if ctx == nil {
		return nil, fmt.Errorf("pkcs11: instantiation failed for %s", library)
	}
	if err := ctx.Initialize(); err != nil {
		// logger.Debugf("initialize failed: %v", err)
	}

	return &HSMSignerFactory{ctx}, nil
}

func (h *HSMSignerFactory) NewHSMSigner(hsmSignerOptions HSMSignerOptions) (*HSMSigner, error) {
	slots, err := h.ctx.GetSlotList(true)
	if err != nil {
		return nil, errors.Wrap(err, "pkcs11: get slot list")
	}

	for _, slot := range slots {
		tokenInfo, err := h.ctx.GetTokenInfo(slot)
		if err != nil || hsmSignerOptions.Label != tokenInfo.Label {
			continue
		}

		session, err := h.createSession(slot, hsmSignerOptions.Pin)
		if err != nil {
			return nil, err
		}

		privateKeyHandle, err := h.findObjectInHSM(session, pkcs11.CKO_PRIVATE_KEY, hsmSignerOptions.Identifier)
		if err != nil {
			h.ctx.CloseSession(session)
			return nil, err
		}

		hsmSigner := &HSMSigner{ctx: h.ctx, session: session}
		hsmSigner.Signer = hsmSigner.newSigner(session, privateKeyHandle)
		return hsmSigner, nil

	}

	return nil, errors.Errorf("pkcs11: could not find token with label %s", hsmSignerOptions.Label)

}

func (h *HSMSignerFactory) dispose() {
	h.ctx.Finalize()
}

func (h *HSMSignerFactory) findObjectInHSM(session pkcs11.SessionHandle, keyType uint, identifier string) (pkcs11.ObjectHandle, error) {
	template := []*pkcs11.Attribute{
		pkcs11.NewAttribute(pkcs11.CKA_CLASS, keyType),
		pkcs11.NewAttribute(pkcs11.CKA_ID, identifier),
	}
	if err := h.ctx.FindObjectsInit(session, template); err != nil {
		return 0, err
	}
	defer h.ctx.FindObjectsFinal(session)

	// single session instance, assume one hit only
	objs, _, err := h.ctx.FindObjects(session, 1)
	if err != nil {
		return 0, err
	}

	if len(objs) == 0 {
		return 0, fmt.Errorf("Key not found [%s]", identifier) // TODO: This may not be helpful with the SKI
	}

	return objs[0], nil
}

func (h *HSMSignerFactory) createSession(slot uint, pin string) (pkcs11.SessionHandle, error) {
	var sess pkcs11.SessionHandle
	var err error
	h.ctx.OpenSession(slot, pkcs11.CKF_SERIAL_SESSION)
	err = h.ctx.Login(sess, pkcs11.CKU_USER, pin)
	if err != nil && err != pkcs11.Error(pkcs11.CKR_USER_ALREADY_LOGGED_IN) {
		h.ctx.CloseSession(sess)
		return 0, errors.Wrap(err, "Login failed")
	}

	// attempt to open a session with a 100ms delay after each attempt (WHY)
	/*
		for i := 0; i < csp.createSessionRetries; i++ {
			sess, err = csp.ctx.OpenSession(csp.slot, pkcs11.CKF_SERIAL_SESSION|pkcs11.CKF_RW_SESSION)
			if err == nil {
				logger.Debugf("Created new pkcs11 session %d on slot %d\n", sess, csp.slot)
				break
			}

			logger.Warningf("OpenSession failed, retrying [%s]\n", err)
			time.Sleep(csp.createSessionRetryDelay)
		}
		if err != nil {
			return 0, errors.Wrap(err, "OpenSession failed")
		}
	*/

	return sess, nil
}

func (signer *HSMSigner) newSigner(session pkcs11.SessionHandle, privateKeyHandle pkcs11.ObjectHandle) Sign {
	return func(digest []byte) ([]byte, error) {
		err := signer.ctx.SignInit(session, []*pkcs11.Mechanism{pkcs11.NewMechanism(pkcs11.CKM_ECDSA, nil)}, privateKeyHandle)
		if err != nil {
			return nil, fmt.Errorf("Sign initialize failed [%s]", err)
		}

		var sig []byte

		sig, err = signer.ctx.Sign(session, digest)
		if err != nil {
			return nil, fmt.Errorf("Sign failed [%s]", err)
		}

		r := new(big.Int)
		s := new(big.Int)
		r.SetBytes(sig[0 : len(sig)/2])
		s.SetBytes(sig[len(sig)/2:])

		s, err = toLowSByCurve(elliptic.P256(), s)
		if err != nil {
			return nil, err
		}

		return marshalECDSASignature(r, s)

	}
}

func (signer *HSMSigner) close() error {
	return signer.ctx.CloseSession(signer.session)
}
