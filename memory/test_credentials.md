# Test Credentials & Verification Notes

## Supabase project
- Project ref: `etwtjrkjphbdkwojhozg`  ·  URL: https://etwtjrkjphbdkwojhozg.supabase.co
- Keys live in `/app/.env` (SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SERVICE_ROLE_KEY). Never hardcode.

## App runtime in this pod
- This repo is a flat TanStack Start app (NOT the standard supervisor frontend/backend layout).
- It is served via supervisor program `lovableapp` (`/app/run_dev.sh` -> `bun --bun run dev --port 3000`).
  - MUST run under the **bun runtime** (`bun --bun`), because supabase-js realtime needs a global
    `WebSocket` which Node 20 (the system node) lacks. bun provides it. Node 22 would also work but
    isn't installed here.
  - `/app/run_dev.sh` sources `/app/.env` so server functions can read `process.env` (Gemini + Supabase keys).
- Serves on http://localhost:3000 and is wired to the Emergent preview URL (port 3000 ingress).
- Restart: `sudo supervisorctl restart lovableapp`. Deps: `export PATH=$HOME/.bun/bin:$PATH && bun install`.

## Authenticated app login (QA test user)
- Email: `qa.assistant@cashgpt.test`  ·  Password: `CashGPT!test123`
- Created via Supabase admin API with email_confirm=true (id 714900d6-8a7c-46e4-97fd-69ca96200473).
- Use it to reach `_authenticated` routes (e.g. /support) and to drive authenticated server functions.

## AI Support Assistant (Gemini)
- Server fn: `sendAssistantMessage` in `src/lib/assistant.functions.ts` -> `src/lib/assistant/server.ts`.
- Uses `GEMINI_API_KEY` (in /app/.env) with model **gemini-3.6-flash** (the spec's gemini-2.0-flash is
  retired by Google and 404s; 3.6-flash is the current recommended flash model). System instruction =
  CASHGPT_SYSTEM_PROMPT. Reply latency ~5-8s (thinking model; thinkingBudget:0 is rejected).
- UI: `src/components/AssistantChat.tsx` (AI Assistant card + floating bubble + chat panel) in the Support tab.

## Offer Feed Automation testing
- Cron secret: `OFFER_FEED_CRON_SECRET` in /app/.env (currently `cq_cron_9f3a1c7e42b84d0e_change_me` — rotate before prod).
- Trigger background refresh: `GET /api/cron/refresh-offer-feed?secret=<OFFER_FEED_CRON_SECRET>&force=1`
- Verify DB state via Supabase REST with the service-role key (tables: offer_feed_cache, offer_feed_settings, offers).

## Authenticated app login
- No admin/user test login (email+password JWT) is currently available. The authenticated server
  functions (getFeaturedFeed, getFeedAutomation, updateFeedSettings, updateNetworkFeedSettings,
  adminRefreshFeed) therefore can't be driven over HTTP in this sandbox — verify them via DB state +
  the cron path, or add a Supabase test user (with an `admin` row in `user_roles`) here when available.
  UPDATE: a non-admin QA user now exists (see "Authenticated app login" above) for driving normal
  authenticated routes/functions; it is NOT an admin.
