import { n as init_client_server, r as supabaseAdmin } from "./client.server-gEMheit0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/proof-upload.server-CbAwWEdl.js
init_client_server();
/**
* Signs a short-lived upload URL scoped to the user's own path under
* offer-proofs/{userId}/{offerId}/{timestamp}-{filename}. The client PUTs the
* file directly to that URL, then submits the returned `path` back with the
* claim in the same insert (offer_claims has no UPDATE grant).
*/
async function requestProofUploadUrlImpl(userId, offerId, filename) {
	const safeName = filename.replace(/[^A-Za-z0-9._-]/g, "_");
	const path = `${userId}/${offerId}/${Date.now()}-${safeName}`;
	const { data, error } = await supabaseAdmin.storage.from("offer-proofs").createSignedUploadUrl(path);
	if (error || !data) throw new Error(error?.message ?? "Could not create upload URL.");
	return {
		path,
		uploadUrl: data.signedUrl ?? data.signed_url ?? "",
		token: data.token ?? ""
	};
}
//#endregion
export { requestProofUploadUrlImpl };
