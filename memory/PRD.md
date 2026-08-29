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

## Feature update (2026-11) — Proof upload + Limited deals + Per-offer payout mode
Migration: `supabase/migrations/20261115000000_offer_proof_deals_payout_mode.sql` (must be run manually by user against Supabase).

### 1. Proof-of-completion upload
- `offer_claims.proof_url text NULL`.
- Private storage bucket `offer-proofs` with path-scoped RLS: users may read/write only under `offer-proofs/{their auth.uid()}/…`; admins (`has_role admin`) read all.
- Server: `claimOfferImpl` (coinquest.server.ts) accepts `proofUrl` and inserts it in the same claim row (the table has no UPDATE grant to authenticated).
- Client: `OfferDetailsDialog` uploads via `requestProofUploadUrl` (server fn returning short-lived signed upload URL) directly to Supabase Storage; only the `path` is sent back with the claim.
- Admin: `ClaimProofPreview` component renders the proof inline in the claims review tab via a signed 5-minute URL (`adminSignProofUrl` server fn).

### 2. Limited Deal offers
- New columns on `offers`: `is_limited_deal`, `deal_group_id`, `actual_cost`, `payout_percentage default 110`, `max_payout_cap`.
- Reward calc `MIN(cost * pct / 100, cap)` is enforced server-side in `computeLimitedDealReward` (`src/lib/offers/proof.server.ts`): applied at `upsertManualOfferImpl` (save time) AND recomputed FRESHLY inside `adminUpdateOfferClaimImpl` (approval time) for limited-deal offers — never trusts the claim snapshot. Wallet credit uses the recomputed value.
- **Group locking via RLS**: `offers` SELECT policy replaced — a user with any non-rejected claim on an offer sharing a `deal_group_id` no longer sees siblings. Admin bypass policy `admins see all offers` restored so the admin panel is unaffected. `claimOfferImpl` also mirrors the check server-side (defensive).
- Proof is REQUIRED for limited-deal offers (submit fails without it).
- Admin UI: `OffersManager` form has a "Limited Deal" toggle group with Deal group, Actual cost, Payout %, Max cap, and a live "Effective payout: $X" preview.
- Offer card UI: `FeaturedOffers` shows a floating gold **Deal** ribbon + "One-time only" note when `is_limited_deal`.

### 3. Per-offer payout mode
- New column `offers.payout_mode text default 'manual'` with CHECK (`manual`, `manual_proof`, `auto_postback`). Backward compatible: every existing offer stays on 'manual'. Sync engine (`sync.server.ts` `toRow`) does NOT touch this column, so admin overrides on network offers persist across syncs (as specified).
- `manual`: unchanged behaviour.
- `manual_proof`: proof required at claim submission (uses the same upload flow as limited deals).
- `auto_postback`: `Claim` button now opens the click_url but does NOT insert a claim. Crediting comes from the postback endpoint below.
- **Postback endpoint** `POST/GET /api/public/offer-postback/{offerId}` (`src/routes/api/public/offer-postback.$offerId.ts` → `src/lib/offers/postback.server.ts`). Verification reuses the SDK offerwall patterns: HMAC-SHA256 over `txn:uid:amount` using the env var referenced by `offers.postback_secret_ref`, optional IP allowlist in `offers.postback_ip_allowlist`. Dedupe via unique index `(offer_id, postback_txn_id)`. Inserts an already-approved claim + credits the wallet + emits automation log.
- Admin UI: `OffersManager` form now has a **Payout mode** selector plus a secret-ref/IP-allowlist block when `auto_postback` is selected; the exact postback URL and signing scheme are shown inline. Network offers get a compact `<select>` on their inline controls (wired to `updateOfferControls` which now accepts `payoutMode` + `postbackSecretRef`).

### Env vars
- New (per-offer, admin-defined): whatever the admin puts into `offers.postback_secret_ref` (e.g. `OFFER_ABC_POSTBACK_SECRET`) must be set in the deploy environment before enabling that offer's auto_postback.
- No other new env vars.

### Skipped / notes
- Featured-feed server function (`getFeaturedFeed`) uses `supabaseAdmin` (service role, bypasses RLS) and is cached per country, not per user; deal-group hiding for that path relies on `claimOfferImpl`'s server-side check (defence-in-depth) since per-user filtering would break cache. Direct client queries against `offers` correctly hide siblings via the new RLS policy.
- Supabase generated types (`src/integrations/supabase/types.ts`) were not regenerated; new columns are accessed via typed casts. Regenerate types after applying the migration to remove the casts.

### Migration SQL for the user to run
`supabase/migrations/20261115000000_offer_proof_deals_payout_mode.sql` — apply via `supabase db push` OR paste into the Supabase SQL editor.

## Feature update (2026-11) — Banner System (custom + scheduled + smart)
Migration: `supabase/migrations/20261120000000_banners.sql`. Purely additive; no existing UI, layouts, colours, or offers/tasks/offerwall logic was changed.

### DB
- New table `public.banners` (section∈{home,offers,tasks,offerwall}, title, description, image_url, cta_kind, cta_target, cta_label, priority, is_active, starts_at, ends_at UTC).
- RLS: `eligible banners readable` for authenticated (active + within schedule window); `admins manage banners` full ALL for admins.
- Storage bucket `banner-assets` (PUBLIC read; admin-only INSERT/UPDATE/DELETE via `has_role`).
- Smart banners are NEVER stored — they are code templates (`src/lib/banners/smart.ts`) evaluated live against real user data at render time.

### Server
- `src/lib/banners/server.ts` — `listEligibleBannersImpl` (auth): loads active-and-in-window rows; resolves CTA server-side (invalid offer/provider → falls back to section's main route so the banner doesn't break). Admin fns: `listAdminBannersImpl`, `upsertBannerImpl`, `deleteBannerImpl`, `requestBannerUploadUrlImpl`.
- `src/lib/banners/functions.ts` — `createServerFn` wrappers: `listEligibleBanners`, `listAdminBanners`, `saveBanner`, `deleteBanner`, `requestBannerUploadUrl`.

### Client
- `src/components/SectionBanner.tsx` — fetches DB banners + builds smart banners from live queries (`offers`, `user_tasks`, `sdk_offerwall_providers`), merges by priority DESC, rotates round-robin using `localStorage["cashgpt.banner_last:<section>"]` + auto-advance every 6s. Renders premium cards inside the existing jade/gold/mint palette (custom banners use `image_url` background with a gradient overlay). CTA renders as `<Link to="/…">` or external `<a target=_blank>`.
- `src/components/admin/BannersManager.tsx` — CRUD dialog with section selector, image URL/upload, CTA kind + target + label, priority, active toggle, `datetime-local` start/end fields (converted local↔UTC in the client so admins enter their local timezone but Supabase stores UTC). Includes a live "Preview <section>" pane that reuses the real `SectionBanner`.

### Wired into
- Admin panel: new **Banners** tab (between Tasks and Withdrawals).
- `home.tsx`: `SectionBanner section="home"` between the existing welcome carousel and Starter Quests (headings stay left-aligned).
- `offers.tsx`: after the "Complete partner offers…" subtitle, before "Featured Offers".
- `task.tsx`: after the "Work through the list…" subtitle, before the task list.
- `offerwall.tsx`: immediately below the "Offerwall" heading, above `OfferwallSlot`.

### Migration SQL — paste in the Supabase SQL editor
See `supabase/migrations/20261120000000_banners.sql` (full file). Highlights:
```sql
CREATE TABLE public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text NOT NULL CHECK (section IN ('home','offers','tasks','offerwall')),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text,
  cta_label text,
  cta_kind text NOT NULL DEFAULT 'none'
    CHECK (cta_kind IN ('none','offers','tasks','offerwall','offer','offerwall_provider','url')),
  cta_target text,
  priority integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at   timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "eligible banners readable" ON public.banners FOR SELECT TO authenticated USING (
  is_active AND (starts_at IS NULL OR starts_at <= now())
             AND (ends_at   IS NULL OR ends_at   >  now())
);
CREATE POLICY "admins manage banners" ON public.banners FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO storage.buckets (id,name,public) VALUES ('banner-assets','banner-assets',true)
ON CONFLICT (id) DO NOTHING;
-- + 4 storage.objects policies: public SELECT, admin INSERT/UPDATE/DELETE
```
