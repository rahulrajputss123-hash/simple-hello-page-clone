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

type AppRole = "admin" | "finance" | "support";

/**
 * Check if user has the specified role using has_role RPC.
 * Returns true if user has the role, false otherwise.
 */
async function hasRole(userId: string, role: AppRole): Promise<boolean> {
  try {
    const { data } = await supabaseAdmin.rpc("has_role", {
      _user_id: userId,
      _role: role,
    });
    return data === true;
  } catch (error) {
    console.error("[role] Failed to check role", { userId, role, error });
    return false;
  }
}

/**
 * Require that the user has at least one of the allowed roles.
 * Throws "Forbidden" if the user does not have any of the required roles.
 * 
 * Usage:
 *   await requireRole(userId, ['admin']) // admin only
 *   await requireRole(userId, ['admin', 'finance']) // admin or finance
 */
export async function requireRole(userId: string, allowedRoles: AppRole[]) {
  for (const role of allowedRoles) {
    if (await hasRole(userId, role)) {
      return; // User has at least one allowed role
    }
  }
  throw new Error("Forbidden");
}

/**
 * Get user's roles (for UI display/logic).
 */
export async function getUserRoles(userId: string): Promise<AppRole[]> {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  return (data ?? []).map((r) => r.role as AppRole);
}
