import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Json } from "@/integrations/supabase/types";

/**
 * Logs an admin action to the audit trail.
 * Called from service-role context only (never from client).
 */
export async function logAdminAction(params: {
  adminId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  note?: string;
}) {
  try {
    await supabaseAdmin.from("admin_audit_log").insert({
      admin_id: params.adminId,
      action: params.action,
      target_type: params.targetType ?? null,
      target_id: params.targetId ?? null,
      before: (params.before as Json) ?? null,
      after: (params.after as Json) ?? null,
      note: params.note ?? null,
    });
  } catch (error) {
    // Audit logging must never fail the primary operation
    console.error("[audit] Failed to log admin action", { params, error });
  }
}

/**
 * Shared admin role verification.
 * Throws "Forbidden" if the user does not have an admin role.
 * Reuses the existing assertAdmin logic for consistency.
 */
export async function requireAdmin(
  supabase: { rpc: (fn: string, args: unknown) => Promise<{ data: unknown }> },
  userId: string,
) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (data !== true) throw new Error("Forbidden");
}

/**
 * Check if user has any of the specified roles.
 */
export async function hasAnyRole(
  userId: string,
  roles: Array<"admin" | "finance" | "support">,
): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", roles)
    .limit(1);
  return Boolean(data?.length);
}

/**
 * Get user's roles.
 */
export async function getUserRoles(userId: string): Promise<string[]> {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  return (data ?? []).map((r) => r.role);
}
