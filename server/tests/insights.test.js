import request from 'supertest';
import app from '../src/app.js';
import mongoose from 'mongoose';
import { User } from '../src/models/User.js';
import { Campaign } from '../src/models/Campaign.js';
import { Response } from '../src/models/Response.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

describe('Insights & Responses API /api/campaigns/:id/...', () => {
  let token, campaignId, userBToken;
  const qSingle = new mongoose.Types.ObjectId();
  const qMulti = new mongoose.Types.ObjectId();
  const qRating = new mongoose.Types.ObjectId();
  const qText = new mongoose.Types.ObjectId();

  beforeAll(async () => {
    const password_hash = await bcrypt.hash('password123', 10);
    const userA = await User.create({ email: 'insightA@example.com', password_hash });
    const userB = await User.create({ email: 'insightB@example.com', password_hash });
    
    token = jwt.sign({ user_id: userA._id, password_version: userA.password_version }, process.env.JWT_SECRET || 'secret');
    userBToken = jwt.sign({ user_id: userB._id, password_version: userB.password_version }, process.env.JWT_SECRET || 'secret');

    const mockCampaign = await Campaign.create({
      admin_id: userA._id,
      name: 'Feedback Flow Testing',
      mode: 'active',
      questions: [
        { _id: qSingle, order: 0, type: 'single_choice', text: 'Color?', options: ['Red', 'Blue'] },
        { _id: qMulti, order: 1, type: 'multi_choice', text: 'Pets?', options: ['Dog', 'Cat'] },
        { _id: qRating, order: 2, type: 'rating', text: 'Score out of 10?' },
        { _id: qText, order: 3, type: 'text', text: 'Comments?' }
      ]
    });
    campaignId = mockCampaign._id;

    // Inject simulated responses bridging blind submissions cleanly
    await Response.create({
      campaign_id: campaignId,
      blind_token_id: new mongoose.Types.ObjectId(),
      answers: [
        { question_id: qSingle, type: 'single_choice', value: 'Red' },
        { question_id: qMulti, type: 'multi_choice', value: ['Dog', 'Cat'] },
        { question_id: qRating, type: 'rating', value: 8 },
        { question_id: qText, type: 'text', value: 'A fully transparent text chunk.' }
      ]
    });

    await Response.create({
      campaign_id: campaignId,
      blind_token_id: new mongoose.Types.ObjectId(),
      answers: [
        { question_id: qSingle, type: 'single_choice', value: 'Blue' },
        { question_id: qMulti, type: 'multi_choice', value: ['Cat'] },
        { question_id: qRating, type: 'rating', value: 10 },
        { question_id: qText, type: 'text', value: 'Another raw comment.' }
      ]
    });
  });

  it('lists raw unaggregated responses successfully', async () => {
    const res = await request(app)
      .get(`/api/campaigns/${campaignId}/responses`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(200);
    expect(res.body.data.responses.length).toBe(2);
  });

  it('computes accurately formatted insight aggregations', async () => {
    const res = await request(app)
      .get(`/api/campaigns/${campaignId}/insights`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(200);
    const insights = res.body.data.insights;
    expect(insights.length).toBe(4);

    const single = insights.find(i => String(i._id) === String(qSingle));
    expect(single.counts['Red']).toBe(1);
    expect(single.counts['Blue']).toBe(1);

    const multi = insights.find(i => String(i._id) === String(qMulti));
    expect(multi.counts['Dog']).toBe(1);
    expect(multi.counts['Cat']).toBe(2);

    // Number math logic matching the expected 1-10 inputs (averaging 8 + 10)
    const rating = insights.find(i => String(i._id) === String(qRating));
    expect(rating.average).toBe(9); 
    expect(rating.distribution['8']).toBe(1);
    expect(rating.distribution['10']).toBe(1);

    // Verifying ALL text responses are listed explicitly without sampling truncations
    const text = insights.find(i => String(i._id) === String(qText));
    expect(text.texts).toContain('A fully transparent text chunk.');
    expect(text.texts).toContain('Another raw comment.');
  });

  it('blocks unauthorized access natively checking Campaign ownership paths', async () => {
    const res = await request(app)
      .get(`/api/campaigns/${campaignId}/insights`)
      .set('Authorization', `Bearer ${userBToken}`);
    expect(res.status).toBe(404);
  });
});
