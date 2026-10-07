import { z } from "zod";

import { type CampaignRow, type UntypedClient, MktRpcError, mktDb, mktRpc, num } from "./db.server";
import type { CampaignSubmissionRow, SubmissionStatus } from "./publisher.server";

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

export const mktDbAdmin = mktDb as UntypedClient;

/* ------------------------------------------------------------------ types */

export type AdminCampaignView = {
  id: string;
  title: string;
  summary: string;
  advertiserName: string;
  advertiserId: string;
  verification: "auto" | "proof";
  reward: number;
  budget: number;
  maxCompletions: number;
  countries: string[];
  status: CampaignRow["status"];
  submittedAt: string;
  createdAt: string;
};

export type AdminProofView = {
  id: string;
  campaignId: string;
  campaignTitle: string;
  publisherId: string;
  publisherName: string;
  proofPaths: string[]; // Array!
  userNote: string | null;
  status: SubmissionStatus;
  rejectionReason: string | null;
  appealText: string | null;
  reward: number;
  submittedAt: string;
};

/* ------------------------------------------------------------------ reads */

/**
 * Lists campaigns pending admin approval.
 */
export async function listPendingCampaignsImpl(): Promise<AdminCampaignView[]> {
  const { data, error } = await mktDbAdmin
    .from("campaigns")
    .select("*, advertiser_accounts(display_name, user_id)")
    .eq("status", "pending_review")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`campaigns: ${error.message}`);

  return ((data ?? []) as Array<CampaignRow & { advertiser_accounts: { display_name: string; user_id: string } | null }>).map((c) => ({
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
    submittedAt: c.created_at,
    createdAt: c.created_at,
  }));
}

/**
 * Lists proof submissions pending admin review (status = pending or appealed).
 */
export async function listPendingProofsImpl(): Promise<AdminProofView[]> {
  const { data, error } = await mktDbAdmin
    .from("campaign_submissions")
    .select("*, campaigns(name), profiles(name)")
    .in("status", ["pending", "appealed"])
    .order("submitted_at", { ascending: false });

  if (error) throw new Error(`campaign_submissions: ${error.message}`);

  return (
    (data ?? []) as Array<
      CampaignSubmissionRow & { campaigns: { name: string } | null; profiles: { name: string } | null }
    >
  ).map((s) => ({
    id: s.id,
    campaignId: s.campaign_id,
    campaignTitle: s.campaigns?.name ?? "Campaign",
    publisherId: s.user_id, // NOT publisher_id!
    publisherName: s.profiles?.name ?? "User",
    proofPaths: s.proof_paths, // Array!
    userNote: s.user_note,
    status: s.status,
    rejectionReason: s.rejection_reason,
    appealText: s.appeal_text,
    reward: num(s.reward_amount),
    submittedAt: s.submitted_at,
  }));
}

/* ----------------------------------------------------------------- actions */

export class AdminActionError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "AdminActionError";
    this.code = code;
  }
}

/**
 * Admin reviews (approves/rejects) a campaign submission for launch.
 * Uses mkt_review_campaign function.
 */
export async function reviewCampaignImpl(
  adminId: string,
  campaignId: string,
  decision: "approved" | "rejected",
  note: string,
): Promise<void> {
  try {
    await mktRpc("mkt_review_campaign", {
      p_campaign_id: campaignId,
      p_admin: adminId,
      p_decision: decision,
      p_note: note,
    });
  } catch (err) {
    if (err instanceof MktRpcError) {
      throw new AdminActionError(err.code, humanAdminError(err.code));
    }
    throw err;
  }
}

/**
 * Admin or advertiser decides on a proof submission (approve/reject).
 * CRITICAL: Uses mkt_decide_submission - SINGLE function for both approve AND reject!
 * This is NOT mkt_approve_proof/mkt_reject_proof (those don't exist!)
 */
export async function reviewProofImpl(
  actorId: string,
  submissionId: string,
  role: "admin" | "advertiser",
  decision: "approved" | "rejected",
  reason: string | null,
): Promise<void> {
  // Validate reason required for rejection
  if (decision === "rejected" && !reason) {
    throw new AdminActionError("REASON_REQUIRED", "Reason is required when rejecting a submission.");
  }

  try {
    await mktRpc("mkt_decide_submission", { // SINGLE function!
      p_submission_id: submissionId,
      p_actor: actorId,
      p_role: role,
      p_decision: decision,
      p_reason: reason || null,
    });
  } catch (err) {
    if (err instanceof MktRpcError) {
      throw new AdminActionError(err.code, humanAdminError(err.code));
    }
    throw err;
  }
}

/**
 * Admin resolves an appealed submission (final decision).
 * Uses mkt_resolve_appeal function.
 */
export async function resolveAppealImpl(
  adminId: string,
  submissionId: string,
  decision: "approved" | "rejected",
  note: string,
): Promise<void> {
  if (!note || note.trim().length < 10) {
    throw new AdminActionError("NOTE_REQUIRED", "A detailed note (at least 10 chars) is required.");
  }

  try {
    await mktRpc("mkt_resolve_appeal", {
      p_submission_id: submissionId,
      p_admin: adminId,
      p_decision: decision,
      p_note: note,
    });
  } catch (err) {
    if (err instanceof MktRpcError) {
      throw new AdminActionError(err.code, humanAdminError(err.code));
    }
    throw err;
  }
}

function humanAdminError(code: string): string {
  switch (code) {
    case "MKT_CAMPAIGN_NOT_FOUND":
      return "Campaign not found.";
    case "MKT_INVALID_STATUS":
      return "Campaign or submission is not in a reviewable state.";
    case "MKT_INSUFFICIENT_FUNDS":
      return "Campaign budget exhausted.";
    case "MKT_SUBMISSION_NOT_FOUND":
      return "Submission not found.";
    case "MKT_REASON_REQUIRED":
      return "A reason is required for this action.";
    default:
      return "Something went wrong.";
  }
}
