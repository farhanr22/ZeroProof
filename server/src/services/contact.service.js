import { Contact } from '../models/Contact.js';
import { getCampaignById } from './campaign.service.js';
import { ApiError } from '../core/errors.js';

export const listContacts = async (admin_id, campaign_id) => {
  await getCampaignById(admin_id, campaign_id);
  return Contact.find({ campaign_id }).select('value _id');
};

export const addContacts = async (admin_id, campaign_id, values) => {
  const campaign = await getCampaignById(admin_id, campaign_id);
  if (campaign.mode !== 'draft') {
    throw new ApiError(400, 'Cannot modify contacts of an active campaign');
  }

  const contactsToInsert = values.map(val => ({
    campaign_id,
    value: val
  }));

  await Contact.insertMany(contactsToInsert);
  return { success: true, added: values.length };
};

export const deleteContact = async (admin_id, campaign_id, contact_id) => {
  const campaign = await getCampaignById(admin_id, campaign_id);
  if (campaign.mode !== 'draft') {
    throw new ApiError(400, 'Cannot modify contacts of an active campaign');
  }

  const result = await Contact.deleteOne({ _id: contact_id, campaign_id });
  if (result.deletedCount === 0) {
    throw new ApiError(404, 'Contact not found');
  }
  return { success: true };
};
