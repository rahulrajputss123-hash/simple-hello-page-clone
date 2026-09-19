// Shared crypto + secret helpers for the SDK offerwall postback adapters.
// Server-only: never import from a client component.
//
// Secrets are ALWAYS read from process.env using the env var *name* stored on
// the provider row (`postback_signature_secret_ref`). No secret value is ever
// stored in the database or hardcoded here.

import { createHash, createHmac, timingSafeEqual } from "crypto";

import type { SdkOfferwallProvider } from "../types";

/**
 * Resolves the provider's signing secret from the environment.
 * Returns "" when the ref is unset or the env var is missing, which callers
 * must treat as "cannot verify" — never as "verified".
 */
export function providerSecret(
  provider: Pick<SdkOfferwallProvider, "postback_signature_secret_ref">,
): string {
  const ref = provider.postback_signature_secret_ref;
  if (!ref) return "";
  return process.env[ref] ?? "";
}

export function md5Hex(input: string): string {
  return createHash("md5").update(input).digest("hex");
}

export function hmacSha256Hex(secret: string, input: string): string {
  return createHmac("sha256", secret).update(input).digest("hex");
}

/**
 * Constant-time hex digest comparison. Compares case-insensitively because
 * networks differ on digest casing, and bails out on length mismatch before
 * timingSafeEqual (which throws on unequal lengths).
 */
export function secureEquals(expected: string, provided: string): boolean {
  if (!expected || !provided) return false;
  const a = Buffer.from(expected.toLowerCase(), "utf8");
  const b = Buffer.from(provided.toLowerCase(), "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Reads a payload field as a trimmed string ("" when absent). */
export function field(payload: Record<string, unknown>, key: string): string {
  const value = payload[key];
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

/** Parses a payload field as a finite number (0 when absent/invalid). */
export function numericField(payload: Record<string, unknown>, key: string): number {
  const parsed = Number.parseFloat(field(payload, key));
  return Number.isFinite(parsed) ? parsed : 0;
}
