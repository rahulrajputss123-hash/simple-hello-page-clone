import { createHmac, timingSafeEqual, createHash } from "crypto";

import { supabaseAdmin } from "@/integrations/supabase/client.server";

import { payReferralMilestone } from "../coinquest.server";
import { creditSdkConversionRpc } from "../wallet/rpc.server";
import {
  convertSdkCurrency,
  type Json,
  type JsonObject,
  type SdkOfferwallProvider,
} from "../sdk-offerwall/types";
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

/**
 * Computes the expected postback signature for a provider.
 * - AdswedMedia: PLAIN concatenated MD5 of subId + transId + reward + secret
 *   (raw string concatenation, then md5 hex — NOT HMAC).
 * - Everyone else (Affike / OGAds / …): HMAC-SHA256 over the raw body, or the
 *   txid:user:amount base. Unchanged.
 */
function expectedSignature(
  provider: SdkOfferwallProvider,
  req: PostbackRequest,
  secret: string,
): string {
  if (provider.slug === "adswedmedia") {
    const subId = req.params[provider.user_id_param] ?? "";
    const transId = req.params[provider.transaction_id_param] ?? "";
    const reward = req.params[provider.reward_param] ?? "";
    return createHash("md5").update(`${subId}${transId}${reward}${secret}`).digest("hex");
  }
  const base =
    req.rawBody && req.rawBody.length > 0 ? req.rawBody : signatureBase(provider, req.params);
  return createHmac("sha256", secret).update(base).digest("hex");
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
    const expected = expectedSignature(provider, req, secret);
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
  await supabaseAdmin.from("sdk_offerwall_conversions").upsert(
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
 * Process a postback where the user ref is a quest token (starts with "q_").
 * Quest tokens are generated by openQuestNetworkImpl and allow users to complete
 * offers inside network quests without crediting their wallet. The conversion
 * status is set to "quest_absorbed" and counts toward quest progress if the
 * payout is >= min_qualifying_usd.
 */
async function processQuestTokenPostback(
  provider: SdkOfferwallProvider,
  req: PostbackRequest,
  parsed: { providerTransactionId: string; providerUserRef: string; providerOfferId?: string; currencyAmount: number; raw: JsonObject },
  auth: { ok: boolean; reason?: string; signatureValid: boolean | null },
  currencyAmount: number,
): Promise<PostbackResult> {
  const token = parsed.providerUserRef;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabaseAdmin as unknown as { from: (t: string) => any };

  // Look up the token
  const { data: tokenData } = await db
    .from("quest_network_tokens")
    .select("*, quest_sessions!inner(id, user_id, quest_key, status)")
    .eq("token", token)
    .maybeSingle();

  if (!tokenData) {
    await logAutomation({
      eventType: "sdk_postback",
      status: "error",
      source: provider.slug,
      providerId: provider.id,
      message: "Invalid quest token",
      context: { token, params: req.params as JsonObject },
    });
    return { ok: false, status: "rejected", reason: "invalid_quest_token" };
  }

  const session = tokenData.quest_sessions;
  const userId = session.user_id;

  // Verify token provider matches postback provider
  if (tokenData.provider_id !== provider.id) {
    await logAutomation({
      eventType: "sdk_postback",
      status: "error",
      source: provider.slug,
      providerId: provider.id,
      message: "Quest token provider mismatch",
      context: { 
        token, 
        tokenProviderId: tokenData.provider_id, 
        postbackProviderId: provider.id,
        params: req.params as JsonObject 
      },
    });
    return { ok: false, status: "rejected", reason: "invalid_quest_token" };
  }

  // Verify session is still started
  if (session.status !== "started") {
    await logAutomation({
      eventType: "sdk_postback",
      status: "warning",
      source: provider.slug,
      providerId: provider.id,
      userId,
      message: `Quest session no longer active: ${session.status}`,
      context: { token, sessionId: session.id, params: req.params as JsonObject },
    });
    return { ok: false, status: "rejected", reason: "quest_session_closed" };
  }

  const expiresAt = new Date(tokenData.expires_at);
  if (expiresAt < new Date()) {
    await logAutomation({
      eventType: "sdk_postback",
      status: "error",
      source: provider.slug,
      providerId: provider.id,
      message: "Expired quest token",
      context: { token, expiresAt: tokenData.expires_at, params: req.params as JsonObject },
    });
    return { ok: false, status: "rejected", reason: "invalid_quest_token" };
  }

  // Verify auth (same as normal postback flow)
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

  // --- Duplicate protection (same logic as normal flow) -----------------
  const windowStart = new Date(
    Date.now() - Math.max(1, provider.dedupe_window_hours) * 3600 * 1000,
  ).toISOString();
  let dupeQuery = supabaseAdmin
    .from("sdk_offerwall_conversions")
    .select("id, status")
    .eq("provider_id", provider.id)
    .gte("received_at", windowStart);
  if (provider.dedupe_strategy === "payload_hash") {
    const hash = createHash("sha256").update(JSON.stringify(req.params)).digest("hex").slice(0, 32);
    dupeQuery = dupeQuery.eq("provider_transaction_id", `${parsed.providerTransactionId}#${hash}`);
  } else {
    dupeQuery = dupeQuery.eq("provider_transaction_id", parsed.providerTransactionId);
    if (provider.dedupe_strategy === "transaction_id_and_user") {
      dupeQuery = dupeQuery.eq("user_id", userId);
    }
  }
  const existing = await dupeQuery.maybeSingle();
  if (existing.data) {
    // Update conversion to duplicate status
    await supabaseAdmin
      .from("sdk_offerwall_conversions")
      .update({ status: "duplicate", reject_reason: "duplicate", processed_at: new Date().toISOString() })
      .eq("id", conversion.id);
    
    await logAutomation({
      eventType: "sdk_postback",
      status: "warning",
      source: provider.slug,
      providerId: provider.id,
      userId,
      referenceId: existing.data.id,
      message: "Duplicate quest conversion ignored",
      context: { transactionId: parsed.providerTransactionId },
    });
    return { ok: true, status: "duplicate", reason: "duplicate", conversionId: existing.data.id };
  }

  const transactionKey =
    provider.dedupe_strategy === "payload_hash"
      ? `${parsed.providerTransactionId}#${createHash("sha256").update(JSON.stringify(req.params)).digest("hex").slice(0, 32)}`
      : parsed.providerTransactionId;

  // Insert conversion with status "quest_absorbed" (no wallet credit)
  const { data: conversion, error: insertError } = await supabaseAdmin
    .from("sdk_offerwall_conversions")
    .insert({
      provider_id: provider.id,
      user_id: userId,
      provider_transaction_id: transactionKey,
      provider_user_ref: parsed.providerUserRef,
      provider_offer_id: parsed.providerOfferId ?? null,
      currency_amount: currencyAmount,
      reward_amount: 0, // Never credited to wallet
      status: "quest_absorbed",
      signature_valid: auth.signatureValid,
      source_ip: req.sourceIp,
      raw_payload: req.params as never,
      processed_at: new Date().toISOString(),
    })
    .select("id")
    .maybeSingle();

  if (insertError || !conversion) {
    await logAutomation({
      eventType: "sdk_postback",
      status: "warning",
      source: provider.slug,
      providerId: provider.id,
      userId,
      message: "Duplicate quest conversion rejected by unique constraint",
      context: { transactionId: transactionKey },
    });
    return { ok: true, status: "duplicate", reason: "duplicate" };
  }

  await logAutomation({
    eventType: "sdk_postback",
    status: "success",
    source: provider.slug,
    providerId: provider.id,
    userId,
    referenceId: conversion.id,
    message: `Quest conversion absorbed (no wallet credit): ${provider.name}`,
    context: { currencyAmount, transactionId: transactionKey, questKey: session.quest_key },
  });

  // --- Quest progress tracking -------------------------------------------
  // Get quest to check min_qualifying_usd and step rewards
  const { data: quest } = await db
    .from("quests")
    .select("*")
    .eq("key", session.quest_key)
    .maybeSingle();

  if (!quest) {
    await logAutomation({
      eventType: "quest_automation",
      status: "error",
      source: provider.slug,
      providerId: provider.id,
      userId,
      message: "Quest not found for absorbed conversion",
      context: { questKey: session.quest_key },
    });
    return { ok: true, status: "credited", reason: "quest_absorbed", conversionId: conversion.id };
  }

  const { normalize } = await import("../quests.server");
  const normalizedQuest = normalize(quest);

  // Convert to USD
  const usd = convertSdkCurrency(provider, currencyAmount);

  // ========== BRANCH: Feed Quest vs Network Quest ==========
  if (tokenData.kind === "feed") {
    // FEED QUEST: Steps are sequential, tracked by step_index
    // No min_qualifying_usd check for feed quests
    
    // ===== CAMPAIGN ID VERIFICATION =====
    // BitcoTasks: No campaign_id in postbacks, validate offer_type instead
    if (provider.slug === "bitcotasks") {
      const { FEED_KIND_OFFER_TYPES } = await import("../sdk-offerwall/adapters/bitcotasks.server");
      const offerType = String(parsed.raw?.offer_type ?? "").toLowerCase();
      const feedKind = normalizedQuest.feed_kind;
      const allowedTypes = feedKind ? FEED_KIND_OFFER_TYPES[feedKind] ?? [] : [];
      
      if (!offerType || !allowedTypes.includes(offerType as never)) {
        // Update conversion with reject_reason
        await supabaseAdmin
          .from("sdk_offerwall_conversions")
          .update({ status: "quest_absorbed", reject_reason: "offer_type_mismatch", processed_at: new Date().toISOString() })
          .eq("id", conversion.id);
        
        await logAutomation({
          eventType: "quest_automation",
          status: "error",
          source: provider.slug,
          providerId: provider.id,
          userId,
          referenceId: conversion.id,
          message: `BitcoTasks offer_type mismatch: expected one of [${allowedTypes.join(", ")}], got "${offerType}"`,
          context: { questKey: session.quest_key, stepIndex: tokenData.step_index, feedKind, offerType },
        });
        return { ok: true, status: "credited", reason: "quest_absorbed", conversionId: conversion.id };
      }
    }
    // Other providers: verify campaign_id if provided (skip for name-based providers like Offerwall.me)
    else if (parsed.providerOfferId && tokenData.campaign_id && provider.slug !== "offerwallme") {
      if (parsed.providerOfferId !== tokenData.campaign_id) {
        // Update conversion with reject_reason
        await supabaseAdmin
          .from("sdk_offerwall_conversions")
          .update({ status: "quest_absorbed", reject_reason: "campaign_id_mismatch", processed_at: new Date().toISOString() })
          .eq("id", conversion.id);
        
        await logAutomation({
          eventType: "quest_automation",
          status: "error",
          source: provider.slug,
          providerId: provider.id,
          userId,
          referenceId: conversion.id,
          message: `Campaign ID mismatch: expected ${tokenData.campaign_id}, got ${parsed.providerOfferId}`,
          context: { questKey: session.quest_key, stepIndex: tokenData.step_index },
        });
        return { ok: true, status: "credited", reason: "quest_absorbed", conversionId: conversion.id };
      }
    }
    // If postback carries no campaign_id, rely on token alone (allowed)

    // Insert completion for this step
    const { error: completionError } = await db
      .from("quest_network_completions")
      .insert({
        session_id: session.id,
        provider_id: provider.id,
        conversion_id: conversion.id,
        step_index: tokenData.step_index,
        kind: "feed",
        amount_usd: usd,
      });

    if (completionError) {
      if (completionError.code === "23505") {
        // Duplicate step completion (idempotent)
        await logAutomation({
          eventType: "quest_automation",
          status: "info",
          source: provider.slug,
          providerId: provider.id,
          userId,
          referenceId: conversion.id,
          message: `Step ${tokenData.step_index} already completed (duplicate postback)`,
          context: { questKey: session.quest_key, stepIndex: tokenData.step_index },
        });
        return { ok: true, status: "credited", reason: "quest_absorbed", conversionId: conversion.id };
      }
      throw completionError;
    }

    await logAutomation({
      eventType: "quest_automation",
      status: "success",
      source: provider.slug,
      providerId: provider.id,
      userId,
      referenceId: conversion.id,
      message: `Feed quest step ${tokenData.step_index} completed: ${provider.name}`,
      context: { questKey: session.quest_key, usd, stepIndex: tokenData.step_index },
    });

    // Credit step reward
    const stepRewardAmount = normalizedQuest.step_rewards?.[tokenData.step_index - 1] ?? normalizedQuest.step_reward ?? 0;
    if (stepRewardAmount > 0) {
      try {
        const { creditStepReward } = await import("../quests.server");
        const credited = await creditStepReward(
          userId,
          session.id,
          session.quest_key,
          normalizedQuest.label,
          tokenData.step_index,
          stepRewardAmount,
        );
        
        if (credited > 0) {
          await logAutomation({
            eventType: "quest_automation",
            status: "success",
            source: provider.slug,
            providerId: provider.id,
            userId,
            referenceId: conversion.id,
            message: `Step ${tokenData.step_index} reward credited: $${credited.toFixed(2)}`,
            context: { questKey: session.quest_key, stepIndex: tokenData.step_index, amount: credited },
          });
        }
      } catch (error) {
        await logAutomation({
          eventType: "quest_automation",
          status: "error",
          source: provider.slug,
          providerId: provider.id,
          userId,
          referenceId: conversion.id,
          message: `Failed to credit step reward: ${error instanceof Error ? error.message : "unknown"}`,
          context: { questKey: session.quest_key, stepIndex: tokenData.step_index },
        });
      }
    }

    // Check if all steps completed
    const { data: allCompletions } = await db
      .from("quest_network_completions")
      .select("step_index")
      .eq("session_id", session.id)
      .eq("kind", "feed");

    const completedSteps = (allCompletions || []).length;
    const requiredSteps = Number(normalizedQuest.steps_count ?? 10);

    if (completedSteps >= requiredSteps) {
      // Quest complete! Credit final bonus
      const { data: sessionUpdate } = await db
        .from("quest_sessions")
        .update({ status: "verified", verified_at: new Date().toISOString() })
        .eq("id", session.id)
        .eq("status", "started")
        .select("status")
        .maybeSingle();

      if (sessionUpdate?.status === "verified") {
        try {
          const { finishQuestSession } = await import("../quests.server");
          await finishQuestSession(userId, session.id, normalizedQuest);
          
          await logAutomation({
            eventType: "quest_automation",
            status: "success",
            source: provider.slug,
            providerId: provider.id,
            userId,
            referenceId: conversion.id,
            message: `Feed quest completed: ${normalizedQuest.label}`,
            context: { questKey: session.quest_key, completedSteps, requiredSteps },
          });
        } catch (error) {
          await logAutomation({
            eventType: "quest_automation",
            status: "error",
            source: provider.slug,
            providerId: provider.id,
            userId,
            referenceId: conversion.id,
            message: `Failed to finish quest: ${error instanceof Error ? error.message : "unknown"}`,
            context: { questKey: session.quest_key },
          });
        }
      }
    }

    return { ok: true, status: "credited", reason: "quest_absorbed", conversionId: conversion.id };
  }

  // ========== NETWORK QUEST (original logic) ==========
  const minQualifyingUsd = Number(normalizedQuest.min_qualifying_usd ?? 0.01);

  // BitcoTasks: Only offer_type === 'offer' counts for network quests
  if (provider.slug === "bitcotasks") {
    const offerType = String(parsed.raw?.offer_type ?? "").toLowerCase();
    if (offerType !== "offer") {
      // Update conversion with reject_reason  
      await supabaseAdmin
        .from("sdk_offerwall_conversions")
        .update({ status: "quest_absorbed", reject_reason: "offer_type_not_offer", processed_at: new Date().toISOString() })
        .eq("id", conversion.id);
      
      await logAutomation({
        eventType: "quest_automation",
        status: "info",
        source: provider.slug,
        providerId: provider.id,
        userId,
        referenceId: conversion.id,
        message: `BitcoTasks offer_type "${offerType}" does not count for network quest (only "offer" counts)`,
        context: { questKey: session.quest_key, offerType },
      });
      return { ok: true, status: "credited", reason: "quest_absorbed", conversionId: conversion.id };
    }
  }

  if (usd < minQualifyingUsd) {
    // Update conversion with reject_reason
    await supabaseAdmin
      .from("sdk_offerwall_conversions")
      .update({ status: "quest_absorbed", reject_reason: "below_minimum", processed_at: new Date().toISOString() })
      .eq("id", conversion.id);
    
    await logAutomation({
      eventType: "quest_automation",
      status: "info",
      source: provider.slug,
      providerId: provider.id,
      userId,
      referenceId: conversion.id,
      message: `Quest conversion below minimum: $${usd.toFixed(2)} < $${minQualifyingUsd.toFixed(2)}`,
      context: { questKey: session.quest_key },
    });
    return { ok: true, status: "credited", reason: "quest_absorbed", conversionId: conversion.id };
  }

  // Try to insert completion with atomic step_index assignment (with retry)
  let stepIndex = 0;
  let completionInserted = false;
  for (let attempt = 0; attempt < 5; attempt++) {
    // Count existing completions to determine next step_index
    const { data: existingCompletions } = await db
      .from("quest_network_completions")
      .select("step_index")
      .eq("session_id", session.id)
      .eq("kind", "network");

    stepIndex = (existingCompletions || []).length + 1;

    // Try to insert with this step_index
    const { error: completionError } = await db
      .from("quest_network_completions")
      .insert({
        session_id: session.id,
        provider_id: provider.id,
        conversion_id: conversion.id,
        step_index: stepIndex,
        kind: "network",
        amount_usd: usd,
      });

    if (!completionError) {
      completionInserted = true;
      break;
    }

    // Check if it's a provider duplicate (this provider already counted)
    if (completionError.code === "23505" && completionError.message?.includes("session_provider")) {
      await logAutomation({
        eventType: "quest_automation",
        status: "info",
        source: provider.slug,
        providerId: provider.id,
        userId,
        referenceId: conversion.id,
        message: "Provider already completed for this quest session",
        context: { questKey: session.quest_key },
      });
      return { ok: true, status: "credited", reason: "quest_absorbed", conversionId: conversion.id };
    }

    // Step index collision - retry with recomputed index
    if (completionError.code === "23505") {
      await new Promise(resolve => setTimeout(resolve, 50 * (attempt + 1))); // Backoff
      continue;
    }

    // Other error
    throw completionError;
  }

  if (!completionInserted) {
    await logAutomation({
      eventType: "quest_automation",
      status: "error",
      source: provider.slug,
      providerId: provider.id,
      userId,
      referenceId: conversion.id,
      message: "Failed to insert network completion after retries",
      context: { questKey: session.quest_key },
    });
    return { ok: true, status: "credited", reason: "quest_absorbed", conversionId: conversion.id };
  }

  await logAutomation({
    eventType: "quest_automation",
    status: "success",
    source: provider.slug,
    providerId: provider.id,
    userId,
    referenceId: conversion.id,
    message: `Quest network completion recorded: ${provider.name} (step ${stepIndex})`,
    context: { questKey: session.quest_key, usd, stepIndex },
  });

  // Credit step reward
  const stepRewardAmount = normalizedQuest.step_rewards?.[stepIndex - 1] ?? normalizedQuest.step_reward ?? 0;
  if (stepRewardAmount > 0) {
    try {
      const { creditStepReward } = await import("../quests.server");
      const credited = await creditStepReward(
        userId,
        session.id,
        session.quest_key,
        normalizedQuest.label,
        stepIndex,
        stepRewardAmount,
      );
      
      if (credited > 0) {
        await logAutomation({
          eventType: "quest_automation",
          status: "success",
          source: provider.slug,
          providerId: provider.id,
          userId,
          referenceId: conversion.id,
          message: `Step ${stepIndex} reward credited: $${credited.toFixed(2)}`,
          context: { questKey: session.quest_key, stepIndex, amount: credited },
        });
      }
    } catch (error) {
      await logAutomation({
        eventType: "quest_automation",
        status: "error",
        source: provider.slug,
        providerId: provider.id,
        userId,
        referenceId: conversion.id,
        message: `Failed to credit step reward: ${error instanceof Error ? error.message : "unknown"}`,
        context: { questKey: session.quest_key, stepIndex },
      });
    }
  }

  // Count distinct completions to check if quest is complete
  const { data: allCompletions } = await db
    .from("quest_network_completions")
    .select("provider_id")
    .eq("session_id", session.id)
    .eq("kind", "network");

  const distinctCount = new Set((allCompletions || []).map((c: any) => c.provider_id)).size;
  const requiredCount = Number(normalizedQuest.required_count ?? 3);

  if (distinctCount >= requiredCount) {
    // Quest complete! Mark session as verified and credit final bonus
    const { data: sessionUpdate } = await db
      .from("quest_sessions")
      .update({ status: "verified", verified_at: new Date().toISOString() })
      .eq("id", session.id)
      .eq("status", "started")
      .select("status")
      .maybeSingle();

    // Only credit if we actually updated the session (prevents double-credit)
    if (sessionUpdate?.status === "verified") {
      await logAutomation({
        eventType: "quest_automation",
        status: "success",
        source: provider.slug,
        providerId: provider.id,
        userId,
        referenceId: conversion.id,
        message: `Network quest ${session.quest_key} completed: ${distinctCount}/${requiredCount}`,
        context: { questKey: session.quest_key, sessionId: session.id },
      });

      const { finishQuestSession } = await import("../quests.server");
      await finishQuestSession(
        userId,
        session.id,
        normalizedQuest.reward_amount,
        `Network Quest: ${normalizedQuest.label}`,
      );
    }
  } else {
    await logAutomation({
      eventType: "quest_automation",
      status: "info",
      source: provider.slug,
      providerId: provider.id,
      userId,
      referenceId: conversion.id,
      message: `Quest progress: ${distinctCount}/${requiredCount} networks completed`,
      context: { questKey: session.quest_key, sessionId: session.id },
    });
  }

  return { ok: true, status: "credited", reason: "quest_absorbed", conversionId: conversion.id };
}

/**
 * Process survey quest progress after a successful wallet credit.
 * 
 * Maps provider conversions to survey networks and tracks progress via
 * quest_step_credits with metadata storing survey_network + survey_id for deduplication.
 * 
 * A survey can only count once per user per quest session, even if the
 * same postback arrives multiple times.
 */
async function processSurveyQuestProgress(params: {
  userId: string;
  conversionId: string;
  provider: SdkOfferwallProvider;
  transactionId: string;
  offerId?: string;
  rewardUsd: number;
}): Promise<void> {
  const { userId, conversionId, provider, transactionId, offerId, rewardUsd } = params;

  // Map provider slug to survey network
  const surveyNetwork = mapProviderToSurveyNetwork(provider.slug);
  if (!surveyNetwork) {
    // Not a survey provider, skip
    return;
  }

  // Survey ID is the offer_id from postback (survey ID from provider)
  const surveyId = offerId || transactionId;
  if (!surveyId) {
    await logAutomation({
      eventType: "quest_automation",
      status: "warning",
      source: provider.slug,
      providerId: provider.id,
      userId,
      referenceId: conversionId,
      message: "Survey quest: missing survey ID (offer_id or transaction_id)",
    });
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabaseAdmin as unknown as { from: (t: string) => any };

  // Find active survey quest sessions for this user
  const { data: sessions } = await db
    .from("quest_sessions")
    .select("id, quest_key, quests!inner(quest_type, label, required_surveys, step_reward, step_rewards, reward_amount, allowed_networks, min_payout_usd)")
    .eq("user_id", userId)
    .eq("status", "started")
    .eq("quests.quest_type", "survey");

  if (!sessions || sessions.length === 0) {
    // No active survey quests
    return;
  }

  for (const session of sessions) {
    const quest = session.quests;

    // Check if this network is allowed for this quest
    const allowedNetworks = Array.isArray(quest.allowed_networks) ? quest.allowed_networks : [];
    if (!allowedNetworks.includes(surveyNetwork)) {
      continue;
    }

    // Check if payout meets minimum
    const minPayoutUsd = Number(quest.min_payout_usd ?? 0);
    if (rewardUsd < minPayoutUsd) {
      await logAutomation({
        eventType: "quest_automation",
        status: "info",
        source: provider.slug,
        providerId: provider.id,
        userId,
        referenceId: conversionId,
        message: `Survey quest: payout $${rewardUsd.toFixed(2)} below minimum $${minPayoutUsd.toFixed(2)}`,
        context: { questKey: session.quest_key, surveyNetwork, surveyId },
      });
      continue;
    }

    // Check if this survey was already completed in this session (deduplication)
    const { data: existingCredit } = await db
      .from("quest_step_credits")
      .select("id")
      .eq("session_id", session.id)
      .contains("metadata", { survey_network: surveyNetwork, survey_id: surveyId })
      .maybeSingle();

    if (existingCredit) {
      await logAutomation({
        eventType: "quest_automation",
        status: "info",
        source: provider.slug,
        providerId: provider.id,
        userId,
        referenceId: conversionId,
        message: "Survey already completed for this quest session",
        context: { questKey: session.quest_key, surveyNetwork, surveyId },
      });
      continue;
    }

    // Count existing survey completions for this session
    const { data: existingSteps, error: countError } = await db
      .from("quest_step_credits")
      .select("step_index")
      .eq("session_id", session.id)
      .order("step_index", { ascending: false })
      .limit(1);

    if (countError) throw countError;

    const nextStepIndex = existingSteps?.[0]?.step_index ? existingSteps[0].step_index + 1 : 1;
    const requiredSurveys = Number(quest.required_surveys ?? 5);

    // Check if already at max surveys
    if (nextStepIndex > requiredSurveys) {
      await logAutomation({
        eventType: "quest_automation",
        status: "info",
        source: provider.slug,
        providerId: provider.id,
        userId,
        referenceId: conversionId,
        message: `Survey quest already complete: ${nextStepIndex - 1}/${requiredSurveys}`,
        context: { questKey: session.quest_key, sessionId: session.id },
      });
      continue;
    }

    // Credit step reward with metadata for deduplication
    // Support custom per-survey rewards (step_rewards[i]) with fallback to step_reward
    const stepRewards = Array.isArray(quest.step_rewards) ? quest.step_rewards : [];
    const stepRewardAmount = stepRewards[nextStepIndex - 1] ?? Number(quest.step_reward ?? 0);
    
    const { creditStepReward } = await import("../quests.server");
    
    try {
      const credited = await creditStepReward(
        userId,
        session.id,
        session.quest_key,
        quest.label,
        nextStepIndex,
        stepRewardAmount,
        {
          survey_network: surveyNetwork,
          survey_id: surveyId,
          conversion_id: conversionId,
        },
      );

      if (credited >= 0) {
        await logAutomation({
          eventType: "quest_automation",
          status: "success",
          source: provider.slug,
          providerId: provider.id,
          userId,
          referenceId: conversionId,
          message: stepRewardAmount > 0 
            ? `Survey quest step ${nextStepIndex}/${requiredSurveys} completed, credited $${credited.toFixed(2)}`
            : `Survey quest step ${nextStepIndex}/${requiredSurveys} completed`,
          context: { questKey: session.quest_key, surveyNetwork, surveyId, stepIndex: nextStepIndex },
        });
      }
    } catch (error) {
      await logAutomation({
        eventType: "quest_automation",
        status: "error",
        source: provider.slug,
        providerId: provider.id,
        userId,
        referenceId: conversionId,
        message: `Failed to credit survey step reward: ${error instanceof Error ? error.message : "unknown"}`,
        context: { questKey: session.quest_key, surveyNetwork, surveyId },
      });
      continue;
    }

    // Check if quest is now complete
    if (nextStepIndex >= requiredSurveys) {
      const { data: sessionUpdate } = await db
        .from("quest_sessions")
        .update({ status: "verified", verified_at: new Date().toISOString() })
        .eq("id", session.id)
        .eq("status", "started")
        .select("status")
        .maybeSingle();

      if (sessionUpdate?.status === "verified") {
        const { finishQuestSession } = await import("../quests.server");
        const finalBonus = Number(quest.reward_amount ?? 0);
        await finishQuestSession(
          userId,
          session.id,
          finalBonus,
          `Survey Quest: ${quest.label}`,
        );

        await logAutomation({
          eventType: "quest_automation",
          status: "success",
          source: provider.slug,
          providerId: provider.id,
          userId,
          referenceId: conversionId,
          message: `Survey quest completed: ${quest.label} (${requiredSurveys}/${requiredSurveys}), final bonus $${finalBonus.toFixed(2)}`,
          context: { questKey: session.quest_key, sessionId: session.id, finalBonus },
        });
      }
    }
  }
}

/**
 * Map provider slug to survey network identifier.
 * Returns null if provider is not a survey provider.
 */
function mapProviderToSurveyNetwork(providerSlug: string): "cpxresearch" | "theoremreach" | "timewall" | null {
  switch (providerSlug) {
    case "cpxresearch":
    case "cpx-research":
    case "cpx":
      return "cpxresearch";
    case "theoremreach":
    case "theorem-reach":
    case "theorem":
      return "theoremreach";
    case "timewall":
    case "time-wall":
      return "timewall";
    default:
      return null;
  }
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
  
  // ========== TEST-ONLY CALLBACK HANDLING (debug=true) ==========
  // If adapter returned testOnly flag (e.g. TheoremReach debug=true), log and return immediately.
  // This short-circuits BEFORE user resolution to avoid "user_not_found" errors for test callbacks.
  if (parsed.testOnly) {
    await supabaseAdmin.from("sdk_offerwall_conversions").insert({
      provider_id: provider.id,
      user_id: null, // No user for test callbacks
      provider_transaction_id: parsed.providerTransactionId || `test-${Date.now()}`,
      provider_user_ref: parsed.providerUserRef || null,
      provider_offer_id: parsed.providerOfferId ?? null,
      currency_amount: 0,
      reward_amount: 0,
      status: "test",
      signature_valid: auth.signatureValid ?? true,
      source_ip: req.sourceIp,
      raw_payload: req.params as never,
      processed_at: new Date().toISOString(),
    });
    
    await logAutomation({
      eventType: "sdk_postback",
      status: "info",
      source: provider.slug,
      providerId: provider.id,
      message: "Test callback received (debug=true, signature valid)",
      context: { 
        transactionId: parsed.providerTransactionId,
        userRef: parsed.providerUserRef,
        params: req.params as JsonObject 
      },
    });
    
    return { ok: true, status: "credited", reason: "test_callback" };
  }
  // ========== END TEST-ONLY HANDLING ==========
  
  // ========== NETWORK QUEST TOKEN HANDLING ==========
  // If the user ref starts with "q_", it's a quest token, not a real user ID.
  // Quest tokens let users complete offers inside quests without crediting their wallet.
  const isQuestToken = parsed.providerUserRef.startsWith("q_");
  
  if (isQuestToken) {
    return await processQuestTokenPostback(provider, req, parsed, auth, currencyAmount);
  }
  // ========== END QUEST TOKEN HANDLING ==========

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
    const hash = createHash("sha256").update(JSON.stringify(req.params)).digest("hex").slice(0, 32);
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
      .eq("id", claim.data.id)
      .eq("status", "pending");
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

  // Wallet credit + ledger row + conversion -> 'credited' commit together
  // (sdk_conversion_credit), so a conversion can never be paid without being
  // marked credited, or marked credited without being paid.
  let credit: Awaited<ReturnType<typeof creditSdkConversionRpc>>;
  try {
    credit = await creditSdkConversionRpc({
      conversionId: claim.data.id,
      reward,
      description: `${provider.name} offerwall reward`,
      allowRetry: false,
    });
  } catch (error) {
    // Nothing was credited. Mark it so the admin retry can pick it up.
    await supabaseAdmin
      .from("sdk_offerwall_conversions")
      .update({
        status: "rejected",
        reject_reason: "wallet_credit_failed",
        processed_at: new Date().toISOString(),
      })
      .eq("id", claim.data.id)
      .eq("status", "pending");
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

  if (!credit.credited) {
    // Only reachable if another process (e.g. an admin retry) settled this
    // just-claimed row first. It was not paid twice.
    await logAutomation({
      eventType: "wallet_credit",
      status: "warning",
      source: provider.slug,
      providerId: provider.id,
      userId,
      referenceId: claim.data.id,
      message: `Conversion not credited: ${credit.reason ?? "unknown"}`,
    });
    return { ok: true, status: "duplicate", reason: credit.reason ?? "duplicate" };
  }

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

  // --- Survey quest progress tracking ----------------------------------------
  // Check if this conversion should count toward an active survey quest.
  // Survey quests track progress based on verified postbacks with network + survey_id deduplication.
  try {
    await processSurveyQuestProgress({
      userId,
      conversionId: claim.data.id,
      provider,
      transactionId: parsed.providerTransactionId,
      offerId: parsed.providerOfferId,
      rewardUsd: reward,
    });
  } catch (error) {
    // Survey quest tracking failure must never roll back the wallet credit.
    await logAutomation({
      eventType: "quest_automation",
      status: "error",
      source: provider.slug,
      providerId: provider.id,
      userId,
      referenceId: claim.data.id,
      message: error instanceof Error ? error.message : "Survey quest progress tracking failed",
    });
  }

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

  // --- Task automation (offerwall_earning) ----------------------------------
  // Fire after creditWallet succeeds. The conversion id is used as the event
  // key — the unique constraint on sdk_offerwall_conversions(provider_id,
  // provider_transaction_id) guarantees this code path is never reached twice
  // for the same postback, so the task event is inherently deduplicated.
  try {
    const { recordTaskEvent } = await import("../tasks/engine.server");
    await recordTaskEvent({
      userId,
      eventType: "offerwall_earning",
      eventKey: claim.data.id,
      quantity: reward,
      metadata: { providerId: provider.id },
      providerId: provider.id,
    });
  } catch (error) {
    // Task automation failure must never roll back the wallet credit.
    await logAutomation({
      eventType: "task_automation",
      status: "error",
      source: provider.slug,
      providerId: provider.id,
      userId,
      referenceId: claim.data.id,
      message: error instanceof Error ? error.message : "Task event recording failed",
    });
  }

  // --- Active Time Grace Period End -----------------------------------------
  // End any active grace period for active_time quests when a conversion succeeds.
  // This is best-effort and should not block the postback.
  try {
    const { endActiveTimeGraceImpl } = await import("../quests.server");
    const { data: activeQuests } = await supabaseAdmin
      .from("quests")
      .select("key")
      .eq("quest_type", "active_time")
      .eq("is_active", true);
    
    if (activeQuests && activeQuests.length > 0) {
      // Try to end grace for all active time quests
      await Promise.all(
        activeQuests.map((quest) =>
          endActiveTimeGraceImpl(userId, quest.key).catch((err) => {
            console.warn(`[active-time] Failed to end grace for ${quest.key}:`, err);
          })
        )
      );
    }
  } catch (error) {
    // Grace period end failure should not block the postback
    console.warn("[active-time] Failed to end grace periods:", error);
  }

  return { ok: true, status: "credited", reward, conversionId: claim.data.id };
}
