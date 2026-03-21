import { Router } from 'express';
import { asyncHandler } from '../../core/errors.js';
import { sendResponse } from '../../core/response.js';
import * as publicService from '../../services/public.service.js';

const router = Router();

router.get('/start', asyncHandler(async (req, res) => {
  const result = await publicService.startFlow(req.query.otp);
  sendResponse(res, result);
}));

router.post('/submit-otp', asyncHandler(async (req, res) => {
  const { otp, blinded_msg_b64, campaign_id } = req.body;
  const result = await publicService.submitOtp(otp, blinded_msg_b64, campaign_id);
  sendResponse(res, result);
}));

router.post('/submit-response', asyncHandler(async (req, res) => {
  const { campaign_id, token_b64, signature_b64, answers } = req.body;
  const result = await publicService.submitResponse(campaign_id, token_b64, signature_b64, answers);
  sendResponse(res, result);
}));

export default router;
