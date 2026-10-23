import { createFileRoute } from "@tanstack/react-router";

/**
 * Public postback endpoint for OGAds feed offers.
 * 
 * OGAds uses a single global postback URL per account with token-based authentication.
 * 
 * URL format (configured in OGAds publisher dashboard):
 * https://cashgpt.in/api/public/feed-postback/ogads?token=SECRET&offer_id={offer_id}&payout={payout}&aff_sub4={aff_sub4}&session_timestamp={session_timestamp}&session_ip={session_ip}
 * 
 * Query parameters:
 * - token: Secret token for authentication (must match OGADS_POSTBACK_TOKEN env var)
 * - offer_id: OGAds external offer ID
 * - payout: Network payout amount (logged only, NOT used for user credit)
 * - aff_sub4: User UUID (attached to click URL by appendAffSub4 in click-url.ts)
 * - session_timestamp: Unix timestamp for deduplication
 * - session_ip: User's IP address from OGAds session
 * 
 * Security:
 * - Constant-time token comparison
 * - No secrets logged or returned
 * - UUID format validation before DB query
 * - Idempotent: duplicate (provider_slug, external_lead_id) returns 200 OK without double-credit
 * 
 * Deduplication:
 * - OGAds provides no unique lead_id, so we build: aff_sub4:offer_id:session_timestamp
 * - Uses existing offer_claims_provider_lead_uniq constraint (migration 20270727000000)
 * 
 * Returns:
 * - 200 "OK" for success and duplicates
 * - 401 for invalid token
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
  
  // Extract query parameters
  const token = url.searchParams.get("token") ?? "";
  const offer_id = url.searchParams.get("offer_id") ?? "";
  const payout = url.searchParams.get("payout") ?? "";
  const aff_sub4 = url.searchParams.get("aff_sub4") ?? "";
  const session_timestamp = url.searchParams.get("session_timestamp") ?? "";
  const session_ip = url.searchParams.get("session_ip") ?? undefined;

  // Import and process postback
  const { processOgAdsPostback } = await import("@/lib/offers/ogads-postback.server");
  
  const result = await processOgAdsPostback(
    { token, offer_id, payout, aff_sub4, session_timestamp, session_ip },
    clientIp(request),
  );

  // Return appropriate status code
  if (!result.ok) {
    // Invalid token or configuration error
    if (result.reason === "invalid_token" || result.reason === "token_not_configured") {
      return new Response("Unauthorized", { status: 401 });
    }
    // Other validation errors
    return new Response(result.reason ?? "Bad Request", { status: 400 });
  }

  // Success or duplicate - both return 200
  return new Response("OK", { status: 200 });
}

export const Route = createFileRoute("/api/public/feed-postback/ogads")({
  server: {
    handlers: {
      GET: async ({ request }) => handle(request),
      POST: async ({ request }) => handle(request),
    },
  },
});
