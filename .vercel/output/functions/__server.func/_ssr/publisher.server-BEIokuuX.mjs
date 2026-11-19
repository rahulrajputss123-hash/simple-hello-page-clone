import { c as getRequest } from "./server-CpGMOUrW.mjs";
import { c as recordType, l as stringType, n as arrayType, s as objectType } from "../_libs/zod.mjs";
import { n as init_client_server, r as supabaseAdmin } from "./client.server-gEMheit0.mjs";
import { l as mktRpc, o as init_db_server, t as MktRpcError, u as num } from "./advertiser.server-DyvSoHf7.mjs";
import crypto from "crypto";
//#region node_modules/.nitro/vite/services/ssr/assets/publisher.server-BEIokuuX.js
init_client_server();
init_db_server();
/**
* Phase 4 — publisher-side: active campaigns list, click recording, proof submission, appeal flow.
*
* CRITICAL SCHEMA CORRECTIONS:
* - Column: user_id (NOT publisher_id!)
* - Column: proof_paths text[] array (NOT proof_url string!)
* - Column: user_note (NOT notes!)
* - Column: appeal_text (NOT appeal_notes!)
* - Function: mkt_start (NOT recordClick!)
* - Function: mkt_appeal (NOT mkt_appeal_submission!)
* - IP addresses must be hashed before storing (ip_hash not ip_address)
*/
var mktDbPublisher = supabaseAdmin;
function normalizeCampaignCountries(countries) {
	const values = countries ?? [];
	return values.some((value) => [
		"*",
		"ALL",
		"WW"
	].includes(value.toUpperCase())) ? [] : values;
}
function deviceFromUserAgent(userAgent) {
	const ua = (userAgent ?? "").toLowerCase();
	if (ua.includes("android")) return "android";
	if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ios")) return "ios";
	return "desktop";
}
/**
* Lists campaigns that are active and visible to publishers (admin-approved).
* Excludes campaigns the user already submitted proof for (one submission per campaign).
* Featured campaigns (not expired) are included and marked with featured=true.
*/
async function listActiveCampaignsImpl(userId) {
	const { data, error } = await mktDbPublisher.from("campaigns").select(`
      id, name, summary, description, publisher_reward, verification_mode, max_completions, completions_count, 
      countries, category_id, subcategory_id, estimated_minutes, is_featured, featured_expires_at, created_at,
      proof_min_images, proof_max_images, proof_fields, proof_description,
      marketplace_categories:category_id (name),
      marketplace_subcategories:subcategory_id (name),
      campaign_options!left(proof_mode, proof_example_url)
    `).eq("status", "active").order("created_at", { ascending: false });
	if (error) {
		console.error("listActiveCampaignsImpl error:", {
			message: error.message,
			code: error.code,
			details: error.details,
			hint: error.hint
		});
		throw new Error(`campaigns: ${error.message}`);
	}
	const campaigns = data ?? [];
	const { data: existingSubmissions } = await mktDbPublisher.from("campaign_submissions").select("campaign_id").eq("user_id", userId);
	const submittedIds = new Set((existingSubmissions ?? []).map((s) => s.campaign_id));
	const now = /* @__PURE__ */ new Date();
	return campaigns.filter((c) => !submittedIds.has(c.id)).map((c) => {
		const slotsLeft = c.max_completions > c.completions_count ? c.max_completions - c.completions_count : 0;
		const proofModeFromOptions = c.campaign_options?.[0]?.proof_mode || null;
		const proofFields = c.proof_fields ?? [];
		const minImages = c.proof_min_images ?? 1;
		let derivedMode = proofModeFromOptions;
		if (!derivedMode && c.verification_mode !== "auto") {
			const hasRequiredFields = proofFields.some((f) => f.required);
			if (minImages >= 1 && !hasRequiredFields) derivedMode = "screenshot";
			else if (minImages === 0 && proofFields.length > 0) derivedMode = "text";
			else derivedMode = "both";
		}
		return {
			id: c.id,
			title: c.name,
			description: c.description || c.summary,
			reward: num(c.publisher_reward),
			verification: c.verification_mode === "auto" ? "auto" : "proof",
			maxCompletions: c.max_completions,
			completionsCount: c.completions_count,
			slotsRemaining: slotsLeft > 0 ? slotsLeft : null,
			slotsLeft: slotsLeft > 0 ? slotsLeft : null,
			countries: normalizeCampaignCountries(c.countries),
			category: c.marketplace_categories?.name || null,
			subcategory: c.marketplace_subcategories?.name || null,
			estimatedMinutes: c.estimated_minutes,
			featured: c.is_featured && c.featured_expires_at ? new Date(c.featured_expires_at) > now : false,
			createdAt: c.created_at,
			proofMode: derivedMode,
			proofMinImages: c.proof_min_images ?? 1,
			proofMaxImages: c.proof_max_images ?? 3,
			proofFields,
			proofDescription: c.proof_description || null,
			proofExampleUrl: c.campaign_options?.[0]?.proof_example_url || null
		};
	});
}
/**
* Lists all submissions by this publisher, with campaign titles.
*/
async function listMySubmissionsImpl(userId) {
	const { data, error } = await mktDbPublisher.from("campaign_submissions").select("*, campaigns(name)").eq("user_id", userId).order("created_at", { ascending: false });
	if (error) throw new Error(`campaign_submissions: ${error.message}`);
	return (data ?? []).map((s) => ({
		id: s.id,
		campaignId: s.campaign_id,
		campaignTitle: s.campaigns?.name ?? "Campaign",
		proofPaths: s.proof_paths,
		userNote: s.user_note,
		status: s.status,
		rejectionReason: s.rejection_reason,
		appealText: s.appeal_text,
		reward: num(s.reward_amount),
		submittedAt: s.created_at,
		reviewedAt: s.reviewed_at
	}));
}
async function getCampaignForEarnerImpl(userId, campaignId) {
	const { data: campaign, error } = await mktDbPublisher.from("campaigns").select("id,name,summary,description,publisher_reward,verification_mode,proof_description,proof_min_images,proof_max_images,proof_fields,max_completions,completions_count,countries,campaign_options!left(proof_mode,proof_example_url)").eq("id", campaignId).eq("status", "active").maybeSingle();
	if (error) {
		console.error("getCampaignForEarnerImpl error:", {
			message: error.message,
			code: error.code,
			details: error.details,
			hint: error.hint,
			campaignId
		});
		throw new Error(error.message);
	}
	if (!campaign) return null;
	const { data: click, error: clickError } = await mktDbPublisher.from("campaign_clicks").select("click_id,status").eq("campaign_id", campaignId).eq("user_id", userId).eq("status", "active").order("created_at", { ascending: false }).limit(1).maybeSingle();
	if (clickError) {
		console.error("getCampaignForEarnerImpl click error:", {
			message: clickError.message,
			code: clickError.code,
			details: clickError.details,
			campaignId,
			userId
		});
		throw new Error(clickError.message);
	}
	const campaignOptions = campaign.campaign_options;
	const proofModeFromOptions = Array.isArray(campaignOptions) ? campaignOptions[0]?.proof_mode : campaignOptions?.proof_mode;
	const proofExampleUrlFromOptions = Array.isArray(campaignOptions) ? campaignOptions[0]?.proof_example_url : campaignOptions?.proof_example_url;
	const proofFields = campaign.proof_fields ?? [];
	const minImages = campaign.proof_min_images ?? 1;
	let derivedMode = proofModeFromOptions || null;
	if (!derivedMode && campaign.verification_mode !== "auto") {
		const hasRequiredFields = proofFields.some((f) => f.required);
		if (minImages >= 1 && !hasRequiredFields) derivedMode = "screenshot";
		else if (minImages === 0 && proofFields.length > 0) derivedMode = "text";
		else derivedMode = "both";
	}
	return {
		...campaign,
		countries: normalizeCampaignCountries(campaign.countries),
		clickId: click?.click_id ?? null,
		proofMode: derivedMode,
		proofExampleUrl: proofExampleUrlFromOptions || null
	};
}
var SubmissionError = class extends Error {
	code;
	constructor(code, message) {
		super(message);
		this.name = "SubmissionError";
		this.code = code;
	}
};
/**
* Records a campaign click (mkt_start).
* For proof-based campaigns, this reserves budget and creates a click record.
* Returns the click_id which is needed for proof submission.
*/
async function startCampaignImpl(userId, campaignId, userAgent = null) {
	const request = getRequest();
	const clientIp = request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request?.headers.get("x-real-ip") || "unknown";
	const country = (request?.headers.get("x-vercel-ip-country") || request?.headers.get("cf-ipcountry") || "").trim().toUpperCase();
	const ipHash = crypto.createHash("sha256").update(clientIp).digest("hex");
	try {
		const result = await mktRpc("mkt_start", {
			p_campaign_id: campaignId,
			p_user_id: userId,
			p_meta: {
				ip_hash: ipHash,
				user_agent: userAgent,
				country: /^[A-Z]{2}$/.test(country) ? country : null,
				device: deviceFromUserAgent(userAgent),
				timestamp: (/* @__PURE__ */ new Date()).toISOString()
			}
		});
		const { data: campaign, error: campaignError } = await mktDbPublisher.from("campaigns").select("verification_mode, tracking_url").eq("id", campaignId).single();
		if (campaignError) throw new Error(`campaign: ${campaignError.message}`);
		return {
			clickId: result.click_id,
			expiresAt: result.expires_at,
			...campaign?.verification_mode === "auto" && campaign.tracking_url ? { redirectUrl: campaign.tracking_url.split("{click_id}").join(encodeURIComponent(result.click_id)) } : {}
		};
	} catch (err) {
		if (err instanceof MktRpcError) throw new SubmissionError(err.code, humanSubmissionError(err.code));
		throw err;
	}
}
var submitProofInput = objectType({
	clickId: stringType().uuid(),
	proofPaths: arrayType(stringType().min(1)).min(0).max(5),
	fieldValues: recordType(stringType()).optional(),
	userNote: stringType().max(500).optional()
});
/**
* Combined submission input: submits proof and starts click if needed.
*/
var submitProofForCampaignInput = objectType({
	campaignId: stringType().uuid(),
	files: arrayType(objectType({
		name: stringType().max(200),
		type: stringType().max(100),
		base64: stringType().max(7e6)
	})).max(5),
	fieldValues: recordType(stringType()).optional(),
	userNote: stringType().max(500).optional()
});
/**
* Creates a proof submission. Status starts as "pending". The mkt_submit_proof function
* validates the click exists, hasn't expired, and no duplicate submission.
*/
async function submitProofImpl(userId, input) {
	try {
		return { submissionId: (await mktRpc("mkt_submit_proof", {
			p_click_id: input.clickId,
			p_user_id: userId,
			p_paths: input.proofPaths,
			p_fields: input.fieldValues || {},
			p_note: input.userNote || null
		})).submission_id };
	} catch (err) {
		if (err instanceof MktRpcError) {
			if (err.code === "MKT_INVALID_PROOF") {
				const friendlyMessage = err.message.match(/DETAIL:\s*(.+)/i)?.[1] || humanSubmissionError(err.code);
				throw new SubmissionError(err.code, friendlyMessage);
			}
			throw new SubmissionError(err.code, humanSubmissionError(err.code));
		}
		throw err;
	}
}
/**
* Unified proof submission: starts click if needed, uploads files, then submits proof.
* This is the earner-facing function that handles the complete flow.
*/
async function submitProofForCampaignImpl(userId, input) {
	const { data: campaign, error: campaignError } = await mktDbPublisher.from("campaigns").select("proof_mode, proof_min_images, proof_fields").eq("id", input.campaignId).single();
	if (campaignError || !campaign) throw new SubmissionError("MKT_NOT_AVAILABLE", "Campaign not found.");
	const hasImages = input.files.length > 0;
	const proofFields = campaign.proof_fields || [];
	const hasFieldValues = proofFields.some((field) => {
		const value = input.fieldValues?.[field.key];
		return value && value.trim().length > 0;
	});
	const proofMode = campaign.proof_mode;
	const minImages = campaign.proof_min_images ?? 0;
	if (proofMode === "either") {
		if (!hasImages && !hasFieldValues) throw new SubmissionError("MKT_INVALID_PROOF", "Please provide either a screenshot or fill in the required details.");
	} else if (proofMode === "both") {
		if (input.files.length < minImages) throw new SubmissionError("MKT_INVALID_PROOF", `Please upload at least ${minImages} image${minImages === 1 ? "" : "s"}.`);
		for (const field of proofFields) if (field.required) {
			const value = input.fieldValues?.[field.key];
			if (!value || !value.trim()) throw new SubmissionError("MKT_INVALID_PROOF", `Please fill in all required fields.`);
		}
	} else if (proofMode === "screenshot") {
		if (input.files.length < minImages) throw new SubmissionError("MKT_INVALID_PROOF", `Please upload at least ${minImages} screenshot${minImages === 1 ? "" : "s"}.`);
	} else if (proofMode === "text") {
		for (const field of proofFields) if (field.required) {
			const value = input.fieldValues?.[field.key];
			if (!value || !value.trim()) throw new SubmissionError("MKT_INVALID_PROOF", `Please fill in all required fields.`);
		}
	} else if (proofMode === null) {
		const hasRequiredFields = proofFields.some((f) => f.required);
		if (minImages >= 1 && !hasRequiredFields) {
			if (input.files.length < minImages) throw new SubmissionError("MKT_INVALID_PROOF", `Please upload at least ${minImages} screenshot${minImages === 1 ? "" : "s"}.`);
		} else if (minImages === 0 && proofFields.length > 0) {
			for (const field of proofFields) if (field.required) {
				const value = input.fieldValues?.[field.key];
				if (!value || !value.trim()) throw new SubmissionError("MKT_INVALID_PROOF", `Please fill in all required fields.`);
			}
		} else {
			if (input.files.length < minImages) throw new SubmissionError("MKT_INVALID_PROOF", `Please upload at least ${minImages} image${minImages === 1 ? "" : "s"}.`);
			for (const field of proofFields) if (field.required) {
				const value = input.fieldValues?.[field.key];
				if (!value || !value.trim()) throw new SubmissionError("MKT_INVALID_PROOF", `Please fill in all required fields.`);
			}
		}
	}
	const { data: existingClick } = await mktDbPublisher.from("campaign_clicks").select("click_id").eq("campaign_id", input.campaignId).eq("user_id", userId).eq("status", "active").order("created_at", { ascending: false }).limit(1).maybeSingle();
	let clickId;
	if (existingClick) clickId = existingClick.click_id;
	else {
		const request = getRequest();
		const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : request?.headers.get("user-agent");
		clickId = (await startCampaignImpl(userId, input.campaignId, userAgent || null)).clickId;
	}
	const proofPaths = [];
	for (const file of input.files) {
		if (!file) continue;
		if (![
			"image/jpeg",
			"image/png",
			"image/webp"
		].includes(file.type)) throw new Error(`Invalid file type: ${file.type}. Only JPEG, PNG, and WebP images are allowed.`);
		const ext = file.name.split(".").pop() || "jpg";
		const uuid = crypto.randomUUID();
		const path = `${userId}/campaign/${input.campaignId}/${uuid}.${ext}`;
		const buffer = Buffer.from(file.base64, "base64");
		if (buffer.length > 5242880) throw new Error(`File "${file.name}" is too large. Maximum size is 5 MB.`);
		const { error: uploadError } = await supabaseAdmin.storage.from("offer-proofs").upload(path, buffer, {
			contentType: file.type,
			upsert: false
		});
		if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
		proofPaths.push(path);
	}
	return submitProofImpl(userId, {
		clickId,
		proofPaths,
		fieldValues: input.fieldValues,
		userNote: input.userNote
	});
}
var appealSubmissionInput = objectType({
	submissionId: stringType().uuid(),
	appealText: stringType().min(20).max(1e3)
});
/**
* Publisher appeals a rejected submission.
* Function is mkt_appeal (NOT mkt_appeal_submission!)
*/
async function appealSubmissionImpl(userId, input) {
	try {
		await mktRpc("mkt_appeal", {
			p_submission_id: input.submissionId,
			p_user_id: userId,
			p_text: input.appealText
		});
	} catch (err) {
		if (err instanceof MktRpcError) throw new SubmissionError(err.code, humanSubmissionError(err.code));
		throw err;
	}
}
function humanSubmissionError(code) {
	switch (code) {
		case "MKT_NOT_AVAILABLE": return "This campaign is no longer accepting submissions.";
		case "MKT_ALREADY_STARTED": return "You already started this campaign.";
		case "MKT_CAMPAIGN_FULL":
		case "MKT_NO_SLOTS": return "This campaign reached its completion limit.";
		case "MKT_DAILY_LIMIT": return "Today's slots for this task are full. Try again later.";
		case "MKT_SUBMISSION_NOT_FOUND": return "Submission not found.";
		case "MKT_CLICK_NOT_FOUND": return "Click not found or expired.";
		case "MKT_CLICK_EXPIRED": return "Your click window expired. Please start again.";
		case "MKT_DUPLICATE_SUBMISSION":
		case "MKT_ALREADY_DONE": return "You already submitted proof for this click.";
		case "MKT_NOT_APPEALLABLE":
		case "MKT_APPEAL_DEADLINE_PASSED": return "This submission can no longer be appealed.";
		case "MKT_INVALID_PROOF": return "Please provide the required proof (screenshot or details).";
		case "MKT_NOT_ELIGIBLE": return "You are not eligible for this campaign.";
		default: return "Something went wrong. Please try again.";
	}
}
//#endregion
export { SubmissionError, appealSubmissionImpl, appealSubmissionInput, getCampaignForEarnerImpl, listActiveCampaignsImpl, listMySubmissionsImpl, startCampaignImpl, submitProofForCampaignImpl, submitProofForCampaignInput, submitProofImpl, submitProofInput };
