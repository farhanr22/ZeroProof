import request from 'supertest';
import app from '../src/app.js';
import jwt from 'jsonwebtoken';
import * as campaignService from '../src/services/campaign.service.js';

describe('AI Questionnaire Builder API', () => {
  let adminToken;
  let adminUserId;
  let campaignId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'ai.test@admin.com', password: 'password123' });
    adminToken = res.body.data.token;
    const decoded = jwt.decode(adminToken);
    adminUserId = decoded.user_id;
  });

  let originalFetch;

  beforeEach(async () => {
    originalFetch = global.fetch;
    const campaign = await campaignService.createCampaign(adminUserId, `Test Campaign for AI ${Date.now()}`);
    campaignId = campaign._id.toString();

    // Mock the global fetch function manually to intercept the OpenAI SDK's network call
    global.fetch = async (url) => {
      // The OpenAI SDK hits chat/completions natively mapped from fetch
      if (url.includes('chat/completions')) {
        const mockBody = {
          id: 'chatcmpl-mock',
          object: 'chat.completion',
          created: 1234567,
          model: 'gpt-4o-mini',
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: JSON.stringify({
                questions: [
                  { type: 'text', text: 'How are you?', options: [] },
                  { type: 'single_choice', text: 'Rate?', options: ['1','2','3'] }
                ]
              })
            },
            finish_reason: 'stop'
          }],
          usage: {
            prompt_tokens: 100,
            completion_tokens: 100,
            total_tokens: 200
          }
        };

        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => mockBody,
          text: async () => JSON.stringify(mockBody)
        });
      }
      throw new Error('Unknown mocked url');
    };
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('generates questions via the AI endpoint when a valid prompt is given', async () => {
    const response = await request(app)
      .post(`/api/campaigns/${campaignId}/ai-generate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ prompt: 'Please write a simple survey.' });

    expect(response.status).toBe(200);
    expect(response.body.error).toBe(false);
    
    // Check if the mock returned the 2 questions
    const generated = response.body.data.questions;
    expect(generated.length).toBe(2);
    expect(generated[0].type).toBe('text');
    expect(generated[0].text).toBe('How are you?');
    expect(generated[1].type).toBe('single_choice');
    expect(generated[1].options.length).toBe(3);
  });

  it('rejects an empty prompt with 400 Bad Request', async () => {
    const response = await request(app)
      .post(`/api/campaigns/${campaignId}/ai-generate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ prompt: '' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(true);
    expect(response.body.error_message).toContain('prompt');
  });

  it('rejects unauthenticated requests 401 Unauthorized', async () => {
    const response = await request(app)
      .post(`/api/campaigns/${campaignId}/ai-generate`)
      .send({ prompt: 'Please write a simple survey.' });

    expect(response.status).toBe(401);
  });
});
