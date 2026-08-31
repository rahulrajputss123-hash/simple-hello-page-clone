/**
 * Client-side per-user tracking for offer click URLs.
 *
 * OGAds (`ogads`) click links are cached and shared across all users, so they
 * don't carry a per-user subid. We append the internal user id as `aff_sub4`
 * at click time. Other providers' URLs are returned unchanged.
 */
export function appendAffSub4(
  url: string | null | undefined,
  providerSlug: string | null | undefined,
  userId: string | null | undefined,
): string | null {
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
