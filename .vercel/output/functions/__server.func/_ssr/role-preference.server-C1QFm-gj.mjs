import { i as createServerFn } from "./server-CpGMOUrW.mjs";
import { t as createSsrRpc } from "./createSsrRpc-Bbq2Yr9O.mjs";
import { i as enumType, l as stringType, s as objectType } from "../_libs/zod.mjs";
import { n as init_client_server, r as supabaseAdmin } from "./client.server-gEMheit0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/role-preference.server-C1QFm-gj.js
/**
* Role preference management for Phase 7
* Persist publisher/advertiser mode preference across sessions
*/
init_client_server();
/**
* Get user's preferred role
*/
var getPreferredRoleInput = objectType({ userId: stringType().uuid() });
var getPreferredRoleImpl = async (input) => {
	const { userId } = getPreferredRoleInput.parse(input);
	const { data, error } = await supabaseAdmin.from("profiles").select("preferred_role").eq("id", userId).single();
	if (error) throw new Error(`Failed to fetch preferred role: ${error.message}`);
	return data?.preferred_role ?? null;
};
createServerFn({ method: "GET" }).validator(getPreferredRoleInput).handler(createSsrRpc("99eed259e60cd53daa631775268a149fd2ccd4504fd8b8b26f85847f9d9b2bea"));
/**
* Set user's preferred role
*/
var setPreferredRoleInput = objectType({
	userId: stringType().uuid(),
	role: enumType(["publisher", "advertiser"]).nullable()
});
var setPreferredRoleImpl = async (input) => {
	const { userId, role } = setPreferredRoleInput.parse(input);
	const { error } = await supabaseAdmin.from("profiles").update({ preferred_role: role }).eq("id", userId);
	if (error) throw new Error(`Failed to set preferred role: ${error.message}`);
	return { success: true };
};
createServerFn({ method: "POST" }).validator(setPreferredRoleInput).handler(createSsrRpc("e1abbb792bd72ea50892158dfffd0418d8976b6014e56b652e40b3a605a77052"));
//#endregion
export { getPreferredRoleImpl, setPreferredRoleImpl };
