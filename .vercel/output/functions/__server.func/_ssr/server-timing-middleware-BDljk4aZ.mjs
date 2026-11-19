//#region node_modules/.nitro/vite/services/ssr/assets/server-timing-middleware-BDljk4aZ.js
/**
* Wrap a server function handler with timing instrumentation
* @param fnName - Name of the function for logging
* @param handler - The actual handler function
* @returns Wrapped handler that logs timing data
*/
function withServerTiming(fnName, handler) {
	return (async (args) => {
		const startTime = Date.now();
		let statusCode = 200;
		let errorMessage = null;
		try {
			return await handler(args);
		} catch (error) {
			statusCode = 500;
			errorMessage = error instanceof Error ? error.message : String(error);
			throw error;
		} finally {
			const duration = Date.now() - startTime;
			const userId = args?.context?.userId || null;
			if (duration > 2e3) (async () => {
				try {
					const { supabaseAdmin } = await import("./client.server-gEMheit0.mjs").then((n) => n.t).then((n) => (n.n(), n.t));
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
							over_2s: true
						}
					});
				} catch (logError) {
					console.error("[server-timing] Failed to log:", logError);
				}
			})();
		}
	});
}
//#endregion
export { withServerTiming as t };
