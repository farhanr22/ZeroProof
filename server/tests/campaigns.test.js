import request from 'supertest';
import app from '../src/app.js';
import mongoose from 'mongoose';
import { User } from '../src/models/User.js';
import { Campaign } from '../src/models/Campaign.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

describe('Campaigns API /api/campaigns', () => {
  let userAToken, userBToken, userAId;

  beforeAll(async () => {
    const password_hash = await bcrypt.hash('password123', 10);
    const userA = await User.create({ email: 'userA@example.com', password_hash });
    const userB = await User.create({ email: 'userB@example.com', password_hash });
    
    userAId = userA._id;

    userAToken = jwt.sign({ user_id: userA._id, password_version: userA.password_version }, process.env.JWT_SECRET || 'secret');
    userBToken = jwt.sign({ user_id: userB._id, password_version: userB.password_version }, process.env.JWT_SECRET || 'secret');
  });

  describe('CRUD Operations and Ownership Isolations', () => {
    let campaignId;

    it('creates a new campaign in draft mode for User A', async () => {
      const res = await request(app)
        .post('/api/campaigns')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ name: 'Campaign A' });
      
      expect(res.status).toBe(201);
      expect(res.body.data.campaign.name).toBe('Campaign A');
      expect(res.body.data.campaign.mode).toBe('draft');
      expect(res.body.data.campaign.admin_id.toString()).toBe(userAId.toString());
      campaignId = res.body.data.campaign._id;
    });

    it('prevents User A from creating another campaign with the same name', async () => {
      const res = await request(app)
        .post('/api/campaigns')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ name: 'Campaign A' });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe(true);
      expect(res.body.error_message).toBe('A campaign with this name already exists');
    });

    it('User A lists their campaigns and sees Campaign A and config status', async () => {
      const res = await request(app)
        .get('/api/campaigns')
        .set('Authorization', `Bearer ${userAToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.data.campaigns.length).toBe(1);
      expect(res.body.data.campaigns[0]._id).toBe(campaignId);
      // Verify OTP service status is present
      expect(res.body.data.config).toBeDefined();
      expect(typeof res.body.data.config.otp_service_enabled).toBe('boolean');
    });

    it('User B lists their campaigns and gets an empty list (Ownership Test)', async () => {
      const res = await request(app)
        .get('/api/campaigns')
        .set('Authorization', `Bearer ${userBToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.data.campaigns.length).toBe(0);
    });

    it('User B cannot fetch Campaign A by ID (Ownership Test)', async () => {
      const res = await request(app)
        .get(`/api/campaigns/${campaignId}`)
        .set('Authorization', `Bearer ${userBToken}`);
      
      expect(res.status).toBe(404);
      expect(res.body.error).toBe(true);
    });

    it('User A can update Campaign A info (draft)', async () => {
      const res = await request(app)
        .patch(`/api/campaigns/${campaignId}/info`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ description: 'New description' });
      
      expect(res.status).toBe(200);
      expect(res.body.data.campaign.description).toBe('New description');
    });

    it('User A can delete their campaign', async () => {
      const res = await request(app)
        .delete(`/api/campaigns/${campaignId}`)
        .set('Authorization', `Bearer ${userAToken}`);
      
      expect(res.status).toBe(200);

      // Verify campaign is gone
      const fetchRes = await request(app)
        .get(`/api/campaigns/${campaignId}`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(fetchRes.status).toBe(404);
    });
  });
});
