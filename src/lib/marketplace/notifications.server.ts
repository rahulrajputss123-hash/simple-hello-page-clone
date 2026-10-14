/**
 * Marketplace notification helpers
 * Fire-and-forget notifications for advertiser and earner events
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";

type NotificationKind = "info" | "success" | "warning" | "error";

/**
 * Send a notification to a user (fire-and-forget)
 * Never throws - logs errors and continues
 */
async function notify(
  userId: string,
  title: string,
  body: string,
  kind: NotificationKind = "info",
): Promise<void> {
  try {
    await supabaseAdmin.from("notifications").insert({
      user_id: userId,
      title,
      body,
      kind,
    });
  } catch (err) {
    // Log but don't break the main flow
    console.error("[notifications] Failed to send notification:", {
      userId,
      title,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Advertiser: campaign approved
 */
export async function notifyCampaignApproved(
  advertiserId: string,
  campaignName: string,
): Promise<void> {
  await notify(
    advertiserId,
    "Campaign approved",
    `Your campaign "${campaignName}" is now live and accepting completions.`,
    "success",
  );
}

/**
 * Advertiser: campaign rejected with reason
 */
export async function notifyCampaignRejected(
  advertiserId: string,
  campaignName: string,
  reason?: string,
): Promise<void> {
  const body = reason
    ? `Your campaign "${campaignName}" was rejected: ${reason}`
    : `Your campaign "${campaignName}" was rejected. Please review and resubmit.`;
  await notify(advertiserId, "Campaign rejected", body, "error");
}

/**
 * Advertiser: new proof waiting for review
 */
export async function notifyProofWaitingForReview(
  advertiserId: string,
  campaignName: string,
): Promise<void> {
  await notify(
    advertiserId,
    "New proof to review",
    `A new proof submission is waiting for your review in "${campaignName}".`,
    "info",
  );
}

/**
 * Advertiser: submission auto-approved
 */
export async function notifySubmissionAutoApproved(
  advertiserId: string,
  campaignName: string,
): Promise<void> {
  await notify(
    advertiserId,
    "Submission auto-approved",
    `A proof in "${campaignName}" was automatically approved (review window expired).`,
    "info",
  );
}

/**
 * Advertiser: balance below threshold (at most once per day per advertiser)
 */
export async function notifyLowBalance(
  advertiserId: string,
  currentBalance: number,
): Promise<void> {
  // Check if we already sent this notification today
  const today = new Date().toISOString().split("T")[0];
  const { data: existing } = await supabaseAdmin
    .from("notifications")
    .select("id")
    .eq("user_id", advertiserId)
    .eq("title", "Low campaign balance")
    .gte("created_at", `${today}T00:00:00Z`)
    .limit(1)
    .maybeSingle();

  if (existing) return; // Already notified today

  await notify(
    advertiserId,
    "Low campaign balance",
    `Your Campaign Balance is below $5.00 (currently $${currentBalance.toFixed(2)}). Add funds to keep campaigns running.`,
    "warning",
  );
}

/**
 * Advertiser: campaign completed or budget exhausted
 */
export async function notifyCampaignCompleted(
  advertiserId: string,
  campaignName: string,
  reason: "completed" | "exhausted",
): Promise<void> {
  const body =
    reason === "completed"
      ? `Your campaign "${campaignName}" has completed all slots.`
      : `Your campaign "${campaignName}" budget is exhausted.`;
  await notify(advertiserId, "Campaign ended", body, "info");
}

/**
 * Earner: proof approved
 */
export async function notifyProofApproved(
  earnerId: string,
  campaignName: string,
  reward: number,
): Promise<void> {
  await notify(
    earnerId,
    "Proof approved",
    `Your proof for "${campaignName}" was approved. You earned $${reward.toFixed(2)}.`,
    "success",
  );
}

/**
 * Earner: proof rejected
 */
export async function notifyProofRejected(
  earnerId: string,
  campaignName: string,
  reason?: string,
): Promise<void> {
  const body = reason
    ? `Your proof for "${campaignName}" was rejected: ${reason}`
    : `Your proof for "${campaignName}" was rejected. Please try again if slots are available.`;
  await notify(earnerId, "Proof rejected", body, "error");
}

/**
 * Earner: proof auto-approved
 */
export async function notifyProofAutoApproved(
  earnerId: string,
  campaignName: string,
  reward: number,
): Promise<void> {
  await notify(
    earnerId,
    "Proof auto-approved",
    `Your proof for "${campaignName}" was automatically approved. You earned $${reward.toFixed(2)}.`,
    "success",
  );
}
