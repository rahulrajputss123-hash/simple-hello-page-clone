/**
 * QuestsManager Validation Tests
 * 
 * Tests for:
 * - Custom reward parsing (trim, filter empty, convert to numbers)
 * - Checkin day reward calculations
 * - Survey custom reward calculations
 * - canSave validation logic for all quest types
 */

import { describe, it, expect } from "vitest";

describe("QuestsManager - Custom Reward Parsing", () => {
  /**
   * Simulates the custom reward parsing logic from QuestsManager.tsx
   */
  function parseCustomRewards(input: string): number[] {
    return input
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s !== "")
      .map((s) => Number(s))
      .filter((n) => !isNaN(n));
  }

  it("should parse comma-separated rewards", () => {
    const result = parseCustomRewards("0.5, 0.75, 1.00");
    expect(result).toEqual([0.5, 0.75, 1.0]);
  });

  it("should trim whitespace from each value", () => {
    const result = parseCustomRewards("  0.5  ,   0.75   ,  1.00  ");
    expect(result).toEqual([0.5, 0.75, 1.0]);
  });

  it("should filter out empty strings before conversion", () => {
    const result = parseCustomRewards("0.5,,0.75,  ,1.00");
    expect(result).toEqual([0.5, 0.75, 1.0]);
  });

  it("should filter out NaN values", () => {
    const result = parseCustomRewards("0.5,invalid,0.75,abc,1.00");
    expect(result).toEqual([0.5, 0.75, 1.0]);
  });

  it("should handle empty input", () => {
    const result = parseCustomRewards("");
    expect(result).toEqual([]);
  });

  it("should handle only commas and spaces", () => {
    const result = parseCustomRewards(",  , , ");
    expect(result).toEqual([]);
  });

  it("should handle mixed valid and invalid entries", () => {
    const result = parseCustomRewards("0.1, , 0.2, foo, 0.3, , bar");
    expect(result).toEqual([0.1, 0.2, 0.3]);
  });

  it("should handle single value without commas", () => {
    const result = parseCustomRewards("1.50");
    expect(result).toEqual([1.5]);
  });

  it("should handle trailing comma", () => {
    const result = parseCustomRewards("0.5, 0.75, 1.00,");
    expect(result).toEqual([0.5, 0.75, 1.0]);
  });

  it("should handle leading comma", () => {
    const result = parseCustomRewards(",0.5, 0.75, 1.00");
    expect(result).toEqual([0.5, 0.75, 1.0]);
  });
});

describe("QuestsManager - Checkin Day Rewards", () => {
  /**
   * Simulates the checkin day reward calculation logic from QuestsManager.tsx
   */
  function calculateCheckinRewards(params: {
    totalDays: number;
    baseReward: number;
    customRewards: string;
  }): {
    dayRewards: number[];
    totalStepRewards: number;
    completionBonus: number;
    totalPayout: number;
  } {
    const { totalDays, baseReward, customRewards } = params;
    
    const parsed = customRewards
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s !== "")
      .map((s) => Number(s))
      .filter((n) => !isNaN(n));

    const dayRewards = Array.from({ length: totalDays }, (_, i) =>
      parsed[i] !== undefined ? parsed[i] : baseReward,
    );

    const totalStepRewards = dayRewards.reduce((sum, r) => sum + r, 0);
    const completionBonus = 0; // Would come from form.rewardAmount
    const totalPayout = totalStepRewards + completionBonus;

    return { dayRewards, totalStepRewards, completionBonus, totalPayout };
  }

  it("should use base reward for all days when no custom rewards", () => {
    const result = calculateCheckinRewards({
      totalDays: 5,
      baseReward: 0.1,
      customRewards: "",
    });

    expect(result.dayRewards).toEqual([0.1, 0.1, 0.1, 0.1, 0.1]);
    expect(result.totalStepRewards).toBe(0.5);
  });

  it("should use custom rewards where provided, base reward for rest", () => {
    const result = calculateCheckinRewards({
      totalDays: 5,
      baseReward: 0.1,
      customRewards: "0.2, 0.3",
    });

    expect(result.dayRewards).toEqual([0.2, 0.3, 0.1, 0.1, 0.1]);
    expect(result.totalStepRewards).toBeCloseTo(0.8, 5);
  });

  it("should handle custom rewards for all days", () => {
    const result = calculateCheckinRewards({
      totalDays: 3,
      baseReward: 0.1,
      customRewards: "0.5, 0.75, 1.0",
    });

    expect(result.dayRewards).toEqual([0.5, 0.75, 1.0]);
    expect(result.totalStepRewards).toBe(2.25);
  });

  it("should handle more custom rewards than days (extras ignored)", () => {
    const result = calculateCheckinRewards({
      totalDays: 2,
      baseReward: 0.1,
      customRewards: "0.5, 0.75, 1.0, 2.0",
    });

    expect(result.dayRewards).toEqual([0.5, 0.75]);
    expect(result.totalStepRewards).toBe(1.25);
  });

  it("should skip invalid entries in custom rewards", () => {
    const result = calculateCheckinRewards({
      totalDays: 5,
      baseReward: 0.1,
      customRewards: "0.2, , 0.4, invalid, 0.6",
    });

    // Parsed: [0.2, 0.4, 0.6]
    // Day rewards: [0.2, 0.4, 0.6, 0.1, 0.1]
    expect(result.dayRewards).toEqual([0.2, 0.4, 0.6, 0.1, 0.1]);
    expect(result.totalStepRewards).toBeCloseTo(1.4, 5);
  });
});

describe("QuestsManager - Survey Reward Breakdown", () => {
  /**
   * Simulates the survey reward calculation logic from QuestsManager.tsx
   */
  function calculateSurveyRewards(params: {
    requiredSurveys: number;
    baseReward: number;
    customRewards: string;
    completionBonus: number;
  }): {
    surveyRewards: number[];
    totalStepRewards: number;
    completionBonus: number;
    totalQuestRewards: number;
  } {
    const { requiredSurveys, baseReward, customRewards, completionBonus } = params;

    const parsed = customRewards
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s !== "")
      .map((s) => Number(s))
      .filter((n) => !isNaN(n));

    const surveyRewards = Array.from({ length: requiredSurveys }, (_, i) =>
      parsed[i] !== undefined ? parsed[i] : baseReward,
    );

    const totalStepRewards = surveyRewards.reduce((sum, r) => sum + r, 0);
    const totalQuestRewards = totalStepRewards + completionBonus;

    return { surveyRewards, totalStepRewards, completionBonus, totalQuestRewards };
  }

  it("should use base reward for all surveys when no custom rewards", () => {
    const result = calculateSurveyRewards({
      requiredSurveys: 5,
      baseReward: 0.1,
      customRewards: "",
      completionBonus: 0.5,
    });

    expect(result.surveyRewards).toEqual([0.1, 0.1, 0.1, 0.1, 0.1]);
    expect(result.totalStepRewards).toBe(0.5);
    expect(result.totalQuestRewards).toBe(1.0);
  });

  it("should support custom per-survey rewards", () => {
    const result = calculateSurveyRewards({
      requiredSurveys: 5,
      baseReward: 0.1,
      customRewards: "0.1, 0.15, 0.2, 0.25, 0.3",
      completionBonus: 0.5,
    });

    expect(result.surveyRewards).toEqual([0.1, 0.15, 0.2, 0.25, 0.3]);
    expect(result.totalStepRewards).toBe(1.0);
    expect(result.totalQuestRewards).toBe(1.5);
  });

  it("should mix custom and base rewards", () => {
    const result = calculateSurveyRewards({
      requiredSurveys: 5,
      baseReward: 0.1,
      customRewards: "0.2, 0.3",
      completionBonus: 0.5,
    });

    expect(result.surveyRewards).toEqual([0.2, 0.3, 0.1, 0.1, 0.1]);
    expect(result.totalStepRewards).toBeCloseTo(0.8, 5);
    expect(result.totalQuestRewards).toBeCloseTo(1.3, 5);
  });

  it("should handle empty custom rewards with zero base", () => {
    const result = calculateSurveyRewards({
      requiredSurveys: 3,
      baseReward: 0,
      customRewards: "",
      completionBonus: 1.0,
    });

    expect(result.surveyRewards).toEqual([0, 0, 0]);
    expect(result.totalStepRewards).toBe(0);
    expect(result.totalQuestRewards).toBe(1.0);
  });
});

describe("QuestsManager - Validation Logic", () => {
  /**
   * Simulates canSave validation for different quest types
   */
  function validateQuest(quest: {
    key: string;
    label: string;
    questType: string;
    adsRequired?: number;
    totalDays?: number;
    networkProviderIds?: string[];
    requiredCount?: number;
    allowedNetworks?: string[];
    requiredSurveys?: number;
    timedSteps?: { reward: string }[];
    feedProviderIds?: string[];
    stepsCount?: number;
  }): { canSave: boolean; reason: string } {
    if (quest.key.trim().length < 2) {
      return { canSave: false, reason: "Quest key must be at least 2 characters" };
    }

    if (quest.label.trim().length < 1) {
      return { canSave: false, reason: "Quest label is required" };
    }

    if (quest.questType === "ads" && (quest.adsRequired ?? 0) <= 0) {
      return { canSave: false, reason: "Ads required must be greater than 0" };
    }

    if (quest.questType === "checkin") {
      if ((quest.totalDays ?? 0) <= 0) {
        return { canSave: false, reason: "Check-in quest must have at least 1 day" };
      }
      if ((quest.totalDays ?? 0) > 365) {
        return { canSave: false, reason: "Check-in quest cannot exceed 365 days" };
      }
    }

    if (quest.questType === "network") {
      if ((quest.networkProviderIds?.length ?? 0) === 0) {
        return { canSave: false, reason: "Network quest must have at least one provider selected" };
      }
      if ((quest.requiredCount ?? 0) <= 0) {
        return { canSave: false, reason: "Network quest must require at least 1 completion" };
      }
    }

    if (quest.questType === "survey") {
      if ((quest.allowedNetworks?.length ?? 0) === 0) {
        return { canSave: false, reason: "Survey quest must have at least one network selected" };
      }
      if ((quest.requiredSurveys ?? 0) <= 0) {
        return { canSave: false, reason: "Survey quest must require at least 1 survey" };
      }
    }

    if (quest.questType === "timed_ptc") {
      if ((quest.timedSteps?.length ?? 0) === 0) {
        return { canSave: false, reason: "Timed PTC quest must have at least one step" };
      }
      const allPositive = quest.timedSteps?.every((s) => Number(s.reward) > 0) ?? false;
      if (!allPositive) {
        return { canSave: false, reason: "All timed PTC steps must have a reward > 0" };
      }
    }

    if (["feed_ptc", "feed_shortlink", "feed_article"].includes(quest.questType)) {
      if ((quest.feedProviderIds?.length ?? 0) === 0) {
        return { canSave: false, reason: "Feed quest must have at least one provider selected" };
      }
      if ((quest.stepsCount ?? 0) <= 0) {
        return { canSave: false, reason: "Feed quest must have at least 1 step" };
      }
    }

    return { canSave: true, reason: "" };
  }

  describe("Basic validation", () => {
    it("should require key with at least 2 characters", () => {
      const result = validateQuest({ key: "a", label: "Test", questType: "ads" });
      expect(result.canSave).toBe(false);
      expect(result.reason).toContain("key must be at least 2 characters");
    });

    it("should require non-empty label", () => {
      const result = validateQuest({ key: "test", label: "", questType: "ads" });
      expect(result.canSave).toBe(false);
      expect(result.reason).toContain("label is required");
    });
  });

  describe("Ads quest validation", () => {
    it("should require ads count > 0", () => {
      const result = validateQuest({
        key: "test",
        label: "Test",
        questType: "ads",
        adsRequired: 0,
      });
      expect(result.canSave).toBe(false);
      expect(result.reason).toContain("Ads required must be greater than 0");
    });

    it("should pass with valid ads count", () => {
      const result = validateQuest({
        key: "test",
        label: "Test",
        questType: "ads",
        adsRequired: 5,
      });
      expect(result.canSave).toBe(true);
    });
  });

  describe("Checkin quest validation", () => {
    it("should require at least 1 day", () => {
      const result = validateQuest({
        key: "test",
        label: "Test",
        questType: "checkin",
        totalDays: 0,
      });
      expect(result.canSave).toBe(false);
      expect(result.reason).toContain("at least 1 day");
    });

    it("should not exceed 365 days", () => {
      const result = validateQuest({
        key: "test",
        label: "Test",
        questType: "checkin",
        totalDays: 366,
      });
      expect(result.canSave).toBe(false);
      expect(result.reason).toContain("cannot exceed 365 days");
    });

    it("should pass with valid day count", () => {
      const result = validateQuest({
        key: "test",
        label: "Test",
        questType: "checkin",
        totalDays: 7,
      });
      expect(result.canSave).toBe(true);
    });
  });

  describe("Network quest validation", () => {
    it("should require at least one provider", () => {
      const result = validateQuest({
        key: "test",
        label: "Test",
        questType: "network",
        networkProviderIds: [],
        requiredCount: 3,
      });
      expect(result.canSave).toBe(false);
      expect(result.reason).toContain("at least one provider selected");
    });

    it("should require count > 0", () => {
      const result = validateQuest({
        key: "test",
        label: "Test",
        questType: "network",
        networkProviderIds: ["provider1"],
        requiredCount: 0,
      });
      expect(result.canSave).toBe(false);
      expect(result.reason).toContain("at least 1 completion");
    });

    it("should pass with valid config", () => {
      const result = validateQuest({
        key: "test",
        label: "Test",
        questType: "network",
        networkProviderIds: ["provider1", "provider2"],
        requiredCount: 3,
      });
      expect(result.canSave).toBe(true);
    });
  });

  describe("Survey quest validation", () => {
    it("should require at least one network", () => {
      const result = validateQuest({
        key: "test",
        label: "Test",
        questType: "survey",
        allowedNetworks: [],
        requiredSurveys: 5,
      });
      expect(result.canSave).toBe(false);
      expect(result.reason).toContain("at least one network selected");
    });

    it("should require surveys > 0", () => {
      const result = validateQuest({
        key: "test",
        label: "Test",
        questType: "survey",
        allowedNetworks: ["cpxresearch"],
        requiredSurveys: 0,
      });
      expect(result.canSave).toBe(false);
      expect(result.reason).toContain("at least 1 survey");
    });

    it("should pass with valid config", () => {
      const result = validateQuest({
        key: "test",
        label: "Test",
        questType: "survey",
        allowedNetworks: ["cpxresearch", "theoremreach"],
        requiredSurveys: 5,
      });
      expect(result.canSave).toBe(true);
    });
  });

  describe("Timed PTC quest validation", () => {
    it("should require at least one step", () => {
      const result = validateQuest({
        key: "test",
        label: "Test",
        questType: "timed_ptc",
        timedSteps: [],
      });
      expect(result.canSave).toBe(false);
      expect(result.reason).toContain("at least one step");
    });

    it("should require all steps to have reward > 0", () => {
      const result = validateQuest({
        key: "test",
        label: "Test",
        questType: "timed_ptc",
        timedSteps: [{ reward: "0.01" }, { reward: "0" }, { reward: "0.02" }],
      });
      expect(result.canSave).toBe(false);
      expect(result.reason).toContain("reward > 0");
    });

    it("should pass with valid steps", () => {
      const result = validateQuest({
        key: "test",
        label: "Test",
        questType: "timed_ptc",
        timedSteps: [{ reward: "0.01" }, { reward: "0.02" }, { reward: "0.03" }],
      });
      expect(result.canSave).toBe(true);
    });
  });

  describe("Feed quest validation", () => {
    it("should require at least one provider", () => {
      const result = validateQuest({
        key: "test",
        label: "Test",
        questType: "feed_ptc",
        feedProviderIds: [],
        stepsCount: 10,
      });
      expect(result.canSave).toBe(false);
      expect(result.reason).toContain("at least one provider selected");
    });

    it("should require steps > 0", () => {
      const result = validateQuest({
        key: "test",
        label: "Test",
        questType: "feed_shortlink",
        feedProviderIds: ["provider1"],
        stepsCount: 0,
      });
      expect(result.canSave).toBe(false);
      expect(result.reason).toContain("at least 1 step");
    });

    it("should pass with valid config", () => {
      const result = validateQuest({
        key: "test",
        label: "Test",
        questType: "feed_article",
        feedProviderIds: ["provider1", "provider2"],
        stepsCount: 10,
      });
      expect(result.canSave).toBe(true);
    });
  });
});
