import { Router } from 'express';
import { validate } from '../../core/validate.js';
import { asyncHandler } from '../../core/errors.js';
import { sendResponse } from '../../core/response.js';
import { authMiddleware } from '../../core/auth.middleware.js';
import * as campaignService from '../../services/campaign.service.js';
import { createCampaignSchema, updateCampaignInfoSchema } from '../../schemas/campaign.schema.js';
import contactsRoutes from './contacts.routes.js';
import questionsRoutes from './questions.routes.js';

const router = Router();
router.use(authMiddleware);

router.use('/:id/contacts', contactsRoutes);
router.use('/:id/questions', questionsRoutes);

router.get('/', asyncHandler(async (req, res) => {
  req.log.info({ user_id: req.user.user_id }, 'Listing campaigns');
  const campaigns = await campaignService.listCampaigns(req.user.user_id);
  sendResponse(res, { campaigns });
}));

router.post('/', validate(createCampaignSchema), asyncHandler(async (req, res) => {
  req.log.info({ user_id: req.user.user_id, name: req.body.name }, 'Creating campaign');
  const campaign = await campaignService.createCampaign(req.user.user_id, req.body.name);
  sendResponse(res, { campaign }, false, null, 201);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const campaign = await campaignService.getCampaignById(req.user.user_id, req.params.id);
  sendResponse(res, { campaign });
}));

router.post('/:id/activate', asyncHandler(async (req, res) => {
  const campaign = await campaignService.activateCampaign(req.user.user_id, req.params.id);
  sendResponse(res, { campaign });
}));

router.patch('/:id/info', validate(updateCampaignInfoSchema), asyncHandler(async (req, res) => {
  const campaign = await campaignService.updateCampaignInfo(req.user.user_id, req.params.id, req.body);
  sendResponse(res, { campaign });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  await campaignService.deleteCampaign(req.user.user_id, req.params.id);
  sendResponse(res, { success: true });
}));

import * as aiService from '../../services/ai.service.js';
import { generateQuestionsSchema } from '../../schemas/ai.schema.js';

router.post('/:id/ai-generate', validate(generateQuestionsSchema), asyncHandler(async (req, res) => {
  const campaign = await campaignService.getCampaignById(req.user.user_id, req.params.id);
  // generate questions based on the user's prompt and campaign context
  const questions = await aiService.generateQuestions(req.body.prompt, campaign.name, campaign.description);
  sendResponse(res, { questions });
}));


import * as insightsService from '../../services/insights.service.js';

// ... other endpoints earlier ...

router.get('/:id/responses', asyncHandler(async (req, res) => {
  const responses = await insightsService.listResponses(req.user.user_id, req.params.id);
  sendResponse(res, { responses });
}));

router.get('/:id/insights', asyncHandler(async (req, res) => {
  const insights = await insightsService.getInsights(req.user.user_id, req.params.id);
  sendResponse(res, { insights });
}));

export default router;
