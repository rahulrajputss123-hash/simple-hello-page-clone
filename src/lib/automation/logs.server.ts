import { supabaseAdmin } from "@/integrations/supabase/client.server";

import type { JsonObject } from "../sdk-offerwall/types";

export type AutomationStatus = "info" | "success" | "warning" | "error";

export type AutomationLogInput = {
  eventType: string;
  status?: AutomationStatus;
  source?: string;
  providerId?: string | null;
  userId?: string | null;
  referenceId?: string | null;
  message?: string;
  context?: JsonObject;
};

/** Fire-and-forget automation audit trail. Never throws into the caller. */
export async function logAutomation(input: AutomationLogInput) {
  try {
    await supabaseAdmin.from("automation_logs").insert({
      event_type: input.eventType,
      status: input.status ?? "info",
      source: input.source ?? "system",
      provider_id: input.providerId ?? null,
      user_id: input.userId ?? null,
      reference_id: input.referenceId ?? null,
      message: input.message ?? "",
      context: (input.context ?? {}) as never,
    });
  } catch {
    // Logging must never break an automation run.
  }
}

export async function listAutomationLogsImpl(input: {
  eventType?: string | undefined;
  status?: string | undefined;
  limit: number;
}) {
  let query = supabaseAdmin
    .from("automation_logs")
    .select(
      "id, event_type, status, source, provider_id, user_id, reference_id, message, context, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(input.limit);
  if (input.eventType) query = query.eq("event_type", input.eventType);
  if (input.status) query = query.eq("status", input.status);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function automationStatsImpl() {
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const [total, errors, credited, duplicates] = await Promise.all([
    supabaseAdmin
      .from("automation_logs")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since),
    supabaseAdmin
      .from("automation_logs")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since)
      .eq("status", "error"),
    supabaseAdmin
      .from("sdk_offerwall_conversions")
      .select("id", { count: "exact", head: true })
      .eq("status", "credited"),
    supabaseAdmin
      .from("sdk_offerwall_conversions")
      .select("id", { count: "exact", head: true })
      .eq("status", "duplicate"),
  ]);
  return {
    events24h: total.count ?? 0,
    errors24h: errors.count ?? 0,
    creditedConversions: credited.count ?? 0,
    duplicateConversions: duplicates.count ?? 0,
  };
}
