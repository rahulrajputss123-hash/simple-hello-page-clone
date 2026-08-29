import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Server-only helper: compute the true user reward for a limited-deal offer
 * from `actual_cost`, `payout_percentage`, and `max_payout_cap`. Used at
 * approval time (never trust the value snapshotted at claim submission).
 *
 * reward = MIN(actual_cost * payout_percentage / 100, max_payout_cap)
 */
export function computeLimitedDealReward(input: {
  actual_cost: number | string | null;
  payout_percentage: number | string | null;
  max_payout_cap: number | string | null;
}): number {
  const cost = Number(input.actual_cost ?? 0);
  const pct = Number(input.payout_percentage ?? 110);
  const cap = input.max_payout_cap == null ? null : Number(input.max_payout_cap);
  if (!Number.isFinite(cost) || cost <= 0) return 0;
  const raw = (cost * pct) / 100;
  const capped = cap != null && Number.isFinite(cap) ? Math.min(raw, cap) : raw;
  return Math.max(0, Math.round(capped * 100) / 100);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OfferRow = any;

/**
 * Signed-URL fetcher for admin proof review. Uses service_role, expires quickly.
 */
export async function signProofUrl(path: string, expiresInSeconds = 300): Promise<string | null> {
  if (!path) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const storage = (supabaseAdmin as any).storage;
  const { data, error } = await storage.from("offer-proofs").createSignedUrl(path, expiresInSeconds);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl as string;
}

/**
 * Loads an offer row and returns a snapshot of the fields relevant to this
 * feature — used by claim submission + approval so behaviour stays consistent.
 */
export async function loadOfferForClaim(offerId: string): Promise<OfferRow | null> {
  const { data, error } = await supabaseAdmin
    .from("offers")
    .select("*")
    .eq("id", offerId)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}
