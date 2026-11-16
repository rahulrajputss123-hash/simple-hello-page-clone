import { createFileRoute } from "@tanstack/react-router";

/**
 * Analytics tracking endpoint
 * 
 * Accepts batched analytics events from the client tracker.
 * Validates event names against allow-list, checks properties size,
 * and stores events with user context.
 * 
 * Auth: Optional - accepts both authenticated and anonymous events.
 */

async function handle(request: Request) {
  try {
    // Parse request body
    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return Response.json(
        { ok: false, error: "invalid json" },
        { status: 400 }
      );
    }

    // Basic payload validation
    if (!payload || typeof payload !== "object" || !("events" in payload)) {
      return Response.json(
        { ok: false, error: "missing events array" },
        { status: 400 }
      );
    }

    // Get user ID from session if available
    let userId: string | null = null;
    try {
      const { getWebRequest } = await import("vinxi/http");
      const event = getWebRequest();
      const { createSupabaseServerClient } = await import(
        "@/integrations/supabase/server"
      );
      const supabase = createSupabaseServerClient(event);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id || null;
    } catch {
      // Anonymous user - this is fine
      userId = null;
    }

    // Process events
    const { trackEventsImpl } = await import("@/lib/analytics/track.server");
    const result = await trackEventsImpl(
      payload as { anon_id: string | null; events: unknown[] },
      userId
    );

    // Return success even if some events were rejected (log them for debugging)
    if (result.rejected.length > 0) {
      console.warn("[analytics] rejected events:", result.rejected);
    }

    return Response.json({
      ok: result.ok,
      accepted: result.accepted,
      rejected: result.rejected,
    });
  } catch (err) {
    console.error("[analytics] track error:", err);
    return Response.json(
      { ok: false, error: "internal error" },
      { status: 500 }
    );
  }
}

export const Route = createFileRoute("/api/analytics/track")({
  server: {
    handlers: {
      POST: async ({ request }) => handle(request),
    },
  },
});
