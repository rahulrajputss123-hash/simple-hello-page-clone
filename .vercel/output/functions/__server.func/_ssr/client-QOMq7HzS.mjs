import { t as createClient } from "../_libs/supabase__supabase-js.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/client-QOMq7HzS.js
var memory = /* @__PURE__ */ new Map();
function getStorage() {
	if (typeof window === "undefined") return null;
	try {
		return window.localStorage ?? null;
	} catch {
		return null;
	}
}
var safeStorage = {
	getItem(key) {
		try {
			const s = getStorage();
			if (s) return s.getItem(key);
		} catch {}
		return memory.get(key) ?? null;
	},
	setItem(key, value) {
		memory.set(key, value);
		try {
			getStorage()?.setItem(key, value);
		} catch {}
	},
	removeItem(key) {
		memory.delete(key);
		try {
			getStorage()?.removeItem(key);
		} catch {}
	}
};
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
function createSupabaseClient() {
	const SUPABASE_URL = "https://etwtjrkjphbdkwojhozg.supabase.co";
	const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_sEtJH_TAzXdfEpMSVSd1cA_mjX1Wgon";
	return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
		global: { fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY) },
		auth: {
			storage: typeof window !== "undefined" ? {
				getItem: (key) => safeStorage.getItem(key),
				setItem: (key, value) => safeStorage.setItem(key, value),
				removeItem: (key) => safeStorage.removeItem(key)
			} : void 0,
			persistSession: true,
			autoRefreshToken: true
		}
	});
}
var _supabase;
var supabase = new Proxy({}, { get(_, prop, receiver) {
	if (!_supabase) _supabase = createSupabaseClient();
	return Reflect.get(_supabase, prop, receiver);
} });
//#endregion
export { supabase as n, safeStorage as t };
