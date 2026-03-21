import crypto from 'crypto';

/**
 * Generates an RSA key pair for Blind Signatures.
 * Standard RSA keys are used matching @cloudflare/blindrsa-ts dependencies.
 */
export const generateBlindRSAKeys = () => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  return { public_key_pem: publicKey, private_key_pem: privateKey };
};

/**
 * Generates a secure random 6-digit OTP.
 */
export const generateOTP = () => {
  // Generate a random number strictly between 100000 and 999999
  const num = crypto.randomInt(100000, 1000000);
  return num.toString();
};
