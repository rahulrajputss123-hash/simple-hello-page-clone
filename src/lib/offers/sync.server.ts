import { supabaseAdmin } from "@/integrations/supabase/client.server";

import { getAdapter } from "./registry.server";
import { computeUserReward, type NormalizedOffer, type OfferProvider } from "./provider-types";

export type SyncResult = {
  provider: string;
  fetched: number;
  upserted: number;
  deactivated: number;
};

function toRow(provider: OfferProvider, offer: NormalizedOffer, seenAt: string) {
  const share = offer.revenueShare ?? provider.default_revenue_share;
  return {
    source: "network",
    provider_id: provider.id,
    external_offer_id: offer.externalOfferId,
    title: offer.title,
    description: offer.description ?? "",
    requirements: offer.requirements ?? "",
    icon: offer.icon ?? "gift",
    click_url: offer.clickUrl,
    network_payout: offer.networkPayout,
    revenue_share: share,
    reward_amount: computeUserReward(offer.networkPayout, share),
    countries: offer.countries ?? [],
    devices: offer.devices ?? [],
    expires_at: offer.expiresAt ?? null,
    is_featured: offer.isFeatured ?? false,
    is_active: true,
    sort_order: offer.sortOrder ?? 0,
    last_seen_at: seenAt,
    // Sync-provided category. The sync engine strips this key from the upsert
    // payload for any offer whose `category_manual` is already true (see
    // `syncProviderImpl`), so admin edits are never overwritten.
    category: offer.category ?? null,
    raw_payload: (offer.raw ?? null) as never,
  };
}

/**
 * Generic sync engine — provider-agnostic. Fetches through the registered adapter,
 * upserts on (provider_id, external_offer_id) and deactivates offers that
 * disappeared from the feed. Does nothing unless an adapter exists and is enabled.
 */
export async function syncProviderImpl(providerId: string): Promise<SyncResult> {
  const { data: provider, error } = await supabaseAdmin
    .from("offer_providers")
    .select("*")
    .eq("id", providerId)
    .maybeSingle();
  if (error) throw error;
  if (!provider) throw new Error("Provider not found");
  if (!provider.enabled) throw new Error("Provider is disabled");

  const adapter = getAdapter(provider.slug);
  if (!adapter) throw new Error(`No adapter registered for provider "${provider.slug}"`);

  const configError = adapter.validateConfig?.(
    (provider.sync_config ?? {}) as Record<string, unknown>,
  );
  if (configError) throw new Error(configError);

  await supabaseAdmin
    .from("offer_providers")
    .update({ sync_status: "syncing", sync_error: null })
    .eq("id", provider.id);

  const seenAt = new Date().toISOString();
  try {
    const offers = await adapter.fetchOffers(provider as unknown as OfferProvider);

    // Fetch existing manual-override flags so the sync never overwrites admin
    // edits on `category` / `tags`. This replaces the old DB trigger which
    // could not distinguish sync writes from legitimate admin re-edits.
    // Paginated so providers with thousands of offers still get full coverage
    // beyond PostgREST's default row cap.
    const manualFlags = new Map<string, { categoryManual: boolean; tagsManual: boolean }>();
    const PAGE_SIZE = 1000;
    for (let from = 0; ; from += PAGE_SIZE) {
      const { data: page, error: pageError } = await supabaseAdmin
        .from("offers")
        .select("external_offer_id, category_manual, tags_manual")
        .eq("provider_id", provider.id)
        .range(from, from + PAGE_SIZE - 1);
      if (pageError) throw pageError;
      const rows = page ?? [];
      for (const row of rows) {
        manualFlags.set(row.external_offer_id, {
          categoryManual: Boolean(
            (row as { category_manual?: boolean }).category_manual,
          ),
          tagsManual: Boolean((row as { tags_manual?: boolean }).tags_manual),
        });
      }
      if (rows.length < PAGE_SIZE) break;
    }

    const rows = offers.map((o) => {
      const row = toRow(provider as unknown as OfferProvider, o, seenAt) as Record<
        string,
        unknown
      >;
      const flags = manualFlags.get(o.externalOfferId);
      if (flags?.categoryManual) delete row["category"];
      if (flags?.tagsManual) delete row["tags"];
      return row;
    });

    if (rows.length) {
      const { error: upsertError } = await supabaseAdmin
        .from("offers")
        .upsert(rows as never, { onConflict: "provider_id,external_offer_id" });
      if (upsertError) throw upsertError;
    }

    // Anything from this provider not seen in this run is gone/expired.
    const { data: stale, error: staleError } = await supabaseAdmin
      .from("offers")
      .update({ is_active: false })
      .eq("provider_id", provider.id)
      .eq("source", "network")
      .eq("is_active", true)
      .or(`last_seen_at.is.null,last_seen_at.lt.${seenAt}`)
      .select("id");
    if (staleError) throw staleError;

    await supabaseAdmin
      .from("offer_providers")
      .update({ sync_status: "ok", sync_error: null, last_synced_at: seenAt })
      .eq("id", provider.id);

    return {
      provider: provider.slug,
      fetched: offers.length,
      upserted: rows.length,
      deactivated: stale?.length ?? 0,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    await supabaseAdmin
      .from("offer_providers")
      .update({ sync_status: "error", sync_error: message })
      .eq("id", provider.id);
    throw err;
  }
}

export async function listProvidersImpl() {
  const { data, error } = await supabaseAdmin
    .from("offer_providers")
    .select("*")
    .order("name");
  if (error) throw error;
  return data;
}

export async function upsertProviderImpl(input: {
  id?: string | undefined;
  name: string;
  slug: string;
  providerType: string;
  enabled: boolean;
  syncConfig: Record<string, unknown>;
  defaultRevenueShare: number;
}) {
  const row = {
    name: input.name,
    slug: input.slug,
    provider_type: input.providerType,
    enabled: input.enabled,
    sync_config: input.syncConfig as never,
    default_revenue_share: input.defaultRevenueShare,
  };
  const query = input.id
    ? supabaseAdmin.from("offer_providers").update(row).eq("id", input.id).select("*").single()
    : supabaseAdmin.from("offer_providers").insert(row).select("*").single();
  const { data, error } = await query;
  if (error) throw error;
  return data;
}
