import { n as init_client_server, r as supabaseAdmin } from "./client.server-gEMheit0.mjs";
import { t as logAutomation } from "./logs.server-DbNT75_y.mjs";
import { a as settleOfferClaimRpc, i as payReferralMilestone } from "./coinquest.server-CBcexWIA.mjs";
import { timingSafeEqual } from "crypto";
//#region node_modules/.nitro/vite/services/ssr/assets/adbluemedia-postback.server-BjIksC6M.js
/**
* AdBlueMedia feed postback processor.
* 
* AdBlueMedia uses a single global postback URL per account with no HMAC signature.
* Security relies on a secret token parameter that must match ADBLUEMEDIA_POSTBACK_TOKEN.
* 
* The postback URL format is:
* https://cashgpt.in/api/public/feed-postback/adbluemedia?token=SECRET&s1={s1}&offer_id={offer_id}&lead_id={lead_id}&payout={payout}&status={status}
* 
* Where:
* - token: Secret token for authentication (constant-time compared)
* - s1: User UUID (attached to click URL by appendAffSub4)
* - offer_id: AdBlueMedia's external offer ID
* - lead_id: Unique transaction ID for deduplication
* - payout: Amount to credit (in dollars)
* - status: "1" = success, "0" = chargeback/reversal
*/
init_client_server();
/**
* Constant-time token comparison.
* Returns false if either token is missing or they don't match.
*/
function secureTokenEquals(expected, provided) {
	if (!expected || !provided) return false;
	const a = Buffer.from(expected, "utf8");
	const b = Buffer.from(provided, "utf8");
	if (a.length !== b.length) return false;
	return timingSafeEqual(a, b);
}
/**
* Process AdBlueMedia postback.
* 
* Flow:
* 1. Verify token against ADBLUEMEDIA_POSTBACK_TOKEN env var
* 2. Find offer by provider=adbluemedia and external_offer_id
* 3. Validate user UUID exists
* 4. Handle status: "1" = credit, "0" = log chargeback
* 5. Dedupe on (provider_slug, external_lead_id)
* 6. Credit wallet using existing offer claim settlement logic
*/
async function processAdBlueMediaPostback(params, sourceIp) {
	const { token, s1: userId, offer_id: externalOfferId, lead_id: leadId, payout, status } = params;
	const expectedToken = process.env["ADBLUEMEDIA_POSTBACK_TOKEN"];
	if (!expectedToken) {
		await logError("token_not_configured", null, null, null, leadId, sourceIp);
		return {
			ok: false,
			status: "rejected",
			reason: "token_not_configured"
		};
	}
	if (!secureTokenEquals(expectedToken, token)) {
		await logError("invalid_token", null, null, null, leadId, sourceIp);
		return {
			ok: false,
			status: "rejected",
			reason: "invalid_token"
		};
	}
	if (!userId || !externalOfferId || !leadId || !payout || !status) {
		await logError("missing_parameters", null, userId, null, leadId, sourceIp);
		return {
			ok: false,
			status: "rejected",
			reason: "missing_parameters"
		};
	}
	if (status === "0") {
		await logAutomation({
			eventType: "sdk_postback",
			status: "warning",
			source: "adbluemedia_postback",
			userId: userId || null,
			message: "AdBlueMedia chargeback received",
			context: {
				externalOfferId,
				leadId,
				payout,
				sourceIp
			}
		});
		return {
			ok: true,
			status: "chargeback",
			reason: "status_0_chargeback"
		};
	}
	if (status !== "1") {
		await logError("unknown_status", null, userId, null, leadId, sourceIp, { status });
		return {
			ok: false,
			status: "rejected",
			reason: `unknown_status_${status}`
		};
	}
	const offer = (await supabaseAdmin.from("offers").select("id, title, reward_amount, is_active, provider_id, offer_providers!inner(slug)").eq("external_offer_id", externalOfferId).eq("offer_providers.slug", "adbluemedia").maybeSingle()).data;
	if (!offer) {
		await logError("offer_not_found", null, userId, null, leadId, sourceIp, { externalOfferId });
		return {
			ok: false,
			status: "rejected",
			reason: "offer_not_found"
		};
	}
	if (!offer.is_active) {
		await logError("offer_inactive", offer.id, userId, null, leadId, sourceIp);
		return {
			ok: false,
			status: "rejected",
			reason: "offer_inactive"
		};
	}
	if (!(await supabaseAdmin.from("profiles").select("id").eq("id", userId).maybeSingle()).data) {
		await logError("user_not_found", offer.id, userId, null, leadId, sourceIp);
		return {
			ok: false,
			status: "rejected",
			reason: "user_not_found"
		};
	}
	const existingClaim = await supabaseAdmin.from("offer_claims").select("id, status").eq("provider_slug", "adbluemedia").eq("external_lead_id", leadId).maybeSingle();
	if (existingClaim.data) {
		await logAutomation({
			eventType: "sdk_postback",
			status: "warning",
			source: "adbluemedia_postback",
			userId,
			referenceId: existingClaim.data.id,
			message: "Duplicate AdBlueMedia postback ignored",
			context: {
				offerId: offer.id,
				externalOfferId,
				leadId
			}
		});
		return {
			ok: true,
			status: "duplicate",
			reason: "duplicate",
			claimId: existingClaim.data.id
		};
	}
	const payoutAmount = Number.parseFloat(payout);
	if (!Number.isFinite(payoutAmount) || payoutAmount <= 0) {
		await logError("invalid_payout", offer.id, userId, null, leadId, sourceIp, { payout });
		return {
			ok: false,
			status: "rejected",
			reason: "invalid_payout"
		};
	}
	const reward = Number(offer.reward_amount);
	const claimInsert = await supabaseAdmin.from("offer_claims").insert({
		user_id: userId,
		offer_id: offer.id,
		reward_amount: reward,
		status: "pending",
		provider_slug: "adbluemedia",
		external_lead_id: leadId
	}).select("id").maybeSingle();
	if (claimInsert.error || !claimInsert.data) return {
		ok: true,
		status: "duplicate",
		reason: "duplicate"
	};
	try {
		if (!(await settleOfferClaimRpc({
			claimId: claimInsert.data.id,
			decision: "approved",
			note: "Auto-credited via AdBlueMedia postback",
			reward
		})).settled) return {
			ok: true,
			status: "duplicate",
			reason: "duplicate",
			claimId: claimInsert.data.id
		};
	} catch (error) {
		await logAutomation({
			eventType: "wallet_credit",
			status: "error",
			source: "adbluemedia_postback",
			userId,
			referenceId: claimInsert.data.id,
			message: error instanceof Error ? error.message : "Wallet credit failed",
			context: {
				offerId: offer.id,
				externalOfferId,
				leadId,
				leftPendingForReview: true
			}
		});
		return {
			ok: false,
			status: "rejected",
			reason: "wallet_credit_failed"
		};
	}
	await logAutomation({
		eventType: "wallet_credit",
		status: "success",
		source: "adbluemedia_postback",
		userId,
		referenceId: claimInsert.data.id,
		message: `Credited $${reward.toFixed(2)} for offer ${offer.title}`,
		context: {
			offerId: offer.id,
			externalOfferId,
			leadId,
			networkPayout: payoutAmount
		}
	});
	try {
		await payReferralMilestone(userId, "earning", "Referral: friend's first earning");
	} catch {}
	return {
		ok: true,
		status: "credited",
		reward,
		claimId: claimInsert.data.id
	};
}
async function logError(reason, offerId, userId, externalOfferId, leadId, sourceIp, extra) {
	await logAutomation({
		eventType: "sdk_postback",
		status: "error",
		source: "adbluemedia_postback",
		userId,
		message: `AdBlueMedia postback rejected: ${reason}`,
		context: {
			offerId,
			externalOfferId,
			leadId,
			sourceIp,
			...extra
		}
	});
}
//#endregion
export { processAdBlueMediaPostback };
