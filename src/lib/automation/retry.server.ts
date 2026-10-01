import { supabaseAdmin } from "@/integrations/supabase/client.server";

import { payReferralMilestone } from "../coinquest.server";
import { creditSdkConversionRpc } from "../wallet/rpc.server";
import { convertSdkCurrency, type SdkOfferwallProvider } from "../sdk-offerwall/types";
import { logAutomation } from "./logs.server";

/**
 * Re-processes a conversion that failed to credit (e.g. transient wallet error).
 * Never re-credits an already credited conversion.
 */
export async function retryConversionImpl(conversionId: string) {
  const { data: conversion, error } = await supabaseAdmin
    .from("sdk_offerwall_conversions")
    .select("*")
    .eq("id", conversionId)
    .maybeSingle();
  if (error) throw error;
  if (!conversion) throw new Error("Conversion not found");
  if (conversion.status === "credited") {
    return { ok: false, status: "credited" as const, reason: "already_credited" };
  }
  if (conversion.status === "duplicate") {
    return { ok: false, status: "duplicate" as const, reason: "duplicate" };
  }
  if (!conversion.user_id) {
    return { ok: false, status: "rejected" as const, reason: "user_not_found" };
  }

  const providerRes = await supabaseAdmin
    .from("sdk_offerwall_providers")
    .select("*")
    .eq("id", conversion.provider_id)
    .maybeSingle();
  const provider = providerRes.data as unknown as SdkOfferwallProvider | null;
  if (!provider) return { ok: false, status: "rejected" as const, reason: "unknown_provider" };

  const reward = convertSdkCurrency(provider, Number(conversion.currency_amount) || 0);
  if (reward <= 0) {
    return { ok: false, status: "rejected" as const, reason: "zero_reward" };
  }

  // The status checks above are a fast path. sdk_conversion_credit re-checks
  // under a row lock and credits + marks credited in one transaction, so two
  // concurrent retries (double click) can no longer both pay.
  let credit: Awaited<ReturnType<typeof creditSdkConversionRpc>>;
  try {
    credit = await creditSdkConversionRpc({
      conversionId: conversion.id,
      reward,
      description: `${provider.name} offerwall reward (retry)`,
      allowRetry: true,
    });
  } catch (err) {
    await logAutomation({
      eventType: "wallet_credit",
      status: "error",
      source: provider.slug,
      providerId: provider.id,
      userId: conversion.user_id,
      referenceId: conversion.id,
      message: err instanceof Error ? err.message : "Retry wallet credit failed",
    });
    return { ok: false, status: "rejected" as const, reason: "wallet_credit_failed" };
  }

  if (!credit.credited) {
    if (credit.reason === "already_credited") {
      return { ok: false, status: "credited" as const, reason: "already_credited" };
    }
    if (credit.reason === "duplicate") {
      return { ok: false, status: "duplicate" as const, reason: "duplicate" };
    }
    return { ok: false, status: "rejected" as const, reason: credit.reason ?? "not_creditable" };
  }

  await logAutomation({
    eventType: "wallet_credit",
    status: "success",
    source: provider.slug,
    providerId: provider.id,
    userId: conversion.user_id,
    referenceId: conversion.id,
    message: `Retry credited $${credit.reward.toFixed(2)} from ${provider.name}`,
    context: { reward: credit.reward },
  });

  try {
    await payReferralMilestone(conversion.user_id, "earning", "Referral: friend's first earning");
  } catch {
    // Referral automation must not fail the retry.
  }

  return { ok: true, status: "credited" as const, reward: credit.reward };
}
