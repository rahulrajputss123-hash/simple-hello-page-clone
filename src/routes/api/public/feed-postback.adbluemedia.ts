import { createFileRoute } from "@tanstack/react-router";

/**
 * Public postback endpoint for AdBlueMedia feed offers.
 * 
 * AdBlueMedia uses a single global postback URL per account with token-based authentication.
 * 
 * URL format (configured in AdBlueMedia publisher dashboard):
 * https://cashgpt.in/api/public/feed-postback/adbluemedia?token=SECRET&s1={s1}&offer_id={offer_id}&lead_id={lead_id}&payout={payout}&status={status}
 * 
 * Query parameters:
 * - token: Secret token for authentication (must match ADBLUEMEDIA_POSTBACK_TOKEN env var)
 * - s1: User UUID (attached to click URL by our system)
 * - offer_id: AdBlueMedia's external offer ID
 * - lead_id: Unique transaction ID for deduplication
 * - payout: Amount in dollars
 * - status: "1" = success (credit), "0" = chargeback (log only)
 * 
 * Security:
 * - Constant-time token comparison
 * - No secrets logged or returned
 * - Idempotent: duplicate lead_id returns 200 OK without double-credit
 * 
 * Returns:
 * - 200 "OK" for success and duplicates
 * - 401/403 for invalid token
 * - 400 for invalid parameters
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
  const s1 = url.searchParams.get("s1") ?? "";
  const offer_id = url.searchParams.get("offer_id") ?? "";
  const lead_id = url.searchParams.get("lead_id") ?? "";
  const payout = url.searchParams.get("payout") ?? "";
  const status = url.searchParams.get("status") ?? "";

  // Import and process postback
  const { processAdBlueMediaPostback } = await import(
    "@/lib/offers/adbluemedia-postback.server"
  );
  
  const result = await processAdBlueMediaPostback(
    { token, s1, offer_id, lead_id, payout, status },
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

  // Success, duplicate, or chargeback - all return 200
  return new Response("OK", { status: 200 });
}

export const Route = createFileRoute("/api/public/feed-postback/adbluemedia")({
  server: {
    handlers: {
      GET: async ({ request }) => handle(request),
      POST: async ({ request }) => handle(request),
    },
  },
});
