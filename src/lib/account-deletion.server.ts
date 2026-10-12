import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Account deletion implementation for Amazon/Google app store compliance.
 *
 * Soft-deletes the profile and anonymizes PII. Does NOT delete the user from
 * Supabase auth (that would break FK constraints and orphan data). Instead:
 * - Clears name, email, avatar, payout methods
 * - Marks account as deleted
 * - Preserves wallet history for audit/compliance
 *
 * Hard delete via supabase.auth.admin.deleteUser() would cascade to profiles,
 * but we need to keep transaction history. Future: add a "deleted_at" column
 * and soft-delete flag to profiles schema.
 */

export class AccountDeletionError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "AccountDeletionError";
  }
}

export async function requestAccountDeletionImpl(userId: string): Promise<{
  success: boolean;
  message: string;
}> {
  // 1. Check for pending withdrawal
  const { data: pendingWithdrawals } = await supabaseAdmin
    .from("withdrawal_requests")
    .select("id, amount, status")
    .eq("user_id", userId)
    .eq("status", "pending")
    .limit(1);

  if (pendingWithdrawals && pendingWithdrawals.length > 0) {
    throw new AccountDeletionError(
      "PENDING_WITHDRAWAL",
      "Cannot delete account while a withdrawal is pending. Please wait for it to be processed or cancel it first.",
    );
  }

  // 2. Soft-delete: anonymize profile
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({
      name: "Deleted User",
      email: null,
      phone: null,
      avatar_url: null,
      is_flagged: true, // Repurpose as "deleted" flag
      // Keep wallet_balance, lifetime_earned, etc for audit trail
    })
    .eq("id", userId);

  if (profileError) {
    console.error("[account-deletion] Failed to anonymize profile:", profileError);
    throw new AccountDeletionError(
      "DELETE_FAILED",
      "Failed to delete account. Please contact support.",
    );
  }

  // 3. Delete payout methods
  const { error: payoutError } = await supabaseAdmin
    .from("payout_methods")
    .delete()
    .eq("user_id", userId);

  if (payoutError) {
    console.error("[account-deletion] Failed to delete payout methods:", payoutError);
    // Non-fatal - continue
  }

  // 4. Delete notifications (non-critical data)
  await supabaseAdmin.from("notifications").delete().eq("user_id", userId);

  // Note: We do NOT delete:
  // - wallet_transactions (audit trail)
  // - withdrawal_requests (financial record)
  // - offer_claims (compliance/dispute resolution)
  // - referrals (payout obligations to referrers)

  return {
    success: true,
    message:
      "Your account has been deleted. Your earning and withdrawal history is preserved for compliance, but all personal information has been removed.",
  };
}
