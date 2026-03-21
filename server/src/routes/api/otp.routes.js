import { Router } from 'express';
import { asyncHandler } from '../../core/errors.js';
import { sendResponse } from '../../core/response.js';
import * as otpService from '../../services/otp.service.js';

const router = Router();

// Returns { campaign_name, value, access_url, contact_id, campaign_id }
// access_url contains the OTP embedded — notification service puts this directly in the message.
// Raw OTP is NOT exposed here.
router.get('/next-contact', asyncHandler(async (req, res) => {
  const sender_id = req.query.sender_id || 'default_worker';
  const result = await otpService.lockNextContact(sender_id);

  if (!result) {
    return res.status(204).end();
  }

  sendResponse(res, result);
}));

router.post('/confirm-sent', asyncHandler(async (req, res) => {
  const { contact_id, campaign_id, sender_id } = req.body;
  await otpService.confirmSent(contact_id, campaign_id, sender_id);
  sendResponse(res, { success: true });
}));

router.post('/release-lock', asyncHandler(async (req, res) => {
  const { contact_id, campaign_id, sender_id } = req.body;
  await otpService.releaseLock(contact_id, campaign_id, sender_id);
  sendResponse(res, { success: true });
}));

export default router;
