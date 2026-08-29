import { createFileRoute } from "@tanstack/react-router";

/**
 * Public postback endpoint for offers on payout_mode='auto_postback'.
 *
 * Networks (or a self-hosted locker page) POST/GET to:
 *   /api/public/offer-postback/{offerId}?txn=…&uid=…&amount=…&sig=…
 *
 * Verification (HMAC signature over `txn:uid:amount` using the per-offer
 * `postback_secret_ref` env var, plus optional IP allowlist) lives in
 * src/lib/offers/postback.server.ts.
 */

function clientIp(request: Request): string | null {
  const header =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for");
  if (!header) return null;
  return header.split(",")[0]?.trim() ?? null;
}

function headerMap(request: Request): Record<string, string> {
  const out: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    out[key.toLowerCase()] = value;
  });
  return out;
}

async function handle(request: Request, offerId: string) {
  const url = new URL(request.url);
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  let rawBody = "";
  if (request.method !== "GET" && request.method !== "HEAD") {
    const contentType = request.headers.get("content-type") ?? "";
    rawBody = await request.text();
    try {
      if (contentType.includes("application/json") && rawBody) {
        const parsed = JSON.parse(rawBody) as Record<string, unknown>;
        for (const [key, value] of Object.entries(parsed)) {
          if (value !== null && typeof value !== "object") params[key] = String(value);
        }
      } else if (rawBody) {
        new URLSearchParams(rawBody).forEach((value, key) => {
          params[key] = value;
        });
      }
    } catch {
      /* fall through */
    }
  }

  const { processOfferPostback } = await import("@/lib/offers/postback.server");
  const result = await processOfferPostback({
    offerId,
    params,
    rawBody,
    headers: headerMap(request),
    sourceIp: clientIp(request),
  });
  const status = result.ok ? 200 : 400;
  return Response.json(result, { status });
}

export const Route = createFileRoute("/api/public/offer-postback/$offerId")({
  server: {
    handlers: {
      GET: async ({ request, params }) => handle(request, params.offerId),
      POST: async ({ request, params }) => handle(request, params.offerId),
    },
  },
});
