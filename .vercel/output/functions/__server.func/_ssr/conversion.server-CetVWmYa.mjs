import { l as mktRpc, o as init_db_server, t as MktRpcError } from "./advertiser.server-DyvSoHf7.mjs";
import crypto$2 from "node:crypto";
//#region node_modules/.nitro/vite/services/ssr/assets/conversion.server-CetVWmYa.js
init_db_server();
var ConversionError = class extends Error {
	code;
	constructor(code, message) {
		super(message);
		this.name = "ConversionError";
		this.code = code;
	}
};
/**
* Records a conversion from a postback webhook.
*
* Authentication and IP verification are performed by postback.ts before calling this.
*
* Uses mkt_record_conversion which:
* - Validates campaign is auto mode
* - Checks for duplicates (by external_txn_id and click_id)
* - Validates click exists and is active
* - Decides outcome: credited, held_for_review, or budget_exhausted
* - Pays publisher immediately if credited
*
* Returns recorded: false if duplicate or invalid, true if recorded.
*/
async function recordConversionImpl(campaignId, clickId, externalTxnId, sourceIp, postbackParams, signatureValid) {
	const sourceIpHash = crypto$2.createHash("sha256").update(sourceIp).digest("hex");
	try {
		const result = await mktRpc("mkt_record_conversion", {
			p_campaign_id: campaignId,
			p_click_id: clickId,
			p_external_txn_id: externalTxnId,
			p_meta: {
				signature_valid: signatureValid,
				source_ip_hash: sourceIpHash,
				raw_payload: postbackParams
			}
		});
		return {
			recorded: result.recorded,
			...result.status ? { status: result.status } : {},
			...result.conversion_id ? { conversionId: result.conversion_id } : {},
			...result.user_id ? { userId: result.user_id } : {},
			...result.hold_reason !== void 0 ? { holdReason: result.hold_reason } : {},
			...result.reason ? { reason: result.reason } : {}
		};
	} catch (err) {
		if (err instanceof MktRpcError) throw new ConversionError(err.code, humanConversionError(err.code));
		throw err;
	}
}
function humanConversionError(code) {
	switch (code) {
		case "MKT_NOT_AUTO_CAMPAIGN": return "This campaign doesn't support automatic conversions.";
		case "MKT_INVALID_TXN": return "Invalid transaction ID.";
		case "MKT_DUPLICATE": return "This conversion was already recorded.";
		case "MKT_UNKNOWN_CLICK": return "Click ID not found.";
		case "MKT_CLICK_EXPIRED": return "Click expired.";
		case "MKT_CONVERSION_NOT_FOUND": return "Conversion not found.";
		case "MKT_NO_BUDGET": return "No budget available.";
		default: return "Conversion failed.";
	}
}
//#endregion
export { recordConversionImpl };
