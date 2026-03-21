import { Campaign } from '../models/Campaign.js';
import { Contact } from '../models/Contact.js';
import { BlindToken } from '../models/BlindToken.js';
import { Response } from '../models/Response.js';
import { ApiError } from '../core/errors.js';
import crypto from 'crypto';
import * as blindrsaService from './blindrsa.service.js';

export const startFlow = async (otp) => {
  if (!otp) throw new ApiError(400, 'Anonymous Access Token required securely.');

  const contact = await Contact.findOne({ otp, otp_used: false });
  if (!contact) throw new ApiError(404, 'Invalid logic branch or token effectively expired remotely.');

  const campaign = await Campaign.findOne({ _id: contact.campaign_id, mode: 'active' });
  if (!campaign) throw new ApiError(404, 'Campaign context inactive globally.');

  // Render Base64 encoded SPKI bytes extracting PEM metadata securely mirroring legacy schemas
  const b64Lines = campaign.public_key_pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');

  const payload = JSON.stringify({
    campaign_id: campaign._id,
    campaign_name: campaign.name,
    questions: campaign.questions
  });

  return {
    campaign_id: campaign._id,
    campaign_name: campaign.name,
    public_key_spki: b64Lines,
    question_payload: payload
  };
};

export const submitOtp = async (otp, blinded_msg_b64, campaign_id) => {
  if (!otp || !blinded_msg_b64 || !campaign_id) throw new ApiError(400, 'Incomplete Blind RSA parameters mapped securely.');

  // Mutates structurally atomic logic verifying lock exactly once!
  const contact = await Contact.findOneAndUpdate(
    { otp, campaign_id, otp_used: false },
    { $set: { otp_used: true } },
    { new: true }
  );

  if (!contact) throw new ApiError(403, 'Token explicitly invalid preventing cryptographic leakage natively.');

  const campaign = await Campaign.findById(campaign_id);
  
  // Hand off exclusively securely processed byte signatures protecting non-deterministic derivations natively
  const blind_signature_b64 = await blindrsaService.signToken(campaign.private_key_pem, blinded_msg_b64);

  const b64Lines = campaign.public_key_pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const question_payload = JSON.stringify({
    campaign_id: campaign._id,
    campaign_name: campaign.name,
    questions: campaign.questions
  });

  return {
    blind_signature_b64,
    public_key_spki: b64Lines,
    question_payload
  };
};

export const submitResponse = async (campaign_id, token_b64, signature_b64, answers) => {
  if (!campaign_id || !token_b64 || !signature_b64 || !answers) {
    throw new ApiError(400, 'Anonymised vectors strictly missing secure implementations.');
  }

  const campaign = await Campaign.findOne({ _id: campaign_id, mode: 'active' });
  if (!campaign) throw new ApiError(404, 'Isolated context locked administratively.');

  // Pass structurally isolated dependencies asserting unblinded signatures mathematically
  const isValid = await blindrsaService.verifySignature(campaign.public_key_pem, token_b64, signature_b64);
  if (!isValid) throw new ApiError(401, 'Invalid non-deterministic RSA signature blocked inherently.');

  // Prevent multiple iterations securely
  const tokenHash = crypto.createHash('sha256').update(token_b64).digest('hex');

  let blindToken;
  try {
    blindToken = await BlindToken.create({ token_hash: tokenHash, campaign_id });
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(409, 'Replay block securely tracked asserting multiple submission attempts.');
    }
    throw err;
  }

  // Mapped isolated telemetry responses explicitly inserting statistical variables securely
  await Response.create({
    campaign_id,
    blind_token_id: blindToken._id,
    answers
  });

  return { success: true };
};
