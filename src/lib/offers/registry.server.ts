import { adblueMediaAdapter } from "./adapters/adbluemedia.server";
import { ogAdsAdapter } from "./adapters/ogads.server";
import type { OfferProviderAdapter } from "./provider-types";

/**
 * Registry of provider adapters. Intentionally EMPTY — no network is integrated yet.
 * A future adapter registers itself here:
 *   registerAdapter(myAdapter)
 */
const adapters = new Map<string, OfferProviderAdapter>();

export function registerAdapter(adapter: OfferProviderAdapter) {
  adapters.set(adapter.slug, adapter);
}

export function getAdapter(slug: string): OfferProviderAdapter | null {
  return adapters.get(slug) ?? null;
}

export function listAdapterSlugs(): string[] {
  return [...adapters.keys()];
}

registerAdapter(adblueMediaAdapter);
registerAdapter(ogAdsAdapter);
