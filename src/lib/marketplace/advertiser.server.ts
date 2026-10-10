import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import {
  type AdvertiserAccountRow,
  type AdvertiserDepositRow,
  type CampaignRow,
  type CampaignDbStatus,
  type LedgerRow,
  type MarketplaceSettingsRow,
  MktRpcError,
  loadMarketplaceSettings,
  mktDb,
  mktRpc,
  num,
} from "./db.server";
import { campaignTotals, hasSufficientFunds } from "./pricing";
import {
  type RazorpayWebhookEvent,
  createRazorpayOrder,
  razorpayConfigured,
  razorpayKeyId,
  verifyCheckoutSignature,
  verifyWebhookSignature,
} from "./razorpay.server";

/**
 * Gets the site URL for postback URLs, preferring SITE_URL env var,
 * falling back to request origin.
 */
function getSiteUrl(): string {
  const envUrl = process.env['SITE_URL'];
  if (envUrl) return envUrl.replace(/\/$/, ''); // remove trailing slash
  
  const request = getRequest();
  if (request?.headers) {
    const origin = request.headers.get('origin') || 
                   request.headers.get('referer')?.split('/').slice(0, 3).join('/') ||
                   '';
    if (origin) return origin.replace(/\/$/, '');
  }
  
  // Fallback to empty string (will produce relative URL)
  return '';
}

/**
 * Phase 2 — advertiser activation, Razorpay deposits, dashboard reads.
 * Phase 3 — campaign creation (CORRECTED: mkt_create_campaign doesn't exist!)
 *
 * CRITICAL SCHEMA CORRECTIONS:
 * - Campaign columns: verification_mode is 'manual_proof' or 'auto' (not 'manual')
 * - Campaign columns: proof_description (not proof_instructions)
 * - Campaign columns: steps (jsonb array, REQUIRED), landing_url (REQUIRED)
 * - Type_key must be from campaign_types table (e.g. 'custom', not 'microtask')
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ MONEY RULE: a deposit is credited (mkt_credit_deposit) from exactly one │
 * │ place — processRazorpayWebhook — and only after the webhook signature   │
 * │ verifies AND the payment entity is `captured`. Nothing the browser      │
 * │ sends (confirmCheckout) moves money. Same pattern as the Phase 0        │
 * │ offer postbacks: the gateway tells us, we never take the client's word. │
 * └─────────────────────────────────────────────────────────────────────────┘
 */

/* ------------------------------------------------------------------ types */

export type AdvertiserAccountView = {
  userId: string;
  displayName: string;
  contactEmail: string | null;
  websiteUrl: string | null;
  status: AdvertiserAccountRow["status"];
  statusReason: string | null;
  depositBalance: number;
  bonusLocked: number;
  bonusAvailable: number;
  /** deposit + bonus_available — what campaigns can spend right now. */
  spendable: number;
  lifetimeDeposited: number;
  lifetimeBonus: number;
  lifetimeSpent: number;
  flaggedForReview: boolean;
  termsVersion: string;
  createdAt: string;
};

export type SettingsView = {
  depositsEnabled: boolean;
  minDepositUsd: number;
  maxDepositUsd: number;
  /** null → charged in USD; otherwise Checkout is opened in INR at this rate. */
  inrPerUsd: number | null;
  platformFeePercent: number;
  promoActive: boolean;
  promoEndsAt: string | null;
  firstDepositBonusPercent: number;
  featuredPricePerDay: number;
  feesEnabled: boolean;
  campaignFeeUsd: number;
  campaignFeeType: "per_campaign" | "per_slot";
  termsVersion: string;
  razorpayConfigured: boolean;
};

export type CampaignView = {
  id: string;
  title: string;
  summary: string;
  status: CampaignRow["status"];
  /** Four-bucket grouping the UI tabs use. */
  group: "active" | "paused" | "draft" | "completed";
  verification: "auto" | "proof";
  reward: number;
  costPerCompletion: number | null;
  maxCompletions: number;
  completions: number;
  budget: number;
  spent: number;
  reserved: number;
  remaining: number;
  countries: string[];
  pausedBy: CampaignRow["paused_by"];
  needsReview: boolean;
  reviewNote: string | null;
  pendingReviews: number;
  createdAt: string;
};

export type TransactionView = {
  id: string;
  kind: LedgerRow["kind"];
  bucket: LedgerRow["bucket"];
  label: string;
  amount: number; // signed, from the advertiser's point of view
  campaignId: string | null;
  campaignName: string | null;
  description: string;
  createdAt: string;
};

export type DepositView = {
  id: string;
  amountUsd: number;
  chargeCurrency: string;
  chargeAmount: number;
  gateway: AdvertiserDepositRow["gateway"];
  status: AdvertiserDepositRow["status"];
  gatewayOrderId: string | null;
  gatewayPaymentId: string | null;
  failureReason: string | null;
  creditedAt: string | null;
  createdAt: string;
};

export type AdvertiserOverview = {
  account: AdvertiserAccountView | null;
  settings: SettingsView;
  stats: { activeCampaigns: number; completedConversions: number; pendingReviews: number };
  liveCampaigns: CampaignView[];
  recentDeposits: DepositView[];
};

/* -------------------------------------------------------------- mappers */

function accountView(a: AdvertiserAccountRow): AdvertiserAccountView {
  const deposit = num(a.deposit_balance);
  const bonusAvail = num(a.bonus_available);
  return {
    userId: a.user_id,
    displayName: a.display_name,
    contactEmail: a.contact_email,
    websiteUrl: a.website_url,
    status: a.status,
    statusReason: a.status_reason,
    depositBalance: deposit,
    bonusLocked: num(a.bonus_locked),
    bonusAvailable: bonusAvail,
    spendable: Math.round((deposit + bonusAvail) * 100) / 100,
    lifetimeDeposited: num(a.lifetime_deposited),
    lifetimeBonus: num(a.lifetime_bonus),
    lifetimeSpent: num(a.lifetime_spent),
    flaggedForReview: a.flagged_for_review,
    termsVersion: a.terms_version,
    createdAt: a.created_at,
  };
}

function settingsView(s: MarketplaceSettingsRow): SettingsView {
  const promoEnds = s.promo_ends_at ? new Date(s.promo_ends_at) : null;
  return {
    depositsEnabled: s.deposits_enabled,
    minDepositUsd: num(s.min_deposit_usd),
    maxDepositUsd: num(s.max_deposit_usd),
    inrPerUsd: s.inr_per_usd == null ? null : num(s.inr_per_usd),
    platformFeePercent: num(s.platform_fee_percent),
    promoActive: Boolean(promoEnds && promoEnds.getTime() > Date.now()),
    promoEndsAt: s.promo_ends_at,
    firstDepositBonusPercent: num(s.first_deposit_bonus_percent),
    featuredPricePerDay: num(s.featured_price_per_day),
    feesEnabled: s.fees_enabled,
    campaignFeeUsd: num(s.campaign_fee_usd),
    campaignFeeType: s.campaign_fee_type,
    termsVersion: s.terms_version,
    razorpayConfigured: razorpayConfigured(),
  };
}

export function campaignGroup(status: CampaignRow["status"]): CampaignView["group"] {
  switch (status) {
    case "active":
    case "budget_exhausted":
      return "active";
    case "paused":
      return "paused";
    case "draft":
    case "pending_review":
    case "rejected":
      return "draft";
    default:
      return "completed";
  }
}

function campaignView(c: CampaignRow, pendingReviews = 0): CampaignView {
  return {
    id: c.id,
    title: c.name,
    summary: c.summary,
    status: c.status,
    group: campaignGroup(c.status),
    verification: c.verification_mode === "auto" ? "auto" : "proof",
    reward: num(c.publisher_reward),
    costPerCompletion: c.advertiser_cost == null ? null : num(c.advertiser_cost),
    maxCompletions: c.max_completions,
    completions: c.completions_count,
    budget: num(c.budget_allocated),
    spent: num(c.budget_spent),
    reserved: num(c.budget_reserved),
    remaining: num(c.budget_remaining),
    countries: c.countries ?? [],
    pausedBy: c.paused_by,
    needsReview: c.needs_review,
    reviewNote: c.review_note,
    pendingReviews,
    createdAt: c.created_at,
  };
}

function depositView(d: AdvertiserDepositRow): DepositView {
  return {
    id: d.id,
    amountUsd: num(d.amount_usd),
    chargeCurrency: d.charge_currency,
    chargeAmount: num(d.charge_amount),
    gateway: d.gateway,
    status: d.status,
    gatewayOrderId: d.gateway_order_id,
    gatewayPaymentId: d.gateway_payment_id,
    failureReason: d.failure_reason,
    creditedAt: d.credited_at,
    createdAt: d.created_at,
  };
}

const LEDGER_LABEL: Record<LedgerRow["kind"], string> = {
  deposit: "Campaign Deposit",
  deposit_reversal: "Deposit Reversed",
  first_deposit_bonus: "First Deposit Bonus",
  first_deposit_bonus_reversal: "Bonus Reversed",
  bonus_unlock: "Bonus Unlocked",
  bonus_forfeit: "Bonus Forfeited",
  campaign_allocation: "Campaign Budget",
  campaign_release: "Budget Returned",
  conversion_charge: "Conversion Charge",
  adjustment: "Adjustment",
};

/* ---------------------------------------------------------------- reads */

export async function getAccount(userId: string): Promise<AdvertiserAccountRow | null> {
  const { data, error } = await mktDb
    .from("advertiser_accounts")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(`advertiser_accounts: ${error.message}`);
  return (data as AdvertiserAccountRow | null) ?? null;
}

async function pendingReviewCounts(campaignIds: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (!campaignIds.length) return out;
  const { data, error } = await mktDb
    .from("campaign_submissions")
    .select("campaign_id")
    .in("campaign_id", campaignIds)
    .in("status", ["pending", "appealed"]);
  if (error) throw new Error(`campaign_submissions: ${error.message}`);
  for (const row of (data ?? []) as { campaign_id: string }[]) {
    out.set(row.campaign_id, (out.get(row.campaign_id) ?? 0) + 1);
  }
  return out;
}

const CAMPAIGN_COLS =
  "id, advertiser_id, type_key, name, summary, verification_mode, countries, publisher_reward, advertiser_cost, max_completions, completions_count, budget_allocated, budget_remaining, budget_reserved, budget_spent, budget_released, status, paused_by, needs_review, review_note, created_at, activated_at";

export async function listCampaignsImpl(userId: string): Promise<CampaignView[]> {
  const { data, error } = await mktDb
    .from("campaigns")
    .select(CAMPAIGN_COLS)
    .eq("advertiser_id", userId)
    .neq("status", "archived")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`campaigns: ${error.message}`);
  const rows = (data ?? []) as CampaignRow[];
  const pending = await pendingReviewCounts(rows.map((r) => r.id));
  return rows.map((r) => campaignView(r, pending.get(r.id) ?? 0));
}

export async function getOverviewImpl(userId: string): Promise<AdvertiserOverview> {
  const [account, settings] = await Promise.all([getAccount(userId), loadMarketplaceSettings()]);
  const base: AdvertiserOverview = {
    account: account ? accountView(account) : null,
    settings: settingsView(settings),
    stats: { activeCampaigns: 0, completedConversions: 0, pendingReviews: 0 },
    liveCampaigns: [],
    recentDeposits: [],
  };
  if (!account) return base;

  const campaigns = await listCampaignsImpl(userId);
  const [{ data: deposits, error: depErr }] = await Promise.all([
    mktDb
      .from("advertiser_deposits")
      .select("*")
      .eq("advertiser_id", userId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);
  if (depErr) throw new Error(`advertiser_deposits: ${depErr.message}`);

  const active = campaigns.filter((c) => c.group === "active");
  return {
    ...base,
    stats: {
      activeCampaigns: active.length,
      completedConversions: campaigns.reduce((n, c) => n + c.completions, 0),
      pendingReviews: campaigns.reduce((n, c) => n + c.pendingReviews, 0),
    },
    liveCampaigns: active.slice(0, 3),
    recentDeposits: ((deposits ?? []) as AdvertiserDepositRow[]).map(depositView),
  };
}

export async function listTransactionsImpl(userId: string, limit = 100): Promise<TransactionView[]> {
  const { data, error } = await mktDb
    .from("advertiser_ledger")
    .select(
      "id, advertiser_id, kind, bucket, amount, delta, balance_after, campaign_id, reference_type, reference_id, description, created_at",
    )
    .eq("advertiser_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`advertiser_ledger: ${error.message}`);
  const rows = (data ?? []) as LedgerRow[];

  const campaignIds = [...new Set(rows.map((r) => r.campaign_id).filter(Boolean))] as string[];
  const names = new Map<string, string>();
  if (campaignIds.length) {
    const { data: cs } = await mktDb.from("campaigns").select("id, name").in("id", campaignIds);
    for (const c of (cs ?? []) as { id: string; name: string }[]) names.set(c.id, c.name);
  }
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    bucket: r.bucket,
    label: LEDGER_LABEL[r.kind] ?? r.kind,
    amount: num(r.delta),
    campaignId: r.campaign_id,
    campaignName: r.campaign_id ? (names.get(r.campaign_id) ?? null) : null,
    description: r.description,
    createdAt: r.created_at,
  }));
}

export async function getDepositImpl(userId: string, depositId: string): Promise<DepositView | null> {
  const { data, error } = await mktDb
    .from("advertiser_deposits")
    .select("*")
    .eq("id", depositId)
    .eq("advertiser_id", userId)
    .maybeSingle();
  if (error) throw new Error(`advertiser_deposits: ${error.message}`);
  return data ? depositView(data as AdvertiserDepositRow) : null;
}

/* ----------------------------------------------------------- activation */

export const becomeAdvertiserInput = z.object({
  displayName: z.string().trim().min(2).max(60),
  contactEmail: z.string().trim().email().max(254).nullable().optional(),
  websiteUrl: z
    .string()
    .trim()
    .max(500)
    .regex(/^https?:\/\//, "Must start with http:// or https://")
    .nullable()
    .optional(),
  acceptTerms: z.literal(true),
});
export type BecomeAdvertiserInput = z.infer<typeof becomeAdvertiserInput>;

/**
 * Creates the advertiser account. A plain INSERT: the Phase 1 guard trigger
 * allows it as long as every money column is 0 and status is 'active', which
 * the defaults guarantee. Idempotent — an existing account is returned as-is.
 */
export async function becomeAdvertiserImpl(
  userId: string,
  input: BecomeAdvertiserInput,
): Promise<{ created: boolean; account: AdvertiserAccountView }> {
  const existing = await getAccount(userId);
  if (existing) return { created: false, account: accountView(existing) };

  const settings = await loadMarketplaceSettings();
  const { data, error } = await mktDb
    .from("advertiser_accounts")
    .insert({
      user_id: userId,
      display_name: input.displayName,
      contact_email: input.contactEmail || null,
      website_url: input.websiteUrl || null,
      terms_version: settings.terms_version,
    })
    .select("*")
    .single();
  if (error) {
    // Race: a second tab inserted first.
    if (error.code === "23505") {
      const again = await getAccount(userId);
      if (again) return { created: false, account: accountView(again) };
    }
    throw new Error(`advertiser_accounts insert: ${error.message}`);
  }
  return { created: true, account: accountView(data as AdvertiserAccountRow) };
}

export const updateAdvertiserProfileInput = becomeAdvertiserInput.omit({ acceptTerms: true });

export async function updateAdvertiserProfileImpl(
  userId: string,
  input: z.infer<typeof updateAdvertiserProfileInput>,
): Promise<AdvertiserAccountView> {
  const { data, error } = await mktDb
    .from("advertiser_accounts")
    .update({
      display_name: input.displayName,
      contact_email: input.contactEmail || null,
      website_url: input.websiteUrl || null,
    })
    .eq("user_id", userId)
    .select("*")
    .single();
  if (error) throw new Error(`advertiser_accounts update: ${error.message}`);
  return accountView(data as AdvertiserAccountRow);
}

/* ------------------------------------------------------------- deposits */

export class DepositError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "DepositError";
    this.code = code;
  }
}

const toMinor = (amount: number) => Math.round(amount * 100);

export type CreateDepositResult = {
  depositId: string;
  orderId: string;
  keyId: string;
  amountMinor: number;
  currency: string;
  amountUsd: number;
};

/**
 * Step 1 of a deposit. Inserts the `created` row (allowed by the guard), asks
 * Razorpay for an order, records the order id and moves the row to `pending`
 * (allowed transition). No balance changes here.
 */
export async function createDepositImpl(userId: string, amountUsd: number): Promise<CreateDepositResult> {
  const account = await getAccount(userId);
  if (!account) throw new DepositError("NOT_ADVERTISER", "Activate advertiser mode first.");
  if (account.status !== "active") {
    throw new DepositError("ACCOUNT_" + account.status.toUpperCase(), "Your advertiser account can't deposit right now.");
  }
  const s = await loadMarketplaceSettings();
  if (!s.deposits_enabled) throw new DepositError("DEPOSITS_DISABLED", "Deposits are temporarily unavailable.");
  if (!razorpayConfigured()) throw new DepositError("GATEWAY_NOT_CONFIGURED", "Payments are not configured yet.");

  const amount = Math.round(amountUsd * 100) / 100;
  if (!(amount >= num(s.min_deposit_usd) && amount <= num(s.max_deposit_usd))) {
    throw new DepositError(
      "AMOUNT_OUT_OF_RANGE",
      `Deposit between $${num(s.min_deposit_usd).toFixed(2)} and $${num(s.max_deposit_usd).toFixed(2)}.`,
    );
  }

  // Charge currency: INR when a rate is configured (Razorpay's home market), else USD.
  const inr = s.inr_per_usd == null ? null : num(s.inr_per_usd);
  const currency = inr ? "INR" : "USD";
  const fxRate = inr ?? 1;
  const chargeAmount = Math.round(amount * fxRate * 100) / 100;

  const { data: created, error: insErr } = await mktDb
    .from("advertiser_deposits")
    .insert({
      advertiser_id: userId,
      amount_usd: amount,
      gateway: "razorpay",
      charge_currency: currency,
      charge_amount: chargeAmount,
      fx_rate: fxRate,
      terms_version: s.terms_version,
    })
    .select("id")
    .single();
  if (insErr) throw new Error(`advertiser_deposits insert: ${insErr.message}`);
  const depositId = (created as { id: string }).id;

  let order;
  try {
    order = await createRazorpayOrder({
      amountMinor: toMinor(chargeAmount),
      currency,
      receipt: depositId,
      notes: { deposit_id: depositId, advertiser_id: userId, amount_usd: amount.toFixed(2) },
    });
  } catch (err) {
    await mktDb
      .from("advertiser_deposits")
      .update({
        status: "failed",
        failure_reason: `order_create_failed: ${err instanceof Error ? err.message : String(err)}`.slice(0, 500),
      })
      .eq("id", depositId);
    throw new DepositError("ORDER_FAILED", "Couldn't start the payment. Please try again.");
  }

  const { error: updErr } = await mktDb
    .from("advertiser_deposits")
    .update({ gateway_order_id: order.id, status: "pending" })
    .eq("id", depositId);
  if (updErr) throw new Error(`advertiser_deposits order update: ${updErr.message}`);

  return {
    depositId,
    orderId: order.id,
    keyId: razorpayKeyId(),
    amountMinor: toMinor(chargeAmount),
    currency,
    amountUsd: amount,
  };
}

/**
 * Step 2 (browser → server after Checkout reports success). Verifies the
 * checkout signature and records the payment id so the UI can show "payment
 * received, confirming…". DOES NOT CREDIT. The balance moves only when the
 * `payment.captured` webhook arrives (processRazorpayWebhook).
 */
export async function confirmCheckoutImpl(
  userId: string,
  input: { depositId: string; orderId: string; paymentId: string; signature: string },
): Promise<DepositView> {
  const { data, error } = await mktDb
    .from("advertiser_deposits")
    .select("*")
    .eq("id", input.depositId)
    .eq("advertiser_id", userId)
    .maybeSingle();
  if (error) throw new Error(`advertiser_deposits: ${error.message}`);
  const d = data as AdvertiserDepositRow | null;
  if (!d) throw new DepositError("NOT_FOUND", "Deposit not found.");
  if (d.gateway_order_id !== input.orderId) throw new DepositError("ORDER_MISMATCH", "Order does not match.");
  if (!verifyCheckoutSignature(input)) throw new DepositError("BAD_SIGNATURE", "Payment signature check failed.");

  // Already credited by the webhook (common — Razorpay is fast): nothing to record.
  if (d.status === "succeeded" || d.status === "reversed") return depositView(d);

  if (d.status === "pending" && d.gateway_payment_id !== input.paymentId) {
    const { error: updErr } = await mktDb
      .from("advertiser_deposits")
      .update({
        gateway_payment_id: input.paymentId,
        last_event: { source: "checkout", payment_id: input.paymentId, at: new Date().toISOString() },
      })
      .eq("id", d.id)
      .eq("status", "pending");
    // A webhook racing us may have moved the row to 'succeeded' (guard rejects
    // our UPDATE then) — fine, the webhook already set the payment id.
    if (updErr && !/MKT_FUNCTION_ONLY/.test(updErr.message)) {
      throw new Error(`advertiser_deposits payment update: ${updErr.message}`);
    }
  }
  const fresh = await getDepositImpl(userId, d.id);
  return fresh ?? depositView(d);
}

/** Browser gave up / Checkout dismissed. Only created|pending → failed. */
export async function abandonDepositImpl(userId: string, depositId: string, reason: string): Promise<void> {
  await mktDb
    .from("advertiser_deposits")
    .update({ status: "failed", failure_reason: reason.slice(0, 200) })
    .eq("id", depositId)
    .eq("advertiser_id", userId)
    .in("status", ["created", "pending"]);
}

/* --------------------------------------------------------------- webhook */

export type WebhookOutcome = {
  ok: boolean;
  event: string;
  action: string;
  depositId?: string;
  detail?: unknown;
};

async function depositByOrder(orderId: string | null | undefined): Promise<AdvertiserDepositRow | null> {
  if (!orderId) return null;
  const { data, error } = await mktDb.from("advertiser_deposits").select("*").eq("gateway_order_id", orderId).maybeSingle();
  if (error) throw new Error(`advertiser_deposits by order: ${error.message}`);
  return (data as AdvertiserDepositRow | null) ?? null;
}

async function depositByPayment(paymentId: string | null | undefined): Promise<AdvertiserDepositRow | null> {
  if (!paymentId) return null;
  const { data, error } = await mktDb.from("advertiser_deposits").select("*").eq("gateway_payment_id", paymentId).maybeSingle();
  if (error) throw new Error(`advertiser_deposits by payment: ${error.message}`);
  return (data as AdvertiserDepositRow | null) ?? null;
}

const minorToUsd = (minor: number, fxRate: number) => Math.round((minor / 100 / fxRate) * 100) / 100;

/**
 * The ONLY code path that credits or reverses advertiser deposits.
 *
 * - Verifies X-Razorpay-Signature over the raw body (RAZORPAY_WEBHOOK_SECRET).
 * - payment.captured / order.paid → mkt_credit_deposit (idempotent: a retry
 *   or the second of the two events returns already_credited).
 * - payment.failed → pending → failed (guard-allowed transition; ignored if
 *   the deposit already succeeded).
 * - refund.created / refund.processed, payment.dispute.lost → mkt_reverse_deposit
 *   keyed on the refund/dispute id (idempotent).
 * - Anything else → acknowledged, no-op. Always answer 200 once the signature
 *   verifies so Razorpay stops retrying; a bad signature is a 401.
 */
export async function processRazorpayWebhook(rawBody: string, signature: string | null): Promise<WebhookOutcome & { httpStatus: number }> {
  if (!verifyWebhookSignature(rawBody, signature)) {
    return { ok: false, event: "?", action: "rejected_bad_signature", httpStatus: 401 };
  }
  let evt: RazorpayWebhookEvent;
  try {
    evt = JSON.parse(rawBody) as RazorpayWebhookEvent;
  } catch {
    return { ok: false, event: "?", action: "rejected_bad_json", httpStatus: 400 };
  }
  const out = await routeWebhookEvent(evt);
  return { ...out, httpStatus: 200 };
}

export async function routeWebhookEvent(evt: RazorpayWebhookEvent): Promise<WebhookOutcome> {
  const event = evt.event ?? "";
  const payment = evt.payload?.payment?.entity;

  if (event === "payment.captured" || event === "order.paid") {
    const orderId = payment?.order_id ?? evt.payload?.order?.entity?.id ?? null;
    const d = (await depositByOrder(orderId)) ?? (await depositByPayment(payment?.id));
    if (!d) return { ok: true, event, action: "ignored_unknown_order", detail: { orderId } };
    if (payment && payment.status !== "captured") {
      // order.paid can arrive with the payment entity; only credit captured money.
      return { ok: true, event, action: "ignored_not_captured", depositId: d.id, detail: payment.status };
    }
    const paymentId = payment?.id ?? d.gateway_payment_id;
    if (!paymentId) return { ok: true, event, action: "ignored_no_payment_id", depositId: d.id };

    // Amount sanity: the captured amount must match what we asked Razorpay for.
    if (payment && (payment.amount !== toMinor(num(d.charge_amount)) || payment.currency !== d.charge_currency)) {
      await mktDb
        .from("advertiser_deposits")
        .update({ last_event: { event, payment_id: paymentId, mismatch: { amount: payment.amount, currency: payment.currency } } })
        .eq("id", d.id);
      console.error("[razorpay-webhook] amount mismatch", { depositId: d.id, expected: d.charge_amount, got: payment.amount });
      return { ok: true, event, action: "held_amount_mismatch", depositId: d.id };
    }

    const result = await mktRpc("mkt_credit_deposit", {
      p_deposit_id: d.id,
      p_gateway_payment_id: paymentId,
      p_event: { event, payment_id: paymentId, created_at: evt.created_at ?? null },
      p_confirmed_by: null,
    });
    return { ok: true, event, action: result["credited"] ? "credited" : `noop_${String(result["reason"] ?? "")}`, depositId: d.id, detail: result };
  }

  if (event === "payment.failed") {
    const d = await depositByOrder(payment?.order_id);
    if (!d) return { ok: true, event, action: "ignored_unknown_order" };
    if (d.status !== "pending" && d.status !== "created") return { ok: true, event, action: "ignored_terminal", depositId: d.id };
    const { error } = await mktDb
      .from("advertiser_deposits")
      .update({
        status: "failed",
        gateway_payment_id: payment?.id ?? null,
        failure_reason: [payment?.error_code, payment?.error_description].filter(Boolean).join(": ").slice(0, 500) || "payment_failed",
        last_event: { event, payment_id: payment?.id ?? null },
      })
      .eq("id", d.id)
      .in("status", ["created", "pending"]);
    if (error) throw new Error(`advertiser_deposits fail update: ${error.message}`);
    return { ok: true, event, action: "marked_failed", depositId: d.id };
  }

  if (event === "refund.created" || event === "refund.processed" || event === "payment.dispute.lost") {
    const refund = evt.payload?.refund?.entity;
    const dispute = evt.payload?.dispute?.entity;
    const paymentId = refund?.payment_id ?? dispute?.payment_id ?? payment?.id ?? null;
    const d = await depositByPayment(paymentId);
    if (!d) return { ok: true, event, action: "ignored_unknown_payment", detail: { paymentId } };
    if (!d.credited_at) return { ok: true, event, action: "ignored_never_credited", depositId: d.id };
    const amountMinor = refund?.amount ?? dispute?.amount ?? toMinor(num(d.charge_amount));
    const amountUsd = Math.min(num(d.amount_usd), minorToUsd(amountMinor, num(d.fx_rate)));
    const key = refund?.id ?? dispute?.id ?? `${event}:${paymentId}`;
    try {
      const result = await mktRpc("mkt_reverse_deposit", {
        p_deposit_id: d.id,
        p_amount: amountUsd,
        p_reversal_key: key,
        p_reason: event,
        p_event: { event, refund_id: refund?.id ?? null, dispute_id: dispute?.id ?? null },
      });
      return { ok: true, event, action: result["reversed"] ? "reversed" : `noop_${String(result["reason"] ?? "")}`, depositId: d.id, detail: result };
    } catch (err) {
      if (err instanceof MktRpcError) return { ok: false, event, action: `reverse_failed_${err.code}`, depositId: d.id };
      throw err;
    }
  }

  return { ok: true, event, action: "ignored_event" };
}

/* ------------------------------------------------------------ campaigns */

export const createCampaignInput = z.object({
  title: z.string().trim().min(3).max(80),
  description: z.string().trim().min(10).max(1000),
  verification: z.enum(["auto", "proof"]),
  reward: z.number().positive().min(0.05).max(1000),
  slots: z.number().int().min(15).max(100000), // Slots-first budgeting (min 15)
  countries: z.array(z.string()).min(1).max(20),
  categoryId: z.string().uuid(),
  subcategoryId: z.string().uuid().optional(),
  landingUrl: z.string().trim().url().max(2048).regex(/^https:\/\//, "Must be an HTTPS URL"),
  estimatedMinutes: z.number().int().min(1).max(1440).optional(),
  featured: z.boolean().optional(),
  featuredDays: z.number().int().min(1).max(30).optional(),
  // Auto verification fields
  trackingUrl: z.string().trim().url().max(2048).regex(/^https:\/\//, "Must be an HTTPS URL").optional(),
  ipAllowlist: z.array(z.string()).max(50).optional(),
  // Offer rules confirmation
  rulesAccepted: z.boolean(),
});
export type CreateCampaignInput = z.infer<typeof createCampaignInput>;

/**
 * Creates a campaign in draft status, then submits it for review.
 * NOTE: mkt_create_campaign() doesn't exist - we INSERT then call mkt_submit_campaign_with_fee()
 * CRITICAL: campaigns_guard trigger only allows INSERT of empty draft (advertiser_cost
 * and fee_percent must be NULL). Pricing is set by mkt_submit_campaign.
 * 
 * CAMPAIGN FEES: If fees_enabled=true, mkt_submit_campaign_with_fee charges the fee once
 * before submitting, using pricing.ts for preflight validation.
 * 
 * FEATURED PLACEMENT: If featured=true, charges the featured fee from advertiser balance
 * atomically with campaign creation. Fee is calculated server-side only (never trust client).
 * 
 * SLOTS-FIRST BUDGETING: Budget = slots × reward × (1 + platform_fee_percent/100).
 * Server calculates budget; never trust client amounts.
 */
export async function createCampaignImpl(
  userId: string,
  input: CreateCampaignInput,
): Promise<{ 
  campaignId: string; 
  status: CampaignDbStatus; 
  featuredApplied?: boolean; 
  featuredError?: string;
  postbackUrl?: string;
  postbackSecret?: string;
}> {
  const account = await getAccount(userId);
  if (!account) throw new DepositError("NOT_ADVERTISER", "Activate advertiser mode first.");
  if (account.status !== "active") {
    throw new DepositError("ACCOUNT_RESTRICTED", "Your advertiser account cannot create campaigns.");
  }

  // Validate offer rules acceptance
  if (!input.rulesAccepted) {
    throw new DepositError("RULES_NOT_ACCEPTED", "You must accept the offer rules before creating a campaign.");
  }

  // Validate auto verification requirements
  if (input.verification === "auto") {
    if (!input.trackingUrl) {
      throw new DepositError("TRACKING_URL_REQUIRED", "Tracking URL is required for auto verification.");
    }
    if (!input.trackingUrl.includes("{click_id}")) {
      throw new DepositError("INVALID_TRACKING_URL", "Tracking URL must contain {click_id} placeholder.");
    }
  }

  // Load settings for budget calculation and featured pricing
  const settings = await loadMarketplaceSettings();
  
  // Calculate totals using pricing module
  const featuredDays = input.featured && input.featuredDays ? input.featuredDays : 0;
  const featuredFee = featuredDays > 0 ? num(settings.featured_price_per_day) * featuredDays : 0;
  
  const totals = campaignTotals({
    slots: input.slots,
    reward: input.reward,
    feePercent: num(settings.platform_fee_percent),
    feesEnabled: settings.fees_enabled,
    feeUsd: num(settings.campaign_fee_usd),
    feeType: settings.campaign_fee_type,
    featuredFee,
  });

  // Calculate spendable balance
  const spendable = Math.round((num(account.deposit_balance) + num(account.bonus_available)) * 100) / 100;

  // Preflight check using pricing module
  if (!hasSufficientFunds({
    spendable,
    deposit: num(account.deposit_balance),
    totals,
  })) {
    throw new DepositError(
      "INSUFFICIENT_FUNDS",
      `Not enough balance. Need $${totals.total.toFixed(2)} (campaign: $${totals.allocation.toFixed(2)}${
        totals.campaignFee > 0 ? `, fee: $${totals.campaignFee.toFixed(2)}` : ""
      }${
        totals.featuredFee > 0 ? `, featured: $${totals.featuredFee.toFixed(2)}` : ""
      }), have $${spendable.toFixed(2)}.`
    );
  }

  // Validate category/subcategory relationship
  if (input.subcategoryId) {
    const { data: subcat, error: subcatErr } = await mktDb
      .from("marketplace_subcategories")
      .select("category_id")
      .eq("id", input.subcategoryId)
      .maybeSingle();
    
    if (subcatErr) throw new DepositError("INVALID_SUBCATEGORY", "Invalid subcategory.");
    if (!subcat || subcat.category_id !== input.categoryId) {
      throw new DepositError("CATEGORY_MISMATCH", "Subcategory does not belong to the selected category.");
    }
  }

  // Calculate max completions from slots
  const maxCompletions = input.slots;
  const budget = totals.allocation; // Use allocation as budget

  // Generate postback secret for auto verification (32+ chars)
  let postbackSecret: string | undefined;
  if (input.verification === "auto") {
    // Generate cryptographically secure 32-character hex string
    postbackSecret = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Step 1: INSERT campaign in draft status
  // CRITICAL: Do NOT set featured fields here - campaigns_guard rejects them!
  // Featured billing happens via mkt_charge_featured RPC after insert.
  const campaignInsert: Record<string, any> = {
    advertiser_id: userId,
    type_key: "custom",
    name: input.title,
    summary: input.description.slice(0, 140),
    description: input.description,
    landing_url: input.landingUrl,
    steps: [{ text: "Complete the task" }],
    verification_mode: input.verification === "auto" ? "auto" : "manual_proof",
    countries: input.countries,
    publisher_reward: input.reward,
    max_completions: maxCompletions,
    budget_allocated: budget,
    proof_description: "Please upload proof of completion",
    category_id: input.categoryId,
    subcategory_id: input.subcategoryId || null,
    estimated_minutes: input.estimatedMinutes || null,
    ...(input.verification === "auto" && input.trackingUrl && {
      tracking_url: input.trackingUrl,
    }),
    status: "draft",
  };

  const { data: campaign, error: insertError } = await mktDb
    .from("campaigns")
    .insert(campaignInsert)
    .select("id, status")
    .single();

  if (insertError) {
    throw new DepositError("CREATE_FAILED", `Failed to create campaign: ${insertError.message}`);
  }

  // Step 1.5: Store postback secret if auto verification
  if (input.verification === "auto" && postbackSecret) {
    const { error: secretError } = await mktDb
      .from("campaign_secrets")
      .insert({
        campaign_id: campaign.id,
        auth_mode: "token",
        secret: postbackSecret,
        ip_allowlist: input.ipAllowlist || [],
      });

    if (secretError) {
      // Rollback: delete the campaign
      await mktDb.from("campaigns").delete().eq("id", campaign.id);
      throw new DepositError("SECRET_FAILED", `Failed to store postback secret: ${secretError.message}`);
    }
  }

  // Step 2: Submit for review (allocates budget, charges fee if enabled)
  // Always use mkt_submit_campaign_with_fee (fee is 0 when fees are disabled)
  try {
    await mktRpc("mkt_submit_campaign_with_fee", {
      p_campaign_id: campaign.id,
      p_actor: userId,
    });
  } catch (err) {
    if (err instanceof MktRpcError) throw new DepositError(err.code, humanMktError(err.code));
    throw err;
  }

  // Step 3: If featured, charge the fee atomically via RPC
  // Note: Campaign is already submitted, so if this fails we DON'T delete the campaign
  let featuredApplied = false;
  let featuredError: string | undefined;

  if (input.featured && input.featuredDays && input.featuredDays > 0) {
    try {
      const featuredDays = Math.min(Math.max(input.featuredDays, 1), 30); // Clamp to 1-30
      
      await mktRpc("mkt_charge_featured", {
        p_campaign_id: campaign.id,
        p_days: featuredDays,
        p_actor: userId,
      });
      
      featuredApplied = true;
    } catch (err) {
      // Featured billing failed, but campaign is already submitted
      // Return a warning instead of throwing
      if (err instanceof MktRpcError) {
        featuredError = humanMktError(err.code);
      } else {
        featuredError = "Featured placement failed due to an unexpected error.";
      }
    }
  }

  const siteUrl = getSiteUrl();
  return {
    campaignId: campaign.id,
    status: "pending_review" as CampaignDbStatus,
    ...(input.featured ? { featuredApplied: featuredApplied || undefined, featuredError: featuredError || undefined } : {}),
    ...(postbackSecret ? { postbackUrl: `${siteUrl}/api/public/marketplace-postback?click_id={click_id}&token=${postbackSecret}&txn_id={transaction_id}`, postbackSecret } : {}),
  };
}

export type CampaignAction = "pause" | "resume" | "submit" | "complete" | "archive";

export async function campaignActionImpl(userId: string, campaignId: string, action: CampaignAction): Promise<Record<string, unknown>> {
  try {
    switch (action) {
      case "submit":
        // Always use mkt_submit_campaign_with_fee (fee is 0 when fees are disabled)
        return await mktRpc("mkt_submit_campaign_with_fee", { p_campaign_id: campaignId, p_actor: userId });
      case "pause":
      case "resume":
      case "complete":
      case "archive": {
        const target = action === "resume" ? "active" : action === "pause" ? "paused" : action === "complete" ? "completed" : "archived";
        return await mktRpc("mkt_set_campaign_status", {
          p_campaign_id: campaignId,
          p_actor: userId,
          p_actor_role: "advertiser",
          p_target: target,
          p_reason: null,
        });
      }
    }
  } catch (err) {
    if (err instanceof MktRpcError) throw new DepositError(err.code, humanMktError(err.code));
    throw err;
  }
}

export function humanMktError(code: string): string {
  switch (code) {
    case "MKT_NOT_OWNER":
      return "That campaign isn't yours.";
    case "MKT_INVALID_STATUS":
      return "The campaign isn't in a state that allows this.";
    case "MKT_ADMIN_PAUSED":
      return "An admin paused this campaign — contact support to resume it.";
    case "MKT_INSUFFICIENT_FUNDS":
      return "Not enough Campaign Balance. Add funds first.";
    case "MKT_ADVERTISER_RESTRICTED":
    case "MKT_ADVERTISER_SUSPENDED":
      return "Your advertiser account is restricted. Contact support.";
    case "MKT_DUPLICATE_FEATURED":
      return "This campaign already has featured placement.";
    case "MKT_INVALID_FEATURED":
      return "Featured placement requires 1-30 days.";
    case "MKT_NO_ACCOUNT":
      return "Your advertiser account was not found.";
    case "MKT_DUPLICATE_FEE":
      return "This campaign fee has already been charged.";
    default:
      return "That didn't work. Please try again.";
  }
}

/**
 * Rotate postback secret for an auto-verified campaign.
 * Only owner can rotate. Returns new secret (shown once).
 */
export async function rotateCampaignSecretImpl(
  userId: string,
  campaignId: string,
): Promise<{ secret: string; url: string }> {
  // Verify ownership
  const { data: campaign, error: campErr } = await mktDb
    .from("campaigns")
    .select("advertiser_id, verification_mode")
    .eq("id", campaignId)
    .maybeSingle();

  if (campErr || !campaign) {
    throw new DepositError("NOT_FOUND", "Campaign not found.");
  }

  if (campaign.advertiser_id !== userId) {
    throw new DepositError("NOT_OWNER", "That campaign isn't yours.");
  }

  if (campaign.verification_mode !== "auto") {
    throw new DepositError("NOT_AUTO", "Only auto-verified campaigns have postback secrets.");
  }

  // Generate new secret
  const newSecret = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Update secret
  const { error: updateErr } = await mktDb
    .from("campaign_secrets")
    .update({ secret: newSecret })
    .eq("campaign_id", campaignId);

  if (updateErr) {
    throw new DepositError("UPDATE_FAILED", `Failed to rotate secret: ${updateErr.message}`);
  }

  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/api/public/marketplace-postback?click_id={click_id}&token=${newSecret}&txn_id={transaction_id}`;

  return { secret: newSecret, url };
}