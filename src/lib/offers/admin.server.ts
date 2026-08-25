import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Admin-only offer management + dashboard aggregates. Reads/writes only existing columns. */

export type ManualOfferInput = {
  id?: string | undefined;
  title: string;
  description: string;
  requirements: string;
  notAllowed: string;
  icon: string;
  rewardAmount: number;
  networkPayout?: number | null | undefined;
  clickUrl?: string | null | undefined;
  countries: string[];
  devices: string[];
  expiresAt?: string | null | undefined;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  adminPriority: number;
};

export async function adminDashboardImpl() {
  const [
    profiles,
    pendingWithdrawals,
    approvedClaims,
    referrals,
    networkClaims,
    providers,
    offerCounts,
  ] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("id, wallet_balance, held_balance, lifetime_earned, lifetime_withdrawn, is_flagged, updated_at, created_at")
      .limit(5000),
    supabaseAdmin.from("withdrawal_requests").select("amount, status").limit(5000),
    supabaseAdmin.from("offer_claims").select("status, reward_amount, offer_id").limit(5000),
    supabaseAdmin.from("referrals").select("status, bonus_amount").limit(5000),
    supabaseAdmin
      .from("offer_claims")
      .select("reward_amount, status, offers:offer_id(source, network_payout)")
      .eq("status", "approved")
      .limit(5000),
    supabaseAdmin.from("offer_providers").select("id, name, enabled, last_synced_at, sync_status"),
    supabaseAdmin.from("offers").select("id, source, is_active").limit(20000),
  ]);

  const users = profiles.data ?? [];
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const claims = approvedClaims.data ?? [];
  const withdrawals = pendingWithdrawals.data ?? [];
  const refs = referrals.data ?? [];
  const offers = offerCounts.data ?? [];

  let networkRevenue = 0;
  for (const claim of networkClaims.data ?? []) {
    const offer = claim.offers as unknown as { source: string; network_payout: number | null } | null;
    if (offer?.source === "network" && offer.network_payout != null) {
      networkRevenue += Number(offer.network_payout) - Number(claim.reward_amount);
    }
  }

  return {
    users: {
      total: users.length,
      active: users.filter((u) => new Date(u.updated_at).getTime() >= cutoff).length,
      flagged: users.filter((u) => u.is_flagged).length,
    },
    money: {
      lifetimeEarned: users.reduce((s, u) => s + Number(u.lifetime_earned), 0),
      lifetimeWithdrawn: users.reduce((s, u) => s + Number(u.lifetime_withdrawn), 0),
      walletLiability: users.reduce((s, u) => s + Number(u.wallet_balance), 0),
      heldLiability: users.reduce((s, u) => s + Number(u.held_balance), 0),
      pendingWithdrawalCount: withdrawals.filter((w) => w.status === "pending").length,
      pendingWithdrawalAmount: withdrawals
        .filter((w) => w.status === "pending")
        .reduce((s, w) => s + Number(w.amount), 0),
      networkRevenue,
    },
    offers: {
      total: offers.length,
      manual: offers.filter((o) => o.source === "manual").length,
      network: offers.filter((o) => o.source === "network").length,
      active: offers.filter((o) => o.is_active).length,
      completions: claims.filter((c) => c.status === "approved").length,
      pendingClaims: claims.filter((c) => c.status === "pending").length,
    },
    referrals: {
      total: refs.length,
      credited: refs.filter((r) => r.status !== "pending").length,
      paid: refs.reduce((s, r) => s + Number(r.bonus_amount), 0),
    },
    providers: (providers.data ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      enabled: p.enabled,
      syncStatus: p.sync_status,
      lastSyncedAt: p.last_synced_at,
    })),
  };
}

export async function listAdminOffersImpl(input: {
  source: "all" | "manual" | "network";
  search?: string | undefined;
  status?: "all" | "active" | "inactive" | "featured" | "expired" | undefined;
  providerId?: string | undefined;
  country?: string | undefined;
  limit: number;
}) {
  let q = supabaseAdmin
    .from("offers")
    .select(
      "id, title, description, requirements, not_allowed, icon, source, provider_id, external_offer_id, reward_amount, network_payout, revenue_share, click_url, countries, devices, expires_at, last_seen_at, is_active, is_featured, sort_order, admin_priority, created_at, updated_at, offer_providers:provider_id(name, slug)",
    )
    .order("admin_priority", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(input.limit);

  if (input.source !== "all") q = q.eq("source", input.source);
  if (input.providerId) q = q.eq("provider_id", input.providerId);
  if (input.search) q = q.ilike("title", `%${input.search}%`);
  if (input.country) q = q.contains("countries", [input.country.toUpperCase()]);
  if (input.status === "active") q = q.eq("is_active", true);
  if (input.status === "inactive") q = q.eq("is_active", false);
  if (input.status === "featured") q = q.eq("is_featured", true);
  if (input.status === "expired") q = q.lt("expires_at", new Date().toISOString());

  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function upsertManualOfferImpl(input: ManualOfferInput) {
  const row = {
    title: input.title,
    description: input.description,
    requirements: input.requirements,
    not_allowed: input.notAllowed ?? "",
    icon: input.icon || "gift",
    reward_amount: input.rewardAmount,
    network_payout: input.networkPayout ?? null,
    click_url: input.clickUrl ?? null,
    countries: input.countries.map((c) => c.toUpperCase()),
    devices: input.devices,
    expires_at: input.expiresAt ?? null,
    is_active: input.isActive,
    is_featured: input.isFeatured,
    sort_order: input.sortOrder,
    admin_priority: input.adminPriority,
    source: "manual",
  };

  if (input.id) {
    const existing = await supabaseAdmin
      .from("offers")
      .select("source")
      .eq("id", input.id)
      .single();
    if (existing.error) throw new Error("Offer not found.");
    if (existing.data.source !== "manual") {
      throw new Error("Only manual offers can be edited here.");
    }
    const { data, error } = await supabaseAdmin
      .from("offers")
      .update(row)
      .eq("id", input.id)
      .select("id")
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabaseAdmin
    .from("offers")
    .insert({ ...row, provider_id: null, external_offer_id: null })
    .select("id")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteManualOfferImpl(id: string) {
  const existing = await supabaseAdmin.from("offers").select("source").eq("id", id).single();
  if (existing.error) throw new Error("Offer not found.");
  if (existing.data.source !== "manual") {
    throw new Error("Network offers can't be deleted — deactivate them instead.");
  }
  const claims = await supabaseAdmin
    .from("offer_claims")
    .select("id")
    .eq("offer_id", id)
    .limit(1);
  if (claims.data?.length) {
    // Preserve claim history: deactivate instead of hard delete.
    const { error } = await supabaseAdmin.from("offers").update({ is_active: false }).eq("id", id);
    if (error) throw error;
    return { deleted: false, deactivated: true };
  }
  const { error } = await supabaseAdmin.from("offers").delete().eq("id", id);
  if (error) throw error;
  return { deleted: true, deactivated: false };
}

/** Local-only controls, safe for both manual and network offers (sync never writes these back destructively). */
export async function updateOfferControlsImpl(input: {
  id: string;
  isActive?: boolean | undefined;
  isFeatured?: boolean | undefined;
  adminPriority?: number | undefined;
  sortOrder?: number | undefined;
  rewardAmount?: number | undefined;
  revenueShare?: number | undefined;
}) {
  const patch: {
    is_active?: boolean;
    is_featured?: boolean;
    admin_priority?: number;
    sort_order?: number;
    reward_amount?: number;
    revenue_share?: number;
  } = {};
  if (input.isActive !== undefined) patch.is_active = input.isActive;
  if (input.isFeatured !== undefined) patch.is_featured = input.isFeatured;
  if (input.adminPriority !== undefined) patch.admin_priority = input.adminPriority;
  if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;
  if (input.rewardAmount !== undefined) patch.reward_amount = input.rewardAmount;
  if (input.revenueShare !== undefined) patch.revenue_share = input.revenueShare;
  if (!Object.keys(patch).length) return { ok: true };
  const { error } = await supabaseAdmin.from("offers").update(patch).eq("id", input.id);
  if (error) throw error;
  return { ok: true };
}
