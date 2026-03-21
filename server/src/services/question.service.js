import { getCampaignById } from './campaign.service.js';
import { ApiError } from '../core/errors.js';

export const listQuestions = async (admin_id, campaign_id) => {
  const campaign = await getCampaignById(admin_id, campaign_id);
  return campaign.questions;
};

export const updateQuestions = async (admin_id, campaign_id, questionsParam) => {
  const campaign = await getCampaignById(admin_id, campaign_id);
  if (campaign.mode !== 'draft') {
    throw new ApiError(400, 'Cannot modify questions of an active campaign');
  }

  const questions = questionsParam.map((q, index) => ({ ...q, order: index }));
  
  campaign.questions = questions;
  await campaign.save();

  return campaign.questions;
};
