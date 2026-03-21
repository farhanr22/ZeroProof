import readline from 'readline';

const API_BASE = 'http://localhost:3000/api';
let adminToken = null;
let currentCampaignId = null;
let currentCampaignName = null;
let currentCampaignStatus = 'draft';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function fetchApi(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (adminToken) headers['Authorization'] = `Bearer ${adminToken}`;
  
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers }
  });
  
  const text = await res.text();
  try {
    return { status: res.status, ok: res.ok, data: JSON.parse(text) };
  } catch (e) {
    return { status: res.status, ok: res.ok, data: text };
  }
}

async function loop() {
  console.log('\n--- ZERO-TRUST ADMIN TERMINAL ---');
  let campStr = 'None';
  if (currentCampaignName) {
    campStr = `${currentCampaignName} [${currentCampaignStatus === 'active' ? 'Active' : 'Draft'} mode]`;
  }
  console.log(`Status: ${adminToken ? 'Logged In' : 'Not Logged In'} | Campaign: ${campStr}`);
  console.log('0. Signup (Create new Admin Account)');
  console.log('1. Login (Existing Admin Account)');
  console.log('2. Create Campaign');
  console.log('3. Add Text Question');
  console.log('4. Add Contact Number');
  console.log('5. Activate Campaign');
  console.log('6. View Responses & Insights');
  console.log('7. Exit');
  
  const choice = await question('\nSelect option: ');
  
  try {
    if (choice === '0') {
      const email = await question('Enter email to register: ');
      const password = await question('Enter new password: ');
      console.log(`\nSigning up as ${email}...`);
      
      const res = await fetchApi('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        adminToken = res.data.data.token;
        console.log('✅ Signup successful and logged in!');
      } else {
        console.error('❌ Signup failed:', res.data);
      }
    }
    else if (choice === '1') {
      const email = await question('Enter email: ');
      const password = await question('Enter password: ');
      console.log(`\nLogging in as ${email}...`);
      
      const res = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        adminToken = res.data.data.token;
        console.log('✅ Login successful!');
      } else {
        console.error('❌ Login failed:', res.data);
      }
    } 
    else if (choice === '2') {
      const name = await question('Enter campaign name: ');
      const res = await fetchApi('/campaigns', {
        method: 'POST',
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        currentCampaignId = res.data.data.campaign._id;
        currentCampaignName = res.data.data.campaign.name;
        currentCampaignStatus = res.data.data.campaign.status || 'draft';
        console.log(`✅ Campaign created! Name: ${currentCampaignName}`);
      } else console.error('❌ Failed:', res.data);
    }
    else if (choice === '3') {
      if (!currentCampaignId) return console.log('❌ Create a campaign first!');
      const qText = await question('Enter the question text: ');
      const res = await fetchApi(`/campaigns/${currentCampaignId}/questions`, {
        method: 'PATCH',
        body: JSON.stringify({
          questions: [
            { order: 0, type: 'text', text: qText, options: [] }
          ]
        })
      });
      if (res.ok) console.log('✅ Question added!');
      else console.error('❌ Failed:', res.data);
    }
    else if (choice === '4') {
      if (!currentCampaignId) return console.log('❌ Create a campaign first!');
      const phone = await question('Enter phone number (e.g. 5551234): ');
      const res = await fetchApi(`/campaigns/${currentCampaignId}/contacts`, {
        method: 'POST',
        body: JSON.stringify({ values: [phone] })
      });
      if (res.ok) console.log(`✅ Added ${res.data.data.added} contact(s)!`);
      else console.error('❌ Failed:', res.data);
    }
    else if (choice === '5') {
      if (!currentCampaignId) return console.log('❌ Create a campaign first!');
      const res = await fetchApi(`/campaigns/${currentCampaignId}/activate`, {
        method: 'POST'
      });
      if (res.ok) {
        currentCampaignStatus = 'active';
        console.log('✅ Campaign activated! RSA Keypair generated and OTPs provisioned.');
      } else console.error('❌ Failed:', res.data);
    }
    else if (choice === '6') {
      if (!currentCampaignId) return console.log('❌ Select a campaign first!');
      const res = await fetchApi(`/campaigns/${currentCampaignId}/insights`, { method: 'GET' });
      if (res.ok) {
        console.log('\n--- CAMPAIGN INSIGHTS ---');
        const insights = res.data.data.insights;
        if (insights.length === 0) console.log('No questions found.');
        
        insights.forEach((q, idx) => {
          console.log(`\nQ${idx + 1}: ${q.text}`);
          console.log(`Total Answers: ${q.total_answers}`);
          if (q.type === 'text' && q.texts) {
            q.texts.forEach(text => console.log(` - "${text}"`));
          } else if (q.type === 'single_choice' && q.counts) {
            Object.entries(q.counts).forEach(([opt, cnt]) => console.log(` - ${opt}: ${cnt}`));
          } else if (q.type === 'rating') {
            console.log(` - Average Rating: ${q.average}`);
          }
        });
        console.log('-------------------------\n');
      }
      else console.error('❌ Failed:', res.data);
    }
    else if (choice === '7') {
      rl.close();
      return;
    }
  } catch (e) {
    console.error('Error:', e.message);
  }

  await question('\nPress ENTER to continue...');
  console.clear();
  setTimeout(loop, 100);
}

console.clear();

loop();
