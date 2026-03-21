import readline from 'readline';

const API_BASE = 'http://localhost:3000/api';
const SECRET = 'development_otp_secret'; // Hardcoded for demo
const SENDER_ID = `demo-worker-${Math.floor(Math.random() * 1000)}`;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

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

async function loop() {
  console.log('\n--- ZERO-TRUST NOTIFICATION WORKER ---');
  console.log('Press ENTER to poll the queue for newly activated contacts...');
  await question('');

  try {
    const res = await fetchApi(`/otp/next-contact?sender_id=${SENDER_ID}`, { method: 'GET' });
    
    if (res.status === 204) {
      console.log('📭 Queue is empty. No SMS to send right now.');
    } else if (res.ok) {
      const data = res.data.data;
      console.log('\n========================================');
      console.log(`📡 SENDING SMS TO: ${data.value}`);
      console.log('========================================');
      console.log(`Hi,\n`);
      console.log(`You've been invited to share feedback for "${data.campaign_name}".\n`);
      console.log(`Tap the link below or copy it into your feedback app:`);
      console.log(`\x1b[36m${data.access_url}\x1b[0m\n`);
      console.log(`This link can only be used once.`);
      console.log('========================================\n');
      
      const confirm = await question('Type "y" to confirm sent (or anything else to drop lease): ');
      if (confirm.toLowerCase() === 'y') {
        const confirmRes = await fetchApi('/otp/confirm-sent', {
          method: 'POST',
          body: JSON.stringify({
            contact_id: data.contact_id,
            campaign_id: data.campaign_id,
            sender_id: SENDER_ID
          })
        });
        if (confirmRes.ok) console.log('✅ Sent confirmed in DB!');
        else console.error('❌ Failed to confirm:', confirmRes.data);
      } else {
        await fetchApi('/otp/release-lock', {
          method: 'POST',
          body: JSON.stringify({
             contact_id: data.contact_id,
             campaign_id: data.campaign_id,
             sender_id: SENDER_ID
          })
        });
        console.log('Lease released.');
      }
    } else {
      console.error('❌ Error from server:', res.data);
    }
  } catch (e) {
    console.error('Network Error:', e.message);
  }

  setTimeout(loop, 1000);
}

loop();
