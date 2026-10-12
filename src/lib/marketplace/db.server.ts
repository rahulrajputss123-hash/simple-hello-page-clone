import type { SupabaseClient } from "@supabase/supabase-js";

import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Phase 2 — server-side access to the Phase 1 marketplace schema.
 *
 * The generated `Database` type (src/integrations/supabase/types.ts) predates
 * the Phase 1 migration, so the marketplace tables and `mkt_*` functions are
 * accessed through an untyped service-role client. Row shapes are declared
 * here by hand and must be kept in sync with
 * supabase/migrations/20270301000000_phase1_marketplace_schema.sql.
 *
 * RULES (mirror the migration header):
 *  - Every money movement goes through a `mkt_*` function via `mktRpc`.
 *    One .rpc() call == one top-level statement == one money-mode window.
 *    Never run mkt_* inside a multi-statement transaction.
 *  - The only direct writes allowed by the guard triggers are the ones the
 *    migration lists: advertiser_accounts INSERT (zero balances) + profile
 *    fields; advertiser_deposits INSERT (status 'created') + gateway ids /
 *    created→pending|failed / pending→failed; campaigns draft INSERT + content.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type UntypedClient = SupabaseClient<any, "public", any>;

/** Service-role client without the stale generated schema. Server code only. */
export const mktDb = supabaseAdmin as unknown as UntypedClient;

export type AdvertiserAccountRow = {
  user_id: string;
  display_name: string;
  contact_email: string | null;
  website_url: string | null;
  status: "active" | "restricted" | "suspended";
  status_reason: string | null;
  deposit_balance: string | number;
  bonus_locked: string | number;
  bonus_available: string | number;
  lifetime_deposited: string | number;
  lifetime_bonus: string | number;
  lifetime_spent: string | number;
  flagged_for_review: boolean;
  terms_version: string;
  terms_accepted_at: string;
  created_at: string;
  updated_at: string;
};

export type DepositStatus = "created" | "pending" | "succeeded" | "failed" | "reversed";

export type AdvertiserDepositRow = {
  id: string;
  advertiser_id: string;
  amount_usd: string | number;
  gateway: "razorpay" | "manual";
  charge_currency: string;
  charge_amount: string | number;
  fx_rate: string | number;
  gateway_order_id: string | null;
  gateway_payment_id: string | null;
  status: DepositStatus;
  failure_reason: string | null;
  reversed_amount: string | number;
  reversal_shortfall: string | number;
  terms_version: string;
  credited_at: string | null;
  reversed_at: string | null;
  last_event: unknown;
  created_at: string;
  updated_at: string;
};

export type LedgerRow = {
  id: string;
  advertiser_id: string;
  kind:
    | "deposit"
    | "deposit_reversal"
    | "first_deposit_bonus"
    | "first_deposit_bonus_reversal"
    | "bonus_unlock"
    | "bonus_forfeit"
    | "campaign_allocation"
    | "campaign_release"
    | "conversion_charge"
    | "adjustment";
  bucket: "deposit" | "bonus_locked" | "bonus_available";
  amount: string | number;
  delta: string | number;
  balance_after: string | number;
  campaign_id: string | null;
  reference_type: string | null;
  reference_id: string | null;
  description: string;
  created_at: string;
};

export type CampaignDbStatus =
  | "draft"
  | "pending_review"
  | "active"
  | "paused"
  | "budget_exhausted"
  | "completed"
  | "rejected"
  | "archived";

export type CampaignRow = {
  id: string;
  advertiser_id: string;
  type_key: string;
  name: string;
  summary: string;
  verification_mode: string;
  countries: string[];
  publisher_reward: string | number;
  advertiser_cost: string | number | null;
  max_completions: number;
  completions_count: number;
  budget_allocated: string | number;
  budget_remaining: string | number;
  budget_reserved: string | number;
  budget_spent: string | number;
  budget_released: string | number;
  status: CampaignDbStatus;
  paused_by: "advertiser" | "admin" | "system" | null;
  needs_review: boolean;
  review_note: string | null;
  review_source: "admin" | "auto" | null;
  submitted_at: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  estimated_minutes: number | null;
  landing_url: string;
  is_featured: boolean;
  featured_started_at: string | null;
  featured_expires_at: string | null;
  featured_fee_paid: string | number;
  created_at: string;
  activated_at: string | null;
};

export type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
};

export type SubcategoryRow = {
  id: string;
  category_id: string;
  slug: string;
  name: string;
  description: string;
  sort_order: number;
  is_active: boolean;
};

export type MarketplaceSettingsRow = {
  deposits_enabled: boolean;
  manual_deposits_enabled: boolean;
  min_deposit_usd: string | number;
  max_deposit_usd: string | number;
  inr_per_usd: string | number | null;
  platform_fee_percent: string | number;
  promo_ends_at: string | null;
  first_deposit_bonus_percent: string | number;
  referral_bonus_split_percent: string | number;
  featured_price_per_day: string | number;
  fees_enabled: boolean;
  campaign_fee_usd: string | number;
  campaign_fee_type: "per_campaign" | "per_slot";
  terms_version: string;
};

export const num = (v: string | number | null | undefined): number => {
  const n = typeof v === "string" ? Number(v) : (v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

/** Machine-readable error raised by a mkt_* function (e.g. MKT_NOT_OWNER). */
export class MktRpcError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "MktRpcError";
    this.code = code;
  }
}

const ERROR_CODE = /\bMKT_[A-Z_]+\b/;

/**
 * Calls one Phase 1 money function. Exactly one PostgREST request, so the
 * function's money-mode flag is scoped to that single statement.
 */
export async function mktRpc<T = Record<string, unknown>>(
  name: string,
  args: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await mktDb.rpc(name, args);
  if (error) {
    const code = error.message?.match(ERROR_CODE)?.[0] ?? "MKT_RPC_FAILED";
    throw new MktRpcError(code, `${name}: ${error.message}`);
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new MktRpcError("MKT_BAD_RESPONSE", `${name}: unexpected response`);
  }
  return data as T;
}

export async function loadMarketplaceSettings(): Promise<MarketplaceSettingsRow> {
  const { data, error } = await mktDb
    .from("marketplace_settings")
    .select(
      "deposits_enabled, manual_deposits_enabled, min_deposit_usd, max_deposit_usd, inr_per_usd, platform_fee_percent, promo_ends_at, first_deposit_bonus_percent, referral_bonus_split_percent, featured_price_per_day, fees_enabled, campaign_fee_usd, campaign_fee_type, terms_version",
    )
    .eq("id", true)
    .maybeSingle();
  if (error) throw new Error(`marketplace_settings: ${error.message}`);
  if (!data) throw new Error("marketplace_settings row missing — Phase 1 migration not applied?");
  return data as MarketplaceSettingsRow;
}