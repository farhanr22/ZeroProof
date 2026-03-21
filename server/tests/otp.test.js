import request from 'supertest';
import app from '../src/app.js';
import mongoose from 'mongoose';
import { Contact } from '../src/models/Contact.js';
import { Campaign } from '../src/models/Campaign.js';
import { User } from '../src/models/User.js';

describe('OTP Notification Service API', () => {
  const SECRET = process.env.OTP_SERVICE_SECRET || 'dev_otp_secret';
  let campaignId, contactId1, contactId2;

  beforeAll(async () => {
    const user = await User.create({ email: 'otp_admin@example.com', password_hash: 'hash' });
    const campaign = await Campaign.create({
      admin_id: user._id,
      name: 'OTP Notification Campaign',
      mode: 'active',
      questions: []
    });
    campaignId = campaign._id;

    // Direct injection mocking previously generated properties mapped from Activation (Phase 5)
    const c1 = await Contact.create({
      campaign_id: campaignId,
      value: '1111111111',
      otp: '123456'
    });
    contactId1 = c1._id;

    const c2 = await Contact.create({
      campaign_id: campaignId,
      value: '2222222222',
      otp: '654321'
    });
    contactId2 = c2._id;
  });

  it('blocks unauthenticated requests missing the secret header layer', async () => {
    const res = await request(app).get('/api/otp/next-contact');
    expect(res.status).toBe(401);
  });

  it('leases exactly one available contact distinctly to worker A', async () => {
    const res = await request(app)
      .get('/api/otp/next-contact?sender_id=workerA')
      .set('X-OTP-Service-Secret', SECRET);
    
    expect(res.status).toBe(200);
    expect(res.body.data.contact_id).toBeDefined();
    expect(res.body.data.campaign_name).toBeDefined();
    expect(res.body.data.value).toBeDefined();
    expect(res.body.data.access_url).toMatch(/\/start\?otp=/);
    // Raw OTP must NOT be exposed
    expect(res.body.data.otp).toBeUndefined();
    
    const contact = await Contact.findById(res.body.data.contact_id);
    expect(contact.send_lock.locked_by).toBe('workerA');
    expect(contact.send_lock.locked_at).toBeDefined();
  });

  it('shifts dynamically returning the second untouched contact to worker B', async () => {
    const res = await request(app)
      .get('/api/otp/next-contact?sender_id=workerB')
      .set('X-OTP-Service-Secret', SECRET);
    
    expect(res.status).toBe(200);
    expect(res.body.data.contact_id).toBeDefined();
    
    const contact = await Contact.findById(res.body.data.contact_id);
    expect(contact.send_lock.locked_by).toBe('workerB');
  });

  it('returns explicit 204 No Content precisely mapping specifications on exhaustions', async () => {
    const res = await request(app)
      .get('/api/otp/next-contact?sender_id=workerC')
      .set('X-OTP-Service-Secret', SECRET);
    
    expect(res.status).toBe(204);
  });

  it('certifies confirming a lease securely deletes the local lock and outputs successful transmission metrics', async () => {
    const contactInfo = await Contact.findOne({ 'send_lock.locked_by': 'workerA' });
    
    const res = await request(app)
      .post('/api/otp/confirm-sent')
      .set('X-OTP-Service-Secret', SECRET)
      .send({ contact_id: contactInfo._id, campaign_id: campaignId, sender_id: 'workerA' });
    
    expect(res.status).toBe(200);
    expect(res.body.data.success).toBe(true);

    const verified = await Contact.findById(contactInfo._id);
    expect(verified.sent_at).not.toBeNull();
    expect(verified.send_lock.locked_by).toBeNull();
  });

  it('allows generic release logic returning states back to null values safely when requests timeout internally', async () => {
    const contactInfo = await Contact.findOne({ 'send_lock.locked_by': 'workerB' });
    
    const res = await request(app)
      .post('/api/otp/release-lock')
      .set('X-OTP-Service-Secret', SECRET)
      .send({ contact_id: contactInfo._id, campaign_id: campaignId, sender_id: 'workerB' });
    
    expect(res.status).toBe(200);
    
    const verified = await Contact.findById(contactInfo._id);
    expect(verified.sent_at).toBeNull(); 
    expect(verified.send_lock.locked_by).toBeNull();
  });
});
