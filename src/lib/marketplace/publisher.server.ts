import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import crypto from "crypto";

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { type CampaignRow, type UntypedClient, MktRpcError, mktDb, mktRpc, num } from "./db.server";

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

export const mktDbPublisher = supabaseAdmin as unknown as UntypedClient;

/* ------------------------------------------------------------------ types */

function normalizeCampaignCountries(countries: string[] | null | undefined): string[] {
  const values = countries ?? [];
  return values.some((value) => ["*", "ALL", "WW"].includes(value.toUpperCase())) ? [] : values;
}

function deviceFromUserAgent(userAgent: string | null): string {
  const ua = (userAgent ?? "").toLowerCase();
  if (ua.includes("android")) return "android";
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ios")) return "ios";
  return "desktop";
}

export type PublisherCampaignView = {
  id: string;
  title: string;
  description: string;
  reward: number;
  verification: "auto" | "proof";
  maxCompletions: number;
  completionsCount: number;
  slotsRemaining: number | null;
  countries: string[];
  category: string | null;
  subcategory: string | null;
  estimatedMinutes: number | null;
  featured: boolean;
  createdAt: string;
};

export type SubmissionStatus = "pending" | "approved" | "rejected" | "appealed" | "appeal_approved" | "appeal_rejected";

export type SubmissionView = {
  id: string;
  campaignId: string;
  campaignTitle: string;
  proofPaths: string[]; // Array!
  userNote: string | null;
  status: SubmissionStatus;
  rejectionReason: string | null;
  appealText: string | null;
  reward: number;
  submittedAt: string;
  reviewedAt: string | null;
};

export type CampaignSubmissionRow = {
  id: string;
  campaign_id: string;
  user_id: string; // NOT publisher_id!
  proof_paths: string[]; // Array!
  user_note: string | null;
  status: SubmissionStatus;
  rejection_reason: string | null;
  appeal_text: string | null;
  reward_amount: string | number;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  wallet_transaction_id: string | null;
  updated_at: string;
};

/* ------------------------------------------------------------------ reads */

/**
 * Lists campaigns that are active and visible to publishers (admin-approved).
 * Excludes campaigns the user already submitted proof for (one submission per campaign).
 * Featured campaigns (not expired) are included and marked with featured=true.
 */
export async function listActiveCampaignsImpl(userId: string): Promise<PublisherCampaignView[]> {
  const { data, error } = await mktDbPublisher
    .from("campaigns")
    .select(`
      id, name, summary, publisher_reward, verification_mode, max_completions, completions_count, 
      countries, category_id, subcategory_id, estimated_minutes, is_featured, featured_expires_at, created_at,
      marketplace_categories:category_id (name),
      marketplace_subcategories:subcategory_id (name)
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`campaigns: ${error.message}`);
  const campaigns = (data ?? []) as (CampaignRow & { 
    marketplace_categories: { name: string } | null; 
    marketplace_subcategories: { name: string } | null;
  })[];

  // Filter out campaigns user already submitted to
  const { data: existingSubmissions } = await mktDbPublisher
    .from("campaign_submissions")
    .select("campaign_id")
    .eq("user_id", userId); // NOT publisher_id!

  const submittedIds = new Set((existingSubmissions ?? []).map((s: { campaign_id: string }) => s.campaign_id));

  const now = new Date();
  return campaigns
    .filter((c) => !submittedIds.has(c.id))
    .map((c) => ({
      id: c.id,
      title: c.name,
      description: c.summary,
      reward: num(c.publisher_reward),
      verification: c.verification_mode === "auto" ? "auto" : "proof",
      maxCompletions: c.max_completions,
      completionsCount: c.completions_count,
      slotsRemaining: c.max_completions > c.completions_count ? c.max_completions - c.completions_count : null,
      countries: normalizeCampaignCountries(c.countries),
      category: c.marketplace_categories?.name || null,
      subcategory: c.marketplace_subcategories?.name || null,
      estimatedMinutes: c.estimated_minutes,
      // Check featured status: must be featured AND not expired
      featured: c.is_featured && c.featured_expires_at ? new Date(c.featured_expires_at) > now : false,
      createdAt: c.created_at,
    }));
}

/**
 * Lists all submissions by this publisher, with campaign titles.
 */
export async function listMySubmissionsImpl(userId: string): Promise<SubmissionView[]> {
  const { data, error } = await mktDbPublisher
    .from("campaign_submissions")
    .select("*, campaigns(name)")
    .eq("user_id", userId) // NOT publisher_id!
    .order("created_at", { ascending: false});

  if (error) throw new Error(`campaign_submissions: ${error.message}`);

  return ((data ?? []) as Array<CampaignSubmissionRow & { campaigns: { name: string } | null }>).map((s) => ({
    id: s.id,
    campaignId: s.campaign_id,
    campaignTitle: s.campaigns?.name ?? "Campaign",
    proofPaths: s.proof_paths, // Array!
    userNote: s.user_note,
    status: s.status,
    rejectionReason: s.rejection_reason,
    appealText: s.appeal_text,
    reward: num(s.reward_amount),
    submittedAt: s.created_at,
    reviewedAt: s.reviewed_at,
  }));
}

export async function getCampaignForEarnerImpl(userId: string, campaignId: string) {
  const { data: campaign, error } = await mktDbPublisher.from("campaigns").select("id,name,summary,publisher_reward,verification_mode,proof_description,proof_min_images,proof_max_images,proof_fields,proof_requirements,max_completions,completions_count,countries,campaign_options!left(proof_example_url)").eq("id", campaignId).eq("status", "active").maybeSingle();
  if (error) throw new Error(error.message);
  if (!campaign) return null;
  const { data: click, error: clickError } = await mktDbPublisher.from("campaign_clicks").select("click_id,status").eq("campaign_id", campaignId).eq("user_id", userId).eq("status", "active").order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (clickError) throw new Error(clickError.message);
  return { ...campaign, countries: normalizeCampaignCountries(campaign.countries), clickId: click?.click_id ?? null };
}

/* --------------------------------------------------------------- click recording */

export class SubmissionError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "SubmissionError";
    this.code = code;
  }
}

/**
 * Records a campaign click (mkt_start).
 * For proof-based campaigns, this reserves budget and creates a click record.
 * Returns the click_id which is needed for proof submission.
 */
export async function startCampaignImpl(
  userId: string,
  campaignId: string,
  userAgent: string | null = null,
): Promise<{ clickId: string; expiresAt: string; redirectUrl?: string }> {
  const request = getRequest();
  const forwarded = request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const clientIp = forwarded || request?.headers.get("x-real-ip") || "unknown";
  const country = (request?.headers.get("x-vercel-ip-country") || request?.headers.get("cf-ipcountry") || "").trim().toUpperCase();
  const ipHash = crypto.createHash("sha256").update(clientIp).digest("hex");

  try {
    const result = await mktRpc<{ click_id: string; expires_at: string }>("mkt_start", {
      p_campaign_id: campaignId,
      p_user_id: userId, // NOT publisher_id!
      p_meta: {
        ip_hash: ipHash, // NOT raw ip_address!
        user_agent: userAgent,
        country: /^[A-Z]{2}$/.test(country) ? country : null,
        device: deviceFromUserAgent(userAgent),
        timestamp: new Date().toISOString(),
      },
    });

    const { data: campaign, error: campaignError } = await mktDbPublisher
      .from("campaigns")
      .select("verification_mode, tracking_url")
      .eq("id", campaignId)
      .single();
    if (campaignError) throw new Error(`campaign: ${campaignError.message}`);

    return {
      clickId: result.click_id,
      expiresAt: result.expires_at,
      ...(campaign?.verification_mode === "auto" && campaign.tracking_url
        ? { redirectUrl: campaign.tracking_url.split("{click_id}").join(encodeURIComponent(result.click_id)) }
        : {}),
    };
  } catch (err) {
    if (err instanceof MktRpcError) {
      throw new SubmissionError(err.code, humanSubmissionError(err.code));
    }
    throw err;
  }
}

/* --------------------------------------------------------------- submission */

export const submitProofInput = z.object({
  clickId: z.string().uuid(),
  proofPaths: z.array(z.string().min(1)).min(0).max(5), // Private storage object paths (0+ for text-only proof)
  fieldValues: z.record(z.string()).optional(), // Custom field values keyed by field.key
  userNote: z.string().max(500).optional(),
});
export type SubmitProofInput = z.infer<typeof submitProofInput>;

/**
 * Creates a proof submission. Status starts as "pending". The mkt_submit_proof function
 * validates the click exists, hasn't expired, and no duplicate submission.
 */
export async function submitProofImpl(
  userId: string,
  input: SubmitProofInput,
): Promise<{ submissionId: string }> {
  try {
    const result = await mktRpc<{ submission_id: string }>("mkt_submit_proof", {
      p_click_id: input.clickId,
      p_user_id: userId, // NOT publisher_id!
      p_paths: input.proofPaths, // Array!
      p_fields: input.fieldValues || {},
      p_note: input.userNote || null,
    });

    // Fire-and-forget notification to advertiser about new proof
    // Get campaign and advertiser info
    void (async () => {
      try {
        const { data: submission } = await mktDb
          .from("campaign_submissions")
          .select("campaign_id, campaigns!inner(advertiser_id, name)")
          .eq("id", result.submission_id)
          .maybeSingle();
        
        if (submission) {
          const { notifyProofWaitingForReview } = await import("./notifications.server");
          const campaign = (submission.campaigns as any);
          void notifyProofWaitingForReview(campaign.advertiser_id, campaign.name);
        }
      } catch (err) {
        // Silent fail - don't break the main flow
        console.error("[submitProof] Failed to send notification:", err);
      }
    })();

    return { submissionId: result.submission_id };
  } catch (err) {
    if (err instanceof MktRpcError) {
      throw new SubmissionError(err.code, humanSubmissionError(err.code));
    }
    throw err;
  }
}

/* ----------------------------------------------------------------- appeal */

export const appealSubmissionInput = z.object({
  submissionId: z.string().uuid(),
  appealText: z.string().min(20).max(1000), // At least 20 chars required
});
export type AppealSubmissionInput = z.infer<typeof appealSubmissionInput>;

/**
 * Publisher appeals a rejected submission.
 * Function is mkt_appeal (NOT mkt_appeal_submission!)
 */
export async function appealSubmissionImpl(
  userId: string,
  input: AppealSubmissionInput,
): Promise<void> {
  try {
    await mktRpc("mkt_appeal", { // NOT mkt_appeal_submission!
      p_submission_id: input.submissionId,
      p_user_id: userId, // NOT publisher_id!
      p_text: input.appealText, // NOT appeal_notes!
    });
  } catch (err) {
    if (err instanceof MktRpcError) {
      throw new SubmissionError(err.code, humanSubmissionError(err.code));
    }
    throw err;
  }
}

function humanSubmissionError(code: string): string {
  switch (code) {
    case "MKT_NOT_AVAILABLE":
      return "This campaign is no longer accepting submissions.";
    case "MKT_ALREADY_STARTED":
      return "You already started this campaign.";
    case "MKT_CAMPAIGN_FULL":
      return "This campaign reached its completion limit.";
    case "MKT_DAILY_LIMIT":
      return "Today's slots for this task are full. Try again later.";
    case "MKT_SUBMISSION_NOT_FOUND":
      return "Submission not found.";
    case "MKT_CLICK_NOT_FOUND":
      return "Click not found or expired.";
    case "MKT_CLICK_EXPIRED":
      return "Your click window expired. Please start again.";
    case "MKT_DUPLICATE_SUBMISSION":
      return "You already submitted proof for this click.";
    case "MKT_NOT_APPEALLABLE":
    case "MKT_APPEAL_DEADLINE_PASSED":
      return "This submission can no longer be appealed.";
    default:
      return "Something went wrong. Please try again.";
  }
}
