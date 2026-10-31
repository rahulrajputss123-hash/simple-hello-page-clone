import { createFileRoute } from "@tanstack/react-router";

/**
 * Public postback endpoint for GemiAd feed offers.
 * 
 * GemiAd sends postbacks to this URL with SHA256 signature verification.
 * 
 * URL format (configured in GemiAd publisher dashboard):
 * https://yourdomain.com/api/public/feed-postback/gemiad?userId={userId}&offerId={offerId}&offerName={offerName}&eventId={eventId}&eventName={eventName}&payout={payout}&reward={reward}&txid={txid}&status={status}&ip={ip}&sub1={sub1}&sub2={sub2}&hash={hash}
 * 
 * Query parameters (all from GemiAd macros):
 * - userId: User UUID
 * - offerId: GemiAd external offer ID
 * - offerName: Offer name (optional, logged only)
 * - eventId: Event ID for multi-step offers (optional)
 * - eventName: Event name (optional, logged only)
 * - payout: Network payout amount in USD (positive=credit, negative=reversal)
 * - reward: User reward amount (optional, logged only, NOT used for crediting)
 * - txid: Unique transaction ID (deduplication key)
 * - status: "completed" | "rejected"
 * - ip: User's IP address (optional, logged only)
 * - sub1: Optional tracking parameter (logged only)
 * - sub2: Optional tracking parameter (logged only)
 * - hash: SHA256 signature = sha256(userId + offerId + txid + GEMIAD_FEED_SECRET_KEY)
 * 
 * Security:
 * - SHA256 signature verification (constant-time comparison)
 * - Source IP allowlist: 64.226.92.208 (GemiAd postback server)
 * - No secrets logged or returned
 * - UUID format validation before DB query
 * - Idempotent: duplicate (provider_slug='gemiad', external_lead_id=txid) returns 200 OK
 * 
 * Reversal handling:
 * - status="rejected" OR payout < 0: Do not credit, wallet untouched
 * - Still returns 200 OK to acknowledge the reversal
 * 
 * Response requirements:
 * - Must respond HTTP 200 with body "Approved" within 5 seconds
 * - GemiAd retries up to 3 times on failure, so must be idempotent
 * 
 * Returns:
 * - 200 "Approved" for success, duplicates, and reversals
 * - 401 for invalid signature or source IP
 * - 400 for invalid parameters or missing user/offer
 */

function clientIp(request: Request): string | null {
  const header =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for");
  if (!header) return null;
  return header.split(",")[0]?.trim() ?? null;
}

async function handle(request: Request) {
  const url = new URL(request.url);
  
  // Extract query parameters (case-sensitive as GemiAd sends them)
  const userId = url.searchParams.get("userId") ?? "";
  const offerId = url.searchParams.get("offerId") ?? "";
  const offerName = url.searchParams.get("offerName") ?? undefined;
  const eventId = url.searchParams.get("eventId") ?? undefined;
  const eventName = url.searchParams.get("eventName") ?? undefined;
  const payout = url.searchParams.get("payout") ?? "";
  const reward = url.searchParams.get("reward") ?? undefined;
  const txid = url.searchParams.get("txid") ?? "";
  const status = url.searchParams.get("status") ?? "";
  const ip = url.searchParams.get("ip") ?? undefined;
  const sub1 = url.searchParams.get("sub1") ?? undefined;
  const sub2 = url.searchParams.get("sub2") ?? undefined;
  const hash = url.searchParams.get("hash") ?? "";

  // Import and process postback
  const { processGemiAdPostback } = await import("@/lib/offers/gemiad-postback.server");
  
  const result = await processGemiAdPostback(
    {
      userId,
      offerId,
      offerName,
      eventId,
      eventName,
      payout,
      reward,
      txid,
      status,
      ip,
      sub1,
      sub2,
      hash,
    },
    clientIp(request),
  );

  // Return appropriate status code
  if (!result.ok) {
    // Invalid signature, source IP, or configuration error
    if (
      result.reason === "invalid_signature" ||
      result.reason === "invalid_source_ip" ||
      result.reason === "secret_not_configured"
    ) {
      return new Response("Unauthorized", { status: 401 });
    }
    // Other validation errors
    return new Response(result.reason ?? "Bad Request", { status: 400 });
  }

  // Success, duplicate, or reversal - all return 200 "Approved"
  return new Response("Approved", { status: 200 });
}

export const Route = createFileRoute("/api/public/feed-postback/gemiad")({
  server: {
    handlers: {
      GET: async ({ request }) => handle(request),
      POST: async ({ request }) => handle(request),
    },
  },
});
