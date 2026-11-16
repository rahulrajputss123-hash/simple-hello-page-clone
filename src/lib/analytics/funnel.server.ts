/**
 * Admin analytics funnel analysis
 * 
 * Provides funnel metrics for the user journey through offers, proofs, and withdrawals
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";

interface FunnelStep {
  step: string;
  count: number;
  conversionRate: number | null; // null for first step
}

interface FunnelResult {
  country: string | null;
  steps: FunnelStep[];
  dateRange: {
    from: string;
    to: string;
  };
}

interface ErrorAnalysis {
  route: string;
  count: number;
}

interface ProofErrorAnalysis {
  error_code: string;
  count: number;
}

/**
 * Get funnel metrics for user journey
 * Returns distinct user/anon counts for each funnel step with conversion rates
 */
export async function getFunnelImpl(
  fromDate: string,
  toDate: string,
  country?: string | null
): Promise<FunnelResult> {
  const funnelSteps = [
    "session_start",
    "home_quest_view",
    "offer_list_view",
    "offer_click",
    "offer_started",
    "proof_screen_view",
    "proof_submit_attempt",
    "proof_submit_success",
    "withdraw_view",
    "withdraw_submit",
  ];

  const steps: FunnelStep[] = [];
  let previousCount = 0;

  for (const stepName of funnelSteps) {
    // Build query
    let query = supabaseAdmin
      .from("app_events")
      .select("user_id, anon_id", { count: "exact", head: false })
      .eq("event_name", stepName)
      .gte("created_at", fromDate)
      .lte("created_at", toDate);

    // Add country filter if specified
    if (country && country !== "all") {
      query = query.eq("country", country);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`[funnel] Error fetching ${stepName}:`, error);
      continue;
    }

    // Count distinct users (prefer user_id, fallback to anon_id)
    const uniqueUsers = new Set<string>();
    data?.forEach((row) => {
      const id = row.user_id || row.anon_id;
      if (id) uniqueUsers.add(id);
    });

    const count = uniqueUsers.size;
    const conversionRate = previousCount > 0 ? (count / previousCount) * 100 : null;

    steps.push({
      step: stepName,
      count,
      conversionRate,
    });

    previousCount = count;
  }

  return {
    country: country || null,
    steps,
    dateRange: {
      from: fromDate,
      to: toDate,
    },
  };
}

/**
 * Get top client error routes for a date range
 */
export async function getTopClientErrorsImpl(
  fromDate: string,
  toDate: string,
  country?: string | null,
  limit: number = 10
): Promise<ErrorAnalysis[]> {
  let query = supabaseAdmin
    .from("app_events")
    .select("properties")
    .eq("event_name", "client_error")
    .gte("created_at", fromDate)
    .lte("created_at", toDate);

  if (country && country !== "all") {
    query = query.eq("country", country);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[funnel] Error fetching client errors:", error);
    return [];
  }

  // Aggregate by route
  const routeCounts = new Map<string, number>();
  data?.forEach((row) => {
    const route = (row.properties as Record<string, unknown>)?.route as string | undefined;
    if (route) {
      routeCounts.set(route, (routeCounts.get(route) || 0) + 1);
    }
  });

  // Sort and limit
  return Array.from(routeCounts.entries())
    .map(([route, count]) => ({ route, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Get top proof submission error codes for a date range
 */
export async function getTopProofErrorsImpl(
  fromDate: string,
  toDate: string,
  country?: string | null,
  limit: number = 10
): Promise<ProofErrorAnalysis[]> {
  let query = supabaseAdmin
    .from("app_events")
    .select("properties")
    .eq("event_name", "proof_submit_error")
    .gte("created_at", fromDate)
    .lte("created_at", toDate);

  if (country && country !== "all") {
    query = query.eq("country", country);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[funnel] Error fetching proof errors:", error);
    return [];
  }

  // Aggregate by error_code
  const errorCounts = new Map<string, number>();
  data?.forEach((row) => {
    const errorCode = (row.properties as Record<string, unknown>)?.error_code as string | undefined;
    if (errorCode) {
      errorCounts.set(errorCode, (errorCounts.get(errorCode) || 0) + 1);
    }
  });

  // Sort and limit
  return Array.from(errorCounts.entries())
    .map(([error_code, count]) => ({ error_code, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
