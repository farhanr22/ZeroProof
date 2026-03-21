import { Contact } from '../models/Contact.js';
import { ApiError } from '../core/errors.js';

/**
 * Claims a lease on the next available unsent contact.
 * A lock is considered "available" if it's structurally null or older than 60s.
 */
export const lockNextContact = async (sender_id) => {
  if (!sender_id) throw new ApiError(400, 'sender_id is required for leasing');

  const staleThreshold = new Date(Date.now() - 60000); // 60 seconds ago timeout window

  // findOneAndUpdate is strictly atomic in MongoDB, inherently preventing race conditions
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
    { new: true, sort: { _id: 1 } }
  );

  return contact;
};

export const confirmSent = async (contact_id, campaign_id, sender_id) => {
  if (!contact_id || !campaign_id || !sender_id) throw new ApiError(400, 'Missing confirmation parameters');

  const contact = await Contact.findOneAndUpdate(
    {
      _id: contact_id,
      campaign_id,
      'send_lock.locked_by': sender_id // Ensures only the active leaseholder can commit the send
    },
    {
      $set: { 
        sent_at: new Date(),
        'send_lock.locked_by': null,
        'send_lock.locked_at': null 
      }
    },
    { new: true }
  );

  if (!contact) {
    throw new ApiError(404, 'Contact lease not found or was hijacked due to timeout');
  }

  return true;
};

export const releaseLock = async (contact_id, campaign_id, sender_id) => {
  if (!contact_id || !campaign_id || !sender_id) throw new ApiError(400, 'Missing release parameters');

  const contact = await Contact.findOneAndUpdate(
    {
      _id: contact_id,
      campaign_id,
      'send_lock.locked_by': sender_id
    },
    {
      $set: {
        'send_lock.locked_by': null,
        'send_lock.locked_at': null
      }
    },
    { new: true }
  );

  if (!contact) {
    throw new ApiError(404, 'Contact lease not found or was hijacked due to timeout');
  }

  return true;
};
