import { Contact } from '../models/Contact.js';
import { Campaign } from '../models/Campaign.js';
import { ApiError } from '../core/errors.js';

const CLIENT_APP_DOMAIN = process.env.CLIENT_APP_DOMAIN || 'http://localhost:4000';

/**
 * Claims a lease on the next available unsent contact.
 * Returns { campaign_name, value, access_url, contact_id } for the notification service.
 * Raw OTP and campaign_id are intentionally omitted from the return — the client app
 * should never receive campaign_id, and the OTP is embedded opaquely in the access_url.
 */
export const lockNextContact = async (sender_id) => {
  if (!sender_id) throw new ApiError(400, 'sender_id is required for leasing');

  const staleThreshold = new Date(Date.now() - 60000);

  const contact = await Contact.findOneAndUpdate(
    {
      otp: { $ne: null },
      otp_used: false,
      sent_at: null,
      $or: [
        { 'send_lock.locked_by': null },
        { 'send_lock.locked_at': { $lt: staleThreshold } }
      ]
    },
    {
      $set: {
        'send_lock.locked_by': sender_id,
        'send_lock.locked_at': new Date()
      }
    },
    { returnDocument: 'after', sort: { _id: 1 } }
  );

  if (!contact) return null;

  const campaign = await Campaign.findById(contact.campaign_id).select('name');

  return {
    contact_id:    contact._id,
    campaign_id:   contact.campaign_id, // kept internally for confirm/release calls
    campaign_name: campaign?.name ?? 'Survey',
    value:         contact.value,
    access_url:    `${CLIENT_APP_DOMAIN}/start?otp=${contact.otp}`
  };
};

export const confirmSent = async (contact_id, campaign_id, sender_id) => {
  if (!contact_id || !campaign_id || !sender_id) throw new ApiError(400, 'Missing confirmation parameters');

  const contact = await Contact.findOneAndUpdate(
    { _id: contact_id, campaign_id, 'send_lock.locked_by': sender_id },
    { $set: { sent_at: new Date(), 'send_lock.locked_by': null, 'send_lock.locked_at': null } },
    { returnDocument: 'after' }
  );

  if (!contact) throw new ApiError(404, 'Contact lease not found or was hijacked due to timeout');
  return true;
};

export const releaseLock = async (contact_id, campaign_id, sender_id) => {
  if (!contact_id || !campaign_id || !sender_id) throw new ApiError(400, 'Missing release parameters');

  const contact = await Contact.findOneAndUpdate(
    { _id: contact_id, campaign_id, 'send_lock.locked_by': sender_id },
    { $set: { 'send_lock.locked_by': null, 'send_lock.locked_at': null } },
    { returnDocument: 'after' }
  );

  if (!contact) throw new ApiError(404, 'Contact lease not found or was hijacked due to timeout');
  return true;
};
