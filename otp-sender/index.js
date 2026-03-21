import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import 'dotenv/config';

const API_BASE = process.env.API_BASE || 'http://localhost:3000/api';
const SECRET = process.env.OTP_SERVICE_SECRET;
if (!SECRET) throw new Error('OTP_SERVICE_SECRET is required in .env');
const SENDER_ID = `whatsapp-worker`;

async function fetchApi(path, options = {}) {
  const headers = { 
    'Content-Type': 'application/json',
    'X-OTP-Service-Secret': SECRET
  };
  
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers }
  });
  
  if (res.status === 204) return { status: 204, ok: true, data: null };

  const text = await res.text();
  try {
    return { status: res.status, ok: res.ok, data: JSON.parse(text) };
  } catch (e) {
    return { status: res.status, ok: res.ok, data: text };
  }
}

function formatPhoneNumber(numberStr) {
  // Strip all non-digit characters (spaces, dashes, +, etc.)
  const digits = numberStr.replace(/\D/g, '');

  // Require at least 10 digits total (7-digit local + country code of 1-3 digits)
  if (!digits || digits.length < 10 || digits.length > 15) return null;

  return `${digits}@c.us`;
}

// Ensure the Node process doesn't exit prematurely
console.log('\n--- WHATSAPP NOTIFICATION SENDER ---');
console.log('Initializing WhatsApp Web client...\n');

const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'otp-worker' }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

client.on('qr', (qr) => {
  console.log('⚠️  No active WhatsApp session found.');
  console.log('📱 Scan this QR code with your WhatsApp app to login:\n');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ WhatsApp Web client is ready!');
  console.log('Starting polling queue...\n');
  pollQueue();
});

client.on('auth_failure', msg => {
  console.error('❌ Authentication failed:', msg);
});

async function pollQueue() {
  try {
    const res = await fetchApi(`/otp/next-contact?sender_id=${SENDER_ID}`, { method: 'GET' });
    
    if (res.status === 204) {
      if (!global.listeningMsgPrinted) {
        console.log('📭 Queue empty. Listening for new outgoing SMS...');
        global.listeningMsgPrinted = true;
      }
    } else if (res.ok) {
      const data = res.data.data;
      global.listeningMsgPrinted = false; // Reset log flag
      
      const rawNumber = data.value;
      const formattedNum = formatPhoneNumber(rawNumber);

      console.log('\n----------------------------------------');
      console.log(`To      : ${rawNumber}`);
      
      if (!formattedNum) {
        console.error(`Status  : ❌ Invalid number format. Releasing lock...`);
        // Tell server this contact is bad
        await fetchApi('/otp/release-lock', {
          method: 'POST',
          body: JSON.stringify({
            contact_id: data.contact_id,
            campaign_id: data.campaign_id,
            sender_id: SENDER_ID
          })
        });
      } else {
        const msgText = `Hi,\n\nYou've been invited to share anonymous feedback for "${data.campaign_name}".\n\nCOPY the link below in to the client application:\n${data.access_url}\n\nThis single-use link protects your anonymity. Do not click the link.`;
        
        console.log(`WA_ID   : ${formattedNum}`);
        console.log(`Status  : ⏳ Sending WhatsApp message...`);

        try {
          await client.sendMessage(formattedNum, msgText);
          
          await fetchApi('/otp/confirm-sent', {
            method: 'POST',
            body: JSON.stringify({
              contact_id: data.contact_id,
              campaign_id: data.campaign_id,
              sender_id: SENDER_ID
            })
          });
          
          console.log(`Status  : ✅ Message sent & DB confirmed!`);
        } catch (err) {
          console.error(`Status  : ❌ Send failed: ${err.message}. Releasing...`);
          await fetchApi('/otp/release-lock', {
            method: 'POST',
            body: JSON.stringify({
              contact_id: data.contact_id,
              campaign_id: data.campaign_id,
              sender_id: SENDER_ID
            })
          });
        }
      }
      console.log('----------------------------------------');
      
      // Short pause after a message before next fetch to avoid spamming WA API
      await new Promise(r => setTimeout(r, 2000));
    } else {
      console.error('❌ Error from server:', res.data);
    }
  } catch (e) {
    console.error('Network Error:', e.message);
  }

  // Poll again
  setTimeout(pollQueue, 3000);
}

// Start booting up
client.initialize();
