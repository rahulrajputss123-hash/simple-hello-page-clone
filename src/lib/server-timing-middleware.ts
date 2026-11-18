/**
 * Server request timing middleware
 * 
 * Logs server function requests to automation_logs for CPU analysis.
 * Logs all requests over 2000ms, plus a 1% sample of others.
 * 
 * Usage: Wrap handler with withServerTiming
 * Example:
 *   export const myFn = createServerFn({ method: "POST" })
 *     .middleware([requireSupabaseAuth])
 *     .handler(withServerTiming("myFn", async ({ context }) => { ... }));
 */

type HandlerFn = (args: any) => Promise<any>;

/**
 * Wrap a server function handler with timing instrumentation
 * @param fnName - Name of the function for logging
 * @param handler - The actual handler function
 * @returns Wrapped handler that logs timing data
 */
export function withServerTiming<T extends HandlerFn>(
  fnName: string,
  handler: T
): T {
  return (async (args: any) => {
    const startTime = Date.now();
    let statusCode = 200;
    let errorMessage: string | null = null;

    try {
      // Execute the actual handler
      const result = await handler(args);
      return result;
    } catch (error) {
      statusCode = 500;
      errorMessage = error instanceof Error ? error.message : String(error);
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      const userId = args?.context?.userId || null;

      // Log only requests over 2000ms (no random sampling)
      if (duration > 2000) {
        // Fire and forget - don't await, just log errors
        (async () => {
          try {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            const userIdPrefix = userId ? userId.slice(0, 8) : null;

            await supabaseAdmin.from("automation_logs").insert({
              event_type: "server_request_timing",
              source: "server_timing",
              status: statusCode === 200 ? "info" : "error",
              message: `${fnName} | ${duration}ms | user=${userIdPrefix || "anon"} | status=${statusCode}`,
              context: {
                fn_name: fnName,
                wall_ms: duration,
                user_id_prefix: userIdPrefix,
                status_code: statusCode,
                error: errorMessage,
                over_2s: true,
              },
            });
          } catch (logError) {
            // Never fail the request due to logging
            console.error("[server-timing] Failed to log:", logError);
          }
        })();
      }
    }
  }) as T;
}
