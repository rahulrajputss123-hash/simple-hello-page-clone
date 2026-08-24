# Test Credentials & Verification Notes

## Supabase project
- Project ref: `etwtjrkjphbdkwojhozg`  ·  URL: https://etwtjrkjphbdkwojhozg.supabase.co
- Keys live in `/app/.env` (SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SERVICE_ROLE_KEY). Never hardcode.

## App runtime in this pod
- This repo is a flat TanStack Start app (NOT the standard supervisor frontend/backend layout).
- Run it on Node 22 (supabase-js realtime needs global WebSocket):
  `export NVM_DIR=$HOME/.nvm && . $NVM_DIR/nvm.sh && nvm use 22 && (nohup node node_modules/.bin/vite dev >/tmp/vite.log 2>&1 &)`
- Serves on http://localhost:8080 (Lovable config forces this port; preview URL / port 3000 is NOT wired for this repo).

## Offer Feed Automation testing
- Cron secret: `OFFER_FEED_CRON_SECRET` in /app/.env (currently `cq_cron_9f3a1c7e42b84d0e_change_me` — rotate before prod).
- Trigger background refresh: `GET /api/cron/refresh-offer-feed?secret=<OFFER_FEED_CRON_SECRET>&force=1`
- Verify DB state via Supabase REST with the service-role key (tables: offer_feed_cache, offer_feed_settings, offers).

## Authenticated app login
- No admin/user test login (email+password JWT) is currently available. The authenticated server
  functions (getFeaturedFeed, getFeedAutomation, updateFeedSettings, updateNetworkFeedSettings,
  adminRefreshFeed) therefore can't be driven over HTTP in this sandbox — verify them via DB state +
  the cron path, or add a Supabase test user (with an `admin` row in `user_roles`) here when available.
