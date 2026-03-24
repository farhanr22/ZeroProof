import request from 'supertest';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { Campaign } from '../src/models/Campaign.js';
import { Contact } from '../src/models/Contact.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

describe('OTP Service Toggle Logic / Manual Fallback', () => {
  let userAToken, campaignId;
  const originalEnv = process.env.OTP_SERVICE_ENABLED;

  beforeAll(async () => {
    const password_hash = await bcrypt.hash('password123', 10);
    const userA = await User.create({ email: 'otp_toggle_test@example.com', password_hash });
    userAToken = jwt.sign({ user_id: userA._id, password_version: userA.password_version }, process.env.JWT_SECRET || 'secret');

    const res = await request(app)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ name: 'OTP Logic Campaign' });
    campaignId = res.body.data.campaign._id;

    // Add a contact with an OTP
    await Contact.create({
      campaign_id: campaignId,
      value: '919876543210',
      otp: 'TEST-OTP-123'
    });
  });

  afterAll(() => {
    process.env.OTP_SERVICE_ENABLED = originalEnv;
  });

  it('reflects OTP_SERVICE_ENABLED=true in campaign config', async () => {
    process.env.OTP_SERVICE_ENABLED = 'true';
    const res = await request(app)
      .get(`/api/campaigns/${campaignId}`)
      .set('Authorization', `Bearer ${userAToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.data.config.otp_service_enabled).toBe(true);
  });

  it('reflects OTP_SERVICE_ENABLED=false in campaign config', async () => {
    process.env.OTP_SERVICE_ENABLED = 'false';
    const res = await request(app)
      .get(`/api/campaigns/${campaignId}`)
      .set('Authorization', `Bearer ${userAToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.data.config.otp_service_enabled).toBe(false);
  });

  it('hides access_url when OTP_SERVICE_ENABLED=true', async () => {
    process.env.OTP_SERVICE_ENABLED = 'true';
    const res = await request(app)
      .get(`/api/campaigns/${campaignId}/contacts`)
      .set('Authorization', `Bearer ${userAToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.data.contacts[0].access_url).toBeUndefined();
    expect(res.body.data.contacts[0].otp).toBeUndefined();
  });

  it('provides access_url when OTP_SERVICE_ENABLED=false', async () => {
    process.env.OTP_SERVICE_ENABLED = 'false';
    const res = await request(app)
      .get(`/api/campaigns/${campaignId}/contacts`)
      .set('Authorization', `Bearer ${userAToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.data.contacts[0].access_url).toBeDefined();
    expect(res.body.data.contacts[0].access_url).toMatch(/otp=TEST-OTP-123/);
  });
});
