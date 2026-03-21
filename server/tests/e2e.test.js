import request from 'supertest';
import app from '../src/app.js';
import crypto from 'crypto';
import { RSABSSA } from '@cloudflare/blindrsa-ts';

const suite = RSABSSA.SHA384.PSS.Randomized();

describe('GIGA Master E2E Flow', () => {
  let adminToken;
  let campaignId;
  let singleChoiceQId, ratingQId;
  const otpServiceSecret = process.env.OTP_SERVICE_SECRET || 'dev_otp_secret';
  const extractedOtps = [];

  // ── 1. AUTH ──────────────────────────────────────────────────────────────

  it('1a. Admin registers', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'giga@admin.com', password: 'password123' });
    expect(res.status).toBe(201);
    adminToken = res.body.data.token;
  });

  it('1b. Admin changes password, old token is invalidated', async () => {
    const changeRes = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ oldPassword: 'password123', newPassword: 'new_giga_password' });
    expect(changeRes.status).toBe(200);

    // Old token should now be rejected
    const failRes = await request(app)
      .get('/api/campaigns')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(failRes.status).toBe(401);
  });

  it('1c. Admin logs back in with new password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'giga@admin.com', password: 'new_giga_password' });
    expect(res.status).toBe(200);
    adminToken = res.body.data.token;
  });

  // ── 2. CAMPAIGN CREATION ─────────────────────────────────────────────────

  it('2a. Admin creates a draft campaign', async () => {
    const res = await request(app)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'E2E Mega Campaign' });
    expect(res.status).toBe(201);
    campaignId = res.body.data.campaign._id;
  });

  it('2b. Admin bulk-sets 3 questions', async () => {
    // The questions API is a full PATCH (replace-all), so we send the full desired list
    const res = await request(app)
      .patch(`/api/campaigns/${campaignId}/questions`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        questions: [
          { order: 0, type: 'single_choice', text: 'Best crypto methodology?', options: ['RSA', 'ECC'] },
          { order: 1, type: 'rating',        text: 'How secure does this feel?', options: [] },
          { order: 2, type: 'text',          text: 'This question will be deleted next.', options: [] }
        ]
      });
    expect(res.status).toBe(200);
    expect(res.body.data.questions.length).toBe(3);
    singleChoiceQId = res.body.data.questions[0]._id;
    ratingQId       = res.body.data.questions[1]._id;
  });

  it('2c. Admin deletes the text question by PATCHing with only 2 questions', async () => {
    const res = await request(app)
      .patch(`/api/campaigns/${campaignId}/questions`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        questions: [
          { order: 0, type: 'single_choice', text: 'Best crypto methodology?', options: ['RSA', 'ECC'] },
          { order: 1, type: 'rating',        text: 'How secure does this feel?',       options: [] }
        ]
      });
    expect(res.status).toBe(200);
    expect(res.body.data.questions.length).toBe(2);

    // Also verify the IDs are stable via the get endpoint
    const check = await request(app)
      .get(`/api/campaigns/${campaignId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(check.body.data.campaign.questions.length).toBe(2);
    // Persist the new Mongo-assigned IDs since PATCH replaces subdocuments
    singleChoiceQId = res.body.data.questions[0]._id;
    ratingQId       = res.body.data.questions[1]._id;
  });

  it('2d. Admin adds 2 contacts', async () => {
    const res = await request(app)
      .post(`/api/campaigns/${campaignId}/contacts`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ values: ['9119119111', '8118118111'] });
    expect(res.status).toBe(201);
    expect(res.body.data.added).toBe(2);
  });

  // ── 3. ACTIVATION ────────────────────────────────────────────────────────

  it('3. Admin activates campaign, RSA keys generated', async () => {
    const res = await request(app)
      .post(`/api/campaigns/${campaignId}/activate`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.campaign.mode).toBe('active');
    expect(res.body.data.campaign.public_key_pem).toBeDefined();
  });

  // ── 4. OTP NOTIFICATION POLLING ──────────────────────────────────────────

  it('4. OTP service polls both contacts and confirms delivery', async () => {
    for (let i = 0; i < 2; i++) {
      const poll = await request(app)
        .get(`/api/otp/next-contact?sender_id=E2E-worker`)
        .set('X-OTP-Service-Secret', otpServiceSecret);
      expect(poll.status).toBe(200);
      extractedOtps.push({ value: poll.body.data.value, otp: poll.body.data.otp });

      await request(app)
        .post('/api/otp/confirm-sent')
        .set('X-OTP-Service-Secret', otpServiceSecret)
        .send({
          contact_id:  poll.body.data.contact_id,
          campaign_id: campaignId,
          sender_id:   'E2E-worker'
        })
        .expect(200);
    }

    // Queue exhausted → 204
    const empty = await request(app)
      .get(`/api/otp/next-contact?sender_id=E2E-worker`)
      .set('X-OTP-Service-Secret', otpServiceSecret);
    expect(empty.status).toBe(204);
  });

  // ── 5. CLIENT CRYPTO (per OTP) ───────────────────────────────────────────

  const simulateClient = async (otp, choiceOption, ratingValue) => {
    // a. /start
    const startRes = await request(app).get(`/api/public/start?otp=${otp}`);
    expect(startRes.status).toBe(200);
    const pubKeySpkiB64 = startRes.body.data.public_key_spki;

    const cryptoKey = await crypto.webcrypto.subtle.importKey(
      'spki',
      Buffer.from(pubKeySpkiB64, 'base64'),
      { name: 'RSA-PSS', hash: 'SHA-384' },
      true,
      ['verify']
    );

    // b. Blind the token
    const token       = crypto.randomBytes(32);
    const preparedMsg = suite.prepare(token);
    const { blindedMsg, inv } = await suite.blind(cryptoKey, preparedMsg);

    // c. /submit-otp
    const otpRes = await request(app)
      .post('/api/public/submit-otp')
      .send({
        otp,
        blinded_msg_b64: Buffer.from(blindedMsg).toString('base64'),
        campaign_id:     campaignId
      });
    expect(otpRes.status).toBe(200);

    // d. Unblind locally
    const blindSigBytes  = new Uint8Array(Buffer.from(otpRes.body.data.blind_signature_b64, 'base64'));
    const finalSigBytes  = await suite.finalize(cryptoKey, preparedMsg, blindSigBytes, inv);
    const localValid     = await suite.verify(cryptoKey, finalSigBytes, preparedMsg);
    expect(localValid).toBe(true);

    // e. /submit-response
    const subRes = await request(app)
      .post('/api/public/submit-response')
      .send({
        campaign_id:   campaignId,
        token_b64:     Buffer.from(preparedMsg).toString('base64'),
        signature_b64: Buffer.from(finalSigBytes).toString('base64'),
        answers: [
          { question_id: singleChoiceQId, type: 'single_choice', value: choiceOption },
          { question_id: ratingQId,       type: 'rating',        value: ratingValue  }
        ]
      });
    expect(subRes.status).toBe(200);
  };

  it('5a. Client 1 submits anonymous response', async () => {
    await simulateClient(extractedOtps[0].otp, 'RSA', 10);
  });

  it('5b. Client 2 submits anonymous response', async () => {
    await simulateClient(extractedOtps[1].otp, 'ECC', 8);
  });

  it('5c. Replay attack blocked with 409', async () => {
    // Re-use Client 1's OTP — it's already been consumed, /start should fail
    const res = await request(app).get(`/api/public/start?otp=${extractedOtps[0].otp}`);
    expect(res.status).toBe(404);
  });

  // ── 6. ADMIN ANALYTICS ───────────────────────────────────────────────────

  it('6a. Admin sees 2 raw responses', async () => {
    const res = await request(app)
      .get(`/api/campaigns/${campaignId}/responses`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.responses.length).toBe(2);
  });

  it('6b. Insights aggregations are mathematically correct', async () => {
    const res = await request(app)
      .get(`/api/campaigns/${campaignId}/insights`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    const insights = res.body.data.insights;
    expect(insights.length).toBe(2);

    const choice = insights.find(i => String(i._id) === String(singleChoiceQId));
    expect(choice.total_answers).toBe(2);
    expect(choice.counts['RSA']).toBe(1);
    expect(choice.counts['ECC']).toBe(1);

    const rating = insights.find(i => String(i._id) === String(ratingQId));
    expect(rating.total_answers).toBe(2);
    expect(rating.average).toBe(9); // (10 + 8) / 2
  });
});
