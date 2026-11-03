import { createFileRoute } from "@tanstack/react-router";

/**
 * Public postback endpoint for Torox feed offers.
 * 
 * Torox sends postbacks to this URL with MD5 signature verification.
 * 
 * URL format (configured in Torox publisher dashboard):
 * https://yourdomain.com/api/public/feed-postback/torox?id={id}&oid={oid}&amount={amount}&currency_name={currency_name}&user_id={user_id}&payout={payout}&o_name={o_name}&sig={sig}&package_id={package_id}&ip_address={ip_address}&event={event}&subid1={subid1}&subid2={subid2}&subid3={subid3}&click_ts={click_ts}&conversion_ts={conversion_ts}
 * 
 * Query parameters (all from Torox macros):
 * - id: Conversion ID (deduplication key)
 * - oid: Offer ID (external_offer_id)
 * - amount: Offer amount in USD (optional)
 * - currency_name: Currency name (optional, logged only)
 * - user_id: User UUID
 * - payout: Publisher revenue in USD (positive=credit, negative=reversal)
 * - o_name: Offer name (optional, logged only)
 * - sig: MD5 signature = md5(oid + "-" + user_id + "-" + TOROX_FEED_TOKEN) (lowercase hex)
 * - package_id: Package/app ID (optional, logged only)
 * - ip_address: User's IP address (optional, logged only)
 * - event: Event name (optional, logged only)
 * - subid1: Optional tracking parameter (logged only)
 * - subid2: Optional tracking parameter (logged only)
 * - subid3: Optional tracking parameter (logged only)
 * - click_ts: Click timestamp (optional, logged only)
 * - conversion_ts: Conversion timestamp (optional, logged only)
 * 
 * Security:
 * - MD5 signature verification (constant-time comparison)
 * - Source IP allowlist: 44.212.211.226 (Torox postback server)
 * - No secrets logged or returned
 * - UUID format validation before DB query
 * - Idempotent: duplicate (provider_slug='torox', external_lead_id=id) returns 200 "1"
 * 
 * Reversal handling:
 * - payout < 0 OR amount < 0: Do not credit, wallet untouched
 * - Still returns 200 "1" to acknowledge the reversal
 * 
 * Response requirements:
 * - Must respond HTTP 200 with body "1" for success/duplicate/reversal
 * - Must respond HTTP 200 with body "0" for failure
 * - Torox retries on non-"1" response, so must be idempotent
 * 
 * Returns:
 * - 200 "1" for success, duplicates, and reversals
 * - 200 "0" for invalid signature, source IP, or other errors
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
  const id = url.searchParams.get("id") ?? "";
  const oid = url.searchParams.get("oid") ?? "";
  const amount = url.searchParams.get("amount") ?? undefined;
  const currency_name = url.searchParams.get("currency_name") ?? undefined;
  const user_id = url.searchParams.get("user_id") ?? "";
  const payout = url.searchParams.get("payout") ?? "";
  const o_name = url.searchParams.get("o_name") ?? undefined;
  const sig = url.searchParams.get("sig") ?? "";
  const package_id = url.searchParams.get("package_id") ?? undefined;
  const ip_address = url.searchParams.get("ip_address") ?? undefined;
  const event = url.searchParams.get("event") ?? undefined;
  const subid1 = url.searchParams.get("subid1") ?? undefined;
  const subid2 = url.searchParams.get("subid2") ?? undefined;
  const subid3 = url.searchParams.get("subid3") ?? undefined;
  const click_ts = url.searchParams.get("click_ts") ?? undefined;
  const conversion_ts = url.searchParams.get("conversion_ts") ?? undefined;

  // Import and process postback
  const { processToroxPostback } = await import("@/lib/offers/torox-postback.server");
  
  const result = await processToroxPostback(
    {
      id,
      oid,
      amount,
      currency_name,
      user_id,
      payout,
      o_name,
      sig,
      package_id,
      ip_address,
      event,
      subid1,
      subid2,
      subid3,
      click_ts,
      conversion_ts,
    },
    clientIp(request),
  );

  // Torox expects "1" for success/duplicate/reversal, "0" for failure
  if (result.ok) {
    // Success, duplicate, or reversal acknowledged
    return new Response("1", { status: 200 });
  }

  // All errors return "0" to indicate failure
  return new Response("0", { status: 200 });
}

export const Route = createFileRoute("/api/public/feed-postback/torox")({
  server: {
    handlers: {
      GET: async ({ request }) => handle(request),
      POST: async ({ request }) => handle(request),
    },
  },
});
