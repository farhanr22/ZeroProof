import { Campaign } from '../models/Campaign.js';
import { BlindToken } from '../models/BlindToken.js';
import { Response } from '../models/Response.js';
import { ApiError } from '../core/errors.js';

export const listCampaigns = async (admin_id) => {
  return Campaign.find({ admin_id }).sort({ created_at: -1 });
};

export const createCampaign = async (admin_id, name) => {
  const campaign = new Campaign({ admin_id, name });
  await campaign.save();
  return campaign;
};

export const getCampaignById = async (admin_id, campaign_id) => {
  const campaign = await Campaign.findOne({ _id: campaign_id, admin_id });
  if (!campaign) throw new ApiError(404, 'Campaign not found');
  return campaign;
};

export const updateCampaignInfo = async (admin_id, campaign_id, updates) => {
  const campaign = await getCampaignById(admin_id, campaign_id);
  if (campaign.mode !== 'draft') {
    throw new ApiError(400, 'Cannot edit an active campaign');
  }
  
  if (updates.name !== undefined) campaign.name = updates.name;
  if (updates.description !== undefined) campaign.description = updates.description;
  campaign.updated_at = new Date();
  
  await campaign.save();
  return campaign;
};

export const deleteCampaign = async (admin_id, campaign_id) => {
  const campaign = await getCampaignById(admin_id, campaign_id);
  
  await BlindToken.deleteMany({ campaign_id: campaign._id });
  await Response.deleteMany({ campaign_id: campaign._id });
  
  await campaign.deleteOne();
  return { success: true };
};
