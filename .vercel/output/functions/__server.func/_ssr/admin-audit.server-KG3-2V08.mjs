import { n as init_client_server, r as supabaseAdmin } from "./client.server-gEMheit0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-audit.server-KG3-2V08.js
init_client_server();
/**
* Logs an admin action to the audit trail.
* Called from service-role context only (never from client).
*/
async function logAdminAction(params) {
	try {
		await supabaseAdmin.from("admin_audit_log").insert({
			admin_id: params.adminId,
			action: params.action,
			target_type: params.targetType ?? null,
			target_id: params.targetId ?? null,
			before: params.before ?? null,
			after: params.after ?? null,
			note: params.note ?? null
		});
	} catch (error) {
		console.error("[audit] Failed to log admin action", {
			params,
			error
		});
	}
}
/**
* Check if user has the specified role using has_role RPC.
* Returns true if user has the role, false otherwise.
*/
async function hasRole(userId, role) {
	try {
		const { data } = await supabaseAdmin.rpc("has_role", {
			_user_id: userId,
			_role: role
		});
		return data === true;
	} catch (error) {
		console.error("[role] Failed to check role", {
			userId,
			role,
			error
		});
		return false;
	}
}
/**
* Require that the user has at least one of the allowed roles.
* Throws "Forbidden" if the user does not have any of the required roles.
* 
* Usage:
*   await requireRole(userId, ['admin']) // admin only
*   await requireRole(userId, ['admin', 'finance']) // admin or finance
*/
async function requireRole(userId, allowedRoles) {
	for (const role of allowedRoles) if (await hasRole(userId, role)) return;
	throw new Error("Forbidden");
}
/**
* Get user's roles (for UI display/logic).
*/
async function getUserRoles(userId) {
	const { data } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId);
	return (data ?? []).map((r) => r.role);
}
//#endregion
export { getUserRoles, logAdminAction, requireRole };
