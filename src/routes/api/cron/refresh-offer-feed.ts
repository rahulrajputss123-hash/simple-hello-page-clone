import { createFileRoute } from "@tanstack/react-router";

/**
 * Scheduled background refresh for the offer feed cache.
 *
 * Not a per-request live fetch — this is meant to be hit by a cron scheduler on an interval
 * (default every 4-6h, configurable in the admin panel). It refreshes every enabled network for
 * every country that has been requested at least once (present in offer_feed_cache) plus the
 * configured default country.
 *
 * Wire it up with your platform's scheduler, e.g. a Vercel Cron Job:
 *   { "crons": [{ "path": "/api/cron/refresh-offer-feed?secret=YOUR_SECRET", "schedule": "0 *\/5 * * *" }] }
 * or a Cloudflare Worker cron trigger / any external uptime pinger.
 *
 * Auth: send the OFFER_FEED_CRON_SECRET via `Authorization: Bearer <secret>`,
 * the `x-cron-secret` header, or `?secret=` query param.
 */

/** Constant-time string compare (portable — avoids node:crypto for edge/worker runtimes). */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

function isAuthorized(request: Request): boolean {
  const secret = process.env["OFFER_FEED_CRON_SECRET"];
  if (!secret) return false;
  const url = new URL(request.url);
  const provided =
    request.headers.get("x-cron-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    url.searchParams.get("secret");
  if (!provided) return false;
  return safeEqual(provided, secret);
}

async function handle(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const force = url.searchParams.get("force") === "1";
  try {
    const { refreshAllFeedsImpl } = await import("@/lib/offers/feed-cache.server");
    const summary = await refreshAllFeedsImpl(force);
    return Response.json({ ok: true, ...summary });
  } catch (err) {
    // Log the real error server-side; don't leak internal details to the caller.
    console.error("[offer-feed-cron] refresh failed:", err);
    return Response.json({ ok: false, error: "refresh failed" }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/cron/refresh-offer-feed")({
  server: {
    handlers: {
      GET: async ({ request }) => handle(request),
      POST: async ({ request }) => handle(request),
    },
  },
});
