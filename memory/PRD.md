# PRD — Offer Feed Automation (geo-targeted, background-refreshed network offers)

## Original problem statement
Automate geo-targeted offer fetching for Offer Feed networks (AdBlueMedia). Replace the
manual-only "Sync now" flow + hardcoded GEO "Any" with per-country cached offers refreshed
on a schedule, plus admin controls and a ranked Featured Offers section.

## Stack (existing repo)
TanStack Start (React 19 + Vite) + Supabase (RLS via `has_role`). Server functions in
`src/lib/*.functions.ts` guarded by `requireSupabaseAuth` + `assertAdmin`. Service-role
client in `src/integrations/supabase/client.server.ts`. Deployed via Lovable/Cloudflare (nitro).

## What was implemented (2026-06)
- **DB migration** `supabase/migrations/20260824000000_offer_feed_automation.sql`
  - `offer_feed_cache` (provider_id, country, offers jsonb, offer_count, last_synced_at, expires_at) — RLS: authenticated read-only, writes via service role.
  - `offer_feed_settings` singleton (refresh_interval_hours=5, default_country=US, fallback_behavior=default_country, featured_slots=3) — RLS: authenticated read, admin write.
- **GEO detection** `src/lib/offers/geo.server.ts` — reads x-vercel-ip-country / cf-ipcountry / others; fallback to configured default country.
- **Feed settings** `src/lib/offers/feed-settings.server.ts` — global settings + per-network config (max_offers, weight) stored in `offer_providers.sync_config`; AdBlueMedia hard-capped at 10.
- **Feed cache + assembly** `src/lib/offers/feed-cache.server.ts` — per-(network,country) refresh with expiry, synchronous on-demand fallback on miss/expiry, stale-serve on error, background `refreshAllFeedsImpl`, admin manual refresh. Featured assembly: admin-featured manual offers first, then network offers ranked by (weight × reward_amount), sliced to `featured_slots` for home.
- **Server API** added to `src/lib/offers.functions.ts`: `getFeaturedFeed` (auth), `getFeedAutomation`/`updateFeedSettings`/`updateNetworkFeedSettings`/`adminRefreshFeed` (admin).
- **Cron route** `src/routes/api/cron/refresh-offer-feed.ts` — secret-guarded (OFFER_FEED_CRON_SECRET), GET/POST, deployment-agnostic (Vercel Cron / Cloudflare cron / external pinger).
- **Admin UI** `src/components/admin/OfferFeedAutomationPanel.tsx` + new "Offer Feed" tab in `src/routes/_authenticated/admin.tsx`.
- **Home Featured Offers** — `FeaturedOffers` now calls `getFeaturedFeed` (geo + ranked). `scope="home"` (home/offers) vs `scope="all"` (/featured).
- Adapter contract extended non-breakingly (`OfferFetchContext` optional `country`); AdBlueMedia adapter file untouched.

## New env vars
- `SUPABASE_SERVICE_ROLE_KEY` — REQUIRED, must match project `kprhboiassbbyheanqky`.
- `ADBLUEMEDIA_API_KEY` — set.
- `OFFER_FEED_CRON_SECRET` — set (placeholder `..._change_me`; rotate before prod).

## Verification status
- `tsc --noEmit`: clean for all new/changed files (only 2 PRE-EXISTING errors in OfferwallSlot.tsx, untouched).
- Dev server boots; cron route auth verified (401 + JSON without secret).
- NOT E2E-verified in pod: (1) provided service-role key is for the WRONG project → Invalid API key; (2) migration not yet applied; (3) pod Node 20 lacks WebSocket that supabase-js realtime wants (works on Node 22+/edge deploy).

## Backlog / next
- P0: user runs migration SQL + provides correct service-role key for kprhboiassbbyheanqky, then E2E verify.
- P1: schedule the cron on the deploy platform; rotate OFFER_FEED_CRON_SECRET.
- P2: true per-country GEO param once a network's feed supports it (wiring already threaded).
