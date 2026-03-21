import request from 'supertest';
import app from '../src/app.js';
import mongoose from 'mongoose';
import { User } from '../src/models/User.js';
import { Contact } from '../src/models/Contact.js';
import { Campaign } from '../src/models/Campaign.js';
import { BlindToken } from '../src/models/BlindToken.js';
import { Response } from '../src/models/Response.js';
import crypto from 'crypto';
import { RSABSSA } from '@cloudflare/blindrsa-ts';

const suite = RSABSSA.SHA384.PSS.Randomized();

describe('Public API Crypto Endpoints (/api/public/*)', () => {
  let campaignId, otp;

  beforeAll(async () => {
    // 1. Setup mock Admin & Campaign strictly injecting standard RSA constraints mathematically
    const admin = await User.create({ email: 'crypto@admin.com', password_hash: '123' });
    
    // Simulate Phase 5 Activation Keys natively
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });

    const campaign = await Campaign.create({
      admin_id: admin._id,
      name: 'Crypto Vote Context',
      mode: 'active',
      public_key_pem: publicKey,
      private_key_pem: privateKey,
      questions: [
        { _id: new mongoose.Types.ObjectId(), order: 0, type: 'text', text: 'How was the cryptography implemented?' }
      ]
    });
    campaignId = campaign._id;

    // 2. Setup mock Contact validating the start loop strictly mathematically
    otp = '123456';
    await Contact.create({
      campaign_id: campaignId,
      value: 'anon@example.com',
      otp: otp,
      otp_used: false,
      sent_at: new Date() // implicitly assumed dispatched out dynamically
    });
  });

  describe('Full Cryptographic Telemetry Journey', () => {
    let pubKeySpkiB64, questionPayloadString;
    let cryptoKeyObj;
    let preparedMsg, blindedMsgBuffer, invObj;
    let blindSignatureB64;
    let finalSignatureB64;

    it('GET /start with otp query param returns plain text (browser guard)', async () => {
      const res = await request(app).get(`/api/public/start?otp=${otp}`);
      expect(res.status).toBe(200);
      expect(res.type).toMatch(/text/);
      expect(res.text).toMatch(/app/i);
    });

    it('Step 1: POST /start returns campaign_name, public_key_spki, and question_payload (no campaign_id)', async () => {
      const res = await request(app).post('/api/public/start').send({ otp });
      expect(res.status).toBe(200);
      expect(res.body.data.public_key_spki).toBeDefined();
      expect(res.body.data.question_payload).toBeDefined();
      expect(res.body.data.campaign_name).toBeDefined();
      expect(res.body.data.campaign_id).toBeUndefined();

      pubKeySpkiB64 = res.body.data.public_key_spki;
      questionPayloadString = res.body.data.question_payload;

      const publicKeyBytes = Buffer.from(pubKeySpkiB64, 'base64');
      cryptoKeyObj = await crypto.webcrypto.subtle.importKey(
        'spki',
        publicKeyBytes,
        { name: 'RSA-PSS', hash: 'SHA-384' },
        true,
        ['verify']
      );
      expect(cryptoKeyObj).toBeDefined();
    });

    it('Step 2: /submit-otp marks OTP as used and returns blind signature + derived campaign_id', async () => {
      const token = crypto.randomBytes(32);
      preparedMsg = suite.prepare(token);
      const blindResult = await suite.blind(cryptoKeyObj, preparedMsg);
      blindedMsgBuffer = blindResult.blindedMsg;
      invObj = blindResult.inv;

      // No campaign_id sent by client — derived server-side from OTP
      const res = await request(app)
        .post('/api/public/submit-otp')
        .send({
          otp,
          blinded_msg_b64: Buffer.from(blindedMsgBuffer).toString('base64')
        });

      expect(res.status).toBe(200);
      expect(res.body.data.blind_signature_b64).toBeDefined();
      expect(res.body.data.campaign_id).toBeDefined(); // returned for use in submit-response
      blindSignatureB64 = res.body.data.blind_signature_b64;
      campaignId = res.body.data.campaign_id; // update to string form

      const verifiedContact = await Contact.findOne({ otp });
      expect(verifiedContact.otp_used).toBe(true);
    });

    it('Step 3: Internal signature unblinding yields completely validated client binaries independent of initial connections locally', async () => {
      const blindSigBytes = new Uint8Array(Buffer.from(blindSignatureB64, 'base64'));
      const finalSignatureBytes = await suite.finalize(cryptoKeyObj, preparedMsg, blindSigBytes, invObj);
      
      const localValid = await suite.verify(cryptoKeyObj, finalSignatureBytes, preparedMsg);
      expect(localValid).toBe(true);

      finalSignatureB64 = Buffer.from(finalSignatureBytes).toString('base64');
    });

    it('Step 4: /submit-response directly accepts signatures preserving completely anonymized identities disconnected perfectly from contacts structurally', async () => {
      const qId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post('/api/public/submit-response')
        .send({
          campaign_id: campaignId.toString(),
          token_b64: Buffer.from(preparedMsg).toString('base64'),
          signature_b64: finalSignatureB64,
          answers: [
            { question_id: qId, type: 'text', value: 'Blind RSA executed successfully!' }
          ]
        });

      expect(res.status).toBe(200);

      // Verifying double spend mathematical safeguards natively function securely structurally mapped natively
      const hash = crypto.createHash('sha256').update(Buffer.from(preparedMsg).toString('base64')).digest('hex');
      const tokenDoc = await BlindToken.findOne({ token_hash: hash });
      expect(tokenDoc).toBeDefined();
      
      const responseDoc = await Response.findOne({ blind_token_id: tokenDoc._id });
      expect(responseDoc.answers[0].value).toBe('Blind RSA executed successfully!');
    });

    it('Step 5: The double vote constraint directly rejects exactly identical tokens surfacing mathematical isolated 409 responses correctly', async () => {
      const res = await request(app)
        .post('/api/public/submit-response')
        .send({
          campaign_id: campaignId.toString(),
          token_b64: Buffer.from(preparedMsg).toString('base64'),
          signature_b64: finalSignatureB64,
          answers: []
        });

      expect(res.status).toBe(409); // Implicitly tracks exactly standard Mongoose code 11000 properly mapped functionally against abstractions natively
    });
  });
});
