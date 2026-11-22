import { describe, expect, it } from "vitest";
import { formatEarningAmount, computeTaskProgress } from "../src/routes/_authenticated/special";

describe("formatEarningAmount", () => {
  it("formats amounts >= $0.01 with 2 decimals", () => {
    expect(formatEarningAmount(0.01)).toBe("$0.01");
    expect(formatEarningAmount(0.10)).toBe("$0.10");
    expect(formatEarningAmount(1.00)).toBe("$1.00");
    expect(formatEarningAmount(2.50)).toBe("$2.50");
  });

  it("formats sub-cent amounts with up to 4 decimals, no trailing zeros", () => {
    expect(formatEarningAmount(0.004)).toBe("$0.004");
    expect(formatEarningAmount(0.0025)).toBe("$0.0025");
    expect(formatEarningAmount(0.001)).toBe("$0.001");
    expect(formatEarningAmount(0.0001)).toBe("$0.0001");
  });

  it("removes trailing zeros for sub-cent amounts", () => {
    expect(formatEarningAmount(0.0010)).toBe("$0.001");
    expect(formatEarningAmount(0.0050)).toBe("$0.005");
    expect(formatEarningAmount(0.0020)).toBe("$0.002");
  });

  it("handles edge cases", () => {
    expect(formatEarningAmount(0)).toBe("$0");
    expect(formatEarningAmount(0.009)).toBe("$0.009");
    expect(formatEarningAmount(0.0099)).toBe("$0.0099");
  });
});

describe("computeTaskProgress", () => {
  describe("offerwall_earning tasks", () => {
    it("uses earning_target for offerwall_earning tasks", () => {
      const result = computeTaskProgress(0.01, 1, "offerwall_earning", 0.10);
      expect(result.progress).toBe(0.01);
      expect(result.target).toBe(0.10);
      expect(result.percentage).toBe(10);
    });

    it("calculates correct percentage: 0.01 / 0.10 = 10%", () => {
      const result = computeTaskProgress(0.01, 1, "offerwall_earning", 0.10);
      expect(result.percentage).toBe(10);
    });

    it("calculates correct percentage: 0.004 / 0.10 = 4%", () => {
      const result = computeTaskProgress(0.004, 1, "offerwall_earning", 0.10);
      expect(result.percentage).toBe(4);
    });

    it("calculates correct percentage: 0.5 / 1.00 = 50%", () => {
      const result = computeTaskProgress(0.5, 1, "offerwall_earning", 1.0);
      expect(result.percentage).toBe(50);
    });

    it("caps percentage at 100% when progress exceeds target", () => {
      const result = computeTaskProgress(0.15, 1, "offerwall_earning", 0.10);
      expect(result.percentage).toBe(100);
    });

    it("handles sub-cent progress correctly", () => {
      const result = computeTaskProgress(0.0025, 1, "offerwall_earning", 0.10);
      expect(result.progress).toBe(0.0025);
      expect(result.target).toBe(0.10);
      expect(result.percentage).toBe(2.5);
    });

    it("converts progress and target with Number()", () => {
      const result = computeTaskProgress("0.01" as any, "1" as any, "offerwall_earning", "0.10" as any);
      expect(result.progress).toBe(0.01);
      expect(result.target).toBe(0.10);
      expect(result.percentage).toBe(10);
    });
  });

  describe("non-earning tasks", () => {
    it("uses provided target for referral tasks", () => {
      const result = computeTaskProgress(3, 5, "referral", null);
      expect(result.progress).toBe(3);
      expect(result.target).toBe(5);
      expect(result.percentage).toBe(60);
    });

    it("uses provided target for shortlink tasks", () => {
      const result = computeTaskProgress(7, 10, "shortlink", null);
      expect(result.progress).toBe(7);
      expect(result.target).toBe(10);
      expect(result.percentage).toBe(70);
    });

    it("ignores earning_target when task_type is not offerwall_earning", () => {
      const result = computeTaskProgress(2, 5, "referral", 0.10);
      expect(result.progress).toBe(2);
      expect(result.target).toBe(5);
      expect(result.percentage).toBe(40);
    });

    it("uses provided target when earning_target is null", () => {
      const result = computeTaskProgress(0.5, 1, "offerwall_earning", null);
      expect(result.progress).toBe(0.5);
      expect(result.target).toBe(1);
      expect(result.percentage).toBe(50);
    });

    it("handles manual tasks", () => {
      const result = computeTaskProgress(0, 1, "manual", null);
      expect(result.progress).toBe(0);
      expect(result.target).toBe(1);
      expect(result.percentage).toBe(0);
    });

    it("converts values with Number()", () => {
      const result = computeTaskProgress("3" as any, "5" as any, "referral", null);
      expect(result.progress).toBe(3);
      expect(result.target).toBe(5);
      expect(result.percentage).toBe(60);
    });

    it("caps percentage at 100%", () => {
      const result = computeTaskProgress(6, 5, "shortlink", null);
      expect(result.percentage).toBe(100);
    });
  });

  describe("edge cases", () => {
    it("handles zero progress", () => {
      const result = computeTaskProgress(0, 1, "offerwall_earning", 0.10);
      expect(result.progress).toBe(0);
      expect(result.target).toBe(0.10);
      expect(result.percentage).toBe(0);
    });

    it("handles exact completion", () => {
      const result = computeTaskProgress(0.10, 1, "offerwall_earning", 0.10);
      expect(result.progress).toBe(0.10);
      expect(result.target).toBe(0.10);
      expect(result.percentage).toBe(100);
    });

    it("handles very small progress values", () => {
      const result = computeTaskProgress(0.0001, 1, "offerwall_earning", 0.10);
      expect(result.progress).toBe(0.0001);
      expect(result.target).toBe(0.10);
      expect(result.percentage).toBe(0.1);
    });
  });
});
