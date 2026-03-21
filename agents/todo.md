# Current Phase: Phase 10 + /start Redesign (Completed) — Backend DONE

## All Phases
- [x] Phase 1-9: Complete (see git history)
- [x] Phase 10: Notification & Client API Refinements
  - [x] `otp.service.js` returns `campaign_name` + `access_url`, suppresses raw OTP
  - [x] `public.service.js` drops `campaign_id` from `startFlow`; `submitOtp` derives & returns it
  - [x] `GET /start` returns plain text browser guard
  - [x] `POST /start` is the real client app endpoint (otp in body)
  - [x] `otp-sender` pseudocode updated with full message template
  - [x] `CLIENT_APP_DOMAIN` added to `.env.example`
  - [x] All 53 tests pass across 9 suites

## Tooling & Infrastructure
- [x] Set up **Mongo-Express** admin interface (Docker-based)
  - [x] Created `tools/mongo-express/docker-compose.yml`
  - [x] Created `tools/mongo-express/start.sh` quick-start script
  - [x] Verified connection and authentication

## Phase 11: Terminal Demo Clients (Completed)
- [x] Admin App CLI (login, create/activate, insights)
- [x] Notification App CLI (poll, print SMS, confirm)
- [x] Client App CLI (verify SPKI hash, answer single question, verify Token Hash, submit)
- [x] Write `DEMO_RUNBOOK.md` instructions
