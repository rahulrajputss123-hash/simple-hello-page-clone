/**
 * Admin advertiser management functions
 * Phase 6: Real advertiser list and status management
 */

import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

export interface AdvertiserAccount {
  user_id: string;
  display_name: string;
  contact_email: string | null;
  website_url: string | null;
  status: "active" | "restricted" | "suspended";
  status_reason: string | null;
  deposit_balance: number;
  bonus_locked: number;
  bonus_available: number;
  lifetime_deposited: number;
  lifetime_spent: number;
  flagged_for_review: boolean;
  flag_reason: string | null;
  created_at: string;
  campaign_count?: number;
}

/**
 * List all advertiser accounts with their campaign counts
 */
export const listAdvertisersImpl = async (): Promise<AdvertiserAccount[]> => {
  // Get all advertiser accounts
  const { data: advertisers, error } = await supabaseAdmin
    .from("advertiser_accounts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch advertisers: ${error.message}`);

  // For each advertiser, get campaign count
  const advertisersWithCounts = await Promise.all(
    (advertisers ?? []).map(async (advertiser) => {
      const { count } = await supabaseAdmin
        .from("campaigns")
        .select("*", { count: "exact", head: true })
        .eq("advertiser_id", advertiser.user_id);

      return {
        ...advertiser,
        campaign_count: count ?? 0,
      };
    })
  );

  return advertisersWithCounts;
};

export const listAdvertisers = createServerFn({ method: "GET" }).handler(listAdvertisersImpl);

/**
 * Set advertiser account status (active/restricted/suspended)
 * Uses mkt_set_advertiser_status function
 */
const setAdvertiserStatusInput = z.object({
  advertiserId: z.string().uuid(),
  adminId: z.string().uuid(),
  status: z.enum(["active", "restricted", "suspended"]),
  reason: z.string().min(5),
});

export const setAdvertiserStatusImpl = async (
  input: z.infer<typeof setAdvertiserStatusInput>
): Promise<{ status: string }> => {
  const { advertiserId, adminId, status, reason } = setAdvertiserStatusInput.parse(input);

  const { data, error } = await supabaseAdmin.rpc("mkt_set_advertiser_status", {
    p_advertiser: advertiserId,
    p_admin: adminId,
    p_status: status,
    p_reason: reason,
  });

  if (error) throw new Error(`Failed to set advertiser status: ${error.message}`);

  return data as { status: string };
};

export const setAdvertiserStatus = createServerFn({ method: "POST" })
  .validator(setAdvertiserStatusInput)
  .handler(({ data }) => setAdvertiserStatusImpl(data));

/**
 * Clear advertiser D5 flag
 * Uses mkt_clear_advertiser_flag function
 */
const clearAdvertiserFlagInput = z.object({
  advertiserId: z.string().uuid(),
  adminId: z.string().uuid(),
  note: z.string().min(10),
});

export const clearAdvertiserFlagImpl = async (
  input: z.infer<typeof clearAdvertiserFlagInput>
): Promise<{ cleared: boolean }> => {
  const { advertiserId, adminId, note } = clearAdvertiserFlagInput.parse(input);

  const { data, error } = await supabaseAdmin.rpc("mkt_clear_advertiser_flag", {
    p_advertiser: advertiserId,
    p_admin: adminId,
    p_note: note,
  });

  if (error) throw new Error(`Failed to clear flag: ${error.message}`);

  return data as { cleared: boolean };
};

export const clearAdvertiserFlag = createServerFn({ method: "POST" })
  .validator(clearAdvertiserFlagInput)
  .handler(({ data }) => clearAdvertiserFlagImpl(data));
