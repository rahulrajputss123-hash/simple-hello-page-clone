/**
 * Admin marketplace and referral settings management
 * Phase 6: Configure marketplace parameters and referral bonuses
 */

import { createServerFn } from "@tanstack/start";
import { supabaseServer } from "../supabase.server";
import { z } from "zod";

export interface MarketplaceSettings {
  deposits_enabled: boolean;
  manual_deposits_enabled: boolean;
  min_deposit_usd: number;
  max_deposit_usd: number;
  inr_per_usd: number | null;
  platform_fee_percent: number;
  promo_ends_at: string | null;
  first_deposit_bonus_percent: number;
  referral_bonus_split_percent: number;
  referrer_bonus_hold_days: number;
  bonus_earnings_hold_days: number;
  bonus_min_publisher_age_days: number;
  ip_link_window_days: number;
  min_publisher_reward: number;
  auto_approve_after_hours: number | null;
  appeal_window_hours: number;
  default_slot_minutes: number;
  default_attribution_hours: number;
  rejection_flag_percent: number;
  rejection_flag_min_decisions: number;
  terms_version: string;
  updated_at: string;
}

export interface ReferralSettings {
  pub_signup_bonus: number;
  pub_first_earning_bonus: number;
  pub_first_withdrawal_bonus: number;
  pub_window_days: number;
  updated_at: string;
}

/**
 * Get current marketplace settings
 */
export const getMarketplaceSettingsImpl = async (): Promise<MarketplaceSettings> => {
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("marketplace_settings")
    .select("*")
    .eq("id", true)
    .single();

  if (error) throw new Error(`Failed to fetch marketplace settings: ${error.message}`);
  if (!data) throw new Error("Marketplace settings not found");

  return data as MarketplaceSettings;
};

export const getMarketplaceSettings = createServerFn({ method: "GET" }).handler(
  getMarketplaceSettingsImpl
);

/**
 * Get current referral settings
 */
export const getReferralSettingsImpl = async (): Promise<ReferralSettings> => {
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("referral_settings")
    .select("*")
    .eq("id", true)
    .single();

  if (error) throw new Error(`Failed to fetch referral settings: ${error.message}`);
  if (!data) throw new Error("Referral settings not found");

  return data as ReferralSettings;
};

export const getReferralSettings = createServerFn({ method: "GET" }).handler(getReferralSettingsImpl);

/**
 * Update marketplace settings
 */
const updateMarketplaceSettingsInput = z.object({
  platform_fee_percent: z.number().min(0).max(90).optional(),
  first_deposit_bonus_percent: z.number().min(0).max(100).optional(),
  referral_bonus_split_percent: z.number().min(0).max(100).optional(),
  referrer_bonus_hold_days: z.number().min(0).max(365).optional(),
  min_publisher_reward: z.number().min(0).optional(),
  auto_approve_after_hours: z.number().min(1).max(720).optional(),
  appeal_window_hours: z.number().min(1).max(720).optional(),
});

export const updateMarketplaceSettingsImpl = async (
  input: z.infer<typeof updateMarketplaceSettingsInput>
): Promise<MarketplaceSettings> => {
  const validated = updateMarketplaceSettingsInput.parse(input);
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("marketplace_settings")
    .update(validated)
    .eq("id", true)
    .select()
    .single();

  if (error) throw new Error(`Failed to update marketplace settings: ${error.message}`);

  return data as MarketplaceSettings;
};

export const updateMarketplaceSettings = createServerFn({ method: "POST" })
  .validator(updateMarketplaceSettingsInput)
  .handler(({ data }) => updateMarketplaceSettingsImpl(data));

/**
 * Update referral settings
 */
const updateReferralSettingsInput = z.object({
  pub_signup_bonus: z.number().min(0).optional(),
  pub_first_earning_bonus: z.number().min(0).optional(),
  pub_first_withdrawal_bonus: z.number().min(0).optional(),
  pub_window_days: z.number().min(1).max(3650).optional(),
});

export const updateReferralSettingsImpl = async (
  input: z.infer<typeof updateReferralSettingsInput>
): Promise<ReferralSettings> => {
  const validated = updateReferralSettingsInput.parse(input);
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("referral_settings")
    .update(validated)
    .eq("id", true)
    .select()
    .single();

  if (error) throw new Error(`Failed to update referral settings: ${error.message}`);

  return data as ReferralSettings;
};

export const updateReferralSettings = createServerFn({ method: "POST" })
  .validator(updateReferralSettingsInput)
  .handler(({ data }) => updateReferralSettingsImpl(data));
