/**
 * PSEUDOCODE - OTP Notification Service Worker
 *
 * Standalone Node app that polls the backend and dispatches OTP messages.
 * Will have its own package.json with minimal deps (e.g., twilio, nodemailer).
 *
 * Environment variables needed:
 *   API_BASE_URL          - e.g. https://api.yourbackend.com/api/otp
 *   OTP_SERVICE_SECRET    - shared secret for X-OTP-Service-Secret header
 *   SENDER_ID             - unique name for this worker instance
 *
 * Note: CLIENT_APP_DOMAIN is configured on the *backend* server.
 * The notification service receives a pre-built access_url and uses it directly.
 */

/*
const API_BASE  = process.env.API_BASE_URL;
const SECRET    = process.env.OTP_SERVICE_SECRET;
const SENDER_ID = process.env.SENDER_ID || `worker-${Math.random().toString(36).slice(2)}`;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function startWorker() {
  console.log(`[${SENDER_ID}] OTP notification worker starting...`);

  while (true) {
    try {
      // 1. Request a lease on the next available contact
      const res = await fetch(`${API_BASE}/next-contact?sender_id=${SENDER_ID}`, {
        headers: { 'X-OTP-Service-Secret': SECRET }
      });

      if (res.status === 204) {
        // Queue empty — wait before polling again
        await sleep(5000);
        continue;
      }

      const { data } = await res.json();
      // data = { contact_id, campaign_id, campaign_name, value, access_url }
      // access_url is already built: https://clientapp.com/start?otp=<otp>

      // 2. Compose and send the message
      const message = `Hi,\n\nYou've been invited to share feedback for "${data.campaign_name}".\n\nTap the link below or copy it into your feedback app:\n${data.access_url}\n\nThis link can only be used once.`;

      // await ExternalProvider.send({ to: data.value, body: message });
      console.log(`[${SENDER_ID}] Would send to ${data.value}:\n${message}`);

      // 3. Confirm the send
      await fetch(`${API_BASE}/confirm-sent`, {
        method: 'POST',
        headers: { 'X-OTP-Service-Secret': SECRET, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_id:  data.contact_id,
          campaign_id: data.campaign_id,
          sender_id:   SENDER_ID
        })
      });

    } catch (err) {
      console.error(`[${SENDER_ID}] Error — releasing lock if held:`, err.message);
      // await fetch(`${API_BASE}/release-lock`, { ... })
      await sleep(5000);
    }
  }
}

startWorker();
*/
