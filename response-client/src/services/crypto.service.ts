// crypto.service.ts
// Uses @cloudflare/blindrsa-ts for Blind RSA operations and Web Crypto for hashing.
// RSABSSA exports suite factory functions (not constructors — call without `new`).

import { RSABSSA } from '@cloudflare/blindrsa-ts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Suite = any;
export async function computeSecurityHash(
  publicKeySPKI: string,
  questionPayload: string,
): Promise<string> {
  const combined = publicKeySPKI + questionPayload;
  const encoded = new TextEncoder().encode(combined);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function toB64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

// Blind-only step: produces blindedMsg and inv for the /submit-otp request.
export async function blindToken(
  spkiBase64: string,
): Promise<{
  preparedMsg: Uint8Array;
  blindedMsg: Uint8Array;
  inv: Uint8Array;
  blindedMsg_b64: string;
}> {
  const suite: Suite = RSABSSA.SHA384.PSS.Randomized();
  const spkiBytes = Uint8Array.from(atob(spkiBase64), (c) => c.charCodeAt(0));
  
  const publicKey = await crypto.subtle.importKey(
    'spki',
    spkiBytes,
    { name: 'RSA-PSS', hash: 'SHA-384' },
    true,
    ['verify']
  );

  const rawToken = crypto.getRandomValues(new Uint8Array(32));
  const preparedMsg = suite.prepare(rawToken);
  const { blindedMsg, inv } = await suite.blind(publicKey, preparedMsg);

  return {
    preparedMsg,
    blindedMsg,
    inv,
    blindedMsg_b64: toB64(blindedMsg),
  };
}

// Finalize step: unblinds the server's blind signature, verifies it locally.
export async function finalizeBlindRSA(
  spkiBase64: string,
  preparedMsg: Uint8Array,
  inv: Uint8Array,
  blindSigBase64: string,
): Promise<{ token_b64: string; signature_b64: string }> {
  const suite: Suite = RSABSSA.SHA384.PSS.Randomized();
  const spkiBytes = Uint8Array.from(atob(spkiBase64), (c) => c.charCodeAt(0));
  
  const publicKey = await crypto.subtle.importKey(
    'spki',
    spkiBytes,
    { name: 'RSA-PSS', hash: 'SHA-384' },
    true,
    ['verify']
  );

  const blindSigBytes = Uint8Array.from(atob(blindSigBase64), (c) => c.charCodeAt(0));
  const finalSig = await suite.finalize(publicKey, preparedMsg, blindSigBytes, inv);

  // Local verification — throws if the signature is invalid
  const isValid = await suite.verify(publicKey, finalSig, preparedMsg);
  if (!isValid) throw new Error("Cryptographic signature verify failed");

  return {
    token_b64: toB64(preparedMsg),
    signature_b64: toB64(finalSig),
  };
}
