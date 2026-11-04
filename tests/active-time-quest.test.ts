import { describe, it, expect, beforeEach, vi } from "vitest";
import type { DbClient } from "../src/lib/quests.server";
import {
  processActiveTimePing,
  startActiveTimeGrace,
  endActiveTimeGrace,
  claimActiveTimeReward,
} from "../src/lib/quests/active-time.server";

// Mock database client
const createMockDb = () => {
  const mockData: {
    quests: any[];
    progress: any[];
    graceHistory: any[];
    sessions: any[];
    transactions: any[];
    notifications: any[];
  } = {
    quests: [],
    progress: [],
    graceHistory: [],
    sessions: [],
    transactions: [],
    notifications: [],
  };

  return {
    from: (table: string) => {
      const methods = {
        select: (...args: any[]) => methods,
        insert: (data: any) => {
          if (Array.isArray(data)) {
            mockData[table as keyof typeof mockData].push(...data);
          } else {
            mockData[table as keyof typeof mockData].push(data);
          }
          return methods;
        },
        update: (data: any) => {
          // Mock update - in real tests would match conditions
          return methods;
        },
        eq: (...args: any[]) => methods,
        in: (...args: any[]) => methods,
        gte: (...args: any[]) => methods,
        order: (...args: any[]) => methods,
        limit: (...args: any[]) => methods,
        maybeSingle: () => ({
          data: mockData[table as keyof typeof mockData][0] || null,
          error: null,
        }),
        single: () => ({
          data: mockData[table as keyof typeof mockData][0] || { id: "test-id" },
          error: null,
        }),
      };
      return methods;
    },
    rpc: (funcName: string, params: any) => {
      if (funcName === "claim_active_time_quest_reward") {
        const progress = mockData.progress.find(
          (p: any) => p.user_id === params.p_user_id && p.quest_key === params.p_quest_key,
        );

        if (!progress) {
          return {
            data: [{ success: false, reason: "progress_not_found", reward_amount: 0, accumulated_seconds: 0 }],
            error: null,
          };
        }

        if (progress.credited_at) {
          return {
            data: [{ success: false, reason: "already_claimed", reward_amount: 0, accumulated_seconds: progress.accumulated_seconds }],
            error: null,
          };
        }

        const quest = mockData.quests.find((q: any) => q.key === params.p_quest_key);
        const targetSeconds = (quest?.target_minutes || 30) * 60;

        if (progress.accumulated_seconds < targetSeconds) {
          return {
            data: [{ success: false, reason: "target_not_reached", reward_amount: 0, accumulated_seconds: progress.accumulated_seconds }],
            error: null,
          };
        }

        progress.credited_at = new Date().toISOString();
        return {
          data: [{
            success: true,
            reason: "claimed",
            reward_amount: quest?.reward_amount || 1.0,
            accumulated_seconds: progress.accumulated_seconds,
          }],
          error: null,
        };
      }
      return { data: null, error: { message: "Unknown RPC" } };
    },
    _mockData: mockData,
  } as unknown as DbClient;
};

describe("Active Time Quest - Ping Processing", () => {
  let mockDb: DbClient;
  const userId = "user-123";
  const questKey = "daily-active-30min";

  beforeEach(() => {
    mockDb = createMockDb();
    (mockDb as any)._mockData.quests.push({
      key: questKey,
      quest_type: "active_time",
      target_minutes: 30,
      daily_cap_minutes: 120,
      grace_minutes: 10,
      reward_amount: 1.5,
      is_active: true,
    });
  });

  it("should credit time on first ping", async () => {
    // First ping with no prior progress
    const result = await processActiveTimePing(mockDb, userId, questKey, null);

    expect(result.success).toBe(true);
    expect(result.nextToken).toBeTruthy();
    expect(result.totalSeconds).toBeGreaterThan(0);
  });

  it("should credit min(gap, 35s) on subsequent pings", async () => {
    // Set up existing progress with last ping 40 seconds ago
    const lastPingAt = new Date(Date.now() - 40_000).toISOString();
    (mockDb as any)._mockData.progress.push({
      user_id: userId,
      quest_key: questKey,
      accumulated_seconds: 100,
      today_seconds: 50,
      last_ping_at: lastPingAt,
      ping_token: "valid-token",
      grace_until: null,
      grace_offer_id: null,
      credited_at: null,
    });

    const result = await processActiveTimePing(mockDb, userId, questKey, "valid-token");

    expect(result.success).toBe(true);
    // Should credit 35s (max per ping), not 40s
    expect(result.totalSeconds).toBe(135);
  });

  it("should reject pings less than 20s apart", async () => {
    // Set up progress with recent ping (15s ago)
    const lastPingAt = new Date(Date.now() - 15_000).toISOString();
    (mockDb as any)._mockData.progress.push({
      user_id: userId,
      quest_key: questKey,
      accumulated_seconds: 100,
      today_seconds: 50,
      last_ping_at: lastPingAt,
      ping_token: "valid-token",
      grace_until: null,
      grace_offer_id: null,
      credited_at: null,
    });

    const result = await processActiveTimePing(mockDb, userId, questKey, "valid-token");

    expect(result.success).toBe(false);
    expect(result.reason).toBe("too_soon");
  });

  it("should reject invalid/replayed tokens", async () => {
    (mockDb as any)._mockData.progress.push({
      user_id: userId,
      quest_key: questKey,
      accumulated_seconds: 100,
      today_seconds: 50,
      last_ping_at: new Date(Date.now() - 31_000).toISOString(),
      ping_token: "valid-token",
      grace_until: null,
      grace_offer_id: null,
      credited_at: null,
    });

    const result = await processActiveTimePing(mockDb, userId, questKey, "wrong-token");

    expect(result.success).toBe(false);
    expect(result.reason).toBe("invalid_token");
  });

  it("should enforce daily cap", async () => {
    // User at 119 minutes today (daily cap is 120)
    const lastPingAt = new Date(Date.now() - 31_000).toISOString();
    (mockDb as any)._mockData.progress.push({
      user_id: userId,
      quest_key: questKey,
      accumulated_seconds: 500,
      today_seconds: 119 * 60, // 119 minutes
      last_ping_at: lastPingAt,
      ping_token: "valid-token",
      grace_until: null,
      grace_offer_id: null,
      credited_at: null,
    });

    const result = await processActiveTimePing(mockDb, userId, questKey, "valid-token");

    // Should succeed but credit at most 1 minute to reach cap
    expect(result.success).toBe(true);
    expect(result.todaySeconds).toBeLessThanOrEqual(120 * 60);
  });
});

describe("Active Time Quest - Grace Periods", () => {
  let mockDb: DbClient;
  const userId = "user-123";
  const questKey = "daily-active-30min";
  const offerId = "offer-456";

  beforeEach(() => {
    mockDb = createMockDb();
    (mockDb as any)._mockData.quests.push({
      key: questKey,
      quest_type: "active_time",
      target_minutes: 30,
      daily_cap_minutes: 120,
      grace_minutes: 10,
      reward_amount: 1.5,
      is_active: true,
    });
    (mockDb as any)._mockData.progress.push({
      user_id: userId,
      quest_key: questKey,
      accumulated_seconds: 100,
      today_seconds: 50,
      last_ping_at: new Date().toISOString(),
      ping_token: "token-123",
      grace_until: null,
      grace_offer_id: null,
      credited_at: null,
    });
  });

  it("should start grace period on offer click", async () => {
    const result = await startActiveTimeGrace(mockDb, userId, questKey, offerId);

    expect(result.success).toBe(true);
    expect(result.graceUntil).toBeTruthy();
  });

  it("should enforce max 3 grace periods per hour", async () => {
    // Add 3 recent grace periods
    const now = Date.now();
    for (let i = 0; i < 3; i++) {
      (mockDb as any)._mockData.graceHistory.push({
        user_id: userId,
        quest_key: questKey,
        offer_id: `offer-${i}`,
        started_at: new Date(now - (i * 10 * 60 * 1000)).toISOString(), // 10, 20, 30 min ago
        ended_at: new Date(now - (i * 10 * 60 * 1000) + 5 * 60 * 1000).toISOString(),
        seconds_credited: 300,
      });
    }

    const result = await startActiveTimeGrace(mockDb, userId, questKey, "offer-new");

    expect(result.success).toBe(false);
    expect(result.reason).toBe("rate_limit_exceeded");
  });

  it("should enforce 24h cooldown per offer", async () => {
    // Add grace period for this offer 12 hours ago
    (mockDb as any)._mockData.graceHistory.push({
      user_id: userId,
      quest_key: questKey,
      offer_id: offerId,
      started_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      ended_at: new Date(Date.now() - 12 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
      seconds_credited: 300,
    });

    const result = await startActiveTimeGrace(mockDb, userId, questKey, offerId);

    expect(result.success).toBe(false);
    expect(result.reason).toBe("offer_cooldown");
  });

  it("should end grace period", async () => {
    // Start grace first
    await startActiveTimeGrace(mockDb, userId, questKey, offerId);

    // End grace
    const result = await endActiveTimeGrace(mockDb, userId, questKey);

    expect(result.success).toBe(true);
  });
});

describe("Active Time Quest - Reward Claim", () => {
  let mockDb: DbClient;
  const userId = "user-123";
  const questKey = "daily-active-30min";

  beforeEach(() => {
    vi.mock("../src/lib/coinquest.server", () => ({
      creditWallet: vi.fn().mockResolvedValue({ success: true, duplicate: false }),
    }));

    mockDb = createMockDb();
    (mockDb as any)._mockData.quests.push({
      key: questKey,
      quest_type: "active_time",
      label: "Daily Active 30min",
      target_minutes: 30,
      daily_cap_minutes: 120,
      grace_minutes: 10,
      reward_amount: 1.5,
      is_active: true,
    });
  });

  it("should claim reward when target reached", async () => {
    (mockDb as any)._mockData.progress.push({
      user_id: userId,
      quest_key: questKey,
      accumulated_seconds: 30 * 60, // Exactly 30 minutes
      today_seconds: 30 * 60,
      last_ping_at: new Date().toISOString(),
      ping_token: "token-123",
      grace_until: null,
      grace_offer_id: null,
      credited_at: null,
    });

    const result = await claimActiveTimeReward(mockDb, userId, questKey);

    expect(result.success).toBe(true);
    expect(result.reason).toBe("claimed");
  });

  it("should reject claim if target not reached", async () => {
    (mockDb as any)._mockData.progress.push({
      user_id: userId,
      quest_key: questKey,
      accumulated_seconds: 20 * 60, // Only 20 minutes
      today_seconds: 20 * 60,
      last_ping_at: new Date().toISOString(),
      ping_token: "token-123",
      grace_until: null,
      grace_offer_id: null,
      credited_at: null,
    });

    const result = await claimActiveTimeReward(mockDb, userId, questKey);

    expect(result.success).toBe(false);
    expect(result.reason).toBe("target_not_reached");
  });

  it("should reject double claim", async () => {
    (mockDb as any)._mockData.progress.push({
      user_id: userId,
      quest_key: questKey,
      accumulated_seconds: 30 * 60,
      today_seconds: 30 * 60,
      last_ping_at: new Date().toISOString(),
      ping_token: "token-123",
      grace_until: null,
      grace_offer_id: null,
      credited_at: new Date().toISOString(), // Already claimed
    });

    const result = await claimActiveTimeReward(mockDb, userId, questKey);

    expect(result.success).toBe(false);
    expect(result.reason).toBe("already_claimed");
  });
});
