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

## Feature update (2026-11) — Offer tags + category filter + click tracking
Migration: `supabase/migrations/20261125000000_offer_tags_category_clicks.sql`. Purely additive. Existing offers unchanged (tags default to empty, category to NULL).

### DB
- New columns on `offers`: `category text` (CHECK ∈ {App Install, Trial, Deals, Survey, Games, Link Locker, Shortlink} or NULL); `tags text[] default '{}'`; `category_manual bool default false`; `tags_manual bool default false`.
- Trigger `preserve_offer_admin_overrides` (BEFORE UPDATE) restores admin-set `category` / `tags` whenever the corresponding `*_manual` flag is true, so re-syncs from network adapters never overwrite admin choices.
- New `offer_click_events (id, offer_id, created_at)` with `authenticated INSERT` RLS + index on `(offer_id, created_at DESC)`.

### Server
- `src/lib/offers/tags.server.ts` — `computeAutoTags` (Hot = top-15% reward; Popular = top-15% 7-day click count; Trending = 7-day activity >= 1.5× prior 7-day AND ≥3 sample; Easy = short requirements OR category=Trial). Uses `offer_click_events` first, falls back to `offer_claims` counts. `recordOfferClickImpl` inserts a click row.
- `trackOfferClick` server fn in `offers.functions.ts`.
- `saveManualOffer` now accepts `category` (nullable) and `tags` (array of Hot/Trending/Easy/Popular). `upsertManualOfferImpl` writes both AND flips `category_manual` / `tags_manual` to true so the trigger freezes them.
- Feed cache selects `category, category_manual, tags, tags_manual`; `assembleFeaturedImpl` overlays auto-tags onto offers whose `tags_manual=false`; admin-locked offers use their stored `tags` untouched.
- `FeaturedOffer` type gained `category` + `tags`.

### Adapter
- `adbluemedia.server.ts` — added `ADBLUEMEDIA_CATEGORY_MAP` (best-guess mapping of `category_id` → our enum; unknown ids stay NULL). Setting `category` on `NormalizedOffer` per item. `NormalizedOffer` type in `provider-types.ts` extended with optional `category`, plus a new exported `OfferCategory` literal type + `OFFER_CATEGORIES` array.
- `sync.server.ts` `toRow` now writes `category` on every sync. The DB trigger preserves any admin-overridden value.

### Client
- `src/components/OfferTagRow.tsx` — coloured Hot / Trending / Easy / Popular / Deal badges. "Deal" is auto-derived from `is_limited_deal`, never a separate DB tag.
- `src/components/OfferFilterButton.tsx` — bottom-sheet with single-select filter (All / App Install / Trial / Deals / Survey / Games / Link Locker / Shortlink). `offerMatchesFilter` maps "Deals" to EITHER `category=Deals` OR `is_limited_deal=true` so cashback deals surface naturally.
- `FeaturedOffers` — accepts `filter` prop; renders `<OfferTagRow>` above each title (replacing the old floating "Deal" ribbon). On `Continue` in the OfferDetailsDialog it fires `trackOfferClick` before opening the URL, feeding the Popular/Trending engine.
- `routes/_authenticated/offers.tsx` — filter state + `<OfferFilterButton>` inline with the "Featured Offers" heading. Home page NOT filtered (per spec).
- **View All** — reusable pill link on Offers page + Home page with primary border, hover fill, and animated `→` icon.
- Admin `OffersManager` form — new Category dropdown + multi-select Tag pills; helper text explains that saving flips the offer into admin-managed mode and disables auto-tagging.

### Migration SQL for the user to run
Full file: `supabase/migrations/20261125000000_offer_tags_category_clicks.sql` — paste into Supabase SQL editor. Key statements:
```sql
ALTER TABLE offers
  ADD COLUMN IF NOT EXISTS category        text,
  ADD COLUMN IF NOT EXISTS category_manual boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tags            text[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tags_manual     boolean NOT NULL DEFAULT false;
ALTER TABLE offers ADD CONSTRAINT offers_category_check
  CHECK (category IS NULL OR category IN
    ('App Install','Trial','Deals','Survey','Games','Link Locker','Shortlink'));

-- Preservation trigger keeps admin edits safe across network re-syncs
CREATE OR REPLACE FUNCTION preserve_manual_offer_overrides() RETURNS trigger AS $$
BEGIN
  IF OLD.category_manual THEN NEW.category := OLD.category; NEW.category_manual := true; END IF;
  IF OLD.tags_manual     THEN NEW.tags     := OLD.tags;     NEW.tags_manual     := true; END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER preserve_offer_admin_overrides BEFORE UPDATE ON offers
  FOR EACH ROW EXECUTE FUNCTION preserve_manual_offer_overrides();

CREATE TABLE offer_click_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX offer_click_events_offer_created_idx ON offer_click_events (offer_id, created_at DESC);
ALTER TABLE offer_click_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated inserts click events" ON offer_click_events
  FOR INSERT TO authenticated WITH CHECK (true);
```

## Feature update (2026-11) — First-time onboarding coach-mark tour
Migration: `supabase/migrations/20261130000000_onboarding_tour.sql` (must be applied manually by user).

### DB
- New `profiles.has_seen_onboarding boolean NOT NULL DEFAULT false` (deliberately different from the pre-existing `profiles.onboarded` which drives the /onboarding profile-setup redirect — never merged).
- New table `public.onboarding_steps` (target_element_id, title, description, display_order, enabled, created/updated_at) + RLS (`enabled steps readable` for authenticated; `admins manage onboarding steps` for admin ALL) + updated_at trigger.
- Seed: 2 rows — `tour-wallet-balance` (merged real-time+withdrawal message; the same DOM element is both the balance display AND the withdraw-entry point on Home so spotlighting it twice would be confusing, hence one merged step) and `tour-featured-offers`.

### DOM anchors
- `id="tour-wallet-balance"` on the header wallet `Link` in `src/components/AppShell.tsx`.
- `id="tour-featured-offers"` wrapping the Featured Offers section in `src/routes/_authenticated/home.tsx`.

### Source of truth for spotlight targets
`src/lib/onboarding/targets.ts` — exports `ONBOARDING_TARGETS`, `ONBOARDING_TARGET_IDS`, `isValidTargetId`. The admin form only shows these ids; server rejects unknown target_element_ids at save time. To add another target: add the `id` to the JSX element, then register it here.

### Server
- `src/lib/onboarding/server.ts` + `.../functions.ts`:
  - `listOnboardingSteps` (auth, cached 60s) — enabled steps in display_order.
  - `markOnboardingSeen` (auth) — flips has_seen_onboarding=true.
  - `resetOnboarding` (auth) — flips has_seen_onboarding=false, used by Support "Replay".
  - `listAdminOnboardingSteps` / `saveOnboardingStep` / `deleteOnboardingStep` / `reorderOnboardingSteps` — admin CRUD; save validates target_element_id against the registry.

### Client
- `src/components/OnboardingTour.tsx` — spotlight overlay with SVG mask that punches a rounded hole around the current target, gold ring, tooltip (Step N of M, title, description, Skip/Next). Auto-scrolls the target into view, tracks scroll/resize, locks body scroll while open. Two exports:
  - `<OnboardingTour />` — auto-runs when `profile.onboarded && !has_seen_onboarding` and calls `markOnboardingSeen` on close. Mounted at the bottom of the home page.
  - `<OnboardingTourPreview steps={} onClose={} />` — pure local state, NEVER writes to profiles. Used by admin "Preview tour".
- `src/components/admin/OnboardingManager.tsx` — full CRUD list with up/down reorder buttons, target picker (from `ONBOARDING_TARGETS`), enabled toggle, "Preview tour" button (runs `OnboardingTourPreview`).
- Support tab — new "Replay the app tour" row with a button that calls `resetOnboarding` and navigates to /home.
- Admin panel — new **Onboarding** tab wired between Banners and Withdrawals.

### Migration SQL to paste in Supabase SQL editor
Full file: `supabase/migrations/20261130000000_onboarding_tour.sql`. Highlights:
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_seen_onboarding boolean NOT NULL DEFAULT false;

CREATE TABLE onboarding_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_element_id text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  display_order integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE onboarding_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "enabled steps readable" ON onboarding_steps FOR SELECT TO authenticated
  USING (enabled = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage onboarding steps" ON onboarding_steps FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO onboarding_steps (target_element_id, title, description, display_order, enabled) VALUES
  ('tour-wallet-balance', 'Your wallet, always live', 'This is your balance — it updates in real time as you earn. Tap it any time to cash out.', 1, true),
  ('tour-featured-offers', 'Featured Offers pay the most', 'Featured Offers are the main way to earn. Complete one and the reward lands in your wallet after review.', 2, true);
```

### Available target ids (registered in `src/lib/onboarding/targets.ts`)
- `tour-wallet-balance` — wallet balance pill in AppHeader (links to /wallet).
- `tour-featured-offers` — Featured Offers section on Home.

## 2026-06 — Home "Cash Out Your Way" redesign
- Replaced the generic 4-card About Us grid (Ways to Earn / Instant Payout / More Offers / Need Help) in `src/routes/_authenticated/home.tsx`.
- New bold jade-gradient "Cash Out Your Way" section: gold "Payouts" badge + heading, asymmetric layout (PayPal hero card + Crypto and Gift Cards), colorful brand-colored icon badges (lucide Wallet/Bitcoin/Gift).
- "Need Help?" kept as a separate surface-card below. Added `.payout-card` staggered-reveal + hover-lift animations in `src/styles.css`. Design-only, no functionality changed.

## 2026-06 — Reusable SectionHeading (main heading polish)
- Added `src/components/SectionHeading.tsx`: left icon badge (soft mint circle + emerald icon), emerald bold title with subtle green brush accent + gold sparkle, optional subtitle + right action; `size="page"|"section"`.
- Applied across home, offers, offerwall, featured, task, wallet, refer, profile, support, notifications (replaced plain h1 / SectionTitle). Admin panel left on legacy SectionTitle (internal).
- Design-only; no layout/functionality/content changes. Verified via preview render + all 10 routes SSR 200, clean compile. Authenticated E2E not run (no test login in pod).

---

## Update — 2026-06 · AI Support Assistant (CashGPT Assistant)

**Feature:** In-app AI support chat in the Support tab, powered by Gemini.

- **Server route:** `sendAssistantMessage` server function (`src/lib/assistant.functions.ts`) →
  impl `src/lib/assistant/server.ts`. Takes a user message + short conversation history, calls the
  Gemini `generateContent` API with `GEMINI_API_KEY` and `CASHGPT_SYSTEM_PROMPT` as the system
  instruction, returns `{ reply }` as JSON. Auth-gated with `requireSupabaseAuth`.
- **Model note:** Spec asked for `gemini-2.0-flash`, but that model is now retired by Google (404,
  "no longer available"). Implemented with the recommended current model `gemini-3.6-flash`.
- **Widget:** `src/components/AssistantChat.tsx` — floating chat bubble, chat panel (message history,
  input, send), loading (typing dots) state, and a failure fallback message. Custom coin-mascot
  avatar (`/public/assistant-mascot.png`, generated from the app's coin logo) reused in the floating
  button, chat header, and the "AI Assistant" card. Matches the jade/cream/gold theme.
- **Runtime fix (infra):** switched the supervised dev server (`lovableapp` / `run_dev.sh`) to the
  **bun runtime** (`bun --bun`) on port 3000, because supabase-js needs a global WebSocket missing in
  Node 20 — this was breaking ALL authenticated server functions in the sandbox.
- **Verified:** logged-in user → Support → open chat → send → grounded reply (~7s), loading + fallback
  paths both exercised.

### Next / backlog
- P2: persist chat history per user (currently in-session only, per user choice).
- P2: quick-reply chips for common FAQ questions.

## Update — 2026-06 · Assistant enhancements (all verified)
- **Quick Replies**: tappable FAQ chips (earn coins, min withdrawal, payout time, KYC) shown before
  the user's first message; sending a chip triggers a normal assistant reply.
- **Chat Memory**: conversation persists across refreshes via `localStorage` keyed per user
  (`cashgpt.assistant.chat.<userId>`). Still client-side only (no DB).
- **Ticket Handoff**: "Talk to a human" button in the chat inserts a `support_tickets` row with the
  chat transcript as the description (subject `AI chat: <first question>`), toasts success, and posts
  an in-chat confirmation. Verified a row lands in Supabase.
- **Unread Nudge**: first-time users see a speech-bubble prompt + a pulsing ring on the floating
  mascot; dismissed permanently once the chat is opened (`cashgpt.assistant.opened` flag).
- All implemented in `src/components/AssistantChat.tsx`.

## Update — 2026-06 · Banner system (3 changes from artifact)
1. **Offers key collision** — verified end-state: `/offers` renders `<SectionBanner section="offers" />`
   and Home's Featured Offers widget has NO banner slot (Home's own slot is `section="home"`). An
   "offers" banner now shows on the real /offers page + admin "Preview Offers". No code change needed
   (already correct in this codebase); confirmed by test.
2. **Smart-banner on/off switches** — new `smart_banner_settings` table (template_key PK, enabled,
   updated_at; RLS: authenticated SELECT, admin manage). Server fns `listSmartBannerSettings` /
   `setSmartBannerEnabled` (`src/lib/banners/functions.ts` + `server.ts`, fail-open if table missing).
   Template registry `SMART_BANNER_TEMPLATES` in `src/lib/banners/smart.ts`. Admin toggle list added
   to `BannersManager.tsx` below the custom-banner list. Migration:
   `supabase/migrations/20261201000000_smart_banner_settings.sql` (user runs it on their live project).
3. **Home = custom banners only** — `SectionBanner.tsx` excludes smart banners when `section==="home"`
   (feeds a custom-only candidate list into the existing rotation), and elsewhere skips any template an
   admin switched off. Verified: Home shows 0 smart + rotates the 2 custom home banners; the hardcoded
   welcome/streak carousel is untouched.

## 2026-08-31 — Home hardcoded streak card removed
- Deleted the hardcoded BannerCarousel block ("Welcome back / Let's earn today / X day streak · Y to bonus" incl. progress bar) from /app/src/routes/_authenticated/home.tsx.
- Removed now-unused imports (BannerCarousel, Flame, Progress) and streak/goal vars.
- <SectionBanner section="home" /> is now the first element in AppShell (custom banner rotation unchanged).
- Verified: vite dev serves /home with HTTP 200, no compile errors.

---
## Featured Offers fix & polish — 2026-06 (verified, testing agent 100%)
Scope: FeaturedOffers.tsx, offers/feed-cache.server.ts, OfferTagRow.tsx, OfferDetailsDialog.tsx, offers.functions.ts.

Done:
- Card image: rendered full-width banner from offer.image_url with Gift-icon fallback (jade gradient) + <img> onError fallback (never a broken image).
- ROOT-CAUSE FIX for "No offers available": offers.image_url column does NOT exist. Network offers store their image URL in the existing `icon` column; manual offers store a lucide keyword. Now image_url is derived via imageUrlFromIcon(icon) = icon when it matches ^https?://, else null. The earlier attempt selecting a nonexistent image_url column errored the whole PostgREST query -> empty feed.
- No claim-pending UX: removed the In review / Approved / Rejected status label and the in-card Claim button. Whole <li> is clickable (role=button + keyboard) and opens OfferDetailsDialog (single CTA lives only in the dialog).
- Completion auto-hide: server-side in getFeaturedFeedImpl/assembleFeaturedImpl via filterCompletedOffers(userId) — hides only offers with offer_claims.status='approved' (rejected/pending stay visible). getFeaturedFeed passes context.userId.
- Redesign: compact 3-col cards, image top, tag pills overlaid (OfferTagRow higher-contrast + bigger touch target), title 1 line, description 1 line, prominent gold payout at bottom, corner chevron affordance (carries featured-offer-claim-<id>). Skeleton updated to match (aspect-[3/4] rounded).
- data-testids preserved: featured-offers-list, featured-offers-loading, featured-offer-<id>, featured-offer-claim-<id>.

Out of scope / pre-existing (NOT fixed, flagged by testing agent):
- Recursive RLS policy on public.offers (42P17) breaks client-side offers queries (Featured feed unaffected — uses service role).
- Client query selects user_tasks.target (column missing, 400).
- OnboardingTour overlay intercepts card clicks on first visit (by design).

Env note: app runs via supervisor program `lovableapp` (/app/run_dev.sh -> bun --bun vite dev :3000). Recreated the supervisor conf + reinstalled bun after pod reset.

---
## Offers RLS recursion + real image_url column — 2026-06 (verified, testing agent 100%; backend 7/7)
User-reported follow-ups (both DB migrations, applied by user via Supabase SQL editor since this pod only has the service-role/PostgREST key — no DDL access):

1. RLS recursion (Postgres 42P17): public.offers had multiple SELECT-applicable policies; one ("offers readable" from 20261115) sub-queried offers inside its own USING clause -> infinite recursion -> every authenticated client read of offers returned 500 (broke SectionBanner's client offers-count query; FeaturedOffers feed was unaffected since it uses the service role). FIX: dropped ALL offers policies and created a single recursion-proof SELECT policy: USING (is_active = true AND (expires_at IS NULL OR expires_at > now())). Writes go through server functions on the service role, so no authenticated write policy needed. Limited-deal one-time rule still enforced at claim time (coinquest.server.ts) and visually in the feed (feed-cache.server.ts filterUserHiddenOffers: hides approved claims + limited-deal siblings).
2. Real image_url column: added offers.image_url + backfilled from icon where icon is an http(s) URL. feed-cache.server.ts detects the column (offersHasImageUrl), reads it with icon fallback (pickImageUrl), and future network syncs write image_url too.

Migration file: supabase/migrations/20261205000000_offers_image_url_and_rls_recursion_fix.sql
Backend regression test added by testing agent: /app/backend/tests/test_offers_rls_image_url.py

Still-open, OUT OF SCOPE (not requested): client query selecting user_tasks.target (column missing -> 42703 on SectionBanner); SectionBanner queries swallow PostgREST errors (masked these bugs); OnboardingTour overlay intercepts first-visit card clicks.

---
## SectionHeading visual polish — 2026-06
Visual-only restyle of shared SectionHeading.tsx (used app-wide: home/offers/featured/offerwall/tasks). No layout/spacing/structure change.
- Title color: text-foreground -> text-primary (brand jade); font-display kept.
- Underline: faint mint/40 -> mint→gold gradient stroke (id sh-underline-<slug>), strokeWidth 3.5, full opacity, taller (h-2.5).
- Sparkle: size-4, text-gold-dark + drop-shadow, gentle shimmer (@keyframes sh-sparkle 2.4s) with prefers-reduced-motion guard (styles.css).
- Heading accent (gradient brush + shimmer sparkle) reserved to headings only, distinct from tags/buttons/payout.
