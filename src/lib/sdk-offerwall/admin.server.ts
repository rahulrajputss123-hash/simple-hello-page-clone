import { supabaseAdmin } from "@/integrations/supabase/client.server";

import type {
  PublicSdkOfferwallProvider,
  SdkOfferwallProvider,
  SdkProviderInput,
} from "./types";
import { getSdkAdapter, listSdkAdapterSlugs } from "./registry.server";

const COLUMNS = "*";

/** Admin: full provider configuration list, ordered for the wall. */
export async function listSdkProvidersImpl(): Promise<
  (SdkOfferwallProvider & { hasAdapter: boolean })[]
> {
  const { data, error } = await supabaseAdmin
    .from("sdk_offerwall_providers")
    .select(COLUMNS)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as unknown as SdkOfferwallProvider[]).map((p) => ({
    ...p,
    hasAdapter: Boolean(getSdkAdapter(p.slug)),
  }));
}

export function listSdkAdaptersImpl() {
  return { slugs: listSdkAdapterSlugs() };
}

/** App-facing list — safe fields only, enabled providers in display order.
 *  Includes lock state computed server-side in UTC so the client can render
 *  locked/unlocked cards without any additional round-trips.
 */
export async function listPublicSdkProvidersImpl(
  limit?: number,
  userId?: string,
): Promise<PublicSdkOfferwallProvider[]> {
  let query = supabaseAdmin
    .from("sdk_offerwall_providers")
    .select(
      "id, slug, name, tagline, logo_url, platforms, integration_type, status, display_order, app_id, lock_type, unlock_at, required_lifetime_earned",
    )
    .eq("enabled", true)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });
  if (typeof limit === "number") query = query.limit(limit);
  const { data, error } = await query;
  if (error) throw error;

  let lifetimeEarned = 0;
  if (userId) {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("lifetime_earned")
      .eq("id", userId)
      .maybeSingle();
    lifetimeEarned = Number(profile?.lifetime_earned ?? 0);
  }

  const { computeLockState } = await import("../lock-state");

  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    const lockType = ((r["lock_type"] as string | null) ?? "none") as "none" | "time" | "earning";
    const unlockAt = (r["unlock_at"] as string | null) ?? null;
    const requiredLifetimeEarned =
      r["required_lifetime_earned"] != null ? Number(r["required_lifetime_earned"]) : null;
    const lockState = userId
      ? computeLockState(lockType, unlockAt, requiredLifetimeEarned, lifetimeEarned)
      : { is_locked: false, unlock_reason: null };
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      tagline: row.tagline,
      logoUrl: row.logo_url,
      platforms: row.platforms,
      integrationType: row.integration_type,
      status: row.status,
      appId: row.app_id,
      displayOrder: row.display_order,
      lockType,
      unlockAt,
      requiredLifetimeEarned,
      isLocked: lockState.is_locked,
      unlockReason: lockState.unlock_reason,
    };
  });
}

function toRow(input: SdkProviderInput) {
  return {
    slug: input.slug,
    name: input.name,
    tagline: input.tagline,
    lock_type: input.lockType ?? "none",
    unlock_at: input.lockType === "time" ? (input.unlockAt ?? null) : null,
    required_lifetime_earned:
      input.lockType === "earning" ? (input.requiredLifetimeEarned ?? null) : null,
    logo_url: input.logoUrl ?? null,
    enabled: input.enabled,
    display_order: input.displayOrder,
    platforms: input.platforms,
    integration_type: input.integrationType,
    sdk_version: input.sdkVersion ?? null,
    app_id: input.appId ?? null,
    placement_id: input.placementId ?? null,
    publisher_id: input.publisherId ?? null,
    extra_config: input.extraConfig as never,
    secret_refs: input.secretRefs as never,
    currency_name: input.currencyName,
    currency_per_usd: input.currencyPerUsd,
    reward_multiplier: input.rewardMultiplier,
    min_reward: input.minReward,
    max_reward: input.maxReward ?? null,
    rounding_mode: input.roundingMode,
    postback_path: input.postbackPath ?? null,
    postback_auth_mode: input.postbackAuthMode,
    postback_signature_secret_ref: input.postbackSignatureSecretRef ?? null,
    postback_ip_allowlist: input.postbackIpAllowlist,
    transaction_id_param: input.transactionIdParam,
    user_id_param: input.userIdParam,
    reward_param: input.rewardParam,
    user_identity_mode: input.userIdentityMode,
    user_identity_salt_ref: input.userIdentitySaltRef ?? null,
    dedupe_strategy: input.dedupeStrategy,
    dedupe_window_hours: input.dedupeWindowHours,
    status: input.status,
    notes: input.notes,
    metadata: input.metadata as never,
  };
}

export async function upsertSdkProviderImpl(input: SdkProviderInput) {
  const row = toRow(input);
  if (input.id) {
    const { data, error } = await supabaseAdmin
      .from("sdk_offerwall_providers")
      .update(row)
      .eq("id", input.id)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    return { id: data?.id ?? input.id };
  }
  const { data, error } = await supabaseAdmin
    .from("sdk_offerwall_providers")
    .insert(row)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  return { id: data?.id ?? "" };
}

export async function updateSdkProviderControlsImpl(input: {
  id: string;
  enabled?: boolean | undefined;
  displayOrder?: number | undefined;
  status?: string | undefined;
}) {
  const patch: Record<string, unknown> = {};
  if (input.enabled !== undefined) patch['enabled'] = input.enabled;
  if (input.displayOrder !== undefined) patch['display_order'] = input.displayOrder;
  if (input.status !== undefined) patch['status'] = input.status;
  if (Object.keys(patch).length === 0) return { ok: true };
  const { error } = await supabaseAdmin
    .from("sdk_offerwall_providers")
    .update(patch as never)
    .eq("id", input.id);
  if (error) throw error;
  return { ok: true };
}

export async function deleteSdkProviderImpl(id: string) {
  const { error } = await supabaseAdmin.from("sdk_offerwall_providers").delete().eq("id", id);
  if (error) throw error;
  return { ok: true };
}

/** Admin: recent conversion records (empty until a real adapter is added). */
export async function listSdkConversionsImpl(input: {
  providerId?: string | undefined;
  limit: number;
}) {
  let query = supabaseAdmin
    .from("sdk_offerwall_conversions")
    .select(
      "id, provider_id, user_id, provider_transaction_id, currency_amount, reward_amount, status, received_at",
    )
    .order("received_at", { ascending: false })
    .limit(input.limit);
  if (input.providerId) query = query.eq("provider_id", input.providerId);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}
