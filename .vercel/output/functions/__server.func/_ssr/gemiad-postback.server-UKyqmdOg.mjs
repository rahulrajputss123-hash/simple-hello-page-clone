import { n as init_client_server, r as supabaseAdmin } from "./client.server-gEMheit0.mjs";
import { t as logAutomation } from "./logs.server-DbNT75_y.mjs";
import { a as settleOfferClaimRpc, i as payReferralMilestone } from "./coinquest.server-CBcexWIA.mjs";
import { createHash, timingSafeEqual } from "crypto";
//#region node_modules/.nitro/vite/services/ssr/assets/gemiad-postback.server-UKyqmdOg.js
/**
* GemiAd Offer Feed postback processor.
* 
* Security:
* - SHA256 hash verification: hash = sha256(userId + offerId + txid + secret)
* - IP allowlist: 64.226.92.208 (GemiAd postback source)
* - Must respond HTTP 200 "Approved" within 5 seconds
* - Idempotent: GemiAd retries up to 3 times on failure
* 
* Postback parameters:
* - userId: User UUID
* - offerId: GemiAd external offer ID
* - offerName: Offer name (logged only)
* - eventId: Event ID (for multi-step offers)
* - eventName: Event name (logged only)
* - payout: Network payout in USD (positive for credit, negative for reversal)
* - reward: User reward amount (logged only, NOT used for crediting)
* - txid: Unique transaction ID (deduplication key)
* - status: "completed" | "rejected"
* - ip: User's IP address (logged only)
* - sub1, sub2: Optional tracking params (logged only)
* - hash: SHA256 signature
* 
* Reversal handling:
* - status="rejected" OR payout < 0: Do not credit, wallet untouched
* - Log the reversal for audit purposes
*/
init_client_server();
var GEMIAD_SOURCE_IP = "64.226.92.208";
/**
* Validate UUID format (RFC 4122).
*/
function isValidUuid(value) {
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
/**
* SHA256 hash helper (lowercase hex).
*/
function sha256Hex(data) {
	return createHash("sha256").update(data, "utf8").digest("hex").toLowerCase();
}
/**
* Constant-time hash comparison.
*/
function secureEquals(expected, provided) {
	if (!expected || !provided) return false;
	const a = Buffer.from(expected, "utf8");
	const b = Buffer.from(provided, "utf8");
	if (a.length !== b.length) return false;
	return timingSafeEqual(a, b);
}
/**
* Process GemiAd feed postback.
* 
* Flow:
* 1. Verify source IP is 64.226.92.208
* 2. Verify SHA256 hash = sha256(userId + offerId + txid + secret)
* 3. Validate required parameters and UUID format
* 4. Check status and payout for reversal
* 5. Find offer by provider=gemiad and external_offer_id
* 6. Validate user UUID exists
* 7. Dedupe on (provider_slug='gemiad', external_lead_id=txid)
* 8. Credit wallet using existing offer claim settlement logic
*/
async function processGemiAdPostback(params, sourceIp) {
	const { userId, offerId: externalOfferId, offerName, eventId, eventName, payout: payoutStr, reward: rewardStr, txid, status, ip: userIp, sub1, sub2, hash: providedHash } = params;
	if (sourceIp !== GEMIAD_SOURCE_IP) {
		await logError("invalid_source_ip", null, userId, null, txid, sourceIp, {
			expectedIp: GEMIAD_SOURCE_IP,
			userIp
		});
		return {
			ok: false,
			status: "rejected",
			reason: "invalid_source_ip"
		};
	}
	const secret = process.env["GEMIAD_FEED_SECRET_KEY"];
	if (!secret) {
		await logError("secret_not_configured", null, userId, null, txid, sourceIp, { userIp });
		return {
			ok: false,
			status: "rejected",
			reason: "secret_not_configured"
		};
	}
	if (!secureEquals(sha256Hex(`${userId}${externalOfferId}${txid}${secret}`), providedHash)) {
		await logError("invalid_signature", null, userId, externalOfferId, txid, sourceIp, {
			providedHash,
			userIp
		});
		return {
			ok: false,
			status: "rejected",
			reason: "invalid_signature"
		};
	}
	if (!userId || !externalOfferId || !txid || !payoutStr) {
		await logError("missing_parameters", null, userId, externalOfferId, txid, sourceIp, {
			hasUserId: Boolean(userId),
			hasOfferId: Boolean(externalOfferId),
			hasTxid: Boolean(txid),
			hasPayout: Boolean(payoutStr),
			userIp
		});
		return {
			ok: false,
			status: "rejected",
			reason: "missing_parameters"
		};
	}
	if (!isValidUuid(userId)) {
		await logError("invalid_user_uuid", null, userId, externalOfferId, txid, sourceIp, { userIp });
		return {
			ok: false,
			status: "rejected",
			reason: "invalid_user_uuid"
		};
	}
	const payoutAmount = Number.parseFloat(payoutStr);
	if (!Number.isFinite(payoutAmount)) {
		await logError("invalid_payout", null, userId, externalOfferId, txid, sourceIp, {
			payout: payoutStr,
			userIp
		});
		return {
			ok: false,
			status: "rejected",
			reason: "invalid_payout"
		};
	}
	if (status === "rejected" || payoutAmount < 0) {
		await logAutomation({
			eventType: "sdk_postback",
			status: "warning",
			source: "gemiad_feed_postback",
			userId,
			message: "GemiAd reversal received (not credited)",
			context: {
				externalOfferId,
				offerName,
				eventId,
				eventName,
				txid,
				payout: payoutAmount,
				status,
				userIp,
				sourceIp,
				sub1,
				sub2
			}
		});
		return {
			ok: true,
			status: "rejected",
			reason: "reversal"
		};
	}
	if (payoutAmount <= 0) {
		await logError("invalid_payout_amount", null, userId, externalOfferId, txid, sourceIp, {
			payout: payoutAmount,
			userIp
		});
		return {
			ok: false,
			status: "rejected",
			reason: "invalid_payout_amount"
		};
	}
	const offer = (await supabaseAdmin.from("offers").select("id, title, reward_amount, is_active, provider_id, offer_providers!inner(slug)").eq("external_offer_id", externalOfferId).eq("offer_providers.slug", "gemiad").maybeSingle()).data;
	if (!offer) {
		await logError("offer_not_found", null, userId, externalOfferId, txid, sourceIp, {
			offerName,
			userIp
		});
		return {
			ok: false,
			status: "rejected",
			reason: "offer_not_found"
		};
	}
	if (!offer.is_active) {
		await logError("offer_inactive", offer.id, userId, externalOfferId, txid, sourceIp, {
			offerName,
			userIp
		});
		return {
			ok: false,
			status: "rejected",
			reason: "offer_inactive"
		};
	}
	if (!(await supabaseAdmin.from("profiles").select("id").eq("id", userId).maybeSingle()).data) {
		await logError("user_not_found", offer.id, userId, externalOfferId, txid, sourceIp, {
			offerName,
			userIp
		});
		return {
			ok: false,
			status: "rejected",
			reason: "user_not_found"
		};
	}
	const existingClaim = await supabaseAdmin.from("offer_claims").select("id, status").eq("provider_slug", "gemiad").eq("external_lead_id", txid).maybeSingle();
	if (existingClaim.data) {
		await logAutomation({
			eventType: "sdk_postback",
			status: "warning",
			source: "gemiad_feed_postback",
			userId,
			referenceId: existingClaim.data.id,
			message: "Duplicate GemiAd postback ignored",
			context: {
				offerId: offer.id,
				externalOfferId,
				offerName,
				eventId,
				eventName,
				txid,
				userIp,
				sourceIp
			}
		});
		return {
			ok: true,
			status: "duplicate",
			reason: "duplicate",
			claimId: existingClaim.data.id
		};
	}
	const reward = Number(offer.reward_amount);
	const claimInsert = await supabaseAdmin.from("offer_claims").insert({
		user_id: userId,
		offer_id: offer.id,
		reward_amount: reward,
		status: "pending",
		provider_slug: "gemiad",
		external_lead_id: txid
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
			note: "Auto-credited via GemiAd feed postback",
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
			source: "gemiad_feed_postback",
			userId,
			referenceId: claimInsert.data.id,
			message: error instanceof Error ? error.message : "Wallet credit failed",
			context: {
				offerId: offer.id,
				externalOfferId,
				offerName,
				eventId,
				eventName,
				txid,
				networkPayout: payoutAmount,
				userIp,
				sourceIp,
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
		source: "gemiad_feed_postback",
		userId,
		referenceId: claimInsert.data.id,
		message: `Credited $${reward.toFixed(2)} for offer ${offer.title}`,
		context: {
			offerId: offer.id,
			externalOfferId,
			offerName,
			eventId,
			eventName,
			txid,
			networkPayout: payoutAmount,
			rewardParam: rewardStr,
			userIp,
			sourceIp,
			sub1,
			sub2
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
async function logError(reason, offerId, userId, externalOfferId, txid, sourceIp, extra) {
	await logAutomation({
		eventType: "sdk_postback",
		status: "error",
		source: "gemiad_feed_postback",
		userId,
		message: `GemiAd feed postback rejected: ${reason}`,
		context: {
			offerId,
			externalOfferId,
			txid,
			sourceIp,
			...extra
		}
	});
}
//#endregion
export { processGemiAdPostback };
