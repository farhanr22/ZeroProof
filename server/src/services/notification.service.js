import { logger } from '../core/logger.js';

/**
 * Mock dispatcher or trigger for OTPs.
 * The external notification service worker will query the database for 
 * unlocked, unsent Contact documents and dispatch them. This notifies systems to wake up.
 */
export const dispatchOTPs = async (campaign_id) => {
  logger.info({ campaign_id }, 'Campaign activated! External notification queue is now open to dispatch OTPs.');
  // System will poll the Contacts targeting { otp: { $ne: null }, sent_at: null }
};
