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
  try {
    const res = await fetchApi(`/otp/next-contact?sender_id=${SENDER_ID}`, { method: 'GET' });
    
    if (res.status === 204) {
      if (!global.listeningMsgPrinted) {
        console.log('\n--- ZERO-TRUST NOTIFICATION WORKER ---');
        console.log('Listening for outgoing SMS...');
        global.listeningMsgPrinted = true;
      }
    } else if (res.ok) {
      const data = res.data.data;
      console.log('\n----------------------------------------');
      console.log(`To : ${data.value}`);
      console.log(`URL: \x1b[36m${data.access_url}\x1b[0m`);
      console.log('----------------------------------------');
      
      // Auto-confirm
      const confirmRes = await fetchApi('/otp/confirm-sent', {
        method: 'POST',
        body: JSON.stringify({
          contact_id: data.contact_id,
          campaign_id: data.campaign_id,
          sender_id: SENDER_ID
        })
      });
      if (!confirmRes.ok) console.error('❌ Failed to confirm:', confirmRes.data);
      
      // Pause slightly longer when a message is sent
      await new Promise(r => setTimeout(r, 2000));
    } else {
      console.error('❌ Error from server:', res.data);
    }
  } catch (e) {
    console.error('Network Error:', e.message);
  }

  setTimeout(loop, 2000);
}

loop();
