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
    
    // Verify campaign_id matches if provided by postback
    if (parsed.providerOfferId && tokenData.campaign_id && parsed.providerOfferId !== tokenData.campaign_id) {
      await logAutomation({
        eventType: "quest_automation",
        status: "warning",
        source: provider.slug,
        providerId: provider.id,
        userId,
        referenceId: conversion.id,
        message: `Campaign ID mismatch: expected ${tokenData.campaign_id}, got ${parsed.providerOfferId}`,
        context: { questKey: session.quest_key, stepIndex: tokenData.step_index },
      });
      // Log and continue (some providers may not send campaign ID)
    }

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

  if (usd < minQualifyingUsd) {
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

  return { ok: true, status: "credited", reward, conversionId: claim.data.id };
}
