import { createHmac, timingSafeEqual, createHash } from "crypto";

import { supabaseAdmin } from "@/integrations/supabase/client.server";

import { creditWallet, payReferralMilestone } from "../coinquest.server";
import { convertSdkCurrency, type Json, type JsonObject, type SdkOfferwallProvider } from "../sdk-offerwall/types";
import { getSdkAdapter } from "../sdk-offerwall/registry.server";
import { logAutomation } from "./logs.server";

export type PostbackResult = {
  ok: boolean;
  status: "credited" | "duplicate" | "rejected" | "pending";
  reason?: string;
  reward?: number;
  conversionId?: string;
};

export type PostbackRequest = {
  slug: string;
  params: Record<string, string>;
  rawBody: string;
  headers: Record<string, string>;
  sourceIp: string | null;
};

function secretValue(ref: string | null | undefined): string | null {
  if (!ref) return null;
  return process.env[ref] ?? null;
}

function signatureMatches(expected: string, provided: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Signature digest algorithm for this provider's postback (default sha256). */
function signatureAlgorithm(provider: SdkOfferwallProvider): "md5" | "sha256" {
  // SdkOfferwallProvider's config bag is `extra_config` (there is no sync_config
  // on this type). AdswedMedia signs with MD5; everyone else defaults to sha256.
  const raw = provider.extra_config?.["signature_algorithm"];
  return raw === "md5" ? "md5" : "sha256";
}

/** Verifies caller authenticity according to the provider's postback auth mode. */
function verifyCaller(
  provider: SdkOfferwallProvider,
  req: PostbackRequest,
): { ok: boolean; reason?: string; signatureValid: boolean | null } {
  const mode = provider.postback_auth_mode;
  let signatureValid: boolean | null = null;

  if (mode === "ip_allowlist" || mode === "signature_and_ip") {
    const allow = provider.postback_ip_allowlist ?? [];
    if (allow.length === 0) return { ok: false, reason: "ip_allowlist_empty", signatureValid };
    if (!req.sourceIp || !allow.includes(req.sourceIp)) {
      return { ok: false, reason: "ip_not_allowed", signatureValid };
    }
  }

  if (mode === "signature" || mode === "signature_and_ip") {
    const secret = secretValue(provider.postback_signature_secret_ref);
    if (!secret) return { ok: false, reason: "signature_secret_missing", signatureValid };
    const provided =
      req.params["signature"] ??
      req.params["sig"] ??
      req.headers["x-signature"] ??
      req.headers["x-postback-signature"] ??
      req.headers["x-callback-signature"] ??
      "";
    const base = req.rawBody && req.rawBody.length > 0 ? req.rawBody : signatureBase(provider, req.params);
    const expected = createHmac(signatureAlgorithm(provider), secret).update(base).digest("hex");
    signatureValid = provided.length > 0 && signatureMatches(expected, provided.toLowerCase());
    if (!signatureValid) return { ok: false, reason: "invalid_signature", signatureValid };
  }

  return { ok: true, signatureValid };
}

/** Deterministic signing base for query-style postbacks: txid + user + amount. */
function signatureBase(provider: SdkOfferwallProvider, params: Record<string, string>): string {
  return [
    params[provider.transaction_id_param] ?? "",
    params[provider.user_id_param] ?? "",
    params[provider.reward_param] ?? "",
  ].join(":");
}

/** Maps the provider's user reference to an internal user id. */
async function resolveUserId(
  provider: SdkOfferwallProvider,
  userRef: string,
): Promise<string | null> {
  if (!userRef) return null;
  const mode = provider.user_identity_mode;

  if (mode === "user_uuid") {
    const res = await supabaseAdmin.from("profiles").select("id").eq("id", userRef).maybeSingle();
    return res.data?.id ?? null;
  }

  if (mode === "referral_code") {
    const res = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("referral_code", userRef.toUpperCase())
      .maybeSingle();
    return res.data?.id ?? null;
  }

  if (mode === "hashed_uuid") {
    const salt = secretValue(provider.user_identity_salt_ref) ?? "";
    const res = await supabaseAdmin.from("profiles").select("id").limit(20000);
    const target = userRef.toLowerCase();
    for (const row of res.data ?? []) {
      const hash = createHash("sha256").update(`${salt}${row.id}`).digest("hex");
      if (hash === target) return row.id;
    }
    return null;
  }

  // custom: providers map identity through extra_config.user_map (ref -> uuid)
  const map = provider.extra_config?.["user_map"];
  if (map && typeof map === "object" && !Array.isArray(map)) {
    const mapped = (map as Record<string, Json>)[userRef];
    if (typeof mapped === "string") return mapped;
  }
  return null;
}

async function recordRejection(
  provider: SdkOfferwallProvider,
  req: PostbackRequest,
  fields: {
    transactionId: string;
    userRef: string;
    userId: string | null;
    currencyAmount: number;
    reason: string;
    signatureValid: boolean | null;
    status: "rejected" | "duplicate";
  },
): Promise<PostbackResult> {
  await supabaseAdmin
    .from("sdk_offerwall_conversions")
    .upsert(
      {
        provider_id: provider.id,
        user_id: fields.userId,
        provider_transaction_id: fields.transactionId || `unknown-${Date.now()}`,
        provider_user_ref: fields.userRef || null,
        currency_amount: fields.currencyAmount,
        reward_amount: 0,
        status: fields.status,
        reject_reason: fields.reason,
        signature_valid: fields.signatureValid,
        source_ip: req.sourceIp,
        raw_payload: req.params as never,
        processed_at: new Date().toISOString(),
      },
      { onConflict: "provider_id,provider_transaction_id", ignoreDuplicates: true },
    );
  await logAutomation({
    eventType: "sdk_postback",
    status: fields.status === "duplicate" ? "warning" : "error",
    source: provider.slug,
    providerId: provider.id,
    userId: fields.userId,
    message: `Postback ${fields.status}: ${fields.reason}`,
    context: { transactionId: fields.transactionId, params: req.params as JsonObject },
  });
  return { ok: false, status: fields.status, reason: fields.reason };
}

/**
 * Generic, provider-agnostic postback pipeline:
 * verify caller -> parse -> dedupe -> credit wallet -> referral automation -> log.
 * Works for any configured provider; adapters may override parsing/verification.
 */
export async function processSdkPostback(req: PostbackRequest): Promise<PostbackResult> {
  const providerRes = await supabaseAdmin
    .from("sdk_offerwall_providers")
    .select("*")
    .eq("slug", req.slug)
    .maybeSingle();
  const provider = providerRes.data as unknown as SdkOfferwallProvider | null;

  if (!provider) {
    await logAutomation({
      eventType: "sdk_postback",
      status: "error",
      source: req.slug,
      message: "Unknown provider slug",
      context: { params: req.params as JsonObject },
    });
    return { ok: false, status: "rejected", reason: "unknown_provider" };
  }

  if (!provider.enabled || provider.status === "disabled") {
    await logAutomation({
      eventType: "sdk_postback",
      status: "warning",
      source: provider.slug,
      providerId: provider.id,
      message: "Postback received for a disabled provider",
      context: { params: req.params as JsonObject },
    });
    return { ok: false, status: "rejected", reason: "provider_disabled" };
  }

  const adapter = getSdkAdapter(provider.slug);

  const auth = adapter?.verifyPostback
    ? {
        ok: await adapter.verifyPostback(provider, {
          rawBody: req.rawBody,
          headers: req.headers,
          sourceIp: req.sourceIp,
        }),
        reason: "invalid_signature",
        signatureValid: true as boolean | null,
      }
    : verifyCaller(provider, req);

  const parsed = adapter?.parsePostback
    ? adapter.parsePostback(provider, req.params as JsonObject)
    : {
        providerTransactionId: req.params[provider.transaction_id_param] ?? "",
        providerUserRef: req.params[provider.user_id_param] ?? "",
        providerOfferId: req.params["offer_id"] ?? undefined,
        currencyAmount: Number(req.params[provider.reward_param] ?? 0),
        raw: req.params as JsonObject,
      };

  const currencyAmount = Number.isFinite(parsed.currencyAmount) ? parsed.currencyAmount : 0;
  const userId = await resolveUserId(provider, parsed.providerUserRef);

  if (!auth.ok) {
    return recordRejection(provider, req, {
      transactionId: parsed.providerTransactionId,
      userRef: parsed.providerUserRef,
      userId,
      currencyAmount,
      reason: auth.reason ?? "unauthorized",
      signatureValid: auth.signatureValid ?? false,
      status: "rejected",
    });
  }

  if (!parsed.providerTransactionId) {
    return recordRejection(provider, req, {
      transactionId: "",
      userRef: parsed.providerUserRef,
      userId,
      currencyAmount,
      reason: "missing_transaction_id",
      signatureValid: auth.signatureValid ?? null,
      status: "rejected",
    });
  }

  if (!userId) {
    return recordRejection(provider, req, {
      transactionId: parsed.providerTransactionId,
      userRef: parsed.providerUserRef,
      userId: null,
      currencyAmount,
      reason: "user_not_found",
      signatureValid: auth.signatureValid ?? null,
      status: "rejected",
    });
  }

  // --- Duplicate protection -------------------------------------------------
  const windowStart = new Date(
    Date.now() - Math.max(1, provider.dedupe_window_hours) * 3600 * 1000,
  ).toISOString();
  let dupeQuery = supabaseAdmin
    .from("sdk_offerwall_conversions")
    .select("id, status")
    .eq("provider_id", provider.id)
    .gte("received_at", windowStart);
  if (provider.dedupe_strategy === "payload_hash") {
    const hash = createHash("sha256")
      .update(JSON.stringify(req.params))
      .digest("hex")
      .slice(0, 32);
    dupeQuery = dupeQuery.eq("provider_transaction_id", `${parsed.providerTransactionId}#${hash}`);
  } else {
    dupeQuery = dupeQuery.eq("provider_transaction_id", parsed.providerTransactionId);
    if (provider.dedupe_strategy === "transaction_id_and_user") {
      dupeQuery = dupeQuery.eq("user_id", userId);
    }
  }
  const existing = await dupeQuery.maybeSingle();
  if (existing.data) {
    await logAutomation({
      eventType: "sdk_postback",
      status: "warning",
      source: provider.slug,
      providerId: provider.id,
      userId,
      referenceId: existing.data.id,
      message: "Duplicate conversion ignored",
      context: { transactionId: parsed.providerTransactionId },
    });
    return { ok: true, status: "duplicate", reason: "duplicate", conversionId: existing.data.id };
  }

  const transactionKey =
    provider.dedupe_strategy === "payload_hash"
      ? `${parsed.providerTransactionId}#${createHash("sha256").update(JSON.stringify(req.params)).digest("hex").slice(0, 32)}`
      : parsed.providerTransactionId;

  // Claim the transaction id first — the unique index makes this atomic.
  const claim = await supabaseAdmin
    .from("sdk_offerwall_conversions")
    .insert({
      provider_id: provider.id,
      user_id: userId,
      provider_transaction_id: transactionKey,
      provider_user_ref: parsed.providerUserRef,
      provider_offer_id: parsed.providerOfferId ?? null,
      currency_amount: currencyAmount,
      reward_amount: 0,
      status: "pending",
      signature_valid: auth.signatureValid,
      source_ip: req.sourceIp,
      raw_payload: req.params as never,
    })
    .select("id")
    .maybeSingle();

  if (claim.error || !claim.data) {
    await logAutomation({
      eventType: "sdk_postback",
      status: "warning",
      source: provider.slug,
      providerId: provider.id,
      userId,
      message: "Duplicate conversion rejected by unique constraint",
      context: { transactionId: transactionKey },
    });
    return { ok: true, status: "duplicate", reason: "duplicate" };
  }

  // --- Reward + wallet credit ----------------------------------------------
  const reward = convertSdkCurrency(provider, currencyAmount);

  if (reward <= 0) {
    await supabaseAdmin
      .from("sdk_offerwall_conversions")
      .update({
        status: "rejected",
        reject_reason: "zero_reward",
        processed_at: new Date().toISOString(),
      })
      .eq("id", claim.data.id);
    await logAutomation({
      eventType: "sdk_postback",
      status: "warning",
      source: provider.slug,
      providerId: provider.id,
      userId,
      referenceId: claim.data.id,
      message: "Conversion produced a zero reward",
      context: { currencyAmount },
    });
    return { ok: false, status: "rejected", reason: "zero_reward" };
  }

  try {
    await creditWallet(userId, reward, "offerwall", `${provider.name} offerwall reward`);
  } catch (error) {
    await supabaseAdmin
      .from("sdk_offerwall_conversions")
      .update({
        status: "rejected",
        reject_reason: "wallet_credit_failed",
        processed_at: new Date().toISOString(),
      })
      .eq("id", claim.data.id);
    await logAutomation({
      eventType: "wallet_credit",
      status: "error",
      source: provider.slug,
      providerId: provider.id,
      userId,
      referenceId: claim.data.id,
      message: error instanceof Error ? error.message : "Wallet credit failed",
    });
    return { ok: false, status: "rejected", reason: "wallet_credit_failed" };
  }

  await supabaseAdmin
    .from("sdk_offerwall_conversions")
    .update({
      status: "credited",
      reward_amount: reward,
      processed_at: new Date().toISOString(),
    })
    .eq("id", claim.data.id);

  await logAutomation({
    eventType: "wallet_credit",
    status: "success",
    source: provider.slug,
    providerId: provider.id,
    userId,
    referenceId: claim.data.id,
    message: `Credited $${reward.toFixed(2)} from ${provider.name}`,
    context: { currencyAmount, reward, transactionId: transactionKey },
  });

  // --- Referral automation --------------------------------------------------
  try {
    await payReferralMilestone(userId, "earning", "Referral: friend's first earning");
    await logAutomation({
      eventType: "referral_automation",
      status: "success",
      source: provider.slug,
      providerId: provider.id,
      userId,
      referenceId: claim.data.id,
      message: "Referral earning milestone evaluated",
    });
  } catch (error) {
    await logAutomation({
      eventType: "referral_automation",
      status: "error",
      source: provider.slug,
      providerId: provider.id,
      userId,
      message: error instanceof Error ? error.message : "Referral automation failed",
    });
  }

  return { ok: true, status: "credited", reward, conversionId: claim.data.id };
}
