import readline from 'readline';
import crypto from 'crypto';
import { RSABSSA } from '@cloudflare/blindrsa-ts';

const API_BASE = 'http://localhost:4000/api';
const suite = RSABSSA.SHA384.PSS.Randomized();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function fetchApi(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers }
  });
  const text = await res.text();
  try {
    return { status: res.status, ok: res.ok, data: JSON.parse(text) };
  } catch (e) {
    return { status: res.status, ok: res.ok, data: text };
  }
}

async function runClientFlow() {
  console.log('\n--- ZERO-TRUST CLIENT APP ---');
  const accessUrl = await question('Paste the access URL from your SMS: ');
  
  // 1. Extract OTP
  let otp;
  try {
    const urlObj = new URL(accessUrl.trim());
    otp = urlObj.searchParams.get('otp');
    if (!otp) throw new Error('No OTP parameter found');
  } catch (e) {
    console.error('❌ Invalid URL format. Should be like http://app.com/start?otp=123');
    rl.close();
    return;
  }

  // 2. Fetch Campaign Context
  console.log('\nFetching campaign securely...');
  const startRes = await fetchApi('/public/start', {
    method: 'POST',
    body: JSON.stringify({ otp })
  });

  if (!startRes.ok) {
    console.error('❌ Failed to start flow:', startRes.data);
    rl.close();
    return;
  }

  const { campaign_name, public_key_spki, question_payload } = startRes.data.data;
  console.log(`\n✅ Connected to Campaign: "${campaign_name}"`);

  // Parse questions
  const qPayload = JSON.parse(question_payload);
  const questions = qPayload.questions;

  // Print SPKI Hash
  const spkiHash = crypto.createHash('sha256').update(public_key_spki).digest('hex');
  console.log('\n======================================================');
  console.log('🛡️  SERVER PUBLIC KEY VERIFICATION HASH (SPKI Hash) 🛡️');
  console.log(spkiHash);
  console.log('   (Compare this across identical clients to ensure');
  console.log('    all instances share the EXACT same campaign key!)');
  console.log('======================================================\n');

  // Let user answer the questions
  const answers = [];
  for (const q of questions) {
    const answerText = await question(`[${q.type.toUpperCase()}] ${q.text} \n> `);
    answers.push({
      question_id: q._id,
      type: q.type,
      value: answerText
    });
  }

  // 3. Blind RSA Math
  console.log('\n⏳ Initiating Blind RSA Protocol...');
  
  const publicKeyBytes = Buffer.from(public_key_spki, 'base64');
  const cryptoKey = await crypto.webcrypto.subtle.importKey(
    'spki',
    publicKeyBytes,
    { name: 'RSA-PSS', hash: 'SHA-384' },
    true,
    ['verify']
  );

  const rawToken = crypto.randomBytes(32);
  const preparedMsg = suite.prepare(rawToken);
  const { blindedMsg, inv } = await suite.blind(cryptoKey, preparedMsg);

  console.log('   Client Token blinded securely.');

  // 4. Submit OTP + Blinded Token
  console.log('   Requesting signature from server...');
  const otpRes = await fetchApi('/public/submit-otp', {
    method: 'POST',
    body: JSON.stringify({
      otp,
      blinded_msg_b64: Buffer.from(blindedMsg).toString('base64')
    })
  });

  if (!otpRes.ok) {
    console.error('❌ Failed to submit OTP:', otpRes.data);
    rl.close(); return;
  }

  const { blind_signature_b64, campaign_id } = otpRes.data.data;
  console.log('   Received Server Signature.');

  // 5. Unblind locally
  console.log('   Unblinding and verifying signature locally...');
  const blindSigBytes  = new Uint8Array(Buffer.from(blind_signature_b64, 'base64'));
  const finalSigBytes  = await suite.finalize(cryptoKey, preparedMsg, blindSigBytes, inv);
  const localValid     = await suite.verify(cryptoKey, finalSigBytes, preparedMsg);

  if (!localValid) {
    console.error('❌ Cryptographic mathematically invalid! Refusing to submit.');
    rl.close(); return;
  }
  console.log('   ✅ Signature computationally verified!');

  // Calculate anonymous Token Hash for Judge 
  const tokenHash = crypto.createHash('sha256').update(Buffer.from(preparedMsg).toString('base64')).digest('hex');
  console.log('\n======================================================');
  console.log('🕵️  ANONYMOUS TOKEN HASH 🕵️');
  console.log(tokenHash);
  console.log('   (This is the ONLY identifier the server will see.');
  console.log('    Notice how it differs per client, proving anonymity!)');
  console.log('======================================================\n');

  await question('🛑 PAUSED FOR JUDGING. Press ENTER on all clients to verify hashes then submit... 🛑');

  // 6. Final untraceable submission
  console.log('🚀 Submitting untraceable payload...');
  const subRes = await fetchApi('/public/submit-response', {
    method: 'POST',
    body: JSON.stringify({
      campaign_id,
      token_b64: Buffer.from(preparedMsg).toString('base64'),
      signature_b64: Buffer.from(finalSigBytes).toString('base64'),
      answers
    })
  });

  if (subRes.ok) {
    console.log('✅✅ Response strictly anonymized and recorded natively! ✅✅\n');
  } else {
    console.error('❌ Submission blocked:', subRes.data);
  }

  rl.close();
}

runClientFlow();
