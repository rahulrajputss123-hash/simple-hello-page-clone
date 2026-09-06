import { REVTOO_USER_ID_PLACEHOLDER } from "./adapters/revtoo.server";

/**
 * Client-side per-user tracking for offer click URLs.
 *
 * OGAds (`ogads`) click links are cached and shared across all users, so they
 * don't carry a per-user subid. We append the internal user id as `aff_sub4`
 * at click time.
 *
 * Affike (`affike`) returns no direct click URL at all — the redirect is built
 * fresh per user from the offer's external id + user id (NOT by appending a
 * param to an existing URL).
 *
 * AdswedMedia (`adswedmedia`) and Revtoo (`revtoo`) embed a literal placeholder
 * string in every cached offer URL. We replace it with the real user id here
 * via simple substring substitution.
 *
 * Other providers' URLs are returned unchanged.
 */
export function appendAffSub4(
  url: string | null | undefined,
  providerSlug: string | null | undefined,
  userId: string | null | undefined,
  externalOfferId?: string | null,
): string | null {
  // Affike: construct the full track/click URL from scratch.
  if (providerSlug === "affike") {
    if (!userId || !externalOfferId) return null;
    const oid = encodeURIComponent(externalOfferId);
    const cid = encodeURIComponent(userId);
    return `https://affike.com/track/click?offer_id=${oid}&click_id=${cid}`;
  }

  // AdswedMedia: the click URL carries a literal "USER_ID_HERE" placeholder that
  // must be replaced with the internal user id (simple substring substitution).
  if (providerSlug === "adswedmedia") {
    if (!url) return null;
    if (!userId) return url;
    return url.split("USER_ID_HERE").join(userId);
  }

  // Revtoo: the click URL carries REVTOO_USER_ID_PLACEHOLDER (embedded at sync
  // time because the feed runs per-country and is shared across all users).
  // Replace it with the real user id via the same substring-substitution pattern.
  if (providerSlug === "revtoo") {
    if (!url) return null;
    if (!userId) return url;
    return url.split(REVTOO_USER_ID_PLACEHOLDER).join(userId);
  }

  if (!url) return null;
  if (providerSlug !== "ogads" || !userId) return url;
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("aff_sub4", userId);
    return parsed.toString();
  } catch {
    // Fall back to a plain query-string append if the URL can't be parsed.
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}aff_sub4=${encodeURIComponent(userId)}`;
  }
}
