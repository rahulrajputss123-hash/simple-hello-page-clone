import { n as __exportAll } from "../_runtime.mjs";
import { l as __exportAll$1, s as __esmMin } from "./server-CpGMOUrW.mjs";
import { t as createClient } from "../_libs/supabase__supabase-js.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/client.server-gEMheit0.js
var client_server_gEMheit0_exports = /* @__PURE__ */ __exportAll({
	n: () => init_client_server,
	r: () => supabaseAdmin,
	t: () => client_server_exports
});
var client_server_exports = /* @__PURE__ */ __exportAll$1({ supabaseAdmin: () => supabaseAdmin });
function isNewSupabaseApiKey(value) {
	return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}
function createSupabaseFetch(supabaseKey) {
	return (input, init) => {
		const headers = new Headers(typeof Request !== "undefined" && input instanceof Request ? input.headers : void 0);
		if (init?.headers) new Headers(init.headers).forEach((value, key) => headers.set(key, value));
		if (isNewSupabaseApiKey(supabaseKey) && headers.get("Authorization") === `Bearer ${supabaseKey}`) headers.delete("Authorization");
		headers.set("apikey", supabaseKey);
		return fetch(input, {
			...init,
			headers
		});
	};
}
function createSupabaseAdminClient() {
	const SUPABASE_URL = process.env["SUPABASE_URL"];
	const SUPABASE_SERVICE_ROLE_KEY = process.env["SUPABASE_SERVICE_ROLE_KEY"];
	if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
		const message = `Missing Supabase environment variable(s): ${[...!SUPABASE_URL ? ["SUPABASE_URL"] : [], ...!SUPABASE_SERVICE_ROLE_KEY ? ["SUPABASE_SERVICE_ROLE_KEY"] : []].join(", ")}. Connect Supabase in Lovable Cloud.`;
		console.error(`[Supabase] ${message}`);
		throw new Error(message);
	}
	return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
		global: { fetch: createSupabaseFetch(SUPABASE_SERVICE_ROLE_KEY) },
		auth: {
			storage: void 0,
			persistSession: false,
			autoRefreshToken: false
		}
	});
}
var _supabaseAdmin;
var supabaseAdmin;
var init_client_server = __esmMin((() => {
	supabaseAdmin = new Proxy({}, { get(_, prop, receiver) {
		if (!_supabaseAdmin) _supabaseAdmin = createSupabaseAdminClient();
		return Reflect.get(_supabaseAdmin, prop, receiver);
	} });
}));
//#endregion
export { init_client_server as n, supabaseAdmin as r, client_server_gEMheit0_exports as t };
