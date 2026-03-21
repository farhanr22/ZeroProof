import { Router } from 'express';
import { asyncHandler } from '../../core/errors.js';
import { sendResponse } from '../../core/response.js';
import * as publicService from '../../services/public.service.js';

const router = Router();

// Browser guard: if someone taps the link from their SMS/email, it opens as a GET
// with the otp in the query string. Return plain text telling them to use the app.
// The legitimate client app always sends otp in the POST body — never as a query param.
router.get('/start', (req, res) => {
  res
    .status(200)
    .type('text/plain')
    .send('This link is for the feedback app only. Do not open it in a browser — copy the full link and paste it into the app instead.');
});

// Step 1 (client app): POST otp in body → receive campaign name, public key, questions
router.post('/start', asyncHandler(async (req, res) => {
  const result = await publicService.startFlow(req.body.otp);
  sendResponse(res, result);
}));

// Step 2: Submit blinded token, receive blind signature + campaign_id (in-memory only)
router.post('/submit-otp', asyncHandler(async (req, res) => {
  const { otp, blinded_msg_b64 } = req.body;
  const result = await publicService.submitOtp(otp, blinded_msg_b64);
  sendResponse(res, result);
}));

// Step 3: Submit unblinded signature + answers
// campaign_id comes from the client's in-memory state (received from submit-otp)
router.post('/submit-response', asyncHandler(async (req, res) => {
  const { campaign_id, token_b64, signature_b64, answers } = req.body;
  const result = await publicService.submitResponse(campaign_id, token_b64, signature_b64, answers);
  sendResponse(res, result);
}));

export default router;
