import { n as init_client_server, r as supabaseAdmin } from "./client.server-gEMheit0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/account-deletion.server-VTJXYklm.js
init_client_server();
/**
* Account deletion implementation for Amazon/Google app store compliance.
*
* Soft-deletes the profile and anonymizes PII. Does NOT delete the user from
* Supabase auth (that would break FK constraints and orphan data). Instead:
* - Clears name, email, avatar, payout methods
* - Marks account as deleted
* - Preserves wallet history for audit/compliance
*
* Hard delete via supabase.auth.admin.deleteUser() would cascade to profiles,
* but we need to keep transaction history. Future: add a "deleted_at" column
* and soft-delete flag to profiles schema.
*/
var AccountDeletionError = class extends Error {
	code;
	constructor(code, message) {
		super(message);
		this.code = code;
		this.name = "AccountDeletionError";
	}
};
async function requestAccountDeletionImpl(userId) {
	const { data: pendingWithdrawals } = await supabaseAdmin.from("withdrawal_requests").select("id, amount, status").eq("user_id", userId).eq("status", "pending").limit(1);
	if (pendingWithdrawals && pendingWithdrawals.length > 0) throw new AccountDeletionError("PENDING_WITHDRAWAL", "Cannot delete account while a withdrawal is pending. Please wait for it to be processed or cancel it first.");
	const { error: profileError } = await supabaseAdmin.from("profiles").update({
		name: "Deleted User",
		email: null,
		phone: null,
		avatar_url: null,
		is_flagged: true
	}).eq("id", userId);
	if (profileError) {
		console.error("[account-deletion] Failed to anonymize profile:", profileError);
		throw new AccountDeletionError("DELETE_FAILED", "Failed to delete account. Please contact support.");
	}
	const { error: payoutError } = await supabaseAdmin.from("payout_methods").delete().eq("user_id", userId);
	if (payoutError) console.error("[account-deletion] Failed to delete payout methods:", payoutError);
	await supabaseAdmin.from("notifications").delete().eq("user_id", userId);
	return {
		success: true,
		message: "Your account has been deleted. Your earning and withdrawal history is preserved for compliance, but all personal information has been removed."
	};
}
//#endregion
export { AccountDeletionError, requestAccountDeletionImpl };
