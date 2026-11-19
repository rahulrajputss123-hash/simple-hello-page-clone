import { n as init_client_server, r as supabaseAdmin } from "./client.server-gEMheit0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/proof.server-DMSAyAXD.js
init_client_server();
/**
* Server-only helper: compute the true user reward for a limited-deal offer
* from `actual_cost`, `payout_percentage`, and `max_payout_cap`. Used at
* approval time (never trust the value snapshotted at claim submission).
*
* reward = MIN(actual_cost * payout_percentage / 100, max_payout_cap)
*/
function computeLimitedDealReward(input) {
	const cost = Number(input.actual_cost ?? 0);
	const pct = Number(input.payout_percentage ?? 110);
	const cap = input.max_payout_cap == null ? null : Number(input.max_payout_cap);
	if (!Number.isFinite(cost) || cost <= 0) return 0;
	const raw = cost * pct / 100;
	return Math.max(0, Math.round((cap != null && Number.isFinite(cap) ? Math.min(raw, cap) : raw) * 100) / 100);
}
/**
* Signed-URL fetcher for admin proof review. Uses service_role, expires quickly.
*/
async function signProofUrl(path, expiresInSeconds = 300) {
	if (!path) return null;
	const { data, error } = await supabaseAdmin.storage.from("offer-proofs").createSignedUrl(path, expiresInSeconds);
	if (error || !data?.signedUrl) return null;
	return data.signedUrl;
}
//#endregion
export { computeLimitedDealReward, signProofUrl };
