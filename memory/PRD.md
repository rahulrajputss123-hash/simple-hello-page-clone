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

## Verification status (VERIFIED against live DB, project etwtjrkjphbdkwojhozg)
- `.env` + `config.toml` corrected to `etwtjrkjphbdkwojhozg`; service-role key validates; migration applied (both tables + RLS + seeded settings row exist).
- `tsc --noEmit`: clean for all new/changed files (only 2 PRE-EXISTING errors in OfferwallSlot.tsx, untouched).
- Testing agent (iteration_1): 28/28 pytest pass, no critical/blocking issues. Cron refresh 200 → US+DE, count=10 (≤ cap); 401 without secret; cache row 5h TTL; network offers reward=payout×0.6; upsert idempotent; RLS blocks anon, allows service role. Direct-impl E2E: manual-featured first, network ranked by weight×reward desc, slots=3, on-demand DE fetch, null→US fallback.
- Applied reviewer hardening: constant-time cron-secret compare + no error leakage; settings passed once (no double fetch); weight map renamed; max-weight on offer-id collisions.

## Backlog / next
- P0: user runs migration SQL + provides correct service-role key for kprhboiassbbyheanqky, then E2E verify.
- P1: schedule the cron on the deploy platform; rotate OFFER_FEED_CRON_SECRET.
- P2: true per-country GEO param once a network's feed supports it (wiring already threaded).

## Feature update (2026-11) — Offer popup + Editable Starter Quests
- **Migration** `supabase/migrations/20261101000000_offer_popup_and_quests.sql`
  - `offers.not_allowed text NOT NULL DEFAULT ''` — new "what NOT to do" warning field.
  - New `public.quests` table (key/label/icon/quest_type/ads_required/reward_amount/shortlink_steps jsonb/min_seconds_per_step/is_active/sort_order) with RLS (`active quests readable`), grants, updated_at trigger, and seed rows (starter_5/25/50).
  - `public.quest_sessions` extended with `quest_type`, `current_step`, `step_issued_at`.
- **Server**
  - `src/lib/quests.functions.ts` + `src/lib/quests.server.ts` — CRUD (`listActiveQuests` / `listAdminQuests` / `saveQuest` / `deleteQuest`), plus `startShortlinkStep` + `completeShortlinkStep` (time-check via `min_seconds_per_step`, step sequencing, wallet credit on final step reuses `creditWallet`).
  - `startQuestImpl` (coinquest.server.ts) now reads quest defs from the `quests` table (constant `QUESTS` array retired, seed rows preserve keys). Ads flow unchanged.
  - Offer server code: `saveManualOffer` (offers.functions.ts) accepts `notAllowed`; `ManualOfferInput` + `upsertManualOfferImpl` + `listAdminOffersImpl` + `assembleFeaturedImpl` (feed-cache) now select/include `not_allowed`; `FeaturedOffer` type gained `not_allowed`.
- **UI**
  - `src/components/OfferDetailsDialog.tsx` — shared pre-redirect confirmation dialog (title, description, "How to complete", "What NOT to do" with red warning styling, Continue button). Fallback warning string when `not_allowed` empty.
  - `FeaturedOffers` — tapping an offer opens the dialog; only after "Continue" does the app open `click_url` + call `claimOffer`. Reused across Home / Offers / /featured views.
  - `OffersManager` admin form — new **"What not to do"** textarea (`data-testid="offer-form-not-allowed"`).
  - `StarterQuests` — horizontally scrollable row (`flex gap-3 overflow-x-auto`, `min-w-[160px]` cards); fetches from `listActiveQuests`; renders both ads and shortlink cards (Step N of 3 / Start / Continue / Done).
  - `QuestsManager` admin (`src/components/admin/QuestsManager.tsx`) — full CRUD with quest-type toggle, 3-step shortlink editor, helper text showing exact `/go/{key}/{step}` destinations to configure on each shortener, min-seconds-per-step field.
  - New route `src/routes/_authenticated/go.$questKey.$step.tsx` — auto-runs `completeShortlinkStep` on mount; shows success/next-step/error states.
  - Admin panel tabs: new **Quests** tab wired between Offers and Tasks.

## Verification status
- ESLint: clean for all new/modified files.
- Not run: `tsc --noEmit` (no local `node_modules` in this sandbox), migration apply, and E2E — user must `bun install`, apply the migration against the Supabase project, and restart dev before verifying.

## Follow-ups
- Regenerate `src/routeTree.gen.ts` (auto by `vite dev` / `vite build` on first run).
- P1: If Supabase types are re-generated later, add the new `quests` table + `offers.not_allowed` column + new `quest_sessions` columns to `src/integrations/supabase/types.ts`; the current code uses a local untyped alias so runtime works today.

## Feature update (2026-11) — Brand logo, splash screen, unified signup, auth polish
- **Assets** in `public/`: `favicon.ico` (16/32/48/64), `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` (180), `logo-horizontal-light.png`, `logo-horizontal-dark.png` — all derived from the user-supplied brand kit.
- `public/manifest.webmanifest` updated: theme_color=#0F3D3A, icons array points to the new 192/512 PNGs (`any maskable`).
- `src/routes/__root.tsx` head links now include the new 192/512 icons + `apple-touch-icon`.
- **BrandMark** in `AppShell.tsx` now renders the actual `icon-512.png` image (used in header). New **BrandLogo** (`variant="light" | "dark" | "auto"`) renders the horizontal wordmark lockup; auto uses `<picture>` with `prefers-color-scheme` swap.
- **SplashScreen** (`src/components/SplashScreen.tsx`) — full-screen `bg-background`, animated jade/gold radial halo behind the logo (`splash-logo-in` + `splash-halo-pulse` keyframes), 3 pulsing dots as loading indicator, 500ms cross-fade out. Mounted in `RootComponent` via `SplashGate` reading `useAuth().loading`.
- **Merged signup fields**: `src/routes/auth.tsx` fully redesigned — Full Name and Referral Code fields appear only in signup mode; referral auto-fills from `?ref=` / `localStorage["coinquest.ref"]`. On signup, name is persisted in `localStorage["coinquest.pending_onboarding"]` (email confirmation delay = no session yet). `src/routes/_authenticated/home.tsx` picks it up on first authenticated render and silently calls `completeOnboarding`, then clears the key — no visible `/onboarding` step for new signups. `/onboarding` route retained as fallback (old accounts, cleared storage, or silent-save failure).
- **Auth UI polish**: `auth-bg` radial background glows (`styles.css`), `surface-card + shadow-lift` on the form, `auth-card-in` entrance animation, `auth-fade-slide` on signup-only fields, larger jade primary button with `size="lg"`, data-testids on every interactive element (`auth-page`, `auth-form-signin`/`-signup`, `auth-name-input`, `auth-email-input`, `auth-password-input`, `auth-referral-input`, `auth-submit-btn`, `auth-mode-toggle`).
- Onboarding fallback screen also refreshed to use `BrandLogo` + `auth-bg` + entrance animation for visual consistency.

## Backlog / next
- P1: If dark mode is later added globally, the `BrandLogo variant="auto"` already swaps via `prefers-color-scheme`; header/app currently sits on light surfaces only.
- P2: Consider adding a Phone/OTP tab on auth (spec anticipated `PhoneForm` but codebase currently only ships email); same signup-fields pattern would apply.
