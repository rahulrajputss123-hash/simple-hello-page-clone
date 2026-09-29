import { createHash } from "crypto";

import { supabaseAdmin } from "@/integrations/supabase/client.server";

import type { NormalizedOffer, OfferProvider } from "./provider-types";

/**
 * Materialises base64 `data:` image URIs from a provider feed into Supabase
 * Storage, so `offers.image_url` only ever holds a URL.
 *
 * Affike sends ~11% of its catalogue with artwork inline as a data URI rather
 * than a link. Those used to be dropped, leaving those offers on the generic
 * fallback icon. Storing the base64 in the table instead was not an option — it
 * would bloat every feed query that selects the column.
 *
 * Runs at most once per offer: an offer that already has a non-null image_url is
 * skipped, so a re-sync does no upload work. The object path is content-hashed,
 * so even if an upload does repeat it overwrites in place rather than
 * accumulating duplicates.
 */

const BUCKET = "offer-images";
/** Guard against a pathological payload; Affike's are a few KB. */
const MAX_DECODED_BYTES = 2 * 1024 * 1024;

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

export type DecodedImage = { bytes: Buffer; contentType: string; ext: string };

/**
 * Parses a `data:image/...;base64,....` URI. Returns null for anything else,
 * including plain URLs and non-image or non-base64 data URIs.
 */
export function decodeDataUriImage(value: string | null | undefined): DecodedImage | null {
  if (typeof value !== "string") return null;
  const match = /^data:([a-z0-9.+/-]+);base64,(.+)$/i.exec(value.trim());
  if (!match) return null;
  const contentType = (match[1] ?? "").toLowerCase();
  const ext = EXT_BY_MIME[contentType];
  if (!ext) return null;
  try {
    const bytes = Buffer.from(match[2] ?? "", "base64");
    if (bytes.length === 0 || bytes.length > MAX_DECODED_BYTES) return null;
    return { bytes, contentType, ext };
  } catch {
    return null;
  }
}

/** Stable, collision-resistant object path. Same bytes -> same path. */
function objectPath(providerSlug: string, externalOfferId: string, image: DecodedImage): string {
  const hash = createHash("sha256").update(image.bytes).digest("hex").slice(0, 16);
  const safeId = externalOfferId.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 80);
  return `${providerSlug}/${safeId}-${hash}.${image.ext}`;
}

/**
 * image_url already stored for these offers, keyed by externalOfferId.
 *
 * Serves two purposes: offers listed here need no upload, and the URL is handed
 * back to the caller so a sync that has no image for an offer can re-write the
 * existing value instead of nulling it out. The bulk upsert writes image_url for
 * every row, so without that a later sync would wipe an uploaded image.
 */
export async function existingOfferImageUrls(
  providerId: string,
  externalOfferIds: string[],
): Promise<Map<string, string>> {
  const found = new Map<string, string>();
  if (!externalOfferIds.length) return found;
  const { data, error } = await supabaseAdmin
    .from("offers")
    .select("external_offer_id, image_url")
    .eq("provider_id", providerId)
    .in("external_offer_id", externalOfferIds);
  // On error, return empty: attempting the upload is safer than skipping it, and
  // the content-hashed path makes a repeat upload harmless.
  if (error || !data) return found;
  for (const row of data) {
    const url = (row as { image_url?: string | null }).image_url;
    const id = (row as { external_offer_id?: string | null }).external_offer_id;
    if (id && typeof url === "string" && url.trim().length > 0) found.set(id, url.trim());
  }
  return found;
}

/**
 * Uploads any inline images that aren't stored yet.
 *
 * @returns externalOfferId -> public URL, for the offers uploaded in THIS call.
 *          Offers that were skipped or failed are absent, so callers fall back to
 *          whatever they would otherwise have used.
 */
export async function materializeInlineOfferImages(
  provider: Pick<OfferProvider, "id" | "slug">,
  offers: NormalizedOffer[],
  /** Result of existingOfferImageUrls, passed in so it is only queried once. */
  alreadyStored: Map<string, string>,
): Promise<Map<string, string>> {
  const result = new Map<string, string>();

  const candidates = offers
    .map((offer) => ({ offer, image: decodeDataUriImage(offer.imageDataUri) }))
    .filter((c): c is { offer: NormalizedOffer; image: DecodedImage } => c.image !== null);
  if (!candidates.length) return result;

  for (const { offer, image } of candidates) {
    // Once per offer: an offer that already has artwork is never re-uploaded.
    if (alreadyStored.has(offer.externalOfferId)) continue;
    const path = objectPath(provider.slug, offer.externalOfferId, image);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const storage = (supabaseAdmin as any).storage.from(BUCKET);
      const { error } = await storage.upload(path, image.bytes, {
        contentType: image.contentType,
        // Unique per content hash and never edited in place, so cache hard.
        cacheControl: "31536000",
        // Idempotent: a retry of the same bytes rewrites the same object.
        upsert: true,
      });
      if (error) continue;
      const { data } = storage.getPublicUrl(path);
      const publicUrl = (data as { publicUrl?: string } | null)?.publicUrl;
      if (publicUrl) result.set(offer.externalOfferId, publicUrl);
    } catch {
      // A failed image must never fail the whole sync — the offer just keeps
      // its fallback icon and the next sync can try again.
      continue;
    }
  }

  return result;
}
