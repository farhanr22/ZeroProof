# Zero-Trust Anonymous Feedback — Medium-Level Technical Specification

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Tech Stack & Tooling](#2-tech-stack--tooling)
3. [Database Models & Indexes](#3-database-models--indexes)
4. [File & Folder Structure](#4-file--folder-structure)
5. [Auth System](#5-auth-system)
6. [Error Handling & Response Shape](#6-error-handling--response-shape)
7. [Logging (Pino)](#7-logging-pino)
8. [Validation (Zod)](#8-validation-zod)
9. [Feature Specs](#9-feature-specs)
    - [9.1 Admin — Campaigns](#91-admin--campaigns)
    - [9.2 Admin — Contacts](#92-admin--contacts)
    - [9.3 Admin — Questions & AI Generation](#93-admin--questions--ai-generation)
    - [9.4 Admin — Responses & Insights](#94-admin--responses--insights)
    - [9.5 Admin — AI Summary](#95-admin--ai-summary)
    - [9.6 Client App — Start / Register](#96-client-app--start--register)
    - [9.7 Client App — Campaign View & Submit](#97-client-app--campaign-view--submit)
    - [9.8 Notification Service (OTP Sender)](#98-notification-service-otp-sender)
10. [Testing Setup](#10-testing-setup)
11. [Development Timeline & Milestones](#11-development-timeline--milestones)

---

## 1. System Overview

Three independently runnable pieces:

|Piece|What it is|Who uses it|
|---|---|---|
|**Express API** (`/server`)|Single Node.js/Express app hosting all three router groups|Everyone|
|**Admin Web App** (`/admin`)|React+Vite SPA for organizations|Org admins|
|**Client Web App** (`/client`)|React+Vite SPA for respondents|Respondents|

The Express API has three logical router groups mounted at different prefixes:

```
/api/*        → admin web app routes (auth-protected)
/otp/*        → internal endpoints consumed by the OTP sender script
(no prefix)   → client-facing endpoints (/start, /submit-otp, /submit-response)
```

---

## 2. Tech Stack & Tooling

|Concern|Choice|
|---|---|
|Runtime|Node.js 20+|
|Framework|Express 5|
|Database|MongoDB via Mongoose|
|Auth|JWT + bcrypt|
|Blind RSA|`@cloudflare/blindrsa-ts`|
|Security Pattern|`jdenticon` (SVG, deterministic)|
|Validation|Zod (shared types between server and client)|
|Logging|Pino|
|Testing|Jest + Supertest + `mongodb-memory-server`|
|AI|Anthropic SDK (claude-sonnet-4-20250514)|
|Frontend|React 18 + Vite + TailwindCSS|
|OTP (demo)|`whatsapp-web.js` OR nodemailer/SMTP|

---

## 3. Database Models & Indexes

### Design Principles

- Each `Campaign` document owns its RSA key pair (stored as PEM strings). Keys are generated once when a campaign transitions to `active`.
- Contacts and questions are sub-documents / embedded arrays on `Campaign` — they don't need independent querying, and their lifecycle is tied entirely to the campaign.
- `BlindToken` is a separate collection because it is queried independently during submission to prevent double-spend.
- `Response` is a separate collection because it grows unboundedly and needs independent querying for the insights/responses pages.
- Admins are a separate `User` collection with email + hashed password.

### `User` (Admin)

```js
{
  email:            String, unique, required
  password_hash:    String, required
  password_version: Number, default: 1
  created_at:       Date, default: now
}
// Indexes:
//   { email: 1 }  unique  — login lookup
```

### `Campaign`

```js
{
  admin_id:        ObjectId → User, required, indexed
  name:            String, required
  description:     String, default: ''
  mode:            String, enum: ['draft', 'active'], default: 'draft'
  public_key_pem:  String | null
  private_key_pem: String | null
  questions: [{
    _id:     ObjectId (auto)
    order:   Number
    type:    String, enum: ['single_choice','multi_choice','rating','text']
    text:    String
    options: [String]
  }]
  created_at:  Date, default: now
  updated_at:  Date, default: now
}
// Indexes:
//   { admin_id: 1 }
//   { mode: 1, admin_id: 1 }
```

### `Contact`

```js
{
  campaign_id:  ObjectId → Campaign, required, indexed
  value:        String, required      // phone number or email
  otp:          String, required      // 6-digit, generated on activation
  otp_used:     Boolean, default: false
  sent_at:      Date | null
  send_lock: {
    locked_by:  String | null
    locked_at:  Date | null
  }
  created_at:   Date, default: now
}
// Indexes:
//   { campaign_id: 1 }           — list contacts for a campaign
//   { otp: 1 }        unique     — /start OTP lookup
```

### `BlindToken`

```js
{
  campaign_id:  ObjectId → Campaign, required
  token_hash:   String, required, unique   // SHA-256 hex of the raw token t
  used:         Boolean, default: false
  created_at:   Date, default: now
}
// Indexes:
//   { token_hash: 1 }  unique  — double-spend check on submission
//   { campaign_id: 1 }         — cleanup / analytics
```

> Store `SHA-256(t)` not `t` itself. The server never needs to know `t` in plaintext; it only needs to check uniqueness.

### `Response`

```js
{
  campaign_id:   ObjectId → Campaign, required
  blind_token_id: ObjectId → BlindToken, required, unique
                 // ensures one response per ticket at DB level too
  answers: [{
    question_id: ObjectId
    type:        String
    value:       Mixed   // String | Number | [String]
  }]
  submitted_at:  Date, default: now
}
// Indexes:
//   { campaign_id: 1, submitted_at: -1 }   — responses page, chronological
//   { blind_token_id: 1 }  unique           — enforce one response per token
```

### Index Setup on App Startup

In `server/src/core/db.js`, after `mongoose.connect()` resolves, call `Model.syncIndexes()` for each model. This is safe to call repeatedly (creates missing indexes, is a no-op if they exist). Use `{ background: true }` for large collections.

---

## 4. File & Folder Structure

```
/
├── server/
│   ├── src/
│   │   ├── app.js                  # Express app factory (no listen call)
│   │   ├── server.js               # Entry point: connects DB, starts listen
│   │   ├── core/
│   │   │   ├── db.js               # mongoose.connect + syncIndexes
│   │   │   ├── logger.js           # Pino instance, exported singleton
│   │   │   ├── errors.js           # ApiError class + asyncHandler wrapper
│   │   │   ├── response.js         # sendResponse helper
│   │   │   ├── auth.middleware.js  # JWT verification middleware
│   │   │   └── validate.js         # Zod middleware factory
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Campaign.js
│   │   │   ├── Contact.js
│   │   │   ├── BlindToken.js
│   │   │   └── Response.js
│   │   ├── routes/
│   │   │   ├── api/                # Mounted at /api
│   │   │   │   ├── index.js        # Aggregates all /api sub-routers
│   │   │   │   ├── auth.routes.js
│   │   │   │   ├── campaigns.routes.js
│   │   │   │   ├── contacts.routes.js
│   │   │   │   ├── questions.routes.js
│   │   │   │   ├── responses.routes.js
│   │   │   │   ├── insights.routes.js
│   │   │   │   └── summary.routes.js
│   │   │   ├── otp/                # Mounted at /otp
│   │   │   │   └── otp.routes.js
│   │   │   └── client/             # Mounted at /  (no prefix)
│   │   │       └── client.routes.js   # /start, /submit-otp, /submit-response
│   │   ├── services/
│   │   │   ├── auth.service.js
│   │   │   ├── campaign.service.js
│   │   │   ├── contact.service.js
│   │   │   ├── question.service.js
│   │   │   ├── response.service.js
│   │   │   ├── insights.service.js
│   │   │   ├── blindrsa.service.js  # Wraps @cloudflare/blindrsa-ts
│   │   │   ├── ai.service.js        # Anthropic SDK calls
│   │   │   └── otp.service.js       # OTP gen, lease logic
│   │   └── schemas/                 # Zod schemas (shared via symlink or package)
│   │       ├── campaign.schema.js
│   │       ├── auth.schema.js
│   │       └── client.schema.js
│   ├── tests/
│   │   ├── setup.js                 # mongodb-memory-server setup/teardown
│   │   ├── auth.test.js
│   │   ├── campaigns.test.js
│   │   ├── client.test.js
│   │   └── blindrsa.poc.js          # Phase 0 standalone PoC script
│   ├── .env.example
│   └── package.json
│
├── admin/                           # React + Vite
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx                  # React Router setup
│   │   ├── api/
│   │   │   └── client.js            # Axios instance with auth header injection
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Campaigns.jsx        # /campaigns
│   │   │   ├── CampaignOverview.jsx # /campaigns/:id
│   │   │   ├── ManageContacts.jsx   # /campaigns/:id/contacts
│   │   │   ├── ManageQuestions.jsx  # /campaigns/:id/questions
│   │   │   ├── Responses.jsx        # /campaigns/:id/responses
│   │   │   └── Insights.jsx         # /campaigns/:id/insights
│   │   ├── components/
│   │   │   ├── QuestionEditor.jsx
│   │   │   ├── ContactList.jsx
│   │   │   ├── InsightChart.jsx
│   │   │   └── AISummaryModal.jsx
│   │   └── hooks/
│   │       └── useAuth.js
│   └── package.json
│
└── client/                          # React + Vite
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx
    │   ├── api/
    │   │   └── client.js
    │   ├── pages/
    │   │   ├── Home.jsx             # Lists all saved campaigns
    │   │   └── CampaignPage.jsx     # Security pattern + questions + submit
    │   ├── components/
    │   │   ├── AddCampaignModal.jsx
    │   │   ├── SecurityPattern.jsx  # Renders jdenticon SVG
    │   │   └── QuestionRenderer.jsx
    │   └── lib/
    │       ├── crypto.js            # Wraps blindrsa-ts: blind, finalize, verify
    │       ├── storage.js           # localStorage R/W helpers with typed keys
    │       └── pattern.js           # Hash input → jdenticon SVG
    └── package.json
```

---

## 5. Auth System

Auth applies only to admin (`/api/*`) routes. Client routes are unauthenticated by design.

### Models & Helpers

See the `User` schema in Section 3.

```js
// server/src/core/errors.js
export class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
```

```js
// server/src/core/response.js
export const sendResponse = (res, data = null, error = false, errorMessage = null, statusCode = 200) =>
  res.status(statusCode).json({ data, error, error_message: errorMessage });
```

### Auth Middleware

```js
// server/src/core/auth.middleware.js
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ApiError, asyncHandler } from './errors.js';

export const authMiddleware = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) throw new ApiError(401, 'No token provided');

  const token = header.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new ApiError(401, 'Invalid token');
  }

  const user = await User.findById(decoded.user_id);
  if (!user) throw new ApiError(401, 'User not found');
  if (decoded.password_version !== user.password_version)
    throw new ApiError(401, 'Token invalid – password changed');

  req.user = decoded;
  next();
});
```

### Auth Routes (`/api/auth/*`)

|Method|Path|Body|Notes|
|---|---|---|---|
|POST|`/api/auth/signup`|`{ email, password }`|Creates User, returns JWT|
|POST|`/api/auth/login`|`{ email, password }`|Returns JWT|
|POST|`/api/auth/change-password`|`{ oldPassword, newPassword }`|Bumps `password_version`, invalidates all tokens|

JWT payload: `{ user_id, password_version }`. No expiration (hackathon scope).

### Global Error Handler (in `app.js`)

```js
// 404 catch-all
app.use((req, res, next) => next(new ApiError(404, 'Route not found')));

// Central error handler
app.use((err, req, res, next) => {
  const statusCode = err.isOperational ? err.statusCode : 500;
  const message = err.isOperational ? err.message : 'Internal Server Error';
  if (!err.isOperational) logger.error(err, 'Unhandled error');
  sendResponse(res, null, true, message, statusCode);
});
```

---

## 6. Error Handling & Response Shape

Every response from the API, success or failure, follows this shape:

```json
// Success
{ "data": { ... }, "error": false, "error_message": null }

// Failure
{ "data": null, "error": true, "error_message": "Human-readable reason" }
```

`ApiError` is for known, expected errors (bad input, not found, unauthorized). Anything else (DB crash, uncaught exception) is caught by the global handler and returns a 500 with a generic message. Unexpected errors are logged at `error` level via Pino.

---

## 7. Logging (Pino)

```js
// server/src/core/logger.js
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined   // production: structured JSON to stdout
});
```

Use `pino-http` for request logging:

```js
// in app.js
import pinoHttp from 'pino-http';
app.use(pinoHttp({ logger }));
```

Within service/route handlers, use `req.log.info(...)` (provided by pino-http) or import the singleton `logger` directly in service files.

---

## 8. Validation (Zod)

Define schemas in `server/src/schemas/`. These can be copied/symlinked into the frontend for shared types.

```js
// server/src/schemas/campaign.schema.js
import { z } from 'zod';

export const createCampaignSchema = z.object({
  name: z.string().min(1).max(100),
});

export const updateCampaignInfoSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});
```

Validation middleware factory:

```js
// server/src/core/validate.js
import { ApiError } from './errors.js';

export const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const msg = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    return next(new ApiError(400, msg));
  }
  req[source] = result.data;   // replace with parsed/coerced values
  next();
};
```

Usage in routes:

```js
router.post('/', authMiddleware, validate(createCampaignSchema), asyncHandler(async (req, res) => {
  // req.body is now typed and validated
}));
```

---

## 9. Feature Specs

### 9.1 Admin — Campaigns

#### Frontend Pages

**`/campaigns` — Campaign List (Home)**

- On mount: `GET /api/campaigns` → renders list of campaign cards showing name, mode badge, created date.
- Each card links to `/campaigns/:id`.
- "New Campaign" button → modal with name input → `POST /api/campaigns` → redirect to `/campaigns/:id`.
- Empty state if no campaigns.

**`/campaigns/:id` — Campaign Overview**

- Fetches `GET /api/campaigns/:id`.
- Shows: name, description (editable inline if `mode === 'draft'`), mode badge.
- If `draft`: shows "Manage Contacts", "Manage Questions" nav links.
- If `active`: shows "Responses", "Insights" nav links.
- "Enable Campaign" button visible if `draft`. On click: confirm modal → `POST /api/campaigns/:id/activate`.
    - Activation is irreversible. Backend generates RSA key pair and OTPs, sends OTPs via the notification service.
- "Edit Info" button (draft only) → inline form → `PATCH /api/campaigns/:id/info`.
- "Delete Campaign" button → confirm → `DELETE /api/campaigns/:id` → redirect to `/campaigns`.

#### Backend Routes (`/api/campaigns`)

```
GET    /api/campaigns              → list all campaigns for req.user
POST   /api/campaigns              → create campaign {name}
GET    /api/campaigns/:id          → get single campaign (meta only, no keys)
PATCH  /api/campaigns/:id/info     → update name/description (draft only)
POST   /api/campaigns/:id/activate → transition draft → active
DELETE /api/campaigns/:id          → delete campaign + cascade BlindTokens + Responses
```

**`POST /api/campaigns/:id/activate` — Activation Logic (service layer)**

1. Verify campaign is in `draft` mode and belongs to `req.user`.
2. Verify at least 1 contact and 1 question exist.
3. Generate RSA key pair using `blindrsa.service.js` → store PEM strings on campaign.
4. For each contact: generate a 6-digit OTP, store on sub-document.
5. Set `mode = 'active'`.
6. Save campaign.
7. Trigger OTP sending: for each contact, call the `/otp` internal endpoint (or directly call the service — see Section 9.8).
8. Return updated campaign (without private key).

**Example Route (showing pattern with validation, logging, service layer):**

```js
// routes/api/campaigns.routes.js
import { Router } from 'express';
import { authMiddleware } from '../../core/auth.middleware.js';
import { asyncHandler } from '../../core/errors.js';
import { validate } from '../../core/validate.js';
import { sendResponse } from '../../core/response.js';
import { createCampaignSchema } from '../../schemas/campaign.schema.js';
import * as campaignService from '../../services/campaign.service.js';

const router = Router();

router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  req.log.info({ user_id: req.user.user_id }, 'Listing campaigns');
  const campaigns = await campaignService.listCampaigns(req.user.user_id);
  sendResponse(res, { campaigns });
}));

router.post('/', authMiddleware, validate(createCampaignSchema), asyncHandler(async (req, res) => {
  req.log.info({ user_id: req.user.user_id, name: req.body.name }, 'Creating campaign');
  const campaign = await campaignService.createCampaign(req.user.user_id, req.body.name);
  sendResponse(res, { campaign }, false, null, 201);
}));

// ... other routes follow same pattern
export default router;
```

---

### 9.2 Admin — Contacts

#### Frontend Pages

**`/campaigns/:id/contacts` — Manage Contacts (draft only)**

- `GET /api/campaigns/:id/contacts` on mount → renders list of contact values.
- "Add Contacts" area: textarea for bulk entry (one per line) → `POST /api/campaigns/:id/contacts`.
- Each row has a delete icon → `DELETE /api/campaigns/:id/contacts/:contactId`.

#### Backend Routes

```
GET    /api/campaigns/:id/contacts               → returns contacts array (value + _id only, no OTPs)
POST   /api/campaigns/:id/contacts               → body: { values: [String] }, appends new contacts
DELETE /api/campaigns/:id/contacts/:contactId    → removes contact subdoc
```

All contact mutations require `mode === 'draft'`; return `400` otherwise.

---

### 9.3 Admin — Questions & AI Generation

#### Frontend Pages

**`/campaigns/:id/questions` — Manage Questions (draft only)**

- `GET /api/campaigns/:id/questions` → renders current questionnaire with drag-to-reorder.
- Question editor component per question: type selector, text input, options editor (for choice types).
- "Add Question" button appends a blank question.
- "Save" button → `PATCH /api/campaigns/:id/questions` with full updated array.
- "Generate with AI" button → opens modal with a textarea for scenario description → `POST /api/campaigns/:id/generate-questions` → renders suggested questions into the editor (not auto-saved).

#### Backend Routes

```
GET    /api/campaigns/:id/questions          → returns questions array
PATCH  /api/campaigns/:id/questions          → body: { questions: [...] }, replaces entire array
POST   /api/campaigns/:id/generate-questions → body: { scenario: String }
                                               → returns AI-suggested questions array (not persisted)
```

**`POST /api/campaigns/:id/generate-questions` — AI Service Logic:**

Prompt to Claude (structured output): given the scenario description, return a JSON array of up to 8 questions, each with `type`, `text`, and `options`. System prompt enforces JSON-only output. Parse and validate with Zod before returning to client.

```js
// services/ai.service.js
import Anthropic from '@anthropic-ai/sdk';
const client = new Anthropic();

export async function generateQuestions(scenario) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: `You are a survey designer. Return ONLY a JSON array, no markdown, no preamble.
Each item: { type: "single_choice"|"multi_choice"|"rating"|"text", text: string, options: string[] }
options is empty [] for rating and text types. Max 8 questions.`,
    messages: [{ role: 'user', content: `Scenario: ${scenario}` }]
  });
  const raw = response.content[0].text.trim();
  return JSON.parse(raw);  // wrap in try/catch in route, return 500 on parse fail
}
```

---

### 9.4 Admin — Responses & Insights

#### Frontend Pages

**`/campaigns/:id/responses` — Response List (active only)**

- `GET /api/campaigns/:id/responses` → renders list of individual responses, each expandable.
- Shows submission timestamp per response.
- No identity info is shown (there is none).

**`/campaigns/:id/insights` — Insights (active only)**

- `GET /api/campaigns/:id/insights` → renders per-question aggregate stats.
    - Choice questions: bar/pie chart with counts + percentages.
    - Rating questions: average + distribution.
    - Text questions: shows 3 random excerpts + "View all" modal that lists all text answers.
- "AI Summary" button → see 9.5.

#### Backend Routes

```
GET /api/campaigns/:id/responses    → returns array of response objects
GET /api/campaigns/:id/insights     → returns aggregated stats per question
```

**Insights computation** happens in `insights.service.js`:

- Load all `Response` docs for the campaign.
- For each question in the campaign's questionnaire, reduce the answers.
- Return a structured object per question with aggregated data.

---

### 9.5 Admin — AI Summary

#### Frontend

"AI Summary" button on Insights page. Shows loading spinner, then renders the summary in a modal. Button is disabled until `mode === 'active'` and at least 1 response exists.

#### Backend Route

```
POST /api/campaigns/:id/summary
```

**Logic in `ai.service.js`:**

1. Load insights aggregation (reuse insights service).
2. Load campaign questions.
3. Compose a prompt with: campaign name, questions, aggregate stats, and a sample of text responses (up to 20).
4. Ask Claude to produce a concise narrative summary of the overall sentiment and key themes.
5. Return summary string in `data.summary`.

---

### 9.6 Client App — Start / Register

This flow has no persistent auth — all state lives in `localStorage`.

#### localStorage Keys

```
campaigns          → JSON array of saved campaign objects
campaign_{id}_inv  → base64-encoded `inv` object from blind step (temporary, deleted after finalize)
campaign_{id}_token → base64-encoded raw token t (kept, needed for submission)
campaign_{id}_sig  → base64-encoded final signature s (kept, needed for submission)
```

#### URL Entry Point

Respondent receives a URL in this format:

```
https://server.example.com&otp=123456
```

Whicih they can enter into the client app.
#### Backend: `/start?otp=<OTP>`

- Looks up the campaign containing this OTP.
- Verifies OTP is not yet used.
- Returns:

```js
{ "data": {    "campaign_id": "...",    "campaign_name": "...",    "public_key_spki": "..."   // base64 SPKI-encoded public key}}
```
- Does **not** mark OTP as used yet (that happens on `/submit-otp`).

#### Client Flow After `/start`

1. Store OTP temporarily in `localStorage` (key: `pending_otp`).
2. Import public key from SPKI bytes using Web Crypto API.
3. Call `crypto.js → blind(publicKey, randomToken)` → get `{ blindedMsg, inv }`.
4. Store `inv` and `token` in localStorage under campaign-scoped keys.
5. Call `POST /submit-otp` with `{ otp, blinded_msg_b64, campaign_id }`.
6. Server returns `{ blind_signature_b64 }`.
7. Call `crypto.js → finalize(publicKey, preparedMsg, blindSignature, inv)` → get final signature `s`.
8. Verify signature locally using `suite.verify(...)`.
9. Delete `pending_otp` and `inv` from localStorage.
10. Store `token` and signature `s` (base64) in localStorage.
11. Compute security pattern hash: `SHA-256(public_key_spki + question_payload_canonical_json)`.
12. Render Security Pattern (jdenticon SVG from hash).
13. Show UI: "Campaign added! Share your Security Pattern with your group before submitting."

#### Backend: `POST /submit-otp`

Body: `{ otp, blinded_msg_b64, campaign_id }`

1. Find campaign by `campaign_id` and find contact with matching `otp`.
2. Verify `otp_used === false`. If used, return 400.
3. Call `blindrsa.service.js → blindSign(privateKey, blindedMsg)`.
4. Mark OTP as used.
5. Return `{ blind_signature_b64, public_key_spki, question_payload }`.

`question_payload` is a canonical JSON string of `{ campaign_id, campaign_name, questions: [...] }`.

---

### 9.7 Client App — Campaign View & Submit

#### Frontend Pages

**`/` — Home**

- Lists all campaigns from `localStorage.campaigns`.
- "Add Campaign" floating button → `AddCampaignModal`:
    - Text input for OTP and server URL.
    - On submit: runs the full Start/Register flow (Section 9.6).
- Each campaign card shows name + "Security Pattern" thumbnail.

**`/campaign/:id` — Campaign Page**

- Reads campaign from localStorage.
- Shows Security Pattern (full size jdenticon SVG).
- Shows questions with response inputs (draft answers saved locally as user types).
- "Submit Response" button → confirm modal warning about network change.
- On submit:
    1. Reads token and signature from localStorage.
    2. Sends `POST /submit-response` with `{ campaign_id, token_b64, signature_b64, answers: [...] }`.
    3. On success: mark campaign as submitted in localStorage, show success state.
- "Delete Campaign" button → removes from localStorage (doesn't contact server).

#### Backend: `POST /submit-response`

Body: `{ campaign_id, token_b64, signature_b64, answers }`

1. Load campaign, get `public_key_pem`.
2. Reconstruct `preparedMsg` from `token_b64` and verify `signature_b64` against the campaign's public key using `suite.verify(...)`.
3. Compute `SHA-256(token)` → check against `BlindToken` collection for duplicates.
4. If new: create `BlindToken` document, save `Response` document.
5. Return `{ success: true }`.

---

### 9.8 Notification Service (OTP Sender)

The OTP sender is a separate long-running script (`server/otp-sender/index.js`) that polls or is invoked to send OTPs. It interacts with the main API over HTTP at `/otp/*`.

The `/otp/*` router should require a shared secret header (`X-OTP-Service-Secret`) checked against an env var.

#### Backend Routes (`/otp/*`)

```
GET  /otp/next-contact
     → finds a contact where otp_used=false AND send_lock.locked_by is null
        OR lock is stale (locked_at > 60s ago)
     → claims a lease: sets send_lock.locked_by = <sender_id>, locked_at = now
     → returns { contact_id, campaign_id, value (phone/email), otp } or 204 if none pending

POST /otp/confirm-sent
     body: { contact_id, campaign_id, sender_id }
     → verifies lock belongs to sender_id
     → sets sent_at = now, clears send_lock
     → returns 200

POST /otp/release-lock
     body: { contact_id, campaign_id, sender_id }
     → clears send_lock (used on failure)
     → returns 200
```

The sender script runs a loop:

1. Call `GET /otp/next-contact`.
2. If 204, sleep and retry.
3. Send the OTP via WhatsApp / SMTP.
4. On success: `POST /otp/confirm-sent`.
5. On failure: `POST /otp/release-lock`.

---

## 10. Testing Setup

### Dependencies

```bash
npm install --save-dev jest supertest mongodb-memory-server @types/jest
```

### `server/tests/setup.js`

```js
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterEach(async () => {
  // Clear all collections between tests
  const collections = mongoose.connection.collections;
  for (const key in collections) await collections[key].deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});
```

In `package.json`:

```json
{
  "jest": {
    "globalSetup": "./tests/setup.js",
    "testEnvironment": "node"
  }
}
```

### Example Test (auth)

```js
// tests/auth.test.js
import request from 'supertest';
import app from '../src/app.js';

describe('POST /api/auth/signup', () => {
  it('creates a user and returns a token', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'test@example.com', password: 'password123' });
    expect(res.status).toBe(201);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.error).toBe(false);
  });

  it('rejects duplicate email', async () => {
    await request(app).post('/api/auth/signup').send({ email: 'x@x.com', password: 'abc' });
    const res = await request(app).post('/api/auth/signup').send({ email: 'x@x.com', password: 'abc' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe(true);
  });
});
```

---

## 11. Development Timeline & Milestones

### Phase 0 — Blind RSA Proof of Concept (no repo commits needed)

**Goal**: Verify the cryptographic flow works end-to-end before writing the full app.

Create `server/tests/blindrsa.poc.js` — a standalone Node.js script (no Express, no MongoDB):

```js
// blindrsa.poc.js
// Simulates two users receiving the same public key, then checks if their
// security patterns (jdenticon hash) match.

import { RSABSSA } from '@cloudflare/blindrsa-ts';
import jdenticon from 'jdenticon';
import crypto from 'crypto';

const suite = RSABSSA.SHA384.PSS.Randomized();
const { privateKey, publicKey } = await suite.generateKey({ modulusLength: 2048 });

// Simulate question payload
const questionPayload = JSON.stringify({ campaign: 'test', questions: [] });
const pubKeyBytes = new Uint8Array(await crypto.subtle.exportKey('spki', publicKey));
const hashInput = Buffer.concat([Buffer.from(pubKeyBytes), Buffer.from(questionPayload)]);
const patternHash = crypto.createHash('sha256').update(hashInput).digest('hex');

// Both users compute the same hash → same jdenticon
const svg1 = jdenticon.toSvg(patternHash, 200);
const svg2 = jdenticon.toSvg(patternHash, 200);
console.assert(svg1 === svg2, 'Security patterns must match!');
console.log('✓ Security patterns match for two simulated users');

// Now run the full blind sign + verify flow
const token = crypto.randomBytes(32);
const preparedMsg = suite.prepare(token);
const { blindedMsg, inv } = await suite.blind(publicKey, preparedMsg);
const blindSig = await suite.blindSign(privateKey, blindedMsg);
const sig = await suite.finalize(publicKey, preparedMsg, blindSig, inv);
const valid = await suite.verify(publicKey, sig, preparedMsg);
console.assert(valid, 'Signature must verify!');
console.log('✓ Blind RSA sign + verify works');
```

**Milestone 0 complete when**: Script runs without errors and prints both ✓ lines.

---

### Phase 1 — Core Backend Infrastructure

Features to build:

- `core/db.js`, `core/logger.js`, `core/errors.js`, `core/response.js`, `core/validate.js`
- All five Mongoose models with indexes
- `app.js` (Express app factory, middleware, error handlers)
- `server.js` (entry point)

**Milestone 1**: `node server.js` starts cleanly, connects to MongoDB, Pino logs appear.

---

### Phase 2 — Auth (Backend + Frontend)

Backend:

- `routes/api/auth.routes.js` + `services/auth.service.js`
- Zod schema for auth inputs

Frontend (Admin):

- Login and Signup pages
- `api/client.js` (Axios instance with Authorization header injection from localStorage)
- `useAuth.js` hook

Tests: `tests/auth.test.js` — signup, login, duplicate email, change password, token invalidation after password change.

**Milestone 2**: Auth tests pass. Admin can sign up and log in via UI. Protected route redirects unauthenticated users.

---

### Phase 3 — Campaigns CRUD (Backend + Frontend)

Backend:

- Campaign model, `campaign.service.js`, `campaigns.routes.js`

Frontend (Admin):

- Campaigns list page, Campaign overview page, create/edit/delete flows.

Tests: `tests/campaigns.test.js` — CRUD operations, ownership checks (can't access other user's campaigns).

**Milestone 3**: Admin can create, list, view, rename, and delete campaigns.

---

### Phase 4 — Contacts & Questions (Backend + Frontend)

Backend:

- `contacts.routes.js`, `questions.routes.js`
- Zod schemas for question structure

Frontend (Admin):

- ManageContacts page (add bulk, delete individual)
- ManageQuestions page (full questionnaire editor, type selector, option editor)

**Milestone 4**: Admin can manage contacts and build a questionnaire. UI prevents editing after activation.

---

### Phase 5 — AI Question Generation

Backend:

- `ai.service.js` with `generateQuestions()`
- `POST /api/campaigns/:id/generate-questions`

Frontend (Admin):

- AI modal on questions page

**Milestone 5**: Admin can enter a scenario, receive suggested questions, edit them, and save.

---

### Phase 6 — Campaign Activation & OTP Notification

Backend:

- Activation logic in `campaign.service.js` (RSA key gen, OTP gen)
- `blindrsa.service.js` (wraps `@cloudflare/blindrsa-ts`)
- `otp.service.js` (lease logic)
- `/otp/*` routes

OTP Sender script:

- `otp-sender/index.js` with polling loop

**Milestone 6**: Activating a campaign generates keys and OTPs. OTP sender script can claim contacts and (in demo) print OTPs to console or send via SMTP.

---

### Phase 7 — Client App: Register Flow

Backend:

- `GET /start`, `POST /submit-otp` in `client.routes.js`

Frontend (Client):

- Home page, AddCampaignModal
- `lib/crypto.js` (blind, finalize, verify wrappers)
- `lib/pattern.js` (hash → jdenticon SVG)
- `lib/storage.js` (localStorage helpers)
- Security Pattern display

Tests: `tests/client.test.js` — `/start` with valid OTP, invalid OTP, already-used OTP; `/submit-otp` blind sign flow.

**Milestone 7**: Respondent can enter OTP + URL, receive security pattern, and two simulated users see the same pattern.

---

### Phase 8 — Client App: Response Submission

Backend:

- `POST /submit-response` in `client.routes.js`

Frontend (Client):

- CampaignPage with question rendering and draft saving
- Submit flow with confirmation modal

Tests: double-spend attempt (reusing same token should fail), valid submission stored correctly.

**Milestone 8**: End-to-end flow works. Respondent submits a response. Admin sees it in the responses page.

---

### Phase 9 — Responses, Insights, AI Summary (Admin)

Backend:

- `responses.routes.js`, `insights.routes.js`, `summary.routes.js`
- `insights.service.js` (aggregation logic)
- `ai.service.js → summarize()`

Frontend (Admin):

- Responses page, Insights page with charts, AI Summary modal

**Milestone 9**: Admin can view all responses, see per-question aggregates, and generate an AI summary.

---

### Phase 10 — Polish & Demo Prep

- Error states and loading states throughout UI
- Client app instructions about VPN / network change
- JSON payload canonicalization audit (ensure Security Pattern hash is stable)
- README with setup instructions
- End-to-end demo run

**Final Milestone**: Full demo flow works: admin creates campaign → activates → OTPs sent → two respondents register (same security pattern) → both submit on different networks → admin views insights and AI summary.
