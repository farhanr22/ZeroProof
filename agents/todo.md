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
