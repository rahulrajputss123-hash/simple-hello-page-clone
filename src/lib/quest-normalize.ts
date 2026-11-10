/**
 * Quest normalization shared between quests.server.ts and postback.server.ts.
 * Extracted to avoid dynamic import() issues in production builds.
 */

import type { QuestRow } from "./quests.server";

/**
 * Normalize quest row: convert strings to numbers, ensure arrays, apply defaults.
 * Used by both quest retrieval and postback processing.
 */
export function normalizeQuest(row: QuestRow): QuestRow {
  return {
    ...row,
    reward_amount: Number(row.reward_amount ?? 0),
    step_reward: Number(row.step_reward ?? 0),
    step_rewards: Array.isArray(row.step_rewards) ? row.step_rewards.map((r) => Number(r)) : null,
    ads_required: Number(row.ads_required ?? 0),
    shortlink_steps: Array.isArray(row.shortlink_steps) ? row.shortlink_steps : [],
    min_seconds_per_step: Number(row.min_seconds_per_step ?? 15),
    locker_urls: Array.isArray(row.locker_urls)
      ? row.locker_urls.map((url) => String(url).trim()).filter(Boolean)
      : [],
    total_days: Number(row.total_days ?? 3),
    required_active_seconds: Number(row.required_active_seconds ?? 300),
    streak_mode: (row.streak_mode ?? "consecutive") as "consecutive" | "total",
    grace_days: Number(row.grace_days ?? 0),
    day1_auto_complete: Boolean(row.day1_auto_complete ?? true),
    repeatable: Boolean(row.repeatable ?? false),
    default_timezone: String(row.default_timezone ?? "Asia/Kolkata"),
    feed_kind: row.feed_kind as "ptc" | "shortlink" | "article" | null,
    steps_count: Number(row.steps_count ?? 10),
    backup_count: Number(row.backup_count ?? 4),
    feed_provider_ids: Array.isArray(row.feed_provider_ids) ? row.feed_provider_ids : [],
    min_reward_usd: Number(row.min_reward_usd ?? 0),
    min_completion_rate: Number(row.min_completion_rate ?? 50),
    max_per_network: row.max_per_network != null ? Number(row.max_per_network) : null,
    blocked_domains: Array.isArray(row.blocked_domains) ? row.blocked_domains : [],
    token_ttl_hours: Number(row.token_ttl_hours ?? 48),
    network_provider_ids: Array.isArray(row.network_provider_ids) ? row.network_provider_ids : [],
    required_count: Number(row.required_count ?? 3),
    min_qualifying_usd: Number(row.min_qualifying_usd ?? 0.01),
    reward_hold_hours: Number(row.reward_hold_hours ?? 0),
    required_surveys: Number(row.required_surveys ?? 5),
    allowed_networks: Array.isArray(row.allowed_networks) ? row.allowed_networks : [],
    min_payout_usd: Number(row.min_payout_usd ?? 0.5),
    max_loi: row.max_loi != null ? Number(row.max_loi) : null,
    timed_steps: Array.isArray(row.timed_steps) ? row.timed_steps : [],
    timed_step_seconds: Number(row.timed_step_seconds ?? 60),
    timed_checkpoint_seconds: Number(row.timed_checkpoint_seconds ?? 10),
    timed_max_failed_taps: Number(row.timed_max_failed_taps ?? 2),
    target_minutes: Number(row.target_minutes ?? 30),
    daily_cap_minutes: Number(row.daily_cap_minutes ?? 120),
    grace_minutes: Number(row.grace_minutes ?? 10),
    sort_order: Number(row.sort_order ?? 0),
    lock_type: (row.lock_type ?? "none") as QuestRow["lock_type"],
    unlock_at: row.unlock_at ?? null,
    required_lifetime_earned:
      row.required_lifetime_earned != null ? Number(row.required_lifetime_earned) : null,
    app_only: Boolean(row.app_only ?? false),
  };
}
