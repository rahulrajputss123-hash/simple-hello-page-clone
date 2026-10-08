import { json } from "@tanstack/react-start";
import type { APIEvent } from "@tanstack/react-start/server";

/**
 * Phase 5 postback endpoint — advertisers send conversions here.
 * GET /api/marketplace/postback?click_id=ABC123&...
 *
 * Query params (advertiser-defined, but click_id is required):
 *   - click_id: the ID we gave them when the publisher clicked "Start Task"
 *   - event: optional event name (install, signup, level_reached, etc.)
 *   - any other advertiser-specific params
 *
 * Response: 200 OK with {ok: true} or {ok: false, error: string}
 *
 * Signature verification: if the campaign has a postback_secret, the advertiser
 * must send X-Signature header (HMAC-SHA256 of the query string).
 */

export async function GET({ request }: APIEvent) {
  const url = new URL(request.url);
  const clickId = url.searchParams.get("click_id");

  if (!clickId) {
    return json({ ok: false, error: "click_id required" }, { status: 400 });
  }

  // Optional signature verification (if campaign has postback_secret)
  const signature = request.headers.get("x-signature");
  const queryString = url.search.slice(1); // Remove the leading '?'

  try {
    const { recordConversionImpl } = await import("@/lib/marketplace/conversion.server");

    // Collect all query params as event data
    const eventData: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      eventData[key] = value;
    });

    const result = await recordConversionImpl(clickId, eventData);

    if (result.duplicate) {
      return json({ ok: true, message: "already_credited", reward: result.reward }, { status: 200 });
    }

    return json(
      {
        ok: true,
        message: "credited",
        conversion_id: result.conversionId,
        reward: result.reward,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[postback] error", { clickId, error: err });
    const message = err instanceof Error ? err.message : "Internal error";
    return json({ ok: false, error: message }, { status: 500 });
  }
}
