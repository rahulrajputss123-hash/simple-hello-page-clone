import { getRequest } from "@tanstack/react-start/server";

/**
 * Server-side GEO detection from standard proxy headers (Vercel / Cloudflare / common CDNs).
 * No client-side geolocation prompts. Returns an uppercase ISO-3166 alpha-2 code, or null.
 */
const GEO_HEADERS = [
  "x-vercel-ip-country",
  "cf-ipcountry",
  "x-country-code",
  "x-geo-country",
  "x-appengine-country",
] as const;

// Cloudflare returns these for anonymised / unknown sources — treat as "no country".
const IGNORED_CODES = new Set(["XX", "T1", "A1", "A2", "ZZ", "EU"]);

export function normalizeCountry(value: string | null | undefined): string | null {
  if (!value) return null;
  const code = value.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return null;
  if (IGNORED_CODES.has(code)) return null;
  return code;
}

/** Reads the requesting user's country from proxy headers. Returns null when absent/unknown. */
export function detectCountryFromRequest(): string | null {
  const request = getRequest();
  const headers = request?.headers;
  if (!headers) return null;
  for (const key of GEO_HEADERS) {
    const found = normalizeCountry(headers.get(key));
    if (found) return found;
  }
  return null;
}
/** Reads the requesting user's real IP from proxy headers (for geo-targeting on network APIs). */
export function detectIpFromRequest(): string | null {
  const request = getRequest();
  const headers = request?.headers;
  if (!headers) return null;
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = headers.get("x-real-ip") ?? headers.get("cf-connecting-ip");
  return realIp?.trim() || null;
}
