import { Router } from 'express';
import { asyncHandler } from '../../core/errors.js';
import { sendResponse } from '../../core/response.js';
import * as otpService from '../../services/otp.service.js';

const router = Router();

router.get('/next-contact', asyncHandler(async (req, res) => {
  const sender_id = req.query.sender_id || 'default_worker';
  const contact = await otpService.lockNextContact(sender_id);
  
  if (!contact) {
    // 204 No Content explicitly signals the worker queue is fully empty
    return res.status(204).end();
  }

  // Strip MongoDB specifics and relay pure string outputs to the worker
  sendResponse(res, {
    contact_id: contact._id,
    campaign_id: contact.campaign_id,
    value: contact.value,
    otp: contact.otp
  });
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
