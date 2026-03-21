import { Campaign } from '../models/Campaign.js';
import { Contact } from '../models/Contact.js';
import { BlindToken } from '../models/BlindToken.js';
import { Response } from '../models/Response.js';
import { ApiError } from '../core/errors.js';
import crypto from 'crypto';
import * as blindrsaService from './blindrsa.service.js';

// Step 1 of the anonymous flow.
// Returns campaign name + public key so the client can show context and begin blinding.
export const startFlow = async (otp) => {
  if (!otp) throw new ApiError(400, 'OTP is required.');

  const contact = await Contact.findOne({ otp, otp_used: false });
  if (!contact) throw new ApiError(404, 'Invalid or already-used OTP.');

  const campaign = await Campaign.findOne({ _id: contact.campaign_id, mode: 'active' });
  if (!campaign) throw new ApiError(404, 'Campaign is no longer active.');

  const public_key_spki = campaign.public_key_pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');

  // question_payload is canonical JSON the client renders directly.
  // campaign_id is intentionally omitted — the client generates its own local session ID.
  const question_payload = JSON.stringify({
    campaign_name: campaign.name,
    questions: campaign.questions
  });

  return {
    campaign_name: campaign.name,
    public_key_spki,
    question_payload
  };
};

// Step 2: Client submits blinded token, server signs it.
// campaign_id is derived from the OTP lookup — never sent by the client.
// campaign_id IS returned here so the client can use it in step 3 (in-memory only; never in a URL).
export const submitOtp = async (otp, blinded_msg_b64) => {
  if (!otp || !blinded_msg_b64) throw new ApiError(400, 'otp and blinded_msg_b64 are required.');

  const contact = await Contact.findOneAndUpdate(
    { otp, otp_used: false },
    { $set: { otp_used: true } },
    { returnDocument: 'after' }
  );
  if (!contact) throw new ApiError(403, 'Invalid or already-used OTP.');

  const campaign = await Campaign.findById(contact.campaign_id);
  if (!campaign) throw new ApiError(404, 'Campaign not found.');

  const blind_signature_b64 = await blindrsaService.signToken(campaign.private_key_pem, blinded_msg_b64);

  return {
    blind_signature_b64,
    campaign_id: campaign._id // returned ephemerally for use in submit-response; not a secret
  };
};

// Step 3: Client submits unblinded signature + answers.
// campaign_id comes from the submitOtp response (held in client memory, never in a URL).
export const submitResponse = async (campaign_id, token_b64, signature_b64, answers) => {
  if (!campaign_id || !token_b64 || !signature_b64 || !answers) {
    throw new ApiError(400, 'campaign_id, token_b64, signature_b64, and answers are required.');
  }

  const campaign = await Campaign.findOne({ _id: campaign_id, mode: 'active' });
  if (!campaign) throw new ApiError(404, 'Campaign is no longer active.');

  const isValid = await blindrsaService.verifySignature(campaign.public_key_pem, token_b64, signature_b64);
  if (!isValid) throw new ApiError(401, 'Invalid signature.');

  // Double-spend prevention via SHA-256 of the token
  const tokenHash = crypto.createHash('sha256').update(token_b64).digest('hex');

  let blindToken;
  try {
    blindToken = await BlindToken.create({ token_hash: tokenHash, campaign_id });
  } catch (err) {
    if (err.code === 11000) throw new ApiError(409, 'This response has already been submitted.');
    throw err;
  }

  await Response.create({ campaign_id, blind_token_id: blindToken._id, answers });

  return { success: true };
};
