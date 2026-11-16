import { createFileRoute } from "@tanstack/react-router";

/**
 * Daily cleanup job for app_events table.
 * 
 * Deletes analytics events older than 90 days.
 * This route is used when pg_cron is not available in the Supabase instance.
 * 
 * Schedule: Daily at 2 AM UTC (0 2 * * *)
 * Auth: Authorization: Bearer must equal OFFER_FEED_CRON_SECRET (same as offer feed refresh).
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

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // Delete events older than 90 days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    const { error, count } = await supabaseAdmin
      .from("app_events")
      .delete({ count: "exact" })
      .lt("created_at", cutoffDate.toISOString());

    if (error) {
      console.error("[cleanup-events] delete failed:", error);
      return Response.json(
        { ok: false, error: "delete failed", details: error.message },
        { status: 500 }
      );
    }

    console.log(`[cleanup-events] deleted ${count ?? 0} events older than 90 days`);
    return Response.json({ ok: true, deletedCount: count ?? 0 });
  } catch (err) {
    console.error("[cleanup-events] unexpected error:", err);
    return Response.json({ ok: false, error: "unexpected error" }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/cron/cleanup-events")({
  server: {
    handlers: {
      GET: async ({ request }) => handle(request),
      POST: async ({ request }) => handle(request),
    },
  },
});
