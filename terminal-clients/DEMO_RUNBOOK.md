# Zero-Trust Terminal Demo Runbook

This guide explicitly walks through how to present the full End-to-End Anonymous Feedback flow to hackathon judges using the 3 terminal applications.

### Setup
Ensure the backend server is running in its own terminal:
```bash
cd server
npm run dev
```

You will need **4 terminal splits/tabs** open to the `terminal-clients` directory:
1. Admin Terminal
2. Notification Worker Terminal
3. Client 1 Terminal
4. Client 2 Terminal

---

### Step 1: Admin Creates the Campaign
1. In the **Admin Terminal**, run: `npm run admin`
2. Select **[1] Login** (Uses the `giga@admin.com` test account).
3. Select **[2] Create Campaign** (name it "Hackathon Demo").
4. Select **[3] Add Default Question**.
5. Select **[4] Add Contacts** (enter two numbers e.g. `111` and `222`, running it twice if needed).
6. Select **[5] Activate Campaign**.
   *Point out to judges that activating generates the RSA Key Pair.*

### Step 2: The Notification Worker Dispatches Links
1. In the **Notification Terminal**, run: `npm run notification`
2. Press **ENTER** to poll the queue.
3. The worker will grab the lock on a contact and print an SMS-like box with an `access_url`.
4. Copy `access_url` #1.
5. Press **`y`** to confirm sending.
6. Press **ENTER** again to get the second contact's `access_url`. Copy `access_url` #2 and confirm.

### Step 3: Clients Begin Local Verification
1. In **Client 1 Terminal**, run: `npm run client`
2. Paste `access_url` #1. 
3. In **Client 2 Terminal**, run: `npm run client`
4. Paste `access_url` #2. 

### Step 4: The Cryptographic Proof (Judging Climax)
Both clients will now connect to the server and download the campaign payload.
They will then pause and ask you to verify the hash.

**Show the judges:**
1. Look at the **Campaign Verification Hash** on both terminals. 
2. Point out that they perfectly match. This proves both clients verified they are talking to the exact same Campaign Public Key, and receiving the exact same payload (meaning no targeted tracking questions are being fed to specific devices).
3. Press **ENTER** on both Client windows to proceed to the question.

### Step 5: Submission & Verification
1. Type your feedback into both terminals and press enter.
2. The clients will generate the blinded tokens, get them signed, unblind them, and submit the final anonymous payload automatically.
3. Return to the **Admin Terminal**.
4. Select **[6] View Raw Responses**. 
5. Select **[7] View Insights** to see the aggregated feedback data.
