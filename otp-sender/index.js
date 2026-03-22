import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import 'dotenv/config';
import readline from 'readline';
import fs from 'fs';
import path from 'path';

const API_BASE = process.env.API_BASE || 'http://localhost:3000/api';
const SECRET = process.env.OTP_SERVICE_SECRET;
if (!SECRET) throw new Error('OTP_SERVICE_SECRET is required in .env');
const SENDER_ID = `otp-worker`;

// ── Helpers ───────────────────────────────────────────────────────────────────

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
  const digits = numberStr.replace(/\D/g, '');
  if (!digits || digits.length < 10 || digits.length > 15) return null;
  return `${digits}@c.us`;
}

function ask(rl, question) {
  return new Promise(resolve => rl.question(question, resolve));
}

function hasExistingSession() {
  const sessionDir = path.join(process.cwd(), '.wwebjs_auth');
  return fs.existsSync(sessionDir) && fs.readdirSync(sessionDir).length > 0;
}

// ── Startup prompt ────────────────────────────────────────────────────────────

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log('\n========================================');
console.log('       Zero-Proof OTP Sender');
console.log('========================================\n');
console.log('  1. Terminal print mode  (no WhatsApp)');
console.log('  2. WhatsApp mode\n');

const modeChoice = (await ask(rl, 'Choose mode [1/2]: ')).trim();

if (modeChoice === '2') {
  // ── WhatsApp mode ──────────────────────────────────────────────────────────
  let forceNewSession = false;

  if (hasExistingSession()) {
    console.log('\n✅ Existing WhatsApp session found.');
    console.log('  1. Continue with existing session');
    console.log('  2. Log in fresh (new QR code)\n');
    const sessionChoice = (await ask(rl, 'Choose [1/2]: ')).trim();
    forceNewSession = sessionChoice === '2';
  } else {
    console.log('\nNo existing session found. A QR code will be shown for login.\n');
  }

  rl.close();

  if (forceNewSession) {
    // Delete existing session data so WhatsApp forces a new QR
    const sessionDir = path.join(process.cwd(), '.wwebjs_auth');
    fs.rmSync(sessionDir, { recursive: true, force: true });
    console.log('Old session cleared. Generating new QR...\n');
  }

  console.log('Initializing WhatsApp Web client...\n');

  const client = new Client({
    authStrategy: new LocalAuth({ clientId: 'otp-worker' }),
    puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] }
  });

  client.on('qr', (qr) => {
    console.log('📱 Scan this QR code with WhatsApp:\n');
    qrcode.generate(qr, { small: true });
  });

  client.on('ready', () => {
    console.log('✅ WhatsApp ready! Polling queue...\n');
    pollQueueWhatsApp(client);
  });

  client.on('auth_failure', msg => {
    console.error('❌ Authentication failed:', msg);
  });

  client.initialize();

} else {
  // ── Terminal print mode ────────────────────────────────────────────────────
  rl.close();
  console.log('\n[Terminal Print Mode] Polling queue...\n');
  pollQueueTerminal();
}

// ── Poll loops ────────────────────────────────────────────────────────────────

async function pollQueueTerminal() {
  try {
    const res = await fetchApi(`/otp/next-contact?sender_id=${SENDER_ID}`, { method: 'GET' });

    if (res.status === 204) {
      // silent — queue empty
    } else if (res.ok) {
      const data = res.data.data;

      console.log('\n----------------------------------------');
      console.log(`To : ${data.value}`);
      console.log(`URL: \x1b[36m${data.access_url}\x1b[0m`);
      console.log('----------------------------------------');

      // Auto-confirm since we "delivered" it by printing
      await fetchApi('/otp/confirm-sent', {
        method: 'POST',
        body: JSON.stringify({
          contact_id: data.contact_id,
          campaign_id: data.campaign_id,
          sender_id: SENDER_ID
        })
      });

      await new Promise(r => setTimeout(r, 1000));
    } else {
      console.error('❌ Server error:', res.data);
    }
  } catch (e) {
    console.error('Network error:', e.message);
  }

  setTimeout(pollQueueTerminal, 3000);
}

async function pollQueueWhatsApp(client) {
  try {
    const res = await fetchApi(`/otp/next-contact?sender_id=${SENDER_ID}`, { method: 'GET' });

    if (res.status === 204) {
      if (!global.listeningMsgPrinted) {
        console.log('📭 Queue empty. Listening...');
        global.listeningMsgPrinted = true;
      }
    } else if (res.ok) {
      const data = res.data.data;
      global.listeningMsgPrinted = false;

      const rawNumber = data.value;
      const formattedNum = formatPhoneNumber(rawNumber);

      console.log('\n----------------------------------------');
      console.log(`To      : ${rawNumber}`);

      if (!formattedNum) {
        console.error('Status  : ❌ Invalid number. Releasing...');
        await fetchApi('/otp/release-lock', {
          method: 'POST',
          body: JSON.stringify({ contact_id: data.contact_id, campaign_id: data.campaign_id, sender_id: SENDER_ID })
        });
      } else {
        const msgText = `Hi,\n\nYou've been invited to share anonymous feedback for "${data.campaign_name}".\n\nCOPY the link below in to the client application:\n${data.access_url}\n\nThis single-use link protects your anonymity. Do not click the link.`;

        console.log(`WA_ID   : ${formattedNum}`);
        console.log('Status  : ⏳ Sending...');

        try {
          await client.sendMessage(formattedNum, msgText);
          await fetchApi('/otp/confirm-sent', {
            method: 'POST',
            body: JSON.stringify({ contact_id: data.contact_id, campaign_id: data.campaign_id, sender_id: SENDER_ID })
          });
          console.log('Status  : ✅ Sent & confirmed!');
        } catch (err) {
          console.error(`Status  : ❌ Failed: ${err.message}. Releasing...`);
          await fetchApi('/otp/release-lock', {
            method: 'POST',
            body: JSON.stringify({ contact_id: data.contact_id, campaign_id: data.campaign_id, sender_id: SENDER_ID })
          });
        }
      }

      console.log('----------------------------------------');
      await new Promise(r => setTimeout(r, 2000));
    } else {
      console.error('❌ Server error:', res.data);
    }
  } catch (e) {
    console.error('Network error:', e.message);
  }

  setTimeout(() => pollQueueWhatsApp(client), 3000);
}


