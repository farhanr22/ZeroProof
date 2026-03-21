import request from 'supertest';
import app from '../src/app.js';
import mongoose from 'mongoose';
import { User } from '../src/models/User.js';
import { Campaign } from '../src/models/Campaign.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

describe('Contacts API /api/campaigns/:id/contacts', () => {
  let userAToken, userBToken, campaignId;

  beforeAll(async () => {
    const password_hash = await bcrypt.hash('password123', 10);
    const userA = await User.create({ email: 'contact_userA@example.com', password_hash });
    const userB = await User.create({ email: 'contact_userB@example.com', password_hash });
    
    userAToken = jwt.sign({ user_id: userA._id, password_version: userA.password_version }, process.env.JWT_SECRET || 'secret');
    userBToken = jwt.sign({ user_id: userB._id, password_version: userB.password_version }, process.env.JWT_SECRET || 'secret');

    const res = await request(app)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ name: 'Contacts Campaign' });
    campaignId = res.body.data.campaign._id;
  });

  describe('CRUD Operations', () => {
    let contactId;

    it('User A can add contacts to their draft campaign', async () => {
      const res = await request(app)
        .post(`/api/campaigns/${campaignId}/contacts`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ values: ['+1234567890', 'test@example.com'] });
      
      expect(res.status).toBe(201);
      expect(res.body.data.success).toBe(true);
      expect(res.body.data.added).toBe(2);
    });

    it('User B cannot add contacts to User A campaign', async () => {
      const res = await request(app)
        .post(`/api/campaigns/${campaignId}/contacts`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ values: ['hacker@hacker.com'] });
      expect(res.status).toBe(404); // Campaign not found for User B
    });

    it('User A can list contacts', async () => {
      const res = await request(app)
        .get(`/api/campaigns/${campaignId}/contacts`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.contacts.length).toBe(2);
      contactId = res.body.data.contacts[0]._id;
    });

    it('User A can delete a contact', async () => {
      const res = await request(app)
        .delete(`/api/campaigns/${campaignId}/contacts/${contactId}`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);
    });

    it('User A cannot add contacts if campaign is active', async () => {
      // Direct DB modify to simulate activation (Activation is Phase 6)
      await Campaign.updateOne({ _id: campaignId }, { mode: 'active' });

      const res = await request(app)
        .post(`/api/campaigns/${campaignId}/contacts`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ values: ['new@example.com'] });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe(true);
      expect(res.body.error_message).toMatch(/active campaign/i);
    });
  });
});
