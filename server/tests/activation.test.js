import request from 'supertest';
import app from '../src/app.js';
import mongoose from 'mongoose';
import { User } from '../src/models/User.js';
import { Contact } from '../src/models/Contact.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

describe('Activation API /api/campaigns/:id/activate', () => {
  let token, campaignId;

  beforeAll(async () => {
    const password_hash = await bcrypt.hash('password123', 10);
    const user = await User.create({ email: 'activate@example.com', password_hash });
    
    token = jwt.sign({ user_id: user._id, password_version: user.password_version }, process.env.JWT_SECRET || 'secret');

    // Create campaign
    const res = await request(app)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Activation Test Campaign' });
    campaignId = res.body.data.campaign._id;

    // Add contacts
    await request(app)
      .post(`/api/campaigns/${campaignId}/contacts`)
      .set('Authorization', `Bearer ${token}`)
      .send({ values: ['contact1@example.com', 'contact2@example.com'] });
  });

  it('Activates a draft campaign successfully', async () => {
    const res = await request(app)
      .post(`/api/campaigns/${campaignId}/activate`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(200);
    const campaign = res.body.data.campaign;
    expect(campaign.mode).toBe('active');
    expect(campaign.public_key_pem).toBeDefined();
    expect(campaign.private_key_pem).toBeDefined();
    expect(campaign.public_key_pem).toMatch(/BEGIN PUBLIC KEY/);
    expect(campaign.private_key_pem).toMatch(/BEGIN PRIVATE KEY/);

    // Verify Contacts received OTPs
    const contacts = await Contact.find({ campaign_id: campaignId });
    expect(contacts.length).toBe(2);
    contacts.forEach(c => {
      expect(c.otp).toBeDefined();
      expect(typeof c.otp).toBe('string');
      expect(c.otp).toHaveLength(6);
    });
  });

  it('Rejects activation if already active', async () => {
    const res = await request(app)
      .post(`/api/campaigns/${campaignId}/activate`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(400);
    expect(res.body.error).toBe(true);
    expect(res.body.error_message).toMatch(/already active/i);
  });
});
