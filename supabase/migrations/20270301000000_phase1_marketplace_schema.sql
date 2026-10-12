-- =============================================================================
-- PHASE 1 — Advertiser marketplace: schema + money-moving functions
-- =============================================================================
-- Implements plan §2.2–§2.3 as amended by addendum v2 (D5, D12, D13, Q1–Q4).
-- FOR REVIEW. Nothing in the app calls these yet; Phase 2+ wires them up.
--
-- Tables (15)
--   Settings ........ marketplace_settings, referral_settings
--   Advertisers ..... advertiser_accounts, advertiser_deposits, advertiser_ledger,
--                     advertiser_deposit_bonuses
--   Campaigns ....... campaign_types, campaigns, campaign_budget_tranches,
--                     campaign_secrets
--   Publisher side .. campaign_clicks, campaign_submissions, campaign_conversions,
--                     publisher_earning_holds
--   Anti-fraud ...... account_ip_observations
--
-- Access model
--   * Clients (anon/authenticated) get NO privileges on any marketplace table,
--     except SELECT on campaign_types / marketplace_settings / referral_settings.
--     Every read goes through server functions that return safe projections
--     (publisher identity masked for advertisers, no secrets, no budget internals).
--   * Every money-bearing write goes through the mkt_* functions below. Guard
--     triggers enforce that even for service_role: money columns, statuses and
--     the function-only tables can only change while a mkt_* function has set
--     the transaction-local flag cashgpt.mkt_money_write = 'on'.
--   * Functions are SECURITY INVOKER, SET search_path = '', EXECUTE for
--     service_role only (same conventions as Phase 0).
--   * The money-write flag is scoped to ONE TOP-LEVEL STATEMENT, i.e. one
--     PostgREST / supabase-js .rpc() call. Server code must never call mkt_*
--     functions inside a multi-statement transaction on a direct connection —
--     see the warning in §6 before changing how the server talks to Postgres.
--
-- Money model
--   * USD numeric(12,2), same as the publisher wallet.
--   * Advertiser balance has three buckets: deposit_balance (own money, spent
--     first), bonus_locked (first-deposit bonus not yet spendable),
--     bonus_available. advertiser_ledger has one row per bucket movement;
--     invariant: SUM(delta) per (advertiser, bucket) = that bucket's balance.
--   * Campaign budget lives in tranches. Each allocation creates one tranche per
--     funding source (deposit / bonus), priced at allocation time by the DB
--     clock: fee 0 while now() < promo_ends_at, else platform_fee_percent.
--     cost_per_completion = ceil_to_cent(publisher_reward / (1 - fee)).
--     publisher_reward is fixed per campaign. Tranches are consumed in
--     allocation order; between tranches allocated at the same moment, deposit
--     before bonus. Releasing budget (pause/end/reject) and allocating it again
--     re-prices it — that is the Q2 rule.
--   * A first-deposit bonus voided by a deposit reversal never becomes spendable
--     again. Bonus-funded budget still sitting in a campaign when the bonus is
--     voided is FORFEITED the moment that campaign releases it (pause / end /
--     reject / appeal denied): ledger kind bonus_forfeit with delta 0, tallied
--     in advertiser_deposit_bonuses.forfeited_amount, nothing re-credited to
--     any bucket. Giving money back after that is an explicit admin action
--     (mkt_adjust_advertiser_balance), never a state transition.
--   * Invariants enforced by CHECK constraints:
--       tranche:  amount_allocated = cost × completions_allocated
--                 amount_allocated = remaining + reserved + spent + released
--       campaign: budget_allocated = remaining + reserved + spent + released
--                 (kept equal to the sum of its tranches by every function)
--
-- Lock order (prevents deadlocks; every function takes a prefix of this):
--   advertiser_accounts → advertiser_deposits → campaigns → campaign_clicks →
--   campaign_submissions / campaign_conversions → advertiser_deposit_bonuses →
--   publisher_earning_holds → profiles (via wallet_apply)
--   Tranches are only touched while their campaign row is locked.
--
-- Deviations from the addendum, flagged for review:
--   * Deposit reversal moves the advertiser's held bonus-funded publisher
--     earnings to admin REVIEW instead of voiding them (honest publishers did
--     the work; admin decides).
--   * promo_ends_at defaults to NULL = promo not active. Set it at launch
--     (launch + 1 year); until then campaigns are priced at the full fee and no
--     first-deposit bonus is granted.
--   * Content edits are only allowed while a campaign is draft / rejected /
--     paused. Editing a paused campaign marks it needs_review, so resuming it
--     goes to pending_review instead of active (§13 enforced by the DB).
--   * Money rows never cascade-delete with auth.users (ON DELETE RESTRICT):
--     financial records outlive the account; deletion needs anonymisation.
--
-- New env vars needed later (not used by this migration):
--   RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET,
--   MARKETPLACE_CRON_SECRET, MARKETPLACE_IP_PEPPER (IPs are stored as
--   sha256(pepper || ip), computed in the app).
--
-- Requires Phase 0 (public.wallet_apply). Additive only; touches no existing
-- table except one new partial unique index on wallet_transactions.
-- Safe to re-run. Apply in the Supabase SQL editor.
-- =============================================================================


-- =============================================================================
-- 1. SETTINGS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.marketplace_settings (
  id                            boolean PRIMARY KEY DEFAULT true CHECK (id),
  deposits_enabled              boolean       NOT NULL DEFAULT false,
  manual_deposits_enabled       boolean       NOT NULL DEFAULT false,
  min_deposit_usd               numeric(10,2) NOT NULL DEFAULT 10   CHECK (min_deposit_usd > 0),
  max_deposit_usd               numeric(10,2) NOT NULL DEFAULT 1000 CHECK (max_deposit_usd > 0),
  inr_per_usd                   numeric(10,4)          CHECK (inr_per_usd IS NULL OR inr_per_usd > 0),
  platform_fee_percent          numeric(5,2)  NOT NULL DEFAULT 20   CHECK (platform_fee_percent >= 0 AND platform_fee_percent <= 90),
  -- D12 + D13: one date governs the 0% fee and the first-deposit bonus.
  -- NULL = no promo running.
  promo_ends_at                 timestamptz,
  first_deposit_bonus_percent   numeric(5,2)  NOT NULL DEFAULT 100  CHECK (first_deposit_bonus_percent BETWEEN 0 AND 100),
  referral_bonus_split_percent  numeric(5,2)  NOT NULL DEFAULT 50   CHECK (referral_bonus_split_percent BETWEEN 0 AND 100),
  referrer_bonus_hold_days      integer       NOT NULL DEFAULT 14   CHECK (referrer_bonus_hold_days BETWEEN 0 AND 365),
  -- Q4 safeguards.
  bonus_earnings_hold_days      integer       NOT NULL DEFAULT 14   CHECK (bonus_earnings_hold_days BETWEEN 0 AND 365),
  bonus_min_publisher_age_days  integer       NOT NULL DEFAULT 7    CHECK (bonus_min_publisher_age_days BETWEEN 0 AND 365),
  ip_link_window_days           integer       NOT NULL DEFAULT 30   CHECK (ip_link_window_days BETWEEN 1 AND 365),
  -- Pricing / review.
  min_publisher_reward          numeric(10,2) NOT NULL DEFAULT 0.05 CHECK (min_publisher_reward > 0),
  auto_approve_after_hours      integer                DEFAULT 72   CHECK (auto_approve_after_hours IS NULL OR auto_approve_after_hours BETWEEN 1 AND 720),
  appeal_window_hours           integer       NOT NULL DEFAULT 72   CHECK (appeal_window_hours BETWEEN 1 AND 720),
  default_slot_minutes          integer       NOT NULL DEFAULT 60   CHECK (default_slot_minutes BETWEEN 5 AND 1440),
  default_attribution_hours     integer       NOT NULL DEFAULT 72   CHECK (default_attribution_hours BETWEEN 1 AND 720),
  -- D5 + Q3.
  rejection_flag_percent        numeric(5,2)  NOT NULL DEFAULT 80   CHECK (rejection_flag_percent > 0 AND rejection_flag_percent <= 100),
  rejection_flag_min_decisions  integer       NOT NULL DEFAULT 20   CHECK (rejection_flag_min_decisions >= 1),
  terms_version                 text          NOT NULL DEFAULT 'v1',
  updated_at                    timestamptz   NOT NULL DEFAULT now(),
  CONSTRAINT marketplace_settings_deposit_range CHECK (max_deposit_usd >= min_deposit_usd)
);
INSERT INTO public.marketplace_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

-- Publisher referral milestone amounts (wired up in Phase 7, D9). Defaults equal
-- today's constants in src/lib/coinquest.ts, so nothing changes until edited.
CREATE TABLE IF NOT EXISTS public.referral_settings (
  id                          boolean PRIMARY KEY DEFAULT true CHECK (id),
  pub_signup_bonus            numeric(10,2) NOT NULL DEFAULT 1   CHECK (pub_signup_bonus >= 0),
  pub_first_earning_bonus     numeric(10,2) NOT NULL DEFAULT 1   CHECK (pub_first_earning_bonus >= 0),
  pub_first_withdrawal_bonus  numeric(10,2) NOT NULL DEFAULT 1   CHECK (pub_first_withdrawal_bonus >= 0),
  pub_window_days             integer       NOT NULL DEFAULT 365 CHECK (pub_window_days BETWEEN 1 AND 3650),
  updated_at                  timestamptz   NOT NULL DEFAULT now()
);
INSERT INTO public.referral_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- 2. ADVERTISERS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.advertiser_accounts (
  user_id             uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
  display_name        text NOT NULL CHECK (char_length(btrim(display_name)) BETWEEN 2 AND 60),
  contact_email       text CHECK (contact_email IS NULL OR char_length(contact_email) <= 254),
  website_url         text CHECK (website_url IS NULL OR website_url ~ '^https?://'),
  status              text NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active', 'restricted', 'suspended')),
  status_reason       text,
  -- Balance buckets (§3.2). Function-only.
  deposit_balance     numeric(12,2) NOT NULL DEFAULT 0 CHECK (deposit_balance >= 0),
  bonus_locked        numeric(12,2) NOT NULL DEFAULT 0 CHECK (bonus_locked >= 0),
  bonus_available     numeric(12,2) NOT NULL DEFAULT 0 CHECK (bonus_available >= 0),
  lifetime_deposited  numeric(12,2) NOT NULL DEFAULT 0 CHECK (lifetime_deposited >= 0),
  lifetime_bonus      numeric(12,2) NOT NULL DEFAULT 0 CHECK (lifetime_bonus >= 0),
  lifetime_spent      numeric(12,2) NOT NULL DEFAULT 0 CHECK (lifetime_spent >= 0),
  -- D5 rejection-rate flag (§3.5). Function-only.
  flagged_for_review  boolean NOT NULL DEFAULT false,
  flag_reason         text,
  flagged_at          timestamptz,
  flag_cleared_by     uuid,
  flag_cleared_at     timestamptz,
  terms_version       text NOT NULL,
  terms_accepted_at   timestamptz NOT NULL DEFAULT now(),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.advertiser_deposits (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id       uuid NOT NULL REFERENCES public.advertiser_accounts(user_id) ON DELETE RESTRICT,
  amount_usd          numeric(12,2) NOT NULL CHECK (amount_usd > 0),
  gateway             text NOT NULL CHECK (gateway IN ('razorpay', 'manual')),
  charge_currency     text NOT NULL DEFAULT 'USD' CHECK (charge_currency ~ '^[A-Z]{3}$'),
  charge_amount       numeric(14,2) NOT NULL CHECK (charge_amount > 0),
  fx_rate             numeric(14,6) NOT NULL DEFAULT 1 CHECK (fx_rate > 0),
  gateway_order_id    text UNIQUE,
  gateway_payment_id  text UNIQUE,
  status              text NOT NULL DEFAULT 'created'
                      CHECK (status IN ('created', 'pending', 'succeeded', 'failed', 'reversed')),
  failure_reason      text,
  reversed_amount     numeric(12,2) NOT NULL DEFAULT 0 CHECK (reversed_amount >= 0),
  -- Part of a reversal that could not be debited because it was already spent.
  reversal_shortfall  numeric(12,2) NOT NULL DEFAULT 0 CHECK (reversal_shortfall >= 0),
  terms_version       text NOT NULL,
  confirmed_by        uuid,            -- admin, manual deposits only
  credited_at         timestamptz,
  reversed_at         timestamptz,
  last_event          jsonb,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT advertiser_deposits_reversal_range CHECK (reversed_amount <= amount_usd)
);
CREATE INDEX IF NOT EXISTS advertiser_deposits_advertiser_idx
  ON public.advertiser_deposits (advertiser_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.advertiser_ledger (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id    uuid NOT NULL REFERENCES public.advertiser_accounts(user_id) ON DELETE RESTRICT,
  kind             text NOT NULL CHECK (kind IN (
                     'deposit', 'deposit_reversal',
                     'first_deposit_bonus', 'first_deposit_bonus_reversal', 'bonus_unlock',
                     'bonus_forfeit',
                     'campaign_allocation', 'campaign_release', 'conversion_charge',
                     'adjustment')),
  bucket           text NOT NULL CHECK (bucket IN ('deposit', 'bonus_locked', 'bonus_available')),
  amount           numeric(12,2) NOT NULL CHECK (amount >= 0),   -- display magnitude
  delta            numeric(12,2) NOT NULL,                       -- signed effect on the bucket
  balance_after    numeric(12,2) NOT NULL,                       -- bucket balance after this row
  campaign_id      uuid,
  tranche_id       uuid,
  reference_type   text,
  reference_id     uuid,
  description      text NOT NULL DEFAULT '',
  idempotency_key  text NOT NULL UNIQUE,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS advertiser_ledger_advertiser_idx
  ON public.advertiser_ledger (advertiser_id, created_at DESC);
CREATE INDEX IF NOT EXISTS advertiser_ledger_campaign_idx
  ON public.advertiser_ledger (campaign_id) WHERE campaign_id IS NOT NULL;


-- =============================================================================
-- 3. CAMPAIGNS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.campaign_types (
  key                   text PRIMARY KEY CHECK (key ~ '^[a-z][a-z0-9_]{1,39}$'),
  label                 text NOT NULL,
  description           text NOT NULL DEFAULT '',
  icon                  text,
  allowed_verification  text[] NOT NULL DEFAULT '{manual_proof,auto}'
                        CHECK (cardinality(allowed_verification) >= 1
                               AND allowed_verification <@ ARRAY['manual_proof', 'auto']::text[]),
  is_active             boolean NOT NULL DEFAULT true,
  sort_order            integer NOT NULL DEFAULT 0,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.campaign_types (key, label, description, icon, sort_order) VALUES
  ('app_install',    'App install',    'Install an app from the store.',                     'download',     10),
  ('app_signup',     'App signup',     'Create an account inside an app.',                   'user-plus',    20),
  ('website_signup', 'Website signup', 'Create an account on a website.',                    'globe',        30),
  ('lead_form',      'Lead form',      'Fill in a short form.',                              'clipboard',    40),
  ('website_visit',  'Website visit',  'Visit a page and stay for a while.',                 'mouse-pointer',50),
  ('app_download',   'App download',   'Download a file or app.',                            'arrow-down',   60),
  ('registration',   'Registration',   'Register for an event, newsletter or service.',      'badge-check',  70),
  ('first_action',   'First action',   'Complete a first in-app action (level, upload...).', 'zap',          80),
  ('purchase',       'Purchase',       'Make a qualifying purchase.',                        'shopping-bag', 90),
  ('custom',         'Custom',         'Anything else, described by the advertiser.',        'sparkles',     100)
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.campaigns (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id            uuid NOT NULL REFERENCES public.advertiser_accounts(user_id) ON DELETE RESTRICT,
  type_key                 text NOT NULL REFERENCES public.campaign_types(key) ON DELETE RESTRICT,
  -- Content (editable by the app while draft / rejected / paused).
  name                     text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 3 AND 80),
  summary                  text NOT NULL DEFAULT '' CHECK (char_length(summary) <= 140),
  description              text NOT NULL DEFAULT '' CHECK (char_length(description) <= 4000),
  steps                    jsonb NOT NULL DEFAULT '[]'::jsonb
                           CHECK (jsonb_typeof(steps) = 'array' AND jsonb_array_length(steps) <= 15),
  rules                    text[] NOT NULL DEFAULT '{}' CHECK (cardinality(rules) <= 15),
  completion_requirements  text CHECK (completion_requirements IS NULL OR char_length(completion_requirements) <= 2000),
  estimated_minutes        integer CHECK (estimated_minutes IS NULL OR estimated_minutes BETWEEN 1 AND 1440),
  icon_url                 text CHECK (icon_url IS NULL OR icon_url ~ '^https://'),
  landing_url              text NOT NULL CHECK (landing_url ~ '^https://' AND char_length(landing_url) <= 2048),
  -- Auto campaigns: advertiser's link with a {click_id} macro; NULL = append to landing_url.
  tracking_url             text CHECK (tracking_url IS NULL OR (tracking_url ~ '^https://' AND char_length(tracking_url) <= 2048)),
  verification_mode        text NOT NULL CHECK (verification_mode IN ('manual_proof', 'auto')),
  proof_description        text CHECK (proof_description IS NULL OR char_length(proof_description) <= 2000),
  proof_min_images         integer NOT NULL DEFAULT 1 CHECK (proof_min_images BETWEEN 0 AND 5),
  proof_max_images         integer NOT NULL DEFAULT 3 CHECK (proof_max_images BETWEEN 1 AND 5),
  -- [{ "key": "username", "label": "Username you used", "required": true, "max_len": 80 }]
  proof_fields             jsonb NOT NULL DEFAULT '[]'::jsonb
                           CHECK (jsonb_typeof(proof_fields) = 'array' AND jsonb_array_length(proof_fields) <= 5),
  -- Auto conversions faster than this after Start are held for review.
  min_seconds_to_convert   integer NOT NULL DEFAULT 0 CHECK (min_seconds_to_convert BETWEEN 0 AND 86400),
  countries                text[] NOT NULL DEFAULT '{}',   -- empty = all (same as offers)
  devices                  text[] NOT NULL DEFAULT '{}'
                           CHECK (devices <@ ARRAY['android', 'ios', 'desktop']::text[]),
  min_age                  integer CHECK (min_age IS NULL OR min_age BETWEEN 13 AND 100),
  eligibility_notes        text CHECK (eligibility_notes IS NULL OR char_length(eligibility_notes) <= 1000),
  slot_minutes             integer NOT NULL DEFAULT 60 CHECK (slot_minutes BETWEEN 5 AND 1440),
  attribution_hours        integer NOT NULL DEFAULT 72 CHECK (attribution_hours BETWEEN 1 AND 720),
  starts_at                timestamptz,
  ends_at                  timestamptz,
  -- Pricing. publisher_reward is fixed once submitted; the cost/fee columns
  -- mirror the newest tranche for display only (money reads tranches).
  publisher_reward         numeric(10,2) NOT NULL CHECK (publisher_reward > 0),
  advertiser_cost          numeric(10,2),
  fee_percent              numeric(5,2),
  max_completions          integer NOT NULL CHECK (max_completions > 0),
  completions_count        integer NOT NULL DEFAULT 0 CHECK (completions_count >= 0),
  per_user_limit           integer NOT NULL DEFAULT 1 CHECK (per_user_limit = 1),
  -- Budget aggregates = sum over this campaign's tranches. Function-only.
  budget_allocated         numeric(12,2) NOT NULL DEFAULT 0 CHECK (budget_allocated >= 0),
  budget_remaining         numeric(12,2) NOT NULL DEFAULT 0 CHECK (budget_remaining >= 0),
  budget_reserved          numeric(12,2) NOT NULL DEFAULT 0 CHECK (budget_reserved >= 0),
  budget_spent             numeric(12,2) NOT NULL DEFAULT 0 CHECK (budget_spent >= 0),
  budget_released          numeric(12,2) NOT NULL DEFAULT 0 CHECK (budget_released >= 0),
  -- Lifecycle. Function-only.
  status                   text NOT NULL DEFAULT 'draft' CHECK (status IN (
                             'draft', 'pending_review', 'active', 'paused',
                             'budget_exhausted', 'completed', 'rejected', 'archived')),
  paused_by                text CHECK (paused_by IS NULL OR paused_by IN ('advertiser', 'admin', 'system')),
  needs_review             boolean NOT NULL DEFAULT false,
  review_note              text,
  reviewed_by              uuid,
  reviewed_at              timestamptz,
  submitted_at             timestamptz,
  activated_at             timestamptz,
  ended_at                 timestamptz,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT campaigns_budget_invariant
    CHECK (budget_allocated = budget_remaining + budget_reserved + budget_spent + budget_released),
  CONSTRAINT campaigns_completions_cap CHECK (completions_count <= max_completions),
  CONSTRAINT campaigns_proof_range CHECK (proof_min_images <= proof_max_images),
  CONSTRAINT campaigns_window CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);
CREATE INDEX IF NOT EXISTS campaigns_status_idx ON public.campaigns (status);
CREATE INDEX IF NOT EXISTS campaigns_advertiser_idx ON public.campaigns (advertiser_id, status);

CREATE TABLE IF NOT EXISTS public.campaign_budget_tranches (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id            uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE RESTRICT,
  advertiser_id          uuid NOT NULL REFERENCES public.advertiser_accounts(user_id) ON DELETE RESTRICT,
  funding                text NOT NULL CHECK (funding IN ('deposit', 'bonus')),
  fee_percent            numeric(5,2)  NOT NULL CHECK (fee_percent >= 0 AND fee_percent <= 90),
  cost_per_completion    numeric(10,2) NOT NULL CHECK (cost_per_completion > 0),
  publisher_reward       numeric(10,2) NOT NULL CHECK (publisher_reward > 0),
  completions_allocated  integer NOT NULL CHECK (completions_allocated > 0),
  amount_allocated       numeric(12,2) NOT NULL CHECK (amount_allocated > 0),
  remaining              numeric(12,2) NOT NULL DEFAULT 0 CHECK (remaining >= 0),
  reserved               numeric(12,2) NOT NULL DEFAULT 0 CHECK (reserved >= 0),
  spent                  numeric(12,2) NOT NULL DEFAULT 0 CHECK (spent >= 0),
  released               numeric(12,2) NOT NULL DEFAULT 0 CHECK (released >= 0),
  allocated_at           timestamptz NOT NULL DEFAULT now(),
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tranches_reward_le_cost CHECK (publisher_reward <= cost_per_completion),
  CONSTRAINT tranches_exact_amount CHECK (amount_allocated = cost_per_completion * completions_allocated),
  CONSTRAINT tranches_invariant CHECK (amount_allocated = remaining + reserved + spent + released)
);
CREATE INDEX IF NOT EXISTS campaign_budget_tranches_order_idx
  ON public.campaign_budget_tranches (campaign_id, allocated_at, funding);

-- Postback credentials. Never readable by any client role.
CREATE TABLE IF NOT EXISTS public.campaign_secrets (
  campaign_id   uuid PRIMARY KEY REFERENCES public.campaigns(id) ON DELETE CASCADE,
  auth_mode     text NOT NULL DEFAULT 'hmac' CHECK (auth_mode IN ('hmac', 'token')),
  secret        text NOT NULL CHECK (char_length(secret) >= 32),
  ip_allowlist  text[] NOT NULL DEFAULT '{}',
  rotated_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);


-- =============================================================================
-- 4. PUBLISHER SIDE
-- =============================================================================

-- One row per Start Task (both verification modes).
CREATE TABLE IF NOT EXISTS public.campaign_clicks (
  click_id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id         uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE RESTRICT,
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  status              text NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active', 'submitted', 'converted', 'expired', 'closed')),
  -- Manual-proof slots reserve one completion's cost from a tranche at Start.
  tranche_id          uuid REFERENCES public.campaign_budget_tranches(id) ON DELETE RESTRICT,
  reserved_amount     numeric(10,2) NOT NULL DEFAULT 0 CHECK (reserved_amount >= 0),
  reservation_status  text NOT NULL DEFAULT 'none'
                      CHECK (reservation_status IN ('none', 'held', 'spent', 'released')),
  -- 'weak' (shared IP) completions need an admin decision. 'strong' links never get a click.
  link_level          text NOT NULL DEFAULT 'none' CHECK (link_level IN ('none', 'weak')),
  expires_at          timestamptz NOT NULL,
  country             text,
  device              text,
  ip_hash             text,
  user_agent          text CHECK (user_agent IS NULL OR char_length(user_agent) <= 512),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
-- One attempt per user per campaign (an expired, never-submitted slot can be retried).
CREATE UNIQUE INDEX IF NOT EXISTS campaign_clicks_one_attempt
  ON public.campaign_clicks (campaign_id, user_id) WHERE status <> 'expired';
CREATE INDEX IF NOT EXISTS campaign_clicks_campaign_idx ON public.campaign_clicks (campaign_id, status);
CREATE INDEX IF NOT EXISTS campaign_clicks_expiry_idx ON public.campaign_clicks (expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS campaign_clicks_user_idx ON public.campaign_clicks (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.campaign_submissions (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id             uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE RESTRICT,
  click_id                uuid NOT NULL UNIQUE REFERENCES public.campaign_clicks(click_id) ON DELETE RESTRICT,
  user_id                 uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  proof_paths             text[] NOT NULL DEFAULT '{}' CHECK (cardinality(proof_paths) <= 5),
  field_values            jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(field_values) = 'object'),
  user_note               text CHECK (user_note IS NULL OR char_length(user_note) <= 1000),
  status                  text NOT NULL DEFAULT 'pending' CHECK (status IN (
                            'pending', 'approved', 'rejected', 'rejection_held',
                            'appealed', 'appeal_approved', 'appeal_rejected')),
  -- Admin must decide (weak link / flagged publisher); advertiser can't.
  requires_admin          boolean NOT NULL DEFAULT false,
  flag_reason             text,
  -- Pricing snapshot from the reserved tranche.
  tranche_id              uuid NOT NULL REFERENCES public.campaign_budget_tranches(id) ON DELETE RESTRICT,
  funding                 text NOT NULL CHECK (funding IN ('deposit', 'bonus')),
  charge_amount           numeric(10,2) NOT NULL CHECK (charge_amount > 0),
  reward_amount           numeric(10,2) NOT NULL CHECK (reward_amount > 0),
  fee_amount              numeric(10,2) NOT NULL CHECK (fee_amount >= 0),
  bonus_unlocked          numeric(10,2) NOT NULL DEFAULT 0 CHECK (bonus_unlocked >= 0),
  -- Review.
  reviewed_by             uuid,
  reviewer_role           text CHECK (reviewer_role IS NULL OR reviewer_role IN ('advertiser', 'admin', 'system')),
  reviewed_at             timestamptz,
  rejection_reason        text,
  rejection_confirmed_by  uuid,
  rejection_confirmed_at  timestamptz,
  overturned_by           uuid,     -- Q3: admin overturned a held rejection
  overturned_at           timestamptz,
  auto_approve_at         timestamptz,
  -- Appeal (one per submission, admin decides).
  appeal_text             text,
  appealed_at             timestamptz,
  appeal_deadline         timestamptz,
  appeal_resolved_by      uuid,
  appeal_resolved_at      timestamptz,
  appeal_note             text,
  -- Payout.
  paid_at                 timestamptz,
  wallet_transaction_id   uuid,
  earning_hold_id         uuid,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT campaign_submissions_one_per_user UNIQUE (campaign_id, user_id),
  CONSTRAINT campaign_submissions_reason_required CHECK (
    status NOT IN ('rejected', 'rejection_held', 'appealed', 'appeal_rejected')
    OR char_length(btrim(COALESCE(rejection_reason, ''))) >= 10),
  CONSTRAINT campaign_submissions_appeal_text_required CHECK (
    status NOT IN ('appealed', 'appeal_approved', 'appeal_rejected')
    OR char_length(btrim(COALESCE(appeal_text, ''))) >= 20),
  CONSTRAINT campaign_submissions_appeal_note_required CHECK (
    status NOT IN ('appeal_approved', 'appeal_rejected')
    OR char_length(btrim(COALESCE(appeal_note, ''))) >= 10)
);
CREATE INDEX IF NOT EXISTS campaign_submissions_queue_idx ON public.campaign_submissions (campaign_id, status);
CREATE INDEX IF NOT EXISTS campaign_submissions_user_idx ON public.campaign_submissions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS campaign_submissions_auto_approve_idx
  ON public.campaign_submissions (auto_approve_at) WHERE status = 'pending' AND auto_approve_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS campaign_submissions_appeal_deadline_idx
  ON public.campaign_submissions (appeal_deadline) WHERE status = 'rejected';

CREATE TABLE IF NOT EXISTS public.campaign_conversions (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id            uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE RESTRICT,
  click_id               uuid NOT NULL UNIQUE REFERENCES public.campaign_clicks(click_id) ON DELETE RESTRICT,
  user_id                uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  external_txn_id        text NOT NULL CHECK (char_length(external_txn_id) BETWEEN 1 AND 200),
  status                 text NOT NULL CHECK (status IN (
                           'credited', 'held_for_review', 'budget_exhausted', 'rejected', 'reversed')),
  hold_reason            text,
  -- Held conversions reserve their cost so budget can't be oversold during review.
  tranche_id             uuid REFERENCES public.campaign_budget_tranches(id) ON DELETE RESTRICT,
  reservation_status     text NOT NULL DEFAULT 'none'
                         CHECK (reservation_status IN ('none', 'held', 'spent', 'released')),
  funding                text CHECK (funding IS NULL OR funding IN ('deposit', 'bonus')),
  charge_amount          numeric(10,2) NOT NULL DEFAULT 0 CHECK (charge_amount >= 0),
  reward_amount          numeric(10,2) NOT NULL DEFAULT 0 CHECK (reward_amount >= 0),
  fee_amount             numeric(10,2) NOT NULL DEFAULT 0 CHECK (fee_amount >= 0),
  bonus_unlocked         numeric(10,2) NOT NULL DEFAULT 0 CHECK (bonus_unlocked >= 0),
  signature_valid        boolean,
  source_ip_hash         text,
  raw_payload            jsonb NOT NULL DEFAULT '{}'::jsonb,
  reviewed_by            uuid,
  review_note            text,
  reviewed_at            timestamptz,
  paid_at                timestamptz,
  wallet_transaction_id  uuid,
  earning_hold_id        uuid,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT campaign_conversions_txn_unique UNIQUE (campaign_id, external_txn_id)
);
CREATE INDEX IF NOT EXISTS campaign_conversions_queue_idx ON public.campaign_conversions (campaign_id, status);
CREATE INDEX IF NOT EXISTS campaign_conversions_user_idx ON public.campaign_conversions (user_id, created_at DESC);

-- D12 + Q1: first-deposit bonus (replaces advertiser_referral_rewards).
CREATE TABLE IF NOT EXISTS public.advertiser_deposit_bonuses (
  id                              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deposit_id                      uuid NOT NULL UNIQUE REFERENCES public.advertiser_deposits(id) ON DELETE RESTRICT,
  -- UNIQUE: first deposit only, enforced by the database.
  advertiser_id                   uuid NOT NULL UNIQUE REFERENCES public.advertiser_accounts(user_id) ON DELETE RESTRICT,
  referral_id                     uuid REFERENCES public.referrals(id) ON DELETE RESTRICT,
  referrer_id                     uuid,
  deposit_amount                  numeric(12,2) NOT NULL CHECK (deposit_amount > 0),
  advertiser_bonus                numeric(12,2) NOT NULL CHECK (advertiser_bonus >= 0),
  referrer_bonus                  numeric(12,2) NOT NULL DEFAULT 0 CHECK (referrer_bonus >= 0),
  -- Bonus unlocked per $1 of deposit-funded spend: 1.0 organic, 0.5 referred (at defaults).
  unlock_ratio                    numeric(8,6) NOT NULL CHECK (unlock_ratio >= 0 AND unlock_ratio <= 1),
  bonus_unlocked                  numeric(12,2) NOT NULL DEFAULT 0 CHECK (bonus_unlocked >= 0),
  -- Bonus-funded campaign budget released AFTER this bonus was voided (deposit
  -- reversed). Forfeited, never re-credited; kept so admins can see the amount.
  forfeited_amount                numeric(12,2) NOT NULL DEFAULT 0 CHECK (forfeited_amount >= 0),
  advertiser_status               text NOT NULL DEFAULT 'locked'
                                  CHECK (advertiser_status IN ('locked', 'unlocking', 'unlocked', 'void')),
  referrer_status                 text CHECK (referrer_status IS NULL OR referrer_status IN ('held', 'review', 'credited', 'void')),
  referrer_release_at             timestamptz,
  referrer_review_reason          text,
  referrer_reviewed_by            uuid,
  referrer_wallet_transaction_id  uuid,
  referrer_credited_at            timestamptz,
  -- Set when a deposit reversal lands after the referrer share was already paid.
  referrer_clawback_needed        boolean NOT NULL DEFAULT false,
  promo_ends_at_snapshot          timestamptz,
  void_reason                     text,
  created_at                      timestamptz NOT NULL DEFAULT now(),
  updated_at                      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bonuses_unlock_cap CHECK (bonus_unlocked <= advertiser_bonus),
  CONSTRAINT bonuses_referrer_consistency CHECK (referrer_status IS NULL OR referrer_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS advertiser_deposit_bonuses_referrer_due_idx
  ON public.advertiser_deposit_bonuses (referrer_release_at) WHERE referrer_status = 'held';
CREATE INDEX IF NOT EXISTS advertiser_deposit_bonuses_referrer_idx
  ON public.advertiser_deposit_bonuses (referrer_id) WHERE referrer_id IS NOT NULL;

-- Q4 C: the bonus-funded share of a publisher's reward waits here.
CREATE TABLE IF NOT EXISTS public.publisher_earning_holds (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  source_type            text NOT NULL CHECK (source_type IN ('submission', 'conversion')),
  source_id              uuid NOT NULL,
  campaign_id            uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE RESTRICT,
  advertiser_id          uuid NOT NULL REFERENCES public.advertiser_accounts(user_id) ON DELETE RESTRICT,
  amount                 numeric(10,2) NOT NULL CHECK (amount > 0),
  release_at             timestamptz NOT NULL,
  status                 text NOT NULL DEFAULT 'held' CHECK (status IN ('held', 'review', 'released', 'void')),
  review_reason          text,
  void_reason            text,
  reviewed_by            uuid,
  reviewed_at            timestamptz,
  released_at            timestamptz,
  wallet_transaction_id  uuid,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT publisher_earning_holds_one_per_source UNIQUE (source_type, source_id)
);
CREATE INDEX IF NOT EXISTS publisher_earning_holds_due_idx
  ON public.publisher_earning_holds (release_at) WHERE status = 'held';
CREATE INDEX IF NOT EXISTS publisher_earning_holds_user_idx
  ON public.publisher_earning_holds (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS publisher_earning_holds_advertiser_idx
  ON public.publisher_earning_holds (advertiser_id, status);

-- Q4 A: hashed IPs seen per account (weak-link signal). Written by the server.
CREATE TABLE IF NOT EXISTS public.account_ip_observations (
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_hash        text NOT NULL CHECK (char_length(ip_hash) BETWEEN 32 AND 128),
  first_seen_at  timestamptz NOT NULL DEFAULT now(),
  last_seen_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, ip_hash)
);
CREATE INDEX IF NOT EXISTS account_ip_observations_ip_idx
  ON public.account_ip_observations (ip_hash, last_seen_at DESC);

-- Publisher wallet: microtask payouts and referrer bonuses credit at most once
-- per reference (same backstop as Phase 0's wallet_transactions_credit_once).
CREATE UNIQUE INDEX IF NOT EXISTS wallet_transactions_credit_once_marketplace
  ON public.wallet_transactions (user_id, source, kind, reference_id)
  WHERE reference_id IS NOT NULL
    AND status = 'completed'
    AND source IN ('microtask', 'advertiser_deposit_bonus');


-- =============================================================================
-- 5. PRIVILEGES, RLS, updated_at TRIGGERS
-- =============================================================================

DO $$
DECLARE
  t text;
  all_tables text[] := ARRAY[
    'marketplace_settings', 'referral_settings', 'advertiser_accounts', 'advertiser_deposits',
    'advertiser_ledger', 'campaign_types', 'campaigns', 'campaign_budget_tranches',
    'campaign_secrets', 'campaign_clicks', 'campaign_submissions', 'campaign_conversions',
    'advertiser_deposit_bonuses', 'publisher_earning_holds', 'account_ip_observations'
  ];
  with_updated_at text[] := ARRAY[
    'marketplace_settings', 'referral_settings', 'advertiser_accounts', 'advertiser_deposits',
    'campaign_types', 'campaigns', 'campaign_budget_tranches', 'campaign_secrets',
    'campaign_clicks', 'campaign_submissions', 'campaign_conversions',
    'advertiser_deposit_bonuses', 'publisher_earning_holds'
  ];
BEGIN
  FOREACH t IN ARRAY all_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    -- Supabase default privileges grant ALL to the client roles; take it back.
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', t);
    EXECUTE format('GRANT ALL ON TABLE public.%I TO service_role', t);
  END LOOP;
  FOREACH t IN ARRAY with_updated_at LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', t || '_updated_at', t);
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()',
      t || '_updated_at', t);
  END LOOP;
END $$;

-- The only client-readable marketplace tables.
GRANT SELECT ON TABLE public.campaign_types, public.marketplace_settings, public.referral_settings TO authenticated;

DROP POLICY IF EXISTS "campaign types readable" ON public.campaign_types;
CREATE POLICY "campaign types readable" ON public.campaign_types
  FOR SELECT TO authenticated USING (is_active OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "marketplace settings readable" ON public.marketplace_settings;
CREATE POLICY "marketplace settings readable" ON public.marketplace_settings
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "referral settings readable" ON public.referral_settings;
CREATE POLICY "referral settings readable" ON public.referral_settings
  FOR SELECT TO authenticated USING (true);
-- Every other marketplace table: RLS on, no policies, no client grants = deny.


-- =============================================================================
-- 6. GUARD TRIGGERS — money/status columns change only inside mkt_* functions
-- =============================================================================

-- =============================================================================
-- !!! WARNING — READ BEFORE CHANGING HOW THE SERVER TALKS TO POSTGRES !!!
-- =============================================================================
-- The whole "money columns are function-only" guarantee rests on ONE
-- assumption: every mkt_* call is its own top-level statement, i.e. one
-- PostgREST request / one supabase-js `.rpc('mkt_…')` call. That is how the
-- app talks to the database today, and it is the ONLY supported way to call
-- these functions.
--
-- Why: mkt__money_mode() sets a transaction-local GUC
-- (set_config(..., is_local => true)). Postgres has no "function-local" GUC,
-- so once a mkt_* function has set the flag it stays ON until the transaction
-- ends. Under PostgREST that is harmless (the transaction ends with the
-- request). On a DIRECT connection (pg / postgres.js / Prisma / psql) that runs
--   BEGIN; SELECT mkt_x(...); UPDATE campaigns SET budget_spent = 0; COMMIT;
-- the second statement would otherwise pass every guard trigger.
--
-- Assertion: the flag is therefore ALSO stamped with statement_timestamp(),
-- which is constant for all nested calls inside one top-level statement and
-- changes with every further client statement. mkt__in_money_mode() honours
-- the flag only in the statement that set it. So the leak above does not
-- silently pass — the UPDATE fails with MKT_FUNCTION_ONLY. Legitimate single
-- RPC calls are unaffected (all their nested writes share one statement).
--
-- DO NOT: wrap several mkt_* calls in one BEGIN/COMMIT, call mkt_* from
--         another PL/pgSQL function of your own, or "fix" MKT_FUNCTION_ONLY by
--         calling mkt__money_mode() yourself.
-- DO:     one .rpc() per mkt_* call. If you ever need a multi-call unit of
--         work, add a new mkt_* function that does the whole unit inside.
-- =============================================================================

-- Called by every mkt_* function before it writes. Transaction-local flag +
-- statement stamp (see the warning above).
CREATE OR REPLACE FUNCTION public.mkt__money_mode()
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  SELECT set_config('cashgpt.mkt_money_write', 'on', true),
         set_config('cashgpt.mkt_money_write_stmt', statement_timestamp()::text, true);
$$;

-- True only inside the top-level statement that called mkt__money_mode().
CREATE OR REPLACE FUNCTION public.mkt__in_money_mode()
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT COALESCE(current_setting('cashgpt.mkt_money_write', true), '') = 'on'
     AND COALESCE(current_setting('cashgpt.mkt_money_write_stmt', true), '') = statement_timestamp()::text;
$$;

-- Ledger, tranches, clicks, submissions, conversions, bonuses, holds: no
-- direct writes at all, not even from service_role.
CREATE OR REPLACE FUNCTION public.mkt__guard_function_only()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF NOT public.mkt__in_money_mode() THEN
    RAISE EXCEPTION 'MKT_FUNCTION_ONLY' USING DETAIL = TG_TABLE_NAME || ' ' || TG_OP;
  END IF;
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'MKT_NO_DELETE' USING DETAIL = TG_TABLE_NAME;
  END IF;
  RETURN NEW;
END;
$$;

-- advertiser_accounts: the app may create a zero-balance account and edit the
-- profile fields; balances, status and flag fields are function-only.
CREATE OR REPLACE FUNCTION public.mkt__guard_advertiser_accounts()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  editable text[] := ARRAY['display_name', 'contact_email', 'website_url', 'updated_at'];
BEGIN
  IF public.mkt__in_money_mode() THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;  -- FKs (ON DELETE RESTRICT) block deleting an account with history
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.deposit_balance <> 0 OR NEW.bonus_locked <> 0 OR NEW.bonus_available <> 0
       OR NEW.lifetime_deposited <> 0 OR NEW.lifetime_bonus <> 0 OR NEW.lifetime_spent <> 0
       OR NEW.status <> 'active' OR NEW.flagged_for_review THEN
      RAISE EXCEPTION 'MKT_FUNCTION_ONLY' USING DETAIL = 'advertiser_accounts INSERT';
    END IF;
    RETURN NEW;
  END IF;
  IF (to_jsonb(NEW) - editable) IS DISTINCT FROM (to_jsonb(OLD) - editable) THEN
    RAISE EXCEPTION 'MKT_FUNCTION_ONLY' USING DETAIL = 'advertiser_accounts UPDATE';
  END IF;
  RETURN NEW;
END;
$$;

-- advertiser_deposits: the app creates 'created' rows and records gateway
-- order ids / failures. Crediting and reversing are function-only.
CREATE OR REPLACE FUNCTION public.mkt__guard_deposits()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  editable text[] := ARRAY['gateway_order_id', 'gateway_payment_id', 'status',
                           'failure_reason', 'last_event', 'updated_at'];
BEGIN
  IF public.mkt__in_money_mode() THEN
    IF TG_OP = 'DELETE' THEN
      RAISE EXCEPTION 'MKT_NO_DELETE' USING DETAIL = 'advertiser_deposits';
    END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'MKT_NO_DELETE' USING DETAIL = 'advertiser_deposits';
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.status <> 'created' OR NEW.credited_at IS NOT NULL OR NEW.reversed_amount <> 0
       OR NEW.reversal_shortfall <> 0 OR NEW.reversed_at IS NOT NULL OR NEW.confirmed_by IS NOT NULL THEN
      RAISE EXCEPTION 'MKT_FUNCTION_ONLY' USING DETAIL = 'advertiser_deposits INSERT';
    END IF;
    RETURN NEW;
  END IF;
  IF (to_jsonb(NEW) - editable) IS DISTINCT FROM (to_jsonb(OLD) - editable) THEN
    RAISE EXCEPTION 'MKT_FUNCTION_ONLY' USING DETAIL = 'advertiser_deposits UPDATE';
  END IF;
  -- Allowed status moves outside functions: created -> pending/failed, pending -> failed.
  IF NEW.status IS DISTINCT FROM OLD.status AND NOT (
       (OLD.status = 'created' AND NEW.status IN ('pending', 'failed'))
    OR (OLD.status = 'pending' AND NEW.status = 'failed')) THEN
    RAISE EXCEPTION 'MKT_FUNCTION_ONLY' USING DETAIL = 'advertiser_deposits status ' || OLD.status || '->' || NEW.status;
  END IF;
  IF OLD.gateway_order_id IS NOT NULL AND NEW.gateway_order_id IS DISTINCT FROM OLD.gateway_order_id THEN
    RAISE EXCEPTION 'MKT_FUNCTION_ONLY' USING DETAIL = 'advertiser_deposits gateway_order_id is set-once';
  END IF;
  RETURN NEW;
END;
$$;

-- campaigns: the app inserts drafts and edits content while draft / rejected /
-- paused. Status, budget, completions and display pricing are function-only.
-- Editing a paused campaign marks it needs_review (§13: re-review before it
-- runs again). Price fields (publisher_reward, max_completions) are editable
-- only while draft / rejected; a running campaign changes them via mkt_add_budget.
CREATE OR REPLACE FUNCTION public.mkt__guard_campaigns()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  content_cols text[] := ARRAY[
    'type_key', 'name', 'summary', 'description', 'steps', 'rules', 'completion_requirements',
    'estimated_minutes', 'icon_url', 'landing_url', 'tracking_url', 'verification_mode',
    'proof_description', 'proof_min_images', 'proof_max_images', 'proof_fields',
    'min_seconds_to_convert', 'countries', 'devices', 'min_age', 'eligibility_notes',
    'slot_minutes', 'attribution_hours', 'starts_at', 'ends_at'];
  price_cols text[] := ARRAY['publisher_reward', 'max_completions'];
BEGIN
  IF public.mkt__in_money_mode() THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  IF TG_OP = 'DELETE' THEN
    IF OLD.status <> 'draft' OR OLD.budget_allocated <> 0 THEN
      RAISE EXCEPTION 'MKT_CAMPAIGN_LOCKED' USING DETAIL = 'only empty drafts can be deleted';
    END IF;
    RETURN OLD;
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.status <> 'draft' OR NEW.budget_allocated <> 0 OR NEW.budget_remaining <> 0
       OR NEW.budget_reserved <> 0 OR NEW.budget_spent <> 0 OR NEW.budget_released <> 0
       OR NEW.completions_count <> 0 OR NEW.advertiser_cost IS NOT NULL
       OR NEW.fee_percent IS NOT NULL OR NEW.needs_review OR NEW.paused_by IS NOT NULL THEN
      RAISE EXCEPTION 'MKT_FUNCTION_ONLY' USING DETAIL = 'campaigns INSERT must be an empty draft';
    END IF;
    RETURN NEW;
  END IF;
  IF OLD.status NOT IN ('draft', 'rejected', 'paused') THEN
    RAISE EXCEPTION 'MKT_CAMPAIGN_LOCKED' USING DETAIL = 'pause the campaign before editing it';
  END IF;
  IF OLD.status = 'paused' THEN
    IF (to_jsonb(NEW) - (content_cols || 'updated_at'::text))
       IS DISTINCT FROM (to_jsonb(OLD) - (content_cols || 'updated_at'::text)) THEN
      RAISE EXCEPTION 'MKT_FUNCTION_ONLY' USING DETAIL = 'only content can change while paused';
    END IF;
    IF (to_jsonb(NEW) - 'updated_at'::text) IS DISTINCT FROM (to_jsonb(OLD) - 'updated_at'::text) THEN
      NEW.needs_review := true;
    END IF;
    RETURN NEW;
  END IF;
  IF (to_jsonb(NEW) - (content_cols || price_cols || 'updated_at'::text))
     IS DISTINCT FROM (to_jsonb(OLD) - (content_cols || price_cols || 'updated_at'::text)) THEN
    RAISE EXCEPTION 'MKT_FUNCTION_ONLY' USING DETAIL = 'campaigns UPDATE';
  END IF;
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t text;
  function_only text[] := ARRAY[
    'advertiser_ledger', 'campaign_budget_tranches', 'campaign_clicks', 'campaign_submissions',
    'campaign_conversions', 'advertiser_deposit_bonuses', 'publisher_earning_holds'];
BEGIN
  FOREACH t IN ARRAY function_only LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', t || '_guard', t);
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.mkt__guard_function_only()',
      t || '_guard', t);
  END LOOP;
END $$;

DROP TRIGGER IF EXISTS advertiser_accounts_guard ON public.advertiser_accounts;
CREATE TRIGGER advertiser_accounts_guard BEFORE INSERT OR UPDATE OR DELETE ON public.advertiser_accounts
  FOR EACH ROW EXECUTE FUNCTION public.mkt__guard_advertiser_accounts();

DROP TRIGGER IF EXISTS advertiser_deposits_guard ON public.advertiser_deposits;
CREATE TRIGGER advertiser_deposits_guard BEFORE INSERT OR UPDATE OR DELETE ON public.advertiser_deposits
  FOR EACH ROW EXECUTE FUNCTION public.mkt__guard_deposits();

DROP TRIGGER IF EXISTS campaigns_guard ON public.campaigns;
CREATE TRIGGER campaigns_guard BEFORE INSERT OR UPDATE OR DELETE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.mkt__guard_campaigns();


-- =============================================================================
-- 7. INTERNAL HELPERS (mkt__*) — called only from other mkt_* functions
-- =============================================================================

CREATE OR REPLACE FUNCTION public.mkt__settings()
RETURNS public.marketplace_settings
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = '' AS $$
DECLARE s public.marketplace_settings;
BEGIN
  SELECT * INTO s FROM public.marketplace_settings WHERE id;
  IF NOT FOUND THEN RAISE EXCEPTION 'MKT_SETTINGS_MISSING'; END IF;
  RETURN s;
END;
$$;

-- D13 / Q2: fee for budget allocated NOW (database clock).
CREATE OR REPLACE FUNCTION public.mkt__fee_now(s public.marketplace_settings)
RETURNS numeric LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT CASE WHEN s.promo_ends_at IS NOT NULL AND now() < s.promo_ends_at
              THEN 0::numeric ELSE s.platform_fee_percent END;
$$;

-- Advertiser cost per completion: publisher_reward / (1 - fee), rounded UP to the cent.
CREATE OR REPLACE FUNCTION public.mkt__cost(p_reward numeric, p_fee numeric)
RETURNS numeric LANGUAGE sql IMMUTABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT ceil(p_reward * 100 / (1 - p_fee / 100)) / 100;
$$;

CREATE OR REPLACE FUNCTION public.mkt__bucket_for(p_funding text)
RETURNS text LANGUAGE sql IMMUTABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT CASE p_funding WHEN 'deposit' THEN 'deposit' WHEN 'bonus' THEN 'bonus_available' END;
$$;

-- True once the advertiser's first-deposit bonus has been voided (deposit
-- reversed). From then on bonus-funded budget may never flow back to a bucket.
CREATE OR REPLACE FUNCTION public.mkt__bonus_void(p_advertiser uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.advertiser_deposit_bonuses
                  WHERE advertiser_id = p_advertiser AND advertiser_status = 'void');
$$;

-- Returns bonus-funded budget that is leaving a campaign. Normal case: back to
-- bonus_available. If the bonus was voided: forfeited — ledger row with
-- delta 0 (bucket unchanged) and the amount tallied on the bonus row. Caller
-- holds the account + campaign locks and has set money mode.
CREATE OR REPLACE FUNCTION public.mkt__return_budget(
  p_advertiser uuid, p_funding text, p_amount numeric, p_key text,
  p_campaign uuid, p_tranche uuid, p_ref_type text, p_ref_id uuid
)
RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF p_funding = 'bonus' AND public.mkt__bonus_void(p_advertiser) THEN
    IF public.mkt__post(p_advertiser, 'bonus_forfeit', 'bonus_available', p_amount, 0,
                        'forfeit:' || p_key, p_campaign, p_tranche, p_ref_type, p_ref_id,
                        'Voided bonus forfeited (deposit reversed)') THEN
      UPDATE public.advertiser_deposit_bonuses
         SET forfeited_amount = forfeited_amount + p_amount
       WHERE advertiser_id = p_advertiser;
    END IF;
    RETURN;
  END IF;
  PERFORM public.mkt__post(p_advertiser, 'campaign_release', public.mkt__bucket_for(p_funding),
                           p_amount, p_amount, 'release:' || p_key,
                           p_campaign, p_tranche, p_ref_type, p_ref_id, 'Returned from campaign');
END;
$$;

-- Moves money in or out of one advertiser bucket and writes the ledger row.
-- Caller must hold the advertiser_accounts row lock. Returns false (and changes
-- nothing) if p_key was already used.
CREATE OR REPLACE FUNCTION public.mkt__post(
  p_advertiser uuid,
  p_kind text,
  p_bucket text,
  p_amount numeric,
  p_delta numeric,
  p_key text,
  p_campaign uuid DEFAULT NULL,
  p_tranche uuid DEFAULT NULL,
  p_ref_type text DEFAULT NULL,
  p_ref_id uuid DEFAULT NULL,
  p_description text DEFAULT ''
)
RETURNS boolean
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  v_current numeric;
  v_after numeric;
  v_id uuid;
BEGIN
  PERFORM public.mkt__money_mode();
  SELECT CASE p_bucket
           WHEN 'deposit' THEN deposit_balance
           WHEN 'bonus_locked' THEN bonus_locked
           WHEN 'bonus_available' THEN bonus_available
         END
    INTO v_current
    FROM public.advertiser_accounts
   WHERE user_id = p_advertiser;
  IF NOT FOUND THEN RAISE EXCEPTION 'MKT_ADVERTISER_NOT_FOUND'; END IF;
  IF v_current IS NULL THEN RAISE EXCEPTION 'MKT_INVALID_BUCKET'; END IF;

  v_after := v_current + round(p_delta, 2);
  IF v_after < 0 THEN
    RAISE EXCEPTION 'MKT_INSUFFICIENT_FUNDS' USING DETAIL = p_bucket;
  END IF;

  INSERT INTO public.advertiser_ledger
    (advertiser_id, kind, bucket, amount, delta, balance_after, campaign_id, tranche_id,
     reference_type, reference_id, description, idempotency_key)
  VALUES
    (p_advertiser, p_kind, p_bucket, round(p_amount, 2), round(p_delta, 2), v_after, p_campaign,
     p_tranche, p_ref_type, p_ref_id, COALESCE(p_description, ''), p_key)
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING id INTO v_id;
  IF v_id IS NULL THEN
    RETURN false;
  END IF;

  IF p_delta <> 0 THEN
    UPDATE public.advertiser_accounts
       SET deposit_balance = deposit_balance + CASE WHEN p_bucket = 'deposit' THEN round(p_delta, 2) ELSE 0 END,
           bonus_locked    = bonus_locked    + CASE WHEN p_bucket = 'bonus_locked' THEN round(p_delta, 2) ELSE 0 END,
           bonus_available = bonus_available + CASE WHEN p_bucket = 'bonus_available' THEN round(p_delta, 2) ELSE 0 END
     WHERE user_id = p_advertiser;
  END IF;
  RETURN true;
END;
$$;

-- Moves budget between states on one tranche and mirrors it on the campaign.
-- Caller must hold the campaign row lock.
CREATE OR REPLACE FUNCTION public.mkt__budget_move(
  p_tranche uuid, p_from text, p_to text, p_amount numeric
)
RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE v_campaign uuid;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN RETURN; END IF;
  IF p_from NOT IN ('remaining', 'reserved') OR p_to NOT IN ('remaining', 'reserved', 'spent', 'released')
     OR p_from = p_to THEN
    RAISE EXCEPTION 'MKT_INVALID_BUDGET_MOVE' USING DETAIL = p_from || '->' || p_to;
  END IF;
  PERFORM public.mkt__money_mode();
  UPDATE public.campaign_budget_tranches
     SET remaining = remaining + CASE WHEN p_to = 'remaining' THEN p_amount ELSE 0 END
                               - CASE WHEN p_from = 'remaining' THEN p_amount ELSE 0 END,
         reserved  = reserved  + CASE WHEN p_to = 'reserved' THEN p_amount ELSE 0 END
                               - CASE WHEN p_from = 'reserved' THEN p_amount ELSE 0 END,
         spent     = spent     + CASE WHEN p_to = 'spent' THEN p_amount ELSE 0 END,
         released  = released  + CASE WHEN p_to = 'released' THEN p_amount ELSE 0 END
   WHERE id = p_tranche
  RETURNING campaign_id INTO v_campaign;
  IF v_campaign IS NULL THEN RAISE EXCEPTION 'MKT_TRANCHE_NOT_FOUND'; END IF;
  UPDATE public.campaigns
     SET budget_remaining = budget_remaining + CASE WHEN p_to = 'remaining' THEN p_amount ELSE 0 END
                                             - CASE WHEN p_from = 'remaining' THEN p_amount ELSE 0 END,
         budget_reserved  = budget_reserved  + CASE WHEN p_to = 'reserved' THEN p_amount ELSE 0 END
                                             - CASE WHEN p_from = 'reserved' THEN p_amount ELSE 0 END,
         budget_spent     = budget_spent     + CASE WHEN p_to = 'spent' THEN p_amount ELSE 0 END,
         budget_released  = budget_released  + CASE WHEN p_to = 'released' THEN p_amount ELSE 0 END
   WHERE id = v_campaign;
END;
$$;

-- Strong link (Q4 A): same device, same account email/phone, or a shared
-- normalised payout identifier.
CREATE OR REPLACE FUNCTION public.mkt__strong_link(p_a uuid, p_b uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT p_a = p_b
    OR EXISTS (
      SELECT 1
        FROM public.profiles a, public.profiles b
       WHERE a.id = p_a AND b.id = p_b
         AND (
              (NULLIF(btrim(a.device_id), '') IS NOT NULL AND a.device_id NOT IN ('server')
               AND btrim(a.device_id) = btrim(b.device_id))
           OR (NULLIF(btrim(a.email), '') IS NOT NULL AND lower(btrim(a.email)) = lower(btrim(b.email)))
           OR (NULLIF(regexp_replace(COALESCE(a.phone, ''), '\D', '', 'g'), '') IS NOT NULL
               AND regexp_replace(a.phone, '\D', '', 'g') = regexp_replace(COALESCE(b.phone, ''), '\D', '', 'g'))
         ))
    OR EXISTS (
      WITH ids AS (
        SELECT pm.user_id, v.ident
          FROM public.payout_methods pm
          CROSS JOIN LATERAL (VALUES
            (lower(btrim(pm.upi_id))),
            (lower(btrim(pm.paypal_email))),
            (NULLIF(regexp_replace(COALESCE(pm.account_number, ''), '\D', '', 'g'), '')),
            (lower(btrim(pm.wallet_address))),
            (lower(btrim(pm.gift_card_recipient_email)))
          ) AS v(ident)
         WHERE pm.user_id IN (p_a, p_b) AND NULLIF(v.ident, '') IS NOT NULL
      )
      SELECT 1 FROM ids x JOIN ids y ON x.ident = y.ident
       WHERE x.user_id = p_a AND y.user_id = p_b
    );
$$;

-- Link level between a publisher and an advertiser's "linked set" (the
-- advertiser + the referrer on the advertiser's first-deposit bonus).
-- 'self' / 'strong' = may not take part. 'weak' (shared recent IP) = allowed,
-- but completions need an admin decision. CGNAT makes IP a weak signal only.
CREATE OR REPLACE FUNCTION public.mkt_link_level(p_publisher uuid, p_advertiser uuid)
RETURNS text
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  v_other uuid;
  v_days integer;
  v_level text := 'none';
BEGIN
  IF p_publisher = p_advertiser THEN RETURN 'self'; END IF;
  SELECT ip_link_window_days INTO v_days FROM public.marketplace_settings WHERE id;
  v_days := COALESCE(v_days, 30);
  FOR v_other IN
    SELECT p_advertiser
    UNION
    SELECT b.referrer_id FROM public.advertiser_deposit_bonuses b
     WHERE b.advertiser_id = p_advertiser AND b.referrer_id IS NOT NULL
  LOOP
    IF public.mkt__strong_link(p_publisher, v_other) THEN RETURN 'strong'; END IF;
    IF v_level = 'none' AND EXISTS (
      SELECT 1
        FROM public.account_ip_observations x
        JOIN public.account_ip_observations y ON y.ip_hash = x.ip_hash
       WHERE x.user_id = p_publisher AND y.user_id = v_other
         AND x.last_seen_at > now() - make_interval(days => v_days)
         AND y.last_seen_at > now() - make_interval(days => v_days)
    ) THEN
      v_level := 'weak';
    END IF;
  END LOOP;
  RETURN v_level;
END;
$$;

CREATE OR REPLACE FUNCTION public.mkt__publisher_age_ok(p_user uuid, p_days integer)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles
                  WHERE id = p_user AND created_at <= now() - make_interval(days => p_days));
$$;

-- Completions already funded (remaining + reserved), summed over tranches.
CREATE OR REPLACE FUNCTION public.mkt__funded_slots(p_campaign uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT COALESCE(SUM(floor((remaining + reserved) / cost_per_completion)), 0)::integer
    FROM public.campaign_budget_tranches WHERE campaign_id = p_campaign;
$$;

-- Allocates p_slots completions at the current price: deposit money first,
-- then available bonus, one tranche per funding source. Fails cleanly if the
-- balance can't fund all of them. Caller holds the account + campaign locks.
CREATE OR REPLACE FUNCTION public.mkt__allocate(p_campaign uuid, p_slots integer)
RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  s public.marketplace_settings := public.mkt__settings();
  c public.campaigns%ROWTYPE;
  a public.advertiser_accounts%ROWTYPE;
  v_fee numeric;
  v_cost numeric;
  v_dep integer;
  v_bonus integer;
  v_funding text;
  v_count integer;
  v_amount numeric;
  v_tranche uuid;
BEGIN
  IF p_slots IS NULL OR p_slots <= 0 THEN
    RETURN jsonb_build_object('slots', 0);
  END IF;
  SELECT * INTO c FROM public.campaigns WHERE id = p_campaign;
  SELECT * INTO a FROM public.advertiser_accounts WHERE user_id = c.advertiser_id;

  v_fee := public.mkt__fee_now(s);
  v_cost := public.mkt__cost(c.publisher_reward, v_fee);
  v_dep := LEAST(p_slots, floor(a.deposit_balance / v_cost)::integer);
  v_bonus := LEAST(p_slots - v_dep, floor(a.bonus_available / v_cost)::integer);
  IF v_dep + v_bonus < p_slots THEN
    RAISE EXCEPTION 'MKT_INSUFFICIENT_FUNDS'
      USING DETAIL = format('needs %s for %s completions at %s', p_slots * v_cost, p_slots, v_cost);
  END IF;

  PERFORM public.mkt__money_mode();
  FOREACH v_funding IN ARRAY ARRAY['deposit', 'bonus'] LOOP
    v_count := CASE v_funding WHEN 'deposit' THEN v_dep ELSE v_bonus END;
    CONTINUE WHEN v_count = 0;
    v_amount := v_cost * v_count;
    INSERT INTO public.campaign_budget_tranches
      (campaign_id, advertiser_id, funding, fee_percent, cost_per_completion, publisher_reward,
       completions_allocated, amount_allocated, remaining, allocated_at)
    VALUES
      (c.id, c.advertiser_id, v_funding, v_fee, v_cost, c.publisher_reward,
       v_count, v_amount, v_amount, clock_timestamp())
    RETURNING id INTO v_tranche;
    UPDATE public.campaigns
       SET budget_allocated = budget_allocated + v_amount,
           budget_remaining = budget_remaining + v_amount
     WHERE id = c.id;
    PERFORM public.mkt__post(c.advertiser_id, 'campaign_allocation', public.mkt__bucket_for(v_funding),
                             v_amount, -v_amount, 'alloc:' || v_tranche, c.id, v_tranche,
                             'campaign', c.id, format('Allocated to "%s"', c.name));
  END LOOP;

  UPDATE public.campaigns SET advertiser_cost = v_cost, fee_percent = v_fee WHERE id = c.id;
  RETURN jsonb_build_object('slots', p_slots, 'deposit_slots', v_dep, 'bonus_slots', v_bonus,
                            'fee_percent', v_fee, 'cost_per_completion', v_cost,
                            'amount', v_cost * p_slots);
END;
$$;

-- Returns every tranche's free (unreserved) budget to the advertiser's
-- buckets — or forfeits it if it is bonus money and the bonus was voided.
-- Caller holds the account + campaign locks.
CREATE OR REPLACE FUNCTION public.mkt__release_remaining(p_campaign uuid)
RETURNS numeric
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  t record;
  v_total numeric := 0;
BEGIN
  FOR t IN
    SELECT * FROM public.campaign_budget_tranches
     WHERE campaign_id = p_campaign AND remaining > 0
     ORDER BY allocated_at
  LOOP
    PERFORM public.mkt__budget_move(t.id, 'remaining', 'released', t.remaining);
    PERFORM public.mkt__return_budget(t.advertiser_id, t.funding, t.remaining,
                                      'tranche:' || t.id || ':' || (t.released + t.remaining),
                                      p_campaign, t.id, 'campaign', p_campaign);
    v_total := v_total + t.remaining;
  END LOOP;
  RETURN v_total;
END;
$$;

-- Frees one reserved completion. While the campaign can still take publishers
-- (active / pending_review) it goes back to the tranche; otherwise straight
-- back to the advertiser's bucket (or forfeited: voided bonus). Caller holds
-- the account + campaign locks.
CREATE OR REPLACE FUNCTION public.mkt__release_reservation(
  p_campaign uuid, p_tranche uuid, p_amount numeric, p_ref_type text, p_ref_id uuid
)
RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  v_status text;
  t public.campaign_budget_tranches%ROWTYPE;
BEGIN
  IF p_tranche IS NULL OR p_amount IS NULL OR p_amount <= 0 THEN RETURN; END IF;
  SELECT status INTO v_status FROM public.campaigns WHERE id = p_campaign;
  IF v_status IN ('active', 'pending_review') THEN
    PERFORM public.mkt__budget_move(p_tranche, 'reserved', 'remaining', p_amount);
  ELSE
    SELECT * INTO t FROM public.campaign_budget_tranches WHERE id = p_tranche;
    PERFORM public.mkt__budget_move(p_tranche, 'reserved', 'released', p_amount);
    PERFORM public.mkt__return_budget(t.advertiser_id, t.funding, p_amount,
                                      p_ref_type || ':' || p_ref_id,
                                      p_campaign, p_tranche, p_ref_type, p_ref_id);
  END IF;
END;
$$;

-- Oldest tranche that can fund one completion for this publisher: deposit
-- before bonus; bonus-funded slots need an account at least N days old (Q4 C).
CREATE OR REPLACE FUNCTION public.mkt__pick_tranche(p_campaign uuid, p_user uuid)
RETURNS uuid
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  s public.marketplace_settings := public.mkt__settings();
  v_age_ok boolean := public.mkt__publisher_age_ok(p_user, s.bonus_min_publisher_age_days);
  v_id uuid;
BEGIN
  SELECT id INTO v_id
    FROM public.campaign_budget_tranches
   WHERE campaign_id = p_campaign
     AND remaining >= cost_per_completion
     AND (funding = 'deposit' OR v_age_ok)
   ORDER BY allocated_at, (funding = 'bonus'), created_at
   LIMIT 1;
  RETURN v_id;
END;
$$;

-- Q4 B: a deposit-funded completion by a qualifying publisher unlocks
-- cost × unlock_ratio of the advertiser's locked bonus. Qualifying = no link,
-- account old enough, first qualifying completion by this publisher for this
-- advertiser. Caller holds the account lock (bonus row locked here).
CREATE OR REPLACE FUNCTION public.mkt__unlock_bonus(
  p_advertiser uuid, p_publisher uuid, p_cost numeric, p_source_type text, p_source_id uuid
)
RETURNS numeric
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  s public.marketplace_settings := public.mkt__settings();
  b public.advertiser_deposit_bonuses%ROWTYPE;
  v_locked numeric;
  v_unlock numeric;
BEGIN
  SELECT * INTO b FROM public.advertiser_deposit_bonuses
   WHERE advertiser_id = p_advertiser AND advertiser_status IN ('locked', 'unlocking')
     FOR UPDATE;
  IF NOT FOUND THEN RETURN 0; END IF;

  IF public.mkt_link_level(p_publisher, p_advertiser) <> 'none'
     OR NOT public.mkt__publisher_age_ok(p_publisher, s.bonus_min_publisher_age_days)
     OR EXISTS (
       SELECT 1 FROM public.campaign_submissions cs
         JOIN public.campaigns c ON c.id = cs.campaign_id
        WHERE c.advertiser_id = p_advertiser AND cs.user_id = p_publisher AND cs.bonus_unlocked > 0)
     OR EXISTS (
       SELECT 1 FROM public.campaign_conversions cv
         JOIN public.campaigns c ON c.id = cv.campaign_id
        WHERE c.advertiser_id = p_advertiser AND cv.user_id = p_publisher AND cv.bonus_unlocked > 0)
  THEN
    RETURN 0;
  END IF;

  SELECT bonus_locked INTO v_locked FROM public.advertiser_accounts WHERE user_id = p_advertiser;
  v_unlock := LEAST(round(p_cost * b.unlock_ratio, 2), v_locked, b.advertiser_bonus - b.bonus_unlocked);
  IF v_unlock <= 0 THEN RETURN 0; END IF;

  PERFORM public.mkt__post(p_advertiser, 'bonus_unlock', 'bonus_locked', v_unlock, -v_unlock,
                           'unlock:' || p_source_type || ':' || p_source_id || ':locked',
                           NULL, NULL, p_source_type, p_source_id, 'Bonus unlocked by spend');
  PERFORM public.mkt__post(p_advertiser, 'bonus_unlock', 'bonus_available', v_unlock, v_unlock,
                           'unlock:' || p_source_type || ':' || p_source_id || ':available',
                           NULL, NULL, p_source_type, p_source_id, 'Bonus unlocked by spend');
  UPDATE public.advertiser_deposit_bonuses
     SET bonus_unlocked = bonus_unlocked + v_unlock,
         advertiser_status = CASE WHEN bonus_unlocked + v_unlock >= advertiser_bonus
                                  THEN 'unlocked' ELSE 'unlocking' END
   WHERE id = b.id;
  RETURN v_unlock;
END;
$$;

-- Spends one completion: tranche -> spent, completions + 1, ledger charge row,
-- bonus unlock (deposit-funded only), then pays the publisher — immediately for
-- deposit-funded budget, into a 14-day hold for bonus-funded budget (Q4 C).
-- Caller holds account + campaign + source-row locks and sets the row status.
CREATE OR REPLACE FUNCTION public.mkt__charge_and_pay(
  p_campaign uuid,
  p_tranche uuid,
  p_from text,              -- 'reserved' (slot / held conversion) or 'remaining' (direct)
  p_source_type text,       -- 'submission' | 'conversion'
  p_source_id uuid,
  p_publisher uuid
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  s public.marketplace_settings := public.mkt__settings();
  c public.campaigns%ROWTYPE;
  t public.campaign_budget_tranches%ROWTYPE;
  v_unlocked numeric := 0;
  v_wallet jsonb;
  v_hold uuid;
BEGIN
  SELECT * INTO c FROM public.campaigns WHERE id = p_campaign;
  SELECT * INTO t FROM public.campaign_budget_tranches WHERE id = p_tranche AND campaign_id = p_campaign;
  IF NOT FOUND THEN RAISE EXCEPTION 'MKT_TRANCHE_NOT_FOUND'; END IF;
  IF c.completions_count >= c.max_completions THEN
    RAISE EXCEPTION 'MKT_NO_BUDGET' USING DETAIL = 'max completions reached';
  END IF;

  PERFORM public.mkt__money_mode();
  PERFORM public.mkt__budget_move(t.id, p_from, 'spent', t.cost_per_completion);
  UPDATE public.campaigns
     SET completions_count = completions_count + 1,
         status = CASE WHEN completions_count + 1 >= max_completions AND status = 'active'
                       THEN 'budget_exhausted' ELSE status END
   WHERE id = c.id;
  UPDATE public.advertiser_accounts
     SET lifetime_spent = lifetime_spent + t.cost_per_completion
   WHERE user_id = c.advertiser_id;
  PERFORM public.mkt__post(c.advertiser_id, 'conversion_charge', public.mkt__bucket_for(t.funding),
                           t.cost_per_completion, 0, 'charge:' || p_source_type || ':' || p_source_id,
                           c.id, t.id, p_source_type, p_source_id,
                           format('Completion on "%s"', c.name));

  IF t.funding = 'deposit' THEN
    v_unlocked := public.mkt__unlock_bonus(c.advertiser_id, p_publisher, t.cost_per_completion,
                                           p_source_type, p_source_id);
  END IF;

  IF t.funding = 'bonus' AND s.bonus_earnings_hold_days > 0 THEN
    INSERT INTO public.publisher_earning_holds
      (user_id, source_type, source_id, campaign_id, advertiser_id, amount, release_at)
    VALUES
      (p_publisher, p_source_type, p_source_id, c.id, c.advertiser_id, t.publisher_reward,
       now() + make_interval(days => s.bonus_earnings_hold_days))
    RETURNING id INTO v_hold;
  ELSE
    v_wallet := public.wallet_apply(p_publisher, t.publisher_reward, 'microtask', 'earned',
                                    'Microtask: ' || c.name, p_source_id);
  END IF;

  RETURN jsonb_build_object(
    'tranche_id', t.id,
    'funding', t.funding,
    'charge', t.cost_per_completion,
    'reward', t.publisher_reward,
    'fee', t.cost_per_completion - t.publisher_reward,
    'bonus_unlocked', v_unlocked,
    'held', v_hold IS NOT NULL,
    'earning_hold_id', v_hold,
    'wallet_transaction_id', v_wallet->'transaction_id',
    'previous_lifetime_earned', v_wallet->'previous_lifetime_earned'
  );
END;
$$;


-- =============================================================================
-- 8. DEPOSITS + FIRST-DEPOSIT BONUS (D12, Q1)
-- =============================================================================

-- Grants the D12 bonus on the advertiser's first credited deposit while the
-- promo runs. Organic: bonus% of the deposit into bonus_locked. Referred:
-- split% to the referrer (held N days, then the publisher wallet), the rest of
-- bonus% to the advertiser. Called inside mkt_credit_deposit (same transaction,
-- account + deposit already locked).
CREATE OR REPLACE FUNCTION public.mkt__grant_first_deposit_bonus(
  p_deposit uuid, p_advertiser uuid, p_amount numeric
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  s public.marketplace_settings := public.mkt__settings();
  v_referral uuid;
  v_referrer uuid;
  v_adv_bonus numeric(12,2);
  v_ref_bonus numeric(12,2) := 0;
  v_ref_status text;
  v_ref_reason text;
  v_bonus_id uuid;
BEGIN
  IF s.promo_ends_at IS NULL OR now() >= s.promo_ends_at OR s.first_deposit_bonus_percent <= 0 THEN
    RETURN jsonb_build_object('granted', false, 'reason', 'no_promo');
  END IF;
  IF EXISTS (SELECT 1 FROM public.advertiser_deposit_bonuses WHERE advertiser_id = p_advertiser) THEN
    RETURN jsonb_build_object('granted', false, 'reason', 'already_granted');
  END IF;
  -- First credited deposit only (an earlier deposit that was later reversed still counts).
  IF EXISTS (SELECT 1 FROM public.advertiser_deposits
              WHERE advertiser_id = p_advertiser AND id <> p_deposit AND credited_at IS NOT NULL) THEN
    RETURN jsonb_build_object('granted', false, 'reason', 'not_first_deposit');
  END IF;

  SELECT r.id, r.referrer_id INTO v_referral, v_referrer
    FROM public.referrals r WHERE r.referred_id = p_advertiser;

  IF v_referrer IS NOT NULL AND v_referrer <> p_advertiser THEN
    v_ref_bonus := round(p_amount * s.referral_bonus_split_percent / 100, 2);
    v_adv_bonus := round(p_amount * GREATEST(s.first_deposit_bonus_percent - s.referral_bonus_split_percent, 0) / 100, 2);
  ELSE
    v_referral := NULL;
    v_referrer := NULL;
    v_adv_bonus := round(p_amount * s.first_deposit_bonus_percent / 100, 2);
  END IF;

  IF v_ref_bonus > 0 THEN
    IF public.mkt__strong_link(v_referrer, p_advertiser) THEN
      v_ref_status := 'review';
      v_ref_reason := 'referrer and advertiser accounts are linked';
    ELSE
      v_ref_status := 'held';
    END IF;
  END IF;

  PERFORM public.mkt__money_mode();
  INSERT INTO public.advertiser_deposit_bonuses
    (deposit_id, advertiser_id, referral_id, referrer_id, deposit_amount, advertiser_bonus,
     referrer_bonus, unlock_ratio, advertiser_status, referrer_status, referrer_release_at,
     referrer_review_reason, promo_ends_at_snapshot)
  VALUES
    (p_deposit, p_advertiser, v_referral, v_referrer, p_amount, v_adv_bonus,
     v_ref_bonus, round(LEAST(1, v_adv_bonus / p_amount), 6),
     CASE WHEN v_adv_bonus > 0 THEN 'locked' ELSE 'unlocked' END,
     v_ref_status,
     CASE WHEN v_ref_status IS NOT NULL THEN now() + make_interval(days => s.referrer_bonus_hold_days) END,
     v_ref_reason, s.promo_ends_at)
  RETURNING id INTO v_bonus_id;

  IF v_adv_bonus > 0 THEN
    PERFORM public.mkt__post(p_advertiser, 'first_deposit_bonus', 'bonus_locked', v_adv_bonus, v_adv_bonus,
                             'bonus:' || p_deposit, NULL, NULL, 'deposit', p_deposit,
                             'First-deposit bonus (unlocks as you spend)');
    UPDATE public.advertiser_accounts
       SET lifetime_bonus = lifetime_bonus + v_adv_bonus
     WHERE user_id = p_advertiser;
  END IF;

  RETURN jsonb_build_object(
    'granted', true, 'bonus_id', v_bonus_id, 'advertiser_bonus', v_adv_bonus,
    'referrer_id', v_referrer, 'referrer_bonus', v_ref_bonus, 'referrer_status', v_ref_status);
END;
$$;

-- Credits a deposit exactly once, after the server has verified the payment
-- with the gateway (Razorpay) or an admin confirmed it (manual). Also grants
-- the first-deposit bonus in the same transaction. A 'failed' deposit can still
-- be credited: a checkout can fail one attempt and succeed on the next.
CREATE OR REPLACE FUNCTION public.mkt_credit_deposit(
  p_deposit_id uuid,
  p_gateway_payment_id text DEFAULT NULL,
  p_event jsonb DEFAULT NULL,
  p_confirmed_by uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  v_adv uuid;
  d public.advertiser_deposits%ROWTYPE;
  v_bonus jsonb;
BEGIN
  SELECT advertiser_id INTO v_adv FROM public.advertiser_deposits WHERE id = p_deposit_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'MKT_DEPOSIT_NOT_FOUND'; END IF;
  PERFORM 1 FROM public.advertiser_accounts WHERE user_id = v_adv FOR UPDATE;
  SELECT * INTO d FROM public.advertiser_deposits WHERE id = p_deposit_id FOR UPDATE;

  IF d.credited_at IS NOT NULL THEN
    RETURN jsonb_build_object('credited', false, 'reason', 'already_credited', 'status', d.status);
  END IF;
  IF d.gateway = 'manual' AND p_confirmed_by IS NULL THEN
    RAISE EXCEPTION 'MKT_MANUAL_CONFIRMATION_REQUIRED';
  END IF;
  IF d.gateway = 'razorpay' AND NULLIF(btrim(COALESCE(p_gateway_payment_id, '')), '') IS NULL THEN
    RAISE EXCEPTION 'MKT_PAYMENT_ID_REQUIRED';
  END IF;

  PERFORM public.mkt__money_mode();
  UPDATE public.advertiser_deposits
     SET status = 'succeeded',
         gateway_payment_id = COALESCE(NULLIF(btrim(p_gateway_payment_id), ''), gateway_payment_id),
         credited_at = now(),
         confirmed_by = COALESCE(p_confirmed_by, confirmed_by),
         last_event = COALESCE(p_event, last_event),
         failure_reason = NULL
   WHERE id = d.id;

  PERFORM public.mkt__post(v_adv, 'deposit', 'deposit', d.amount_usd, d.amount_usd,
                           'deposit:' || d.id, NULL, NULL, 'deposit', d.id, 'Campaign deposit');
  UPDATE public.advertiser_accounts
     SET lifetime_deposited = lifetime_deposited + d.amount_usd
   WHERE user_id = v_adv;

  v_bonus := public.mkt__grant_first_deposit_bonus(d.id, v_adv, d.amount_usd);

  RETURN jsonb_build_object('credited', true, 'advertiser_id', v_adv,
                            'amount', d.amount_usd, 'bonus', v_bonus);
END;
$$;

-- Refund / chargeback. Debits what's still in the deposit bucket; anything
-- already spent is recorded as a shortfall and restricts the account. If this
-- was the bonus deposit, the bonus is voided (remaining bonus clawed back, the
-- referrer share voided or marked for clawback) and the advertiser's held
-- bonus-funded publisher earnings move to admin review. Bonus money already
-- allocated to campaigns is NOT touched here (publishers mid-task still get
-- paid); it is forfeited when those campaigns release it — see
-- mkt__return_budget. 'bonus_shortfall' in the result is that amount.
-- p_reversal_key: the gateway refund/dispute id — makes repeats no-ops.
CREATE OR REPLACE FUNCTION public.mkt_reverse_deposit(
  p_deposit_id uuid,
  p_amount numeric,
  p_reversal_key text,
  p_reason text,
  p_event jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  v_adv uuid;
  d public.advertiser_deposits%ROWTYPE;
  a public.advertiser_accounts%ROWTYPE;
  b public.advertiser_deposit_bonuses%ROWTYPE;
  v_amount numeric(12,2);
  v_debit numeric(12,2);
  v_short numeric(12,2);
  v_bonus_short numeric(12,2) := 0;
  v_bonus_voided boolean := false;
  v_holds integer := 0;
BEGIN
  IF NULLIF(btrim(COALESCE(p_reversal_key, '')), '') IS NULL THEN
    RAISE EXCEPTION 'MKT_REVERSAL_KEY_REQUIRED';
  END IF;
  SELECT advertiser_id INTO v_adv FROM public.advertiser_deposits WHERE id = p_deposit_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'MKT_DEPOSIT_NOT_FOUND'; END IF;
  SELECT * INTO a FROM public.advertiser_accounts WHERE user_id = v_adv FOR UPDATE;
  SELECT * INTO d FROM public.advertiser_deposits WHERE id = p_deposit_id FOR UPDATE;

  IF EXISTS (SELECT 1 FROM public.advertiser_ledger WHERE idempotency_key = 'reversal:' || p_reversal_key) THEN
    RETURN jsonb_build_object('reversed', false, 'reason', 'duplicate');
  END IF;
  IF d.credited_at IS NULL THEN
    RETURN jsonb_build_object('reversed', false, 'reason', 'not_credited');
  END IF;
  v_amount := LEAST(round(COALESCE(p_amount, 0), 2), d.amount_usd - d.reversed_amount);
  IF v_amount <= 0 THEN
    RETURN jsonb_build_object('reversed', false, 'reason', 'nothing_to_reverse');
  END IF;

  PERFORM public.mkt__money_mode();
  v_debit := LEAST(v_amount, a.deposit_balance);
  v_short := v_amount - v_debit;
  PERFORM public.mkt__post(v_adv, 'deposit_reversal', 'deposit', v_debit, -v_debit,
                           'reversal:' || p_reversal_key, NULL, NULL, 'deposit', d.id,
                           'Payment reversed: ' || COALESCE(p_reason, ''));
  UPDATE public.advertiser_deposits
     SET reversed_amount = reversed_amount + v_amount,
         reversal_shortfall = reversal_shortfall + v_short,
         status = CASE WHEN reversed_amount + v_amount >= amount_usd THEN 'reversed' ELSE status END,
         reversed_at = now(),
         last_event = COALESCE(p_event, last_event)
   WHERE id = d.id;

  SELECT * INTO b FROM public.advertiser_deposit_bonuses WHERE deposit_id = d.id FOR UPDATE;
  IF FOUND AND b.advertiser_status <> 'void' THEN
    SELECT * INTO a FROM public.advertiser_accounts WHERE user_id = v_adv;
    IF a.bonus_locked > 0 THEN
      PERFORM public.mkt__post(v_adv, 'first_deposit_bonus_reversal', 'bonus_locked', a.bonus_locked,
                               -a.bonus_locked, 'bonus_reversal:' || d.id || ':locked', NULL, NULL,
                               'deposit', d.id, 'Bonus voided: payment reversed');
    END IF;
    IF a.bonus_available > 0 THEN
      PERFORM public.mkt__post(v_adv, 'first_deposit_bonus_reversal', 'bonus_available', a.bonus_available,
                               -a.bonus_available, 'bonus_reversal:' || d.id || ':available', NULL, NULL,
                               'deposit', d.id, 'Bonus voided: payment reversed');
    END IF;
    v_bonus_short := GREATEST(0, b.advertiser_bonus - a.bonus_locked - a.bonus_available);
    UPDATE public.advertiser_deposit_bonuses
       SET advertiser_status = 'void',
           void_reason = 'deposit reversed: ' || COALESCE(p_reason, ''),
           referrer_status = CASE WHEN referrer_status IN ('held', 'review') THEN 'void' ELSE referrer_status END,
           -- referrer_status is NULL for organic advertisers; NULL = 'credited' is NULL,
           -- which would violate NOT NULL. Compare NULL-safely.
           referrer_clawback_needed = (referrer_status IS NOT DISTINCT FROM 'credited')
     WHERE id = b.id;
    v_bonus_voided := true;

    UPDATE public.publisher_earning_holds
       SET status = 'review', review_reason = 'advertiser payment reversed'
     WHERE advertiser_id = v_adv AND status = 'held';
    GET DIAGNOSTICS v_holds = ROW_COUNT;
  END IF;

  IF v_short > 0 OR v_bonus_short > 0 THEN
    UPDATE public.advertiser_accounts
       SET status = CASE WHEN status = 'suspended' THEN status ELSE 'restricted' END,
           status_reason = 'Payment reversed after the funds were spent'
     WHERE user_id = v_adv;
  END IF;

  RETURN jsonb_build_object(
    'reversed', true, 'amount', v_amount, 'debited', v_debit, 'shortfall', v_short,
    'bonus_voided', v_bonus_voided, 'bonus_shortfall', v_bonus_short, 'holds_to_review', v_holds);
END;
$$;


-- =============================================================================
-- 9. CAMPAIGN LIFECYCLE (§7.1, D13/Q2 pricing)
-- =============================================================================

-- Locks the advertiser account then the campaign (global lock order) and
-- returns the campaign. All campaign functions start here.
CREATE OR REPLACE FUNCTION public.mkt__lock_campaign(p_campaign uuid)
RETURNS public.campaigns
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  v_adv uuid;
  c public.campaigns;
BEGIN
  SELECT advertiser_id INTO v_adv FROM public.campaigns WHERE id = p_campaign;
  IF NOT FOUND THEN RAISE EXCEPTION 'MKT_CAMPAIGN_NOT_FOUND'; END IF;
  PERFORM 1 FROM public.advertiser_accounts WHERE user_id = v_adv FOR UPDATE;
  SELECT * INTO c FROM public.campaigns WHERE id = p_campaign FOR UPDATE;
  RETURN c;
END;
$$;

CREATE OR REPLACE FUNCTION public.mkt__assert_advertiser_active(p_advertiser uuid)
RETURNS void LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = '' AS $$
DECLARE v_status text;
BEGIN
  SELECT status INTO v_status FROM public.advertiser_accounts WHERE user_id = p_advertiser;
  IF v_status IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'MKT_ADVERTISER_NOT_ACTIVE' USING DETAIL = COALESCE(v_status, 'missing');
  END IF;
END;
$$;

-- Draft / rejected -> pending_review. Validates the campaign, then allocates
-- budget for every open completion at the current price (Q2). Fails cleanly
-- with MKT_INSUFFICIENT_FUNDS if the balance can't cover it.
CREATE OR REPLACE FUNCTION public.mkt_submit_campaign(p_campaign_id uuid, p_actor uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  s public.marketplace_settings := public.mkt__settings();
  c public.campaigns := public.mkt__lock_campaign(p_campaign_id);
  ct public.campaign_types%ROWTYPE;
  v_open integer;
  v_alloc jsonb;
BEGIN
  IF c.advertiser_id <> p_actor THEN RAISE EXCEPTION 'MKT_NOT_OWNER'; END IF;
  IF c.status NOT IN ('draft', 'rejected') THEN
    RAISE EXCEPTION 'MKT_INVALID_STATUS' USING DETAIL = c.status;
  END IF;
  PERFORM public.mkt__assert_advertiser_active(c.advertiser_id);

  SELECT * INTO ct FROM public.campaign_types WHERE key = c.type_key;
  IF NOT ct.is_active THEN RAISE EXCEPTION 'MKT_INVALID_CAMPAIGN' USING DETAIL = 'campaign type is not available'; END IF;
  IF NOT (c.verification_mode = ANY (ct.allowed_verification)) THEN
    RAISE EXCEPTION 'MKT_INVALID_CAMPAIGN' USING DETAIL = 'verification mode not allowed for this type';
  END IF;
  IF c.publisher_reward < s.min_publisher_reward THEN
    RAISE EXCEPTION 'MKT_INVALID_CAMPAIGN' USING DETAIL = 'reward below the minimum';
  END IF;
  IF c.verification_mode = 'manual_proof'
     AND c.proof_min_images = 0 AND jsonb_array_length(c.proof_fields) = 0 THEN
    RAISE EXCEPTION 'MKT_INVALID_CAMPAIGN' USING DETAIL = 'manual campaigns need at least one image or proof field';
  END IF;
  IF c.verification_mode = 'auto'
     AND NOT EXISTS (SELECT 1 FROM public.campaign_secrets WHERE campaign_id = c.id) THEN
    RAISE EXCEPTION 'MKT_INVALID_CAMPAIGN' USING DETAIL = 'postback secret missing';
  END IF;
  IF jsonb_array_length(c.steps) = 0 THEN
    RAISE EXCEPTION 'MKT_INVALID_CAMPAIGN' USING DETAIL = 'add at least one step';
  END IF;
  IF c.ends_at IS NOT NULL AND c.ends_at <= now() THEN
    RAISE EXCEPTION 'MKT_INVALID_CAMPAIGN' USING DETAIL = 'end date is in the past';
  END IF;

  v_open := c.max_completions - c.completions_count - public.mkt__funded_slots(c.id);
  v_alloc := public.mkt__allocate(c.id, v_open);

  PERFORM public.mkt__money_mode();
  UPDATE public.campaigns
     SET status = 'pending_review', submitted_at = now(), needs_review = false,
         review_note = NULL, reviewed_by = NULL, reviewed_at = NULL, paused_by = NULL
   WHERE id = c.id;
  RETURN jsonb_build_object('status', 'pending_review', 'allocation', v_alloc);
END;
$$;

-- Admin review (§13). Approve -> active (or budget_exhausted if nothing is
-- left to do). Reject (note required) -> rejected, free budget returned.
CREATE OR REPLACE FUNCTION public.mkt_review_campaign(
  p_campaign_id uuid, p_admin uuid, p_decision text, p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  c public.campaigns := public.mkt__lock_campaign(p_campaign_id);
  v_released numeric := 0;
  v_status text;
BEGIN
  IF p_decision NOT IN ('approved', 'rejected') THEN RAISE EXCEPTION 'MKT_INVALID_DECISION'; END IF;
  IF c.status <> 'pending_review' THEN RAISE EXCEPTION 'MKT_INVALID_STATUS' USING DETAIL = c.status; END IF;
  PERFORM public.mkt__money_mode();

  IF p_decision = 'approved' THEN
    v_status := CASE WHEN c.completions_count >= c.max_completions THEN 'budget_exhausted' ELSE 'active' END;
    UPDATE public.campaigns
       SET status = v_status, activated_at = COALESCE(activated_at, now()),
           review_note = p_note, reviewed_by = p_admin, reviewed_at = now(), paused_by = NULL
     WHERE id = c.id;
  ELSE
    IF char_length(btrim(COALESCE(p_note, ''))) < 10 THEN RAISE EXCEPTION 'MKT_REASON_REQUIRED'; END IF;
    UPDATE public.campaigns
       SET status = 'rejected', review_note = p_note, reviewed_by = p_admin, reviewed_at = now()
     WHERE id = c.id;
    v_released := public.mkt__release_remaining(c.id);
    v_status := 'rejected';
  END IF;
  RETURN jsonb_build_object('status', v_status, 'released', v_released);
END;
$$;

-- pause / resume / complete / archive.
--   pause:    active | budget_exhausted -> paused; free budget returned (§14c).
--             An admin pause (= disable) can only be lifted by an admin.
--   resume:   paused -> active (or pending_review if edited while paused);
--             open completions re-allocated at the CURRENT price (Q2).
--   complete: active | paused | budget_exhausted | pending_review -> completed.
--   archive:  draft | rejected | paused | budget_exhausted | completed -> archived.
-- In-flight slots and held conversions settle normally after a pause/end;
-- their budget returns to the advertiser when they resolve.
CREATE OR REPLACE FUNCTION public.mkt_set_campaign_status(
  p_campaign_id uuid, p_actor uuid, p_actor_role text, p_target text, p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  c public.campaigns := public.mkt__lock_campaign(p_campaign_id);
  v_released numeric := 0;
  v_alloc jsonb;
  v_open integer;
  v_status text;
BEGIN
  IF p_actor_role NOT IN ('advertiser', 'admin', 'system') THEN RAISE EXCEPTION 'MKT_INVALID_ROLE'; END IF;
  IF p_actor_role = 'advertiser' AND c.advertiser_id <> p_actor THEN RAISE EXCEPTION 'MKT_NOT_OWNER'; END IF;
  PERFORM public.mkt__money_mode();

  IF p_target = 'paused' THEN
    IF c.status NOT IN ('active', 'budget_exhausted') THEN
      RAISE EXCEPTION 'MKT_INVALID_STATUS' USING DETAIL = c.status;
    END IF;
    UPDATE public.campaigns SET status = 'paused', paused_by = p_actor_role WHERE id = c.id;
    v_released := public.mkt__release_remaining(c.id);
    v_status := 'paused';

  ELSIF p_target = 'active' THEN
    IF c.status <> 'paused' THEN RAISE EXCEPTION 'MKT_INVALID_STATUS' USING DETAIL = c.status; END IF;
    IF c.paused_by = 'admin' AND p_actor_role <> 'admin' THEN RAISE EXCEPTION 'MKT_ADMIN_PAUSED'; END IF;
    IF p_actor_role = 'advertiser' THEN PERFORM public.mkt__assert_advertiser_active(c.advertiser_id); END IF;
    IF c.ends_at IS NOT NULL AND c.ends_at <= now() THEN
      RAISE EXCEPTION 'MKT_INVALID_STATUS' USING DETAIL = 'campaign end date has passed';
    END IF;
    v_open := c.max_completions - c.completions_count - public.mkt__funded_slots(c.id);
    v_alloc := public.mkt__allocate(c.id, v_open);
    v_status := CASE
                  WHEN c.needs_review THEN 'pending_review'
                  WHEN c.completions_count >= c.max_completions THEN 'budget_exhausted'
                  ELSE 'active' END;
    UPDATE public.campaigns
       SET status = v_status, paused_by = NULL,
           submitted_at = CASE WHEN c.needs_review THEN now() ELSE submitted_at END,
           needs_review = false
     WHERE id = c.id;

  ELSIF p_target = 'completed' THEN
    IF c.status NOT IN ('active', 'paused', 'budget_exhausted', 'pending_review') THEN
      RAISE EXCEPTION 'MKT_INVALID_STATUS' USING DETAIL = c.status;
    END IF;
    UPDATE public.campaigns SET status = 'completed', ended_at = now() WHERE id = c.id;
    v_released := public.mkt__release_remaining(c.id);
    v_status := 'completed';

  ELSIF p_target = 'archived' THEN
    IF c.status NOT IN ('draft', 'rejected', 'paused', 'budget_exhausted', 'completed') THEN
      RAISE EXCEPTION 'MKT_INVALID_STATUS' USING DETAIL = c.status;
    END IF;
    UPDATE public.campaigns SET status = 'archived', ended_at = COALESCE(ended_at, now()) WHERE id = c.id;
    v_released := public.mkt__release_remaining(c.id);
    v_status := 'archived';

  ELSE
    RAISE EXCEPTION 'MKT_INVALID_STATUS' USING DETAIL = 'unknown target ' || COALESCE(p_target, 'null');
  END IF;

  RETURN jsonb_build_object('status', v_status, 'released', v_released, 'allocation', v_alloc);
END;
$$;

-- Adds p_completions to the campaign. Allocated now at the CURRENT price
-- (Q2: budget added after the promo pays the then-current fee, even on a
-- campaign created during the promo). For a paused campaign only the target
-- grows; the budget is allocated when it resumes.
CREATE OR REPLACE FUNCTION public.mkt_add_budget(p_campaign_id uuid, p_actor uuid, p_completions integer)
RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  c public.campaigns := public.mkt__lock_campaign(p_campaign_id);
  v_alloc jsonb;
BEGIN
  IF c.advertiser_id <> p_actor THEN RAISE EXCEPTION 'MKT_NOT_OWNER'; END IF;
  IF p_completions IS NULL OR p_completions <= 0 OR p_completions > 100000 THEN
    RAISE EXCEPTION 'MKT_INVALID_AMOUNT';
  END IF;
  IF c.status NOT IN ('active', 'budget_exhausted', 'pending_review', 'paused') THEN
    RAISE EXCEPTION 'MKT_INVALID_STATUS' USING DETAIL = c.status;
  END IF;
  PERFORM public.mkt__assert_advertiser_active(c.advertiser_id);
  PERFORM public.mkt__money_mode();

  UPDATE public.campaigns SET max_completions = max_completions + p_completions WHERE id = c.id;
  IF c.status <> 'paused' THEN
    v_alloc := public.mkt__allocate(c.id, p_completions);
    IF c.status = 'budget_exhausted' THEN
      UPDATE public.campaigns SET status = 'active' WHERE id = c.id;
    END IF;
  END IF;
  RETURN jsonb_build_object('status', CASE WHEN c.status = 'budget_exhausted' THEN 'active' ELSE c.status END,
                            'allocation', v_alloc);
END;
$$;


-- =============================================================================
-- 10. PUBLISHER: START + MANUAL PROOF (§7.2)
-- =============================================================================

-- Expires one stale slot and frees its reservation. Caller holds account +
-- campaign locks. Used by mkt_start (lazily) and the sweep.
CREATE OR REPLACE FUNCTION public.mkt__expire_click(p_click_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE k public.campaign_clicks%ROWTYPE;
BEGIN
  SELECT * INTO k FROM public.campaign_clicks WHERE click_id = p_click_id FOR UPDATE;
  IF NOT FOUND OR k.status <> 'active' OR k.expires_at > now() THEN RETURN false; END IF;
  PERFORM public.mkt__money_mode();
  IF k.reservation_status = 'held' THEN
    PERFORM public.mkt__release_reservation(k.campaign_id, k.tranche_id, k.reserved_amount, 'click', k.click_id);
  END IF;
  UPDATE public.campaign_clicks
     SET status = 'expired',
         reservation_status = CASE WHEN reservation_status = 'held' THEN 'released' ELSE reservation_status END
   WHERE click_id = p_click_id;
  RETURN true;
END;
$$;

-- Start Task. Atomic slot reservation for manual-proof campaigns (the "two
-- users take the last slot" case: the campaign row lock serialises Starts, so
-- only one can reserve it). Re-Starting an open slot returns the same click.
-- p_meta: { country, device, ip_hash, user_agent } from the server.
CREATE OR REPLACE FUNCTION public.mkt_start(p_campaign_id uuid, p_user_id uuid, p_meta jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  s public.marketplace_settings := public.mkt__settings();
  c public.campaigns := public.mkt__lock_campaign(p_campaign_id);
  v_adv_status text;
  v_link text;
  v_dob date;
  v_flagged boolean;
  v_country text := upper(NULLIF(btrim(p_meta->>'country'), ''));
  v_device text := lower(NULLIF(btrim(p_meta->>'device'), ''));
  v_existing public.campaign_clicks%ROWTYPE;
  v_stale uuid;
  v_tranche uuid;
  t public.campaign_budget_tranches%ROWTYPE;
  v_click uuid;
  v_expires timestamptz;
BEGIN
  IF c.status <> 'active' THEN RAISE EXCEPTION 'MKT_NOT_AVAILABLE' USING DETAIL = c.status; END IF;
  IF c.starts_at IS NOT NULL AND c.starts_at > now() THEN RAISE EXCEPTION 'MKT_NOT_AVAILABLE' USING DETAIL = 'not started'; END IF;
  IF c.ends_at IS NOT NULL AND c.ends_at <= now() THEN RAISE EXCEPTION 'MKT_NOT_AVAILABLE' USING DETAIL = 'ended'; END IF;
  SELECT status INTO v_adv_status FROM public.advertiser_accounts WHERE user_id = c.advertiser_id;
  IF v_adv_status = 'suspended' THEN RAISE EXCEPTION 'MKT_NOT_AVAILABLE' USING DETAIL = 'advertiser suspended'; END IF;

  -- Eligibility (also filtered in the listing; re-checked here).
  v_link := public.mkt_link_level(p_user_id, c.advertiser_id);
  IF v_link IN ('self', 'strong') THEN RAISE EXCEPTION 'MKT_NOT_ELIGIBLE' USING DETAIL = 'linked'; END IF;
  IF cardinality(c.countries) > 0 AND (v_country IS NULL OR NOT (v_country = ANY (c.countries))) THEN
    RAISE EXCEPTION 'MKT_NOT_ELIGIBLE' USING DETAIL = 'country';
  END IF;
  IF cardinality(c.devices) > 0 AND (v_device IS NULL OR NOT (v_device = ANY (c.devices))) THEN
    RAISE EXCEPTION 'MKT_NOT_ELIGIBLE' USING DETAIL = 'device';
  END IF;
  SELECT date_of_birth, is_flagged INTO v_dob, v_flagged FROM public.profiles WHERE id = p_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'MKT_NOT_ELIGIBLE' USING DETAIL = 'no profile'; END IF;
  IF c.min_age IS NOT NULL AND (v_dob IS NULL OR v_dob > (current_date - make_interval(years => c.min_age))::date) THEN
    RAISE EXCEPTION 'MKT_NOT_ELIGIBLE' USING DETAIL = 'age';
  END IF;

  -- Free this campaign's stale slots first, so slot counts are right even
  -- without the sweep.
  FOR v_stale IN
    SELECT click_id FROM public.campaign_clicks
     WHERE campaign_id = c.id AND status = 'active' AND expires_at <= now()
  LOOP
    PERFORM public.mkt__expire_click(v_stale);
  END LOOP;

  SELECT * INTO v_existing FROM public.campaign_clicks
   WHERE campaign_id = c.id AND user_id = p_user_id AND status <> 'expired';
  IF FOUND THEN
    IF v_existing.status = 'active' THEN
      RETURN jsonb_build_object('click_id', v_existing.click_id, 'expires_at', v_existing.expires_at,
                                'verification_mode', c.verification_mode, 'reused', true);
    END IF;
    RAISE EXCEPTION 'MKT_ALREADY_DONE';
  END IF;

  v_tranche := public.mkt__pick_tranche(c.id, p_user_id);
  IF v_tranche IS NULL THEN
    IF EXISTS (SELECT 1 FROM public.campaign_budget_tranches
                WHERE campaign_id = c.id AND funding = 'bonus' AND remaining >= cost_per_completion) THEN
      RAISE EXCEPTION 'MKT_NO_SLOTS' USING DETAIL = 'remaining slots need an account at least '
        || s.bonus_min_publisher_age_days || ' days old';
    END IF;
    RAISE EXCEPTION 'MKT_NO_SLOTS';
  END IF;
  SELECT * INTO t FROM public.campaign_budget_tranches WHERE id = v_tranche;

  PERFORM public.mkt__money_mode();
  IF c.verification_mode = 'manual_proof' THEN
    v_expires := now() + make_interval(mins => c.slot_minutes);
    PERFORM public.mkt__budget_move(t.id, 'remaining', 'reserved', t.cost_per_completion);
  ELSE
    -- Auto: no reservation; the conversion is charged when it arrives (D7).
    v_expires := now() + make_interval(hours => c.attribution_hours);
  END IF;

  INSERT INTO public.campaign_clicks
    (campaign_id, user_id, tranche_id, reserved_amount, reservation_status, link_level,
     expires_at, country, device, ip_hash, user_agent)
  VALUES
    (c.id, p_user_id,
     CASE WHEN c.verification_mode = 'manual_proof' THEN t.id END,
     CASE WHEN c.verification_mode = 'manual_proof' THEN t.cost_per_completion ELSE 0 END,
     CASE WHEN c.verification_mode = 'manual_proof' THEN 'held' ELSE 'none' END,
     CASE WHEN v_link = 'weak' OR COALESCE(v_flagged, false) THEN 'weak' ELSE 'none' END,
     v_expires, v_country, v_device, NULLIF(p_meta->>'ip_hash', ''), left(p_meta->>'user_agent', 512))
  RETURNING click_id INTO v_click;

  RETURN jsonb_build_object('click_id', v_click, 'expires_at', v_expires,
                            'verification_mode', c.verification_mode, 'reused', false);
END;
$$;

-- Submits proof for an open manual slot. Paths must be the user's own uploads
-- under offer-proofs/{user}/campaign/{campaign}/ (checked here; the app also
-- checks the objects exist and are images <= 5 MB).
CREATE OR REPLACE FUNCTION public.mkt_submit_proof(
  p_click_id uuid, p_user_id uuid, p_paths text[], p_fields jsonb DEFAULT '{}'::jsonb, p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  s public.marketplace_settings := public.mkt__settings();
  v_campaign uuid;
  c public.campaigns;
  k public.campaign_clicks%ROWTYPE;
  t public.campaign_budget_tranches%ROWTYPE;
  v_prefix text;
  v_path text;
  v_field jsonb;
  v_value text;
  v_flagged boolean;
  v_requires_admin boolean;
  v_id uuid;
BEGIN
  SELECT campaign_id INTO v_campaign FROM public.campaign_clicks WHERE click_id = p_click_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'MKT_CLICK_NOT_FOUND'; END IF;
  c := public.mkt__lock_campaign(v_campaign);
  SELECT * INTO k FROM public.campaign_clicks WHERE click_id = p_click_id FOR UPDATE;
  IF k.user_id <> p_user_id THEN RAISE EXCEPTION 'MKT_NOT_OWNER'; END IF;
  IF c.verification_mode <> 'manual_proof' THEN RAISE EXCEPTION 'MKT_INVALID_STATUS' USING DETAIL = 'not a proof campaign'; END IF;
  IF k.status = 'active' AND k.expires_at <= now() THEN
    PERFORM public.mkt__expire_click(k.click_id);
    RETURN jsonb_build_object('submitted', false, 'reason', 'slot_expired');
  END IF;
  IF k.status <> 'active' OR k.reservation_status <> 'held' THEN
    RAISE EXCEPTION 'MKT_INVALID_STATUS' USING DETAIL = k.status;
  END IF;

  p_paths := COALESCE(p_paths, '{}');
  IF cardinality(p_paths) < c.proof_min_images OR cardinality(p_paths) > c.proof_max_images THEN
    RAISE EXCEPTION 'MKT_INVALID_PROOF' USING DETAIL = format('upload %s-%s images', c.proof_min_images, c.proof_max_images);
  END IF;
  v_prefix := p_user_id || '/campaign/' || c.id || '/';
  FOREACH v_path IN ARRAY p_paths LOOP
    IF left(v_path, char_length(v_prefix)) <> v_prefix OR v_path LIKE '%..%' OR char_length(v_path) > 300 THEN
      RAISE EXCEPTION 'MKT_INVALID_PROOF' USING DETAIL = 'proof path not owned by this slot';
    END IF;
  END LOOP;

  p_fields := COALESCE(p_fields, '{}'::jsonb);
  IF jsonb_typeof(p_fields) <> 'object' THEN RAISE EXCEPTION 'MKT_INVALID_PROOF' USING DETAIL = 'fields'; END IF;
  FOR v_field IN SELECT * FROM jsonb_array_elements(c.proof_fields) LOOP
    v_value := btrim(COALESCE(p_fields->>(v_field->>'key'), ''));
    IF COALESCE((v_field->>'required')::boolean, false) AND v_value = '' THEN
      RAISE EXCEPTION 'MKT_INVALID_PROOF' USING DETAIL = 'missing ' || (v_field->>'key');
    END IF;
    IF char_length(v_value) > COALESCE((v_field->>'max_len')::integer, 200) THEN
      RAISE EXCEPTION 'MKT_INVALID_PROOF' USING DETAIL = 'too long: ' || (v_field->>'key');
    END IF;
  END LOOP;

  SELECT * INTO t FROM public.campaign_budget_tranches WHERE id = k.tranche_id;
  SELECT is_flagged INTO v_flagged FROM public.profiles WHERE id = p_user_id;
  v_requires_admin := k.link_level = 'weak' OR COALESCE(v_flagged, false);

  PERFORM public.mkt__money_mode();
  INSERT INTO public.campaign_submissions
    (campaign_id, click_id, user_id, proof_paths, field_values, user_note, requires_admin, flag_reason,
     tranche_id, funding, charge_amount, reward_amount, fee_amount, auto_approve_at)
  VALUES
    (c.id, k.click_id, p_user_id, p_paths, p_fields, NULLIF(btrim(COALESCE(p_note, '')), ''),
     v_requires_admin,
     CASE WHEN k.link_level = 'weak' THEN 'shares a recent IP with the advertiser'
          WHEN COALESCE(v_flagged, false) THEN 'publisher account is flagged' END,
     t.id, t.funding, t.cost_per_completion, t.publisher_reward, t.cost_per_completion - t.publisher_reward,
     CASE WHEN v_requires_admin OR s.auto_approve_after_hours IS NULL THEN NULL
          ELSE now() + make_interval(hours => s.auto_approve_after_hours) END)
  RETURNING id INTO v_id;
  UPDATE public.campaign_clicks SET status = 'submitted' WHERE click_id = k.click_id;
  RETURN jsonb_build_object('submitted', true, 'submission_id', v_id, 'requires_admin', v_requires_admin);
END;
$$;


-- =============================================================================
-- 11. REVIEW, HELD REJECTIONS (Q3), APPEALS
-- =============================================================================

-- Locks account + campaign + submission (lock order) and returns the submission.
CREATE OR REPLACE FUNCTION public.mkt__lock_submission(p_submission_id uuid)
RETURNS public.campaign_submissions
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  v_campaign uuid;
  c public.campaigns;
  sub public.campaign_submissions;
BEGIN
  SELECT campaign_id INTO v_campaign FROM public.campaign_submissions WHERE id = p_submission_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'MKT_SUBMISSION_NOT_FOUND'; END IF;
  c := public.mkt__lock_campaign(v_campaign);
  SELECT * INTO sub FROM public.campaign_submissions WHERE id = p_submission_id FOR UPDATE;
  RETURN sub;
END;
$$;

-- Approves + pays a submission (reserved -> spent). Caller holds the locks
-- and has validated the transition.
CREATE OR REPLACE FUNCTION public.mkt__approve_submission(
  p_submission_id uuid, p_status text, p_actor uuid, p_role text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  sub public.campaign_submissions%ROWTYPE;
  v_pay jsonb;
BEGIN
  SELECT * INTO sub FROM public.campaign_submissions WHERE id = p_submission_id;
  v_pay := public.mkt__charge_and_pay(sub.campaign_id, sub.tranche_id, 'reserved', 'submission', sub.id, sub.user_id);
  PERFORM public.mkt__money_mode();
  UPDATE public.campaign_submissions
     SET status = p_status,
         reviewed_by = CASE WHEN p_status = 'approved' AND reviewer_role IS NULL THEN p_actor ELSE reviewed_by END,
         reviewer_role = CASE WHEN p_status = 'approved' AND reviewer_role IS NULL THEN p_role ELSE reviewer_role END,
         reviewed_at = COALESCE(reviewed_at, now()),
         auto_approve_at = NULL,
         bonus_unlocked = (v_pay->>'bonus_unlocked')::numeric,
         paid_at = now(),
         wallet_transaction_id = (v_pay->>'wallet_transaction_id')::uuid,
         earning_hold_id = (v_pay->>'earning_hold_id')::uuid
   WHERE id = sub.id;
  UPDATE public.campaign_clicks SET reservation_status = 'spent', status = 'closed' WHERE click_id = sub.click_id;
  RETURN v_pay || jsonb_build_object('status', p_status, 'submission_id', sub.id, 'user_id', sub.user_id);
END;
$$;

-- D5: recompute the advertiser's rejection rate over their own decisions since
-- the flag was last cleared; flag when >= threshold with enough decisions.
-- Admin-overturned held rejections count as rejections. Returns true if this
-- call raised the flag. Caller holds the account lock.
CREATE OR REPLACE FUNCTION public.mkt__evaluate_rejection_flag(p_advertiser uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  s public.marketplace_settings := public.mkt__settings();
  a public.advertiser_accounts%ROWTYPE;
  v_total integer;
  v_rejected integer;
BEGIN
  SELECT * INTO a FROM public.advertiser_accounts WHERE user_id = p_advertiser;
  IF a.flagged_for_review THEN RETURN false; END IF;
  SELECT count(*),
         count(*) FILTER (WHERE cs.status <> 'approved' OR cs.overturned_at IS NOT NULL)
    INTO v_total, v_rejected
    FROM public.campaign_submissions cs
    JOIN public.campaigns c ON c.id = cs.campaign_id
   WHERE c.advertiser_id = p_advertiser
     AND cs.reviewer_role = 'advertiser'
     AND cs.reviewed_at > COALESCE(a.flag_cleared_at, '-infinity'::timestamptz);
  IF v_total >= s.rejection_flag_min_decisions
     AND v_rejected * 100.0 / v_total >= s.rejection_flag_percent THEN
    PERFORM public.mkt__money_mode();
    UPDATE public.advertiser_accounts
       SET flagged_for_review = true, flagged_at = now(),
           flag_reason = format('Rejected %s of %s submissions (%s%%)', v_rejected, v_total,
                                round(v_rejected * 100.0 / v_total))
     WHERE user_id = p_advertiser;
    RETURN true;
  END IF;
  RETURN false;
END;
$$;

-- Advertiser / admin / system (auto-approve) decision on a pending submission.
--   * requires_admin submissions (weak link, flagged publisher): admin only.
--   * Reject needs a reason (>= 10 chars, also a DB CHECK).
--   * Q3: a FLAGGED advertiser's rejection becomes rejection_held and waits for
--     admin sign-off (mkt_confirm_rejection); no appeal window, no timer.
--   * Otherwise a rejection opens the appeal window; the reservation is kept
--     so an upheld appeal can still be paid.
CREATE OR REPLACE FUNCTION public.mkt_decide_submission(
  p_submission_id uuid, p_actor uuid, p_role text, p_decision text, p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  s public.marketplace_settings := public.mkt__settings();
  sub public.campaign_submissions := public.mkt__lock_submission(p_submission_id);
  c public.campaigns%ROWTYPE;
  v_flagged boolean;
  v_status text;
  v_result jsonb := '{}'::jsonb;
  v_flagged_now boolean := false;
BEGIN
  IF p_decision NOT IN ('approved', 'rejected') THEN RAISE EXCEPTION 'MKT_INVALID_DECISION'; END IF;
  IF p_role NOT IN ('advertiser', 'admin', 'system') THEN RAISE EXCEPTION 'MKT_INVALID_ROLE'; END IF;
  SELECT * INTO c FROM public.campaigns WHERE id = sub.campaign_id;
  IF sub.status <> 'pending' THEN
    RETURN jsonb_build_object('decided', false, 'reason', 'already_reviewed', 'status', sub.status);
  END IF;
  IF p_role = 'advertiser' THEN
    IF c.advertiser_id <> p_actor THEN RAISE EXCEPTION 'MKT_NOT_OWNER'; END IF;
    IF sub.requires_admin THEN RAISE EXCEPTION 'MKT_ADMIN_DECISION_REQUIRED'; END IF;
  END IF;
  IF p_role = 'system' AND (p_decision <> 'approved' OR sub.requires_admin
                            OR sub.auto_approve_at IS NULL OR sub.auto_approve_at > now()) THEN
    RETURN jsonb_build_object('decided', false, 'reason', 'not_due');
  END IF;

  PERFORM public.mkt__money_mode();
  IF p_decision = 'approved' THEN
    UPDATE public.campaign_submissions
       SET reviewer_role = p_role, reviewed_by = p_actor, reviewed_at = now()
     WHERE id = sub.id;
    v_result := public.mkt__approve_submission(sub.id, 'approved', p_actor, p_role);
    v_status := 'approved';
  ELSE
    IF char_length(btrim(COALESCE(p_reason, ''))) < 10 THEN RAISE EXCEPTION 'MKT_REASON_REQUIRED'; END IF;
    SELECT flagged_for_review INTO v_flagged FROM public.advertiser_accounts WHERE user_id = c.advertiser_id;
    v_status := CASE WHEN p_role = 'advertiser' AND v_flagged THEN 'rejection_held' ELSE 'rejected' END;
    UPDATE public.campaign_submissions
       SET status = v_status, rejection_reason = btrim(p_reason),
           reviewer_role = p_role, reviewed_by = p_actor, reviewed_at = now(), auto_approve_at = NULL,
           appeal_deadline = CASE WHEN v_status = 'rejected'
                                  THEN now() + make_interval(hours => s.appeal_window_hours) END
     WHERE id = sub.id;
  END IF;

  IF p_role = 'advertiser' THEN
    v_flagged_now := public.mkt__evaluate_rejection_flag(c.advertiser_id);
  END IF;
  RETURN v_result || jsonb_build_object('decided', true, 'status', v_status,
                                        'submission_id', sub.id, 'user_id', sub.user_id,
                                        'advertiser_flagged_now', v_flagged_now);
END;
$$;

-- Q3: admin signs off a flagged advertiser's held rejection.
--   confirm  -> rejected, normal appeal window opens (the publisher still gets heard).
--   overturn -> approved and paid; recorded as overturned (counts against the advertiser).
CREATE OR REPLACE FUNCTION public.mkt_confirm_rejection(
  p_submission_id uuid, p_admin uuid, p_decision text, p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  s public.marketplace_settings := public.mkt__settings();
  sub public.campaign_submissions := public.mkt__lock_submission(p_submission_id);
  v_result jsonb := '{}'::jsonb;
BEGIN
  IF p_decision NOT IN ('confirm', 'overturn') THEN RAISE EXCEPTION 'MKT_INVALID_DECISION'; END IF;
  IF sub.status <> 'rejection_held' THEN
    RETURN jsonb_build_object('decided', false, 'reason', 'not_held', 'status', sub.status);
  END IF;
  PERFORM public.mkt__money_mode();
  IF p_decision = 'confirm' THEN
    UPDATE public.campaign_submissions
       SET status = 'rejected', rejection_confirmed_by = p_admin, rejection_confirmed_at = now(),
           appeal_deadline = now() + make_interval(hours => s.appeal_window_hours)
     WHERE id = sub.id;
    RETURN jsonb_build_object('decided', true, 'status', 'rejected', 'submission_id', sub.id, 'user_id', sub.user_id);
  END IF;
  IF char_length(btrim(COALESCE(p_note, ''))) < 10 THEN RAISE EXCEPTION 'MKT_REASON_REQUIRED'; END IF;
  UPDATE public.campaign_submissions
     SET overturned_by = p_admin, overturned_at = now(), appeal_note = btrim(p_note)
   WHERE id = sub.id;
  v_result := public.mkt__approve_submission(sub.id, 'approved', p_admin, 'admin');
  RETURN v_result || jsonb_build_object('decided', true, 'status', 'approved', 'overturned', true);
END;
$$;

-- One appeal per rejected submission, before the deadline (text >= 20 chars).
CREATE OR REPLACE FUNCTION public.mkt_appeal(p_submission_id uuid, p_user_id uuid, p_text text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  sub public.campaign_submissions := public.mkt__lock_submission(p_submission_id);
BEGIN
  IF sub.user_id <> p_user_id THEN RAISE EXCEPTION 'MKT_NOT_OWNER'; END IF;
  IF sub.status <> 'rejected' THEN RAISE EXCEPTION 'MKT_INVALID_STATUS' USING DETAIL = sub.status; END IF;
  IF sub.appeal_deadline IS NULL OR sub.appeal_deadline < now() THEN RAISE EXCEPTION 'MKT_APPEAL_CLOSED'; END IF;
  IF char_length(btrim(COALESCE(p_text, ''))) < 20 THEN RAISE EXCEPTION 'MKT_APPEAL_TEXT_REQUIRED'; END IF;
  PERFORM public.mkt__money_mode();
  UPDATE public.campaign_submissions
     SET status = 'appealed', appeal_text = btrim(p_text), appealed_at = now()
   WHERE id = sub.id;
  RETURN jsonb_build_object('status', 'appealed', 'submission_id', sub.id);
END;
$$;

-- Admin's final decision on an appeal. Upheld -> paid. Denied -> reservation freed.
CREATE OR REPLACE FUNCTION public.mkt_resolve_appeal(
  p_submission_id uuid, p_admin uuid, p_decision text, p_note text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  sub public.campaign_submissions := public.mkt__lock_submission(p_submission_id);
  v_result jsonb := '{}'::jsonb;
BEGIN
  IF p_decision NOT IN ('approved', 'rejected') THEN RAISE EXCEPTION 'MKT_INVALID_DECISION'; END IF;
  IF sub.status <> 'appealed' THEN
    RETURN jsonb_build_object('decided', false, 'reason', 'not_appealed', 'status', sub.status);
  END IF;
  IF char_length(btrim(COALESCE(p_note, ''))) < 10 THEN RAISE EXCEPTION 'MKT_REASON_REQUIRED'; END IF;
  PERFORM public.mkt__money_mode();
  UPDATE public.campaign_submissions
     SET appeal_note = btrim(p_note), appeal_resolved_by = p_admin, appeal_resolved_at = now()
   WHERE id = sub.id;
  IF p_decision = 'approved' THEN
    v_result := public.mkt__approve_submission(sub.id, 'appeal_approved', p_admin, 'admin');
    RETURN v_result || jsonb_build_object('decided', true, 'status', 'appeal_approved');
  END IF;
  UPDATE public.campaign_submissions SET status = 'appeal_rejected' WHERE id = sub.id;
  PERFORM public.mkt__release_reservation(sub.campaign_id, sub.tranche_id, sub.charge_amount, 'submission', sub.id);
  UPDATE public.campaign_clicks SET reservation_status = 'released', status = 'closed' WHERE click_id = sub.click_id;
  RETURN jsonb_build_object('decided', true, 'status', 'appeal_rejected', 'submission_id', sub.id, 'user_id', sub.user_id);
END;
$$;

-- Sweep: a rejection whose appeal window passed unused becomes final and its
-- reservation is freed.
CREATE OR REPLACE FUNCTION public.mkt_finalize_rejection(p_submission_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  sub public.campaign_submissions := public.mkt__lock_submission(p_submission_id);
  v_res text;
BEGIN
  SELECT reservation_status INTO v_res FROM public.campaign_clicks WHERE click_id = sub.click_id;
  IF sub.status <> 'rejected' OR sub.appeal_deadline IS NULL OR sub.appeal_deadline > now()
     OR v_res <> 'held' THEN
    RETURN jsonb_build_object('finalized', false);
  END IF;
  PERFORM public.mkt__money_mode();
  PERFORM public.mkt__release_reservation(sub.campaign_id, sub.tranche_id, sub.charge_amount, 'submission', sub.id);
  UPDATE public.campaign_clicks SET reservation_status = 'released', status = 'closed' WHERE click_id = sub.click_id;
  RETURN jsonb_build_object('finalized', true, 'submission_id', sub.id);
END;
$$;


-- =============================================================================
-- 12. AUTOMATIC VERIFICATION — postback conversions (§7.3, D7)
-- =============================================================================

-- Records a verified postback for a click. The route verifies the signature /
-- token / IP first and passes only trusted values. Outcomes:
--   credited          budget charged, publisher paid (or bonus-funded share held)
--   held_for_review   weak link / flagged publisher / faster than the minimum;
--                     cost reserved so the budget can't be oversold meanwhile
--   budget_exhausted  no budget left (D7): recorded unpaid, admin can pay later
-- Expected failures (unknown/expired click, duplicate) return recorded = false
-- and write nothing, so a rejected attempt never blocks a later valid retry.
CREATE OR REPLACE FUNCTION public.mkt_record_conversion(
  p_campaign_id uuid, p_click_id uuid, p_external_txn_id text, p_meta jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  c public.campaigns := public.mkt__lock_campaign(p_campaign_id);
  k public.campaign_clicks%ROWTYPE;
  t public.campaign_budget_tranches%ROWTYPE;
  v_txn text := btrim(COALESCE(p_external_txn_id, ''));
  v_existing uuid;
  v_flagged boolean;
  v_hold_reason text;
  v_tranche uuid;
  v_status text;
  v_id uuid;
  v_pay jsonb := '{}'::jsonb;
BEGIN
  IF c.verification_mode <> 'auto' THEN
    RETURN jsonb_build_object('recorded', false, 'reason', 'not_auto_campaign');
  END IF;
  IF v_txn = '' OR char_length(v_txn) > 200 THEN
    RETURN jsonb_build_object('recorded', false, 'reason', 'invalid_txn');
  END IF;
  SELECT id INTO v_existing FROM public.campaign_conversions
   WHERE campaign_id = c.id AND external_txn_id = v_txn;
  IF FOUND THEN
    RETURN jsonb_build_object('recorded', false, 'reason', 'duplicate', 'conversion_id', v_existing);
  END IF;

  SELECT * INTO k FROM public.campaign_clicks WHERE click_id = p_click_id FOR UPDATE;
  IF NOT FOUND OR k.campaign_id <> c.id THEN
    RETURN jsonb_build_object('recorded', false, 'reason', 'unknown_click');
  END IF;
  SELECT id INTO v_existing FROM public.campaign_conversions WHERE click_id = k.click_id;
  IF FOUND THEN
    RETURN jsonb_build_object('recorded', false, 'reason', 'duplicate', 'conversion_id', v_existing);
  END IF;
  IF k.status <> 'active' THEN
    RETURN jsonb_build_object('recorded', false, 'reason', 'click_' || k.status);
  END IF;
  IF k.expires_at <= now() THEN
    PERFORM public.mkt__expire_click(k.click_id);
    RETURN jsonb_build_object('recorded', false, 'reason', 'click_expired');
  END IF;

  SELECT is_flagged INTO v_flagged FROM public.profiles WHERE id = k.user_id;
  v_hold_reason := CASE
    WHEN k.link_level = 'weak' THEN 'shares a recent IP with the advertiser'
    WHEN COALESCE(v_flagged, false) THEN 'publisher account is flagged'
    WHEN extract(epoch FROM now() - k.created_at) < c.min_seconds_to_convert
      THEN 'converted faster than the campaign minimum'
  END;

  IF c.completions_count < c.max_completions THEN
    v_tranche := public.mkt__pick_tranche(c.id, k.user_id);
  END IF;
  IF v_tranche IS NOT NULL THEN
    SELECT * INTO t FROM public.campaign_budget_tranches WHERE id = v_tranche;
  END IF;
  v_status := CASE WHEN v_tranche IS NULL THEN 'budget_exhausted'
                   WHEN v_hold_reason IS NOT NULL THEN 'held_for_review'
                   ELSE 'credited' END;

  PERFORM public.mkt__money_mode();
  INSERT INTO public.campaign_conversions
    (campaign_id, click_id, user_id, external_txn_id, status, hold_reason, tranche_id,
     reservation_status, funding, charge_amount, reward_amount, fee_amount,
     signature_valid, source_ip_hash, raw_payload)
  VALUES
    (c.id, k.click_id, k.user_id, v_txn, v_status, v_hold_reason, v_tranche,
     CASE v_status WHEN 'held_for_review' THEN 'held' WHEN 'credited' THEN 'spent' ELSE 'none' END,
     t.funding, COALESCE(t.cost_per_completion, 0), COALESCE(t.publisher_reward, c.publisher_reward),
     COALESCE(t.cost_per_completion - t.publisher_reward, 0),
     (p_meta->>'signature_valid')::boolean, NULLIF(p_meta->>'source_ip_hash', ''),
     COALESCE(p_meta->'raw_payload', '{}'::jsonb))
  RETURNING id INTO v_id;

  IF v_status = 'held_for_review' THEN
    PERFORM public.mkt__budget_move(t.id, 'remaining', 'reserved', t.cost_per_completion);
  ELSIF v_status = 'credited' THEN
    v_pay := public.mkt__charge_and_pay(c.id, t.id, 'remaining', 'conversion', v_id, k.user_id);
    UPDATE public.campaign_conversions
       SET paid_at = now(),
           bonus_unlocked = (v_pay->>'bonus_unlocked')::numeric,
           wallet_transaction_id = (v_pay->>'wallet_transaction_id')::uuid,
           earning_hold_id = (v_pay->>'earning_hold_id')::uuid
     WHERE id = v_id;
  END IF;
  UPDATE public.campaign_clicks SET status = 'converted' WHERE click_id = k.click_id;

  RETURN v_pay || jsonb_build_object('recorded', true, 'status', v_status, 'conversion_id', v_id,
                                     'user_id', k.user_id, 'hold_reason', v_hold_reason);
END;
$$;

-- Admin decision on a held or over-budget conversion.
--   held_for_review:  approve -> charge reservation + pay; reject -> free reservation.
--   budget_exhausted: approve -> pay from budget available now (MKT_NO_BUDGET if none).
CREATE OR REPLACE FUNCTION public.mkt_decide_conversion(
  p_conversion_id uuid, p_admin uuid, p_decision text, p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  v_campaign uuid;
  c public.campaigns;
  cv public.campaign_conversions%ROWTYPE;
  t public.campaign_budget_tranches%ROWTYPE;
  v_tranche uuid;
  v_pay jsonb;
BEGIN
  IF p_decision NOT IN ('approved', 'rejected') THEN RAISE EXCEPTION 'MKT_INVALID_DECISION'; END IF;
  SELECT campaign_id INTO v_campaign FROM public.campaign_conversions WHERE id = p_conversion_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'MKT_CONVERSION_NOT_FOUND'; END IF;
  c := public.mkt__lock_campaign(v_campaign);
  SELECT * INTO cv FROM public.campaign_conversions WHERE id = p_conversion_id FOR UPDATE;
  IF cv.status NOT IN ('held_for_review', 'budget_exhausted') THEN
    RETURN jsonb_build_object('decided', false, 'reason', 'not_pending', 'status', cv.status);
  END IF;
  IF p_decision = 'rejected' AND char_length(btrim(COALESCE(p_note, ''))) < 10 THEN
    RAISE EXCEPTION 'MKT_REASON_REQUIRED';
  END IF;
  PERFORM public.mkt__money_mode();

  IF p_decision = 'rejected' THEN
    IF cv.reservation_status = 'held' THEN
      PERFORM public.mkt__release_reservation(c.id, cv.tranche_id, cv.charge_amount, 'conversion', cv.id);
    END IF;
    UPDATE public.campaign_conversions
       SET status = 'rejected', review_note = btrim(p_note), reviewed_by = p_admin, reviewed_at = now(),
           reservation_status = CASE WHEN reservation_status = 'held' THEN 'released' ELSE reservation_status END
     WHERE id = cv.id;
    RETURN jsonb_build_object('decided', true, 'status', 'rejected', 'conversion_id', cv.id, 'user_id', cv.user_id);
  END IF;

  IF cv.status = 'held_for_review' THEN
    v_pay := public.mkt__charge_and_pay(c.id, cv.tranche_id, 'reserved', 'conversion', cv.id, cv.user_id);
  ELSE
    IF c.completions_count < c.max_completions THEN
      v_tranche := public.mkt__pick_tranche(c.id, cv.user_id);
    END IF;
    IF v_tranche IS NULL THEN RAISE EXCEPTION 'MKT_NO_BUDGET'; END IF;
    SELECT * INTO t FROM public.campaign_budget_tranches WHERE id = v_tranche;
    UPDATE public.campaign_conversions
       SET tranche_id = t.id, funding = t.funding, charge_amount = t.cost_per_completion,
           reward_amount = t.publisher_reward, fee_amount = t.cost_per_completion - t.publisher_reward
     WHERE id = cv.id;
    v_pay := public.mkt__charge_and_pay(c.id, t.id, 'remaining', 'conversion', cv.id, cv.user_id);
  END IF;
  UPDATE public.campaign_conversions
     SET status = 'credited', reservation_status = 'spent', review_note = NULLIF(btrim(COALESCE(p_note, '')), ''),
         reviewed_by = p_admin, reviewed_at = now(), paid_at = now(),
         bonus_unlocked = (v_pay->>'bonus_unlocked')::numeric,
         wallet_transaction_id = (v_pay->>'wallet_transaction_id')::uuid,
         earning_hold_id = (v_pay->>'earning_hold_id')::uuid
   WHERE id = cv.id;
  RETURN v_pay || jsonb_build_object('decided', true, 'status', 'credited', 'conversion_id', cv.id, 'user_id', cv.user_id);
END;
$$;


-- =============================================================================
-- 13. HELD EARNINGS (Q4 C) + REFERRER SHARE (Q1)
-- =============================================================================

-- Sweep: releases a due hold to the publisher wallet, unless the publisher is
-- now linked to the advertiser (e.g. a matching payout method was added since)
-- — then it goes to admin review.
CREATE OR REPLACE FUNCTION public.mkt_release_earning_hold(p_hold_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  h public.publisher_earning_holds%ROWTYPE;
  v_name text;
  v_wallet jsonb;
BEGIN
  SELECT * INTO h FROM public.publisher_earning_holds WHERE id = p_hold_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'MKT_HOLD_NOT_FOUND'; END IF;
  IF h.status <> 'held' OR h.release_at > now() THEN
    RETURN jsonb_build_object('released', false, 'reason', 'not_due', 'status', h.status);
  END IF;
  PERFORM public.mkt__money_mode();
  IF public.mkt_link_level(h.user_id, h.advertiser_id) <> 'none' THEN
    UPDATE public.publisher_earning_holds
       SET status = 'review', review_reason = 'publisher is linked to the advertiser at release time'
     WHERE id = h.id;
    RETURN jsonb_build_object('released', false, 'reason', 'linked', 'status', 'review');
  END IF;
  SELECT name INTO v_name FROM public.campaigns WHERE id = h.campaign_id;
  v_wallet := public.wallet_apply(h.user_id, h.amount, 'microtask', 'earned',
                                  'Microtask: ' || COALESCE(v_name, 'campaign') || ' (released)', h.id);
  UPDATE public.publisher_earning_holds
     SET status = 'released', released_at = now(), wallet_transaction_id = (v_wallet->>'transaction_id')::uuid
   WHERE id = h.id;
  RETURN jsonb_build_object('released', true, 'user_id', h.user_id, 'amount', h.amount,
                            'wallet_transaction_id', v_wallet->'transaction_id',
                            'previous_lifetime_earned', v_wallet->'previous_lifetime_earned');
END;
$$;

-- Admin decision on a hold in review (or an early release).
CREATE OR REPLACE FUNCTION public.mkt_decide_earning_hold(
  p_hold_id uuid, p_admin uuid, p_decision text, p_note text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  h public.publisher_earning_holds%ROWTYPE;
  v_wallet jsonb;
BEGIN
  IF p_decision NOT IN ('release', 'void') THEN RAISE EXCEPTION 'MKT_INVALID_DECISION'; END IF;
  IF char_length(btrim(COALESCE(p_note, ''))) < 10 THEN RAISE EXCEPTION 'MKT_REASON_REQUIRED'; END IF;
  SELECT * INTO h FROM public.publisher_earning_holds WHERE id = p_hold_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'MKT_HOLD_NOT_FOUND'; END IF;
  IF h.status NOT IN ('held', 'review') THEN
    RETURN jsonb_build_object('decided', false, 'status', h.status);
  END IF;
  PERFORM public.mkt__money_mode();
  IF p_decision = 'void' THEN
    UPDATE public.publisher_earning_holds
       SET status = 'void', void_reason = btrim(p_note), reviewed_by = p_admin, reviewed_at = now()
     WHERE id = h.id;
    RETURN jsonb_build_object('decided', true, 'status', 'void');
  END IF;
  v_wallet := public.wallet_apply(h.user_id, h.amount, 'microtask', 'earned', 'Microtask (released by admin)', h.id);
  UPDATE public.publisher_earning_holds
     SET status = 'released', released_at = now(), reviewed_by = p_admin, reviewed_at = now(),
         review_reason = COALESCE(review_reason, '') || CASE WHEN review_reason IS NULL THEN '' ELSE ' | ' END || btrim(p_note),
         wallet_transaction_id = (v_wallet->>'transaction_id')::uuid
   WHERE id = h.id;
  RETURN jsonb_build_object('decided', true, 'status', 'released', 'user_id', h.user_id, 'amount', h.amount,
                            'previous_lifetime_earned', v_wallet->'previous_lifetime_earned');
END;
$$;

-- Sweep: pays a due referrer share (Q1) to the referrer's publisher wallet,
-- unless the deposit was reversed (void) or the accounts are now linked (review).
CREATE OR REPLACE FUNCTION public.mkt_release_referrer_bonus(p_bonus_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  b public.advertiser_deposit_bonuses%ROWTYPE;
  v_reversed numeric;
  v_wallet jsonb;
BEGIN
  SELECT * INTO b FROM public.advertiser_deposit_bonuses WHERE id = p_bonus_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'MKT_BONUS_NOT_FOUND'; END IF;
  IF b.referrer_status IS DISTINCT FROM 'held' OR b.referrer_release_at > now() THEN
    RETURN jsonb_build_object('credited', false, 'reason', 'not_due', 'status', b.referrer_status);
  END IF;
  PERFORM public.mkt__money_mode();
  SELECT reversed_amount INTO v_reversed FROM public.advertiser_deposits WHERE id = b.deposit_id;
  IF COALESCE(v_reversed, 0) > 0 OR b.advertiser_status = 'void' THEN
    UPDATE public.advertiser_deposit_bonuses
       SET referrer_status = 'void', void_reason = COALESCE(void_reason, 'deposit reversed')
     WHERE id = b.id;
    RETURN jsonb_build_object('credited', false, 'reason', 'deposit_reversed', 'status', 'void');
  END IF;
  IF public.mkt__strong_link(b.referrer_id, b.advertiser_id) THEN
    UPDATE public.advertiser_deposit_bonuses
       SET referrer_status = 'review', referrer_review_reason = 'referrer and advertiser accounts are linked'
     WHERE id = b.id;
    RETURN jsonb_build_object('credited', false, 'reason', 'linked', 'status', 'review');
  END IF;
  v_wallet := public.wallet_apply(b.referrer_id, b.referrer_bonus, 'advertiser_deposit_bonus', 'bonus',
                                  'Advertiser referral bonus', b.id);
  UPDATE public.advertiser_deposit_bonuses
     SET referrer_status = 'credited', referrer_credited_at = now(),
         referrer_wallet_transaction_id = (v_wallet->>'transaction_id')::uuid
   WHERE id = b.id;
  RETURN jsonb_build_object('credited', true, 'referrer_id', b.referrer_id, 'amount', b.referrer_bonus,
                            'previous_lifetime_earned', v_wallet->'previous_lifetime_earned');
END;
$$;

CREATE OR REPLACE FUNCTION public.mkt_decide_referrer_bonus(
  p_bonus_id uuid, p_admin uuid, p_decision text, p_note text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  b public.advertiser_deposit_bonuses%ROWTYPE;
  v_wallet jsonb;
BEGIN
  IF p_decision NOT IN ('release', 'void') THEN RAISE EXCEPTION 'MKT_INVALID_DECISION'; END IF;
  IF char_length(btrim(COALESCE(p_note, ''))) < 10 THEN RAISE EXCEPTION 'MKT_REASON_REQUIRED'; END IF;
  SELECT * INTO b FROM public.advertiser_deposit_bonuses WHERE id = p_bonus_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'MKT_BONUS_NOT_FOUND'; END IF;
  IF b.referrer_status NOT IN ('held', 'review') THEN
    RETURN jsonb_build_object('decided', false, 'status', b.referrer_status);
  END IF;
  PERFORM public.mkt__money_mode();
  IF p_decision = 'void' OR b.advertiser_status = 'void' THEN
    UPDATE public.advertiser_deposit_bonuses
       SET referrer_status = 'void', referrer_reviewed_by = p_admin, void_reason = btrim(p_note)
     WHERE id = b.id;
    RETURN jsonb_build_object('decided', true, 'status', 'void');
  END IF;
  v_wallet := public.wallet_apply(b.referrer_id, b.referrer_bonus, 'advertiser_deposit_bonus', 'bonus',
                                  'Advertiser referral bonus', b.id);
  UPDATE public.advertiser_deposit_bonuses
     SET referrer_status = 'credited', referrer_credited_at = now(), referrer_reviewed_by = p_admin,
         referrer_wallet_transaction_id = (v_wallet->>'transaction_id')::uuid
   WHERE id = b.id;
  RETURN jsonb_build_object('decided', true, 'status', 'credited', 'referrer_id', b.referrer_id,
                            'amount', b.referrer_bonus,
                            'previous_lifetime_earned', v_wallet->'previous_lifetime_earned');
END;
$$;


-- =============================================================================
-- 14. ADMIN: advertiser status, flag, adjustments
-- =============================================================================

CREATE OR REPLACE FUNCTION public.mkt_set_advertiser_status(
  p_advertiser uuid, p_admin uuid, p_status text, p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF p_status NOT IN ('active', 'restricted', 'suspended') THEN RAISE EXCEPTION 'MKT_INVALID_STATUS'; END IF;
  IF char_length(btrim(COALESCE(p_reason, ''))) < 5 THEN RAISE EXCEPTION 'MKT_REASON_REQUIRED'; END IF;
  PERFORM 1 FROM public.advertiser_accounts WHERE user_id = p_advertiser FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'MKT_ADVERTISER_NOT_FOUND'; END IF;
  PERFORM public.mkt__money_mode();
  UPDATE public.advertiser_accounts
     SET status = p_status, status_reason = btrim(p_reason)
   WHERE user_id = p_advertiser;
  RETURN jsonb_build_object('status', p_status);
END;
$$;

-- Clears the D5 flag. Rejections already held stay held for admin sign-off.
CREATE OR REPLACE FUNCTION public.mkt_clear_advertiser_flag(p_advertiser uuid, p_admin uuid, p_note text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF char_length(btrim(COALESCE(p_note, ''))) < 10 THEN RAISE EXCEPTION 'MKT_REASON_REQUIRED'; END IF;
  PERFORM 1 FROM public.advertiser_accounts WHERE user_id = p_advertiser FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'MKT_ADVERTISER_NOT_FOUND'; END IF;
  PERFORM public.mkt__money_mode();
  UPDATE public.advertiser_accounts
     SET flagged_for_review = false, flag_cleared_by = p_admin, flag_cleared_at = now(),
         flag_reason = COALESCE(flag_reason, '') || ' | cleared: ' || btrim(p_note)
   WHERE user_id = p_advertiser;
  RETURN jsonb_build_object('flagged', false);
END;
$$;

-- Manual correction to the DEPOSIT bucket (bonus buckets are only ever moved
-- by the bonus functions). p_key makes it idempotent.
CREATE OR REPLACE FUNCTION public.mkt_adjust_advertiser_balance(
  p_advertiser uuid, p_admin uuid, p_delta numeric, p_reason text, p_key text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE v_applied boolean;
BEGIN
  IF p_delta IS NULL OR p_delta = 0 OR p_delta = 'NaN'::numeric OR abs(p_delta) > 100000 THEN
    RAISE EXCEPTION 'MKT_INVALID_AMOUNT';
  END IF;
  IF char_length(btrim(COALESCE(p_reason, ''))) < 5 THEN RAISE EXCEPTION 'MKT_REASON_REQUIRED'; END IF;
  IF NULLIF(btrim(COALESCE(p_key, '')), '') IS NULL THEN RAISE EXCEPTION 'MKT_KEY_REQUIRED'; END IF;
  PERFORM 1 FROM public.advertiser_accounts WHERE user_id = p_advertiser FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'MKT_ADVERTISER_NOT_FOUND'; END IF;
  v_applied := public.mkt__post(p_advertiser, 'adjustment', 'deposit', abs(p_delta), p_delta,
                                'adjust:' || p_key, NULL, NULL, 'admin', p_admin,
                                'Adjustment: ' || btrim(p_reason));
  RETURN jsonb_build_object('applied', v_applied);
END;
$$;


-- =============================================================================
-- 15. SWEEP + RECONCILIATION
-- =============================================================================

-- Public wrapper for the sweep: takes the locks, then expires one slot.
CREATE OR REPLACE FUNCTION public.mkt_expire_click(p_click_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  v_campaign uuid;
  c public.campaigns;
BEGIN
  SELECT campaign_id INTO v_campaign FROM public.campaign_clicks WHERE click_id = p_click_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'MKT_CLICK_NOT_FOUND'; END IF;
  c := public.mkt__lock_campaign(v_campaign);
  RETURN jsonb_build_object('expired', public.mkt__expire_click(p_click_id));
END;
$$;

-- Lists due work. The cron route calls each item's own function in its own
-- transaction (short locks, one failure doesn't block the rest):
--   expired_clicks      -> mkt_expire_click
--   auto_approve        -> mkt_decide_submission(id, NULL, 'system', 'approved')
--   finalize_rejections -> mkt_finalize_rejection
--   ended_campaigns     -> mkt_set_campaign_status(id, NULL, 'system', 'completed')
--   referrer_bonuses    -> mkt_release_referrer_bonus
--   earning_holds       -> mkt_release_earning_hold
CREATE OR REPLACE FUNCTION public.mkt_due_work(p_limit integer DEFAULT 200)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT jsonb_build_object(
    'expired_clicks', COALESCE((SELECT jsonb_agg(click_id) FROM (
        SELECT click_id FROM public.campaign_clicks
         WHERE status = 'active' AND expires_at <= now() ORDER BY expires_at LIMIT p_limit) x), '[]'::jsonb),
    'auto_approve', COALESCE((SELECT jsonb_agg(id) FROM (
        SELECT id FROM public.campaign_submissions
         WHERE status = 'pending' AND NOT requires_admin AND auto_approve_at <= now()
         ORDER BY auto_approve_at LIMIT p_limit) x), '[]'::jsonb),
    'finalize_rejections', COALESCE((SELECT jsonb_agg(id) FROM (
        SELECT cs.id FROM public.campaign_submissions cs
          JOIN public.campaign_clicks k ON k.click_id = cs.click_id
         WHERE cs.status = 'rejected' AND cs.appeal_deadline <= now() AND k.reservation_status = 'held'
         ORDER BY cs.appeal_deadline LIMIT p_limit) x), '[]'::jsonb),
    'ended_campaigns', COALESCE((SELECT jsonb_agg(id) FROM (
        SELECT id FROM public.campaigns
         WHERE status IN ('active', 'paused', 'budget_exhausted', 'pending_review') AND ends_at <= now()
         ORDER BY ends_at LIMIT p_limit) x), '[]'::jsonb),
    'referrer_bonuses', COALESCE((SELECT jsonb_agg(id) FROM (
        SELECT id FROM public.advertiser_deposit_bonuses
         WHERE referrer_status = 'held' AND referrer_release_at <= now()
         ORDER BY referrer_release_at LIMIT p_limit) x), '[]'::jsonb),
    'earning_holds', COALESCE((SELECT jsonb_agg(id) FROM (
        SELECT id FROM public.publisher_earning_holds
         WHERE status = 'held' AND release_at <= now() ORDER BY release_at LIMIT p_limit) x), '[]'::jsonb)
  );
$$;

-- Admin overview check (§6): every row returned is an accounting violation.
-- Expected result: {"advertisers": [], "campaigns": []}.
CREATE OR REPLACE FUNCTION public.mkt_reconciliation()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT jsonb_build_object(
    'advertisers', COALESCE((SELECT jsonb_agg(x) FROM (
        SELECT a.user_id, a.deposit_balance, a.bonus_locked, a.bonus_available,
               COALESCE(SUM(l.delta) FILTER (WHERE l.bucket = 'deposit'), 0)         AS ledger_deposit,
               COALESCE(SUM(l.delta) FILTER (WHERE l.bucket = 'bonus_locked'), 0)    AS ledger_bonus_locked,
               COALESCE(SUM(l.delta) FILTER (WHERE l.bucket = 'bonus_available'), 0) AS ledger_bonus_available
          FROM public.advertiser_accounts a
          LEFT JOIN public.advertiser_ledger l ON l.advertiser_id = a.user_id
         GROUP BY a.user_id
        HAVING a.deposit_balance <> COALESCE(SUM(l.delta) FILTER (WHERE l.bucket = 'deposit'), 0)
            OR a.bonus_locked    <> COALESCE(SUM(l.delta) FILTER (WHERE l.bucket = 'bonus_locked'), 0)
            OR a.bonus_available <> COALESCE(SUM(l.delta) FILTER (WHERE l.bucket = 'bonus_available'), 0)
    ) x), '[]'::jsonb),
    'campaigns', COALESCE((SELECT jsonb_agg(x) FROM (
        SELECT c.id, c.budget_allocated, c.budget_remaining, c.budget_reserved, c.budget_spent, c.budget_released,
               COALESCE(SUM(t.amount_allocated), 0) AS tranche_allocated,
               COALESCE(SUM(t.remaining), 0) AS tranche_remaining,
               COALESCE(SUM(t.reserved), 0) AS tranche_reserved,
               COALESCE(SUM(t.spent), 0) AS tranche_spent,
               COALESCE(SUM(t.released), 0) AS tranche_released
          FROM public.campaigns c
          LEFT JOIN public.campaign_budget_tranches t ON t.campaign_id = c.id
         GROUP BY c.id
        HAVING c.budget_allocated <> COALESCE(SUM(t.amount_allocated), 0)
            OR c.budget_remaining <> COALESCE(SUM(t.remaining), 0)
            OR c.budget_reserved  <> COALESCE(SUM(t.reserved), 0)
            OR c.budget_spent     <> COALESCE(SUM(t.spent), 0)
            OR c.budget_released  <> COALESCE(SUM(t.released), 0)
            -- every completion was charged exactly once
            OR c.completions_count <> COALESCE(SUM(floor(t.spent / t.cost_per_completion)), 0)
    ) x), '[]'::jsonb)
  );
$$;


-- =============================================================================
-- 16. PRIVILEGES — every mkt function: service_role only
-- =============================================================================

DO $$
DECLARE f regprocedure;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure
      FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public' AND p.proname LIKE 'mkt\_%'
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f);
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';

-- -----------------------------------------------------------------------------
-- Verification (run after applying; read-only)
-- -----------------------------------------------------------------------------
-- 1. 15 tables, RLS on, no client privileges except SELECT on the 3 readable ones:
--   SELECT c.relname, c.relrowsecurity AS rls,
--          has_table_privilege('authenticated', c.oid, 'SELECT') AS auth_select,
--          has_table_privilege('authenticated', c.oid, 'INSERT,UPDATE,DELETE') AS auth_write,
--          has_table_privilege('anon', c.oid, 'SELECT,INSERT,UPDATE,DELETE') AS anon_any
--   FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
--   WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname IN (
--     'marketplace_settings','referral_settings','advertiser_accounts','advertiser_deposits',
--     'advertiser_ledger','campaign_types','campaigns','campaign_budget_tranches','campaign_secrets',
--     'campaign_clicks','campaign_submissions','campaign_conversions','advertiser_deposit_bonuses',
--     'publisher_earning_holds','account_ip_observations')
--   ORDER BY 1;
--   Expect: 15 rows, rls = true, auth_write = false, anon_any = false, and
--   auth_select = true only for campaign_types, marketplace_settings, referral_settings.
--
-- 2. No mkt function executable by clients, none SECURITY DEFINER:
--   SELECT count(*) AS total,
--          count(*) FILTER (WHERE has_function_privilege('anon', p.oid, 'EXECUTE')
--                              OR has_function_privilege('authenticated', p.oid, 'EXECUTE')) AS client_exec,
--          count(*) FILTER (WHERE p.prosecdef) AS definer
--   FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--   WHERE n.nspname = 'public' AND p.proname LIKE 'mkt\_%';
--   Expect: client_exec = 0, definer = 0.
--
-- 3. Books balance (empty on a fresh install):
--   SELECT public.mkt_reconciliation();
--   Expect: {"campaigns": [], "advertisers": []}
--
-- 4. Guard is statement-scoped (run as ONE multi-statement script in the editor):
--   BEGIN;
--   SELECT public.mkt__money_mode();
--   SELECT public.mkt__in_money_mode();   -- separate statement -> expect FALSE
--   UPDATE public.advertiser_ledger SET description = 'x' WHERE false;
--                                         -- expect ERROR MKT_FUNCTION_ONLY
--   ROLLBACK;
--   A direct-connection transaction cannot inherit money mode from an earlier
--   mkt_* call; every money write must happen inside a single mkt_* statement.