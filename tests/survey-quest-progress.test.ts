import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Unit test for processSurveyQuestProgress bug fix.
 * 
 * Bug: Survey quests never progress because the embedded join
 * quest_sessions.select("*, quests!inner(...)") fails silently (no foreign key).
 * 
 * Fix: Use two separate queries - one for quest_sessions, one for quests.
 */

describe("processSurveyQuestProgress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should credit step reward for CPX survey completion", async () => {
    // Mock database responses
    const mockQuestSession = {
      id: "session-123",
      quest_key: "survey-daily-5",
      quest_type: "survey",
    };

    const mockQuest = {
      key: "survey-daily-5",
      quest_type: "survey",
      label: "Daily Survey Quest",
      required_surveys: 5,
      step_reward: 0.05,
      step_rewards: null,
      reward_amount: 0.50,
      allowed_networks: ["cpxresearch", "bitlabs", "theoremreach"],
      min_payout_usd: 0.01,
    };

    const mockProvider = {
      id: "provider-cpx",
      name: "CPX Research",
      slug: "cpxresearch",
    };

    // Mock Supabase client
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === "quest_sessions") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    data: [mockQuestSession],
                    error: null,
                  })),
                })),
              })),
            })),
          };
        }
        if (table === "quests") {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => ({
                data: [mockQuest],
                error: null,
              })),
            })),
          };
        }
        if (table === "quest_step_credits") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                contains: vi.fn(() => ({
                  maybeSingle: vi.fn(() => ({
                    data: null, // No existing credit (not a duplicate)
                    error: null,
                  })),
                })),
                order: vi.fn(() => ({
                  limit: vi.fn(() => ({
                    data: [], // No existing steps (first survey)
                    error: null,
                  })),
                })),
              })),
            })),
          };
        }
        return { select: vi.fn() };
      }),
    };

    // Mock creditStepReward
    const mockCreditStepReward = vi.fn().mockResolvedValue(0.05);

    // Mock logAutomation
    const mockLogAutomation = vi.fn().mockResolvedValue(undefined);

    // Mock imports
    vi.doMock("@/integrations/supabase/client.server", () => ({
      supabaseAdmin: mockSupabase,
    }));

    vi.doMock("../quests.server", () => ({
      creditStepReward: mockCreditStepReward,
    }));

    vi.doMock("./logs.server", () => ({
      logAutomation: mockLogAutomation,
    }));

    // Import the function AFTER mocks are set up
    const { processSurveyQuestProgress } = await import(
      "../src/lib/automation/postback.server"
    );

    // Execute the function with CPXResearch postback params
    await processSurveyQuestProgress({
      userId: "user-456",
      conversionId: "conversion-789",
      provider: mockProvider as never,
      transactionId: "cpx-tx-123",
      offerId: "cpx-survey-456",
      rewardUsd: 0.50,
    });

    // Verify quest_sessions query was called (without embedded join)
    expect(mockSupabase.from).toHaveBeenCalledWith("quest_sessions");

    // Verify quests query was called separately
    expect(mockSupabase.from).toHaveBeenCalledWith("quests");

    // Verify step reward was credited
    expect(mockCreditStepReward).toHaveBeenCalledWith(
      "user-456",
      "session-123",
      "survey-daily-5",
      "Daily Survey Quest",
      1, // First step
      0.05, // Step reward amount
      {
        survey_network: "cpxresearch",
        survey_id: "cpx-survey-456",
        conversion_id: "conversion-789",
      }
    );

    // Verify success was logged
    expect(mockLogAutomation).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "quest_automation",
        status: "success",
        message: expect.stringContaining("Survey quest step 1 completed"),
      })
    );
  });

  it("should log error when quest_sessions query fails", async () => {
    const mockProvider = {
      id: "provider-cpx",
      name: "CPX Research",
      slug: "cpxresearch",
    };

    // Mock Supabase with error response
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === "quest_sessions") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    data: null,
                    error: { message: "Database connection failed" },
                  })),
                })),
              })),
            })),
          };
        }
        return { select: vi.fn() };
      }),
    };

    const mockLogAutomation = vi.fn().mockResolvedValue(undefined);

    vi.doMock("@/integrations/supabase/client.server", () => ({
      supabaseAdmin: mockSupabase,
    }));

    vi.doMock("./logs.server", () => ({
      logAutomation: mockLogAutomation,
    }));

    const { processSurveyQuestProgress } = await import(
      "../src/lib/automation/postback.server"
    );

    await processSurveyQuestProgress({
      userId: "user-456",
      conversionId: "conversion-789",
      provider: mockProvider as never,
      transactionId: "cpx-tx-123",
      offerId: "cpx-survey-456",
      rewardUsd: 0.50,
    });

    // Verify error was logged
    expect(mockLogAutomation).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "quest_automation",
        status: "error",
        message: expect.stringContaining("failed to fetch sessions"),
      })
    );
  });

  it("should log error when quests query fails", async () => {
    const mockQuestSession = {
      id: "session-123",
      quest_key: "survey-daily-5",
      quest_type: "survey",
    };

    const mockProvider = {
      id: "provider-cpx",
      name: "CPX Research",
      slug: "cpxresearch",
    };

    // Mock Supabase with sessions success but quests error
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === "quest_sessions") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    data: [mockQuestSession],
                    error: null,
                  })),
                })),
              })),
            })),
          };
        }
        if (table === "quests") {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => ({
                data: null,
                error: { message: "Quest table read failed" },
              })),
            })),
          };
        }
        return { select: vi.fn() };
      }),
    };

    const mockLogAutomation = vi.fn().mockResolvedValue(undefined);

    vi.doMock("@/integrations/supabase/client.server", () => ({
      supabaseAdmin: mockSupabase,
    }));

    vi.doMock("./logs.server", () => ({
      logAutomation: mockLogAutomation,
    }));

    const { processSurveyQuestProgress } = await import(
      "../src/lib/automation/postback.server"
    );

    await processSurveyQuestProgress({
      userId: "user-456",
      conversionId: "conversion-789",
      provider: mockProvider as never,
      transactionId: "cpx-tx-123",
      offerId: "cpx-survey-456",
      rewardUsd: 0.50,
    });

    // Verify error was logged
    expect(mockLogAutomation).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "quest_automation",
        status: "error",
        message: expect.stringContaining("failed to fetch quests"),
      })
    );
  });
});
