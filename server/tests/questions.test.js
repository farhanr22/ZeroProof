import request from 'supertest';
import app from '../src/app.js';
import mongoose from 'mongoose';
import { User } from '../src/models/User.js';
import { Campaign } from '../src/models/Campaign.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

describe('Questions API /api/campaigns/:id/questions', () => {
  let userAToken, userBToken, campaignId;

  beforeAll(async () => {
    const password_hash = await bcrypt.hash('password123', 10);
    const userA = await User.create({ email: 'question_userA@example.com', password_hash });
    const userB = await User.create({ email: 'question_userB@example.com', password_hash });
    
    userAToken = jwt.sign({ user_id: userA._id, password_version: userA.password_version }, process.env.JWT_SECRET || 'secret');
    userBToken = jwt.sign({ user_id: userB._id, password_version: userB.password_version }, process.env.JWT_SECRET || 'secret');

    const res = await request(app)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ name: 'Questions Campaign' });
    campaignId = res.body.data.campaign._id;
  });

  describe('CRUD Operations', () => {

    it('User A can update questions on their draft campaign', async () => {
      const questionsData = [
        { type: 'text', text: 'How are you?', options: [] },
        { type: 'single_choice', text: 'Color?', options: ['Red', 'Blue'] }
      ];

      const res = await request(app)
        .patch(`/api/campaigns/${campaignId}/questions`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ questions: questionsData });
      
      expect(res.status).toBe(200);
      expect(res.body.data.questions.length).toBe(2);
      expect(res.body.data.questions[0].order).toBe(0);
      expect(res.body.data.questions[1].order).toBe(1);
    });

    it('User B cannot view User A questions', async () => {
      const res = await request(app)
        .get(`/api/campaigns/${campaignId}/questions`)
        .set('Authorization', `Bearer ${userBToken}`);
      expect(res.status).toBe(404);
    });

    it('User A can list their campaign questions', async () => {
      const res = await request(app)
        .get(`/api/campaigns/${campaignId}/questions`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.questions.length).toBe(2);
    });

    it('User A cannot update questions if campaign is active', async () => {
      await Campaign.updateOne({ _id: campaignId }, { mode: 'active' });

      const res = await request(app)
        .patch(`/api/campaigns/${campaignId}/questions`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ questions: [] });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe(true);
      expect(res.body.error_message).toMatch(/active campaign/i);
    });
  });
});
