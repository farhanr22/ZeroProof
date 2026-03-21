import crypto from 'crypto';
import { RSABSSA } from '@cloudflare/blindrsa-ts';

// Force Randomization mathematically guaranteeing non-deterministic signatures bridging identities securely
const suite = RSABSSA.SHA384.PSS.Randomized();

/**
 * Strips verbose ASCII PEM boundaries translating representations securely back to strict binary base64 payloads computationally compatible with Cloudflare WebCrypto scopes.
 */
const pemToArrayBuffer = (pem) => {
  const b64Lines = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  return Buffer.from(b64Lines, 'base64');
};

export const importPrivateKey = async (pem) => {
  const der = pemToArrayBuffer(pem);
  return await crypto.webcrypto.subtle.importKey(
    'pkcs8',
    der,
    { name: 'RSA-PSS', hash: 'SHA-384' },
    true,
    ['sign']
  );
};

export const importPublicKey = async (pem) => {
  const der = pemToArrayBuffer(pem);
  return await crypto.webcrypto.subtle.importKey(
    'spki',
    der,
    { name: 'RSA-PSS', hash: 'SHA-384' },
    true,
    ['verify']
  );
};

export const signToken = async (privateKeyPem, blindedMsgB64) => {
  const privateKey = await importPrivateKey(privateKeyPem);
  // Reconstruct explicitly mapped arrays securely verifying bytes
  const blindedMsgBytes = new Uint8Array(Buffer.from(blindedMsgB64, 'base64'));
  const blindSig = await suite.blindSign(privateKey, blindedMsgBytes);
  return Buffer.from(blindSig).toString('base64');
};

export const signTokenWithThrowawayKey = async (blindedMsgB64) => {
  const { privateKey } = await crypto.webcrypto.subtle.generateKey(
    { name: 'RSA-PSS', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-384' },
    true,
    ['sign']
  );
  const blindedMsgBytes = new Uint8Array(Buffer.from(blindedMsgB64, 'base64'));
  const blindSig = await suite.blindSign(privateKey, blindedMsgBytes);
  return Buffer.from(blindSig).toString('base64');
};

export const verifySignature = async (publicKeyPem, messageB64, signatureB64) => {
  const publicKey = await importPublicKey(publicKeyPem);
  const messageBytes = new Uint8Array(Buffer.from(messageB64, 'base64'));
  const signatureBytes = new Uint8Array(Buffer.from(signatureB64, 'base64'));
  
  return await suite.verify(publicKey, signatureBytes, messageBytes);
};
