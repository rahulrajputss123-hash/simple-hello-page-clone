import { c as mktDb, l as mktRpc, o as init_db_server, t as MktRpcError, u as num } from "./advertiser.server-DyvSoHf7.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin.server-BZl5UQqf.js
init_db_server();
/**
* Phase 3 & 4 — admin-side: campaign approvals, proof reviews.
*
* CRITICAL SCHEMA CORRECTIONS:
* - Function: mkt_decide_submission (NOT mkt_approve_proof/mkt_reject_proof!)
* - Function: mkt_resolve_appeal (for appeals)
* - Function: mkt_review_campaign (for campaign approval)
* - Column: user_id (NOT publisher_id!)
* - Column: proof_paths array (NOT proof_url string!)
* - Column: user_note (NOT notes!)
* - Column: appeal_text (NOT appeal_notes!)
*/
var mktDbAdmin = mktDb;
/**
* Lists campaigns pending admin approval.
* Includes auto-approval eligibility and countdown information.
*/
async function listPendingCampaignsImpl() {
	const { data, error } = await mktDbAdmin.from("campaigns").select("*, advertiser_accounts(display_name, user_id)").eq("status", "pending_review").order("created_at", { ascending: false });
	if (error) throw new Error(`campaigns: ${error.message}`);
	const { data: settings } = await mktDbAdmin.from("marketplace_settings").select("auto_approve_enabled, auto_approve_after_minutes, auto_approve_skip_first_campaign").eq("id", true).single();
	const autoApproveEnabled = settings?.auto_approve_enabled ?? false;
	const autoApproveMinutes = settings?.auto_approve_after_minutes ?? 10;
	const skipFirstCampaign = settings?.auto_approve_skip_first_campaign ?? true;
	const campaigns = data ?? [];
	return await Promise.all(campaigns.map(async (c) => {
		let autoApproveAt = null;
		let autoApproveEligible = false;
		let autoApproveReason = null;
		if (autoApproveEnabled && c.submitted_at) {
			const submittedDate = new Date(c.submitted_at);
			autoApproveAt = new Date(submittedDate.getTime() + autoApproveMinutes * 60 * 1e3).toISOString();
			if (skipFirstCampaign) {
				const { data: firstCheck } = await mktDbAdmin.from("campaigns").select("id").eq("advertiser_id", c.advertiser_id).neq("id", c.id).not("status", "in", "(draft,rejected)").limit(1).single();
				if (!firstCheck) {
					autoApproveReason = "First campaign (manual review required)";
					autoApproveEligible = false;
				}
			}
			if (!autoApproveReason) {
				const { data: advertiser } = await mktDbAdmin.from("advertiser_accounts").select("flagged_for_review").eq("user_id", c.advertiser_id).single();
				if (advertiser?.flagged_for_review) {
					autoApproveReason = "Advertiser flagged for review";
					autoApproveEligible = false;
				}
			}
			if (!autoApproveReason && num(c.budget_allocated) === 0) {
				autoApproveReason = "No budget allocated";
				autoApproveEligible = false;
			}
			if (!autoApproveReason) autoApproveEligible = true;
		}
		return {
			id: c.id,
			title: c.name,
			summary: c.summary,
			advertiserName: c.advertiser_accounts?.display_name ?? "Unknown",
			advertiserId: c.advertiser_accounts?.user_id ?? c.advertiser_id,
			verification: c.verification_mode === "auto" ? "auto" : "proof",
			reward: num(c.publisher_reward),
			budget: num(c.budget_allocated),
			maxCompletions: c.max_completions,
			countries: c.countries ?? [],
			status: c.status,
			submittedAt: c.submitted_at ?? c.created_at,
			createdAt: c.created_at,
			reviewSource: c.review_source,
			autoApproveAt,
			autoApproveEligible,
			autoApproveReason
		};
	}));
}
/**
* Lists proof submissions pending admin review (status = pending or appealed).
*/
async function listPendingProofsImpl() {
	const { data, error } = await mktDbAdmin.from("campaign_submissions").select("*, campaigns(name)").in("status", ["pending", "appealed"]).order("created_at", { ascending: false });
	if (error) throw new Error(`campaign_submissions: ${error.message}`);
	if (!data || data.length === 0) return [];
	const userIds = [...new Set(data.map((s) => s.user_id))];
	const { data: profiles, error: profileError } = await mktDbAdmin.from("profiles").select("id, name").in("id", userIds);
	if (profileError) throw new Error(`profiles: ${profileError.message}`);
	const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
	return (data ?? []).map((s) => ({
		id: s.id,
		campaignId: s.campaign_id,
		campaignTitle: s.campaigns?.name ?? "Campaign",
		publisherId: s.user_id,
		publisherName: profileMap.get(s.user_id)?.name ?? "User",
		proofPaths: s.proof_paths,
		userNote: s.user_note,
		status: s.status,
		rejectionReason: s.rejection_reason,
		appealText: s.appeal_text,
		reward: num(s.reward_amount),
		submittedAt: s.created_at
	}));
}
var AdminActionError = class extends Error {
	code;
	constructor(code, message) {
		super(message);
		this.name = "AdminActionError";
		this.code = code;
	}
};
/**
* Admin reviews (approves/rejects) a campaign submission for launch.
* Uses mkt_review_campaign function.
*/
async function reviewCampaignImpl(adminId, campaignId, decision, note) {
	const { data: campaign } = await mktDb.from("campaigns").select("advertiser_id, name").eq("id", campaignId).maybeSingle();
	try {
		await mktRpc("mkt_review_campaign", {
			p_campaign_id: campaignId,
			p_admin: adminId,
			p_decision: decision,
			p_note: note
		});
	} catch (err) {
		if (err instanceof MktRpcError) throw new AdminActionError(err.code, humanAdminError(err.code));
		throw err;
	}
}
/**
* Admin or advertiser decides on a proof submission (approve/reject).
* CRITICAL: Uses mkt_decide_submission - SINGLE function for both approve AND reject!
* This is NOT mkt_approve_proof/mkt_reject_proof (those don't exist!)
*/
async function reviewProofImpl(actorId, submissionId, role, decision, reason) {
	if (decision === "rejected" && !reason) throw new AdminActionError("REASON_REQUIRED", "Reason is required when rejecting a submission.");
	const { data: submission } = await mktDb.from("campaign_submissions").select("publisher_id, publisher_reward, campaigns!inner(name)").eq("id", submissionId).maybeSingle();
	try {
		await mktRpc("mkt_decide_submission", {
			p_submission_id: submissionId,
			p_actor: actorId,
			p_role: role,
			p_decision: decision,
			p_reason: reason || null
		});
	} catch (err) {
		if (err instanceof MktRpcError) throw new AdminActionError(err.code, humanAdminError(err.code));
		throw err;
	}
}
function humanAdminError(code) {
	switch (code) {
		case "MKT_CAMPAIGN_NOT_FOUND": return "Campaign not found.";
		case "MKT_INVALID_STATUS": return "Campaign or submission is not in a reviewable state.";
		case "MKT_INSUFFICIENT_FUNDS": return "Campaign budget exhausted.";
		case "MKT_SUBMISSION_NOT_FOUND": return "Submission not found.";
		case "MKT_REASON_REQUIRED": return "A reason is required for this action.";
		default: return "Something went wrong.";
	}
}
//#endregion
export { AdminActionError, listPendingCampaignsImpl, listPendingProofsImpl, reviewCampaignImpl, reviewProofImpl };
