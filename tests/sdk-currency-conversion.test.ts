import { describe, expect, it } from "vitest";
import { convertSdkCurrency } from "../src/lib/sdk-offerwall/types";

describe("convertSdkCurrency - 4-decimal precision", () => {
  it("BitcoTasks: 4 coins @ 1000/USD with floor mode → $0.004", () => {
    const result = convertSdkCurrency(
      {
        currency_per_usd: 1000,
        reward_multiplier: 1,
        min_reward: 0,
        max_reward: null,
        rounding_mode: "floor",
      },
      4,
    );
    expect(result).toBe(0.004);
  });

  it("TimeWall: 0.0025 USD @ 1/USD with x0.8 multiplier → $0.002", () => {
    const result = convertSdkCurrency(
      {
        currency_per_usd: 1,
        reward_multiplier: 0.8,
        min_reward: 0,
        max_reward: null,
        rounding_mode: "nearest",
      },
      0.0025,
    );
    expect(result).toBe(0.002);
  });

  it("CPX Research: 2.10 @ 1/USD with x0.8 multiplier → $1.68", () => {
    const result = convertSdkCurrency(
      {
        currency_per_usd: 1,
        reward_multiplier: 0.8,
        min_reward: 0,
        max_reward: null,
        rounding_mode: "nearest",
      },
      2.1,
    );
    expect(result).toBe(1.68);
  });

  it("floor mode: 1.0049 rounds down to 1.0049 (no truncation)", () => {
    const result = convertSdkCurrency(
      {
        currency_per_usd: 1,
        reward_multiplier: 1,
        min_reward: 0,
        max_reward: null,
        rounding_mode: "floor",
      },
      1.0049,
    );
    expect(result).toBe(1.0049);
  });

  it("floor mode: 1.00499 rounds down to 1.0049", () => {
    const result = convertSdkCurrency(
      {
        currency_per_usd: 1,
        reward_multiplier: 1,
        min_reward: 0,
        max_reward: null,
        rounding_mode: "floor",
      },
      1.00499,
    );
    expect(result).toBe(1.0049);
  });

  it("ceil mode: 1.0041 rounds up to 1.0041 (no change)", () => {
    const result = convertSdkCurrency(
      {
        currency_per_usd: 1,
        reward_multiplier: 1,
        min_reward: 0,
        max_reward: null,
        rounding_mode: "ceil",
      },
      1.0041,
    );
    expect(result).toBe(1.0041);
  });

  it("ceil mode: 1.00401 rounds up to 1.0041", () => {
    const result = convertSdkCurrency(
      {
        currency_per_usd: 1,
        reward_multiplier: 1,
        min_reward: 0,
        max_reward: null,
        rounding_mode: "ceil",
      },
      1.00401,
    );
    expect(result).toBe(1.0041);
  });

  it("nearest mode: 0.00445 rounds to 0.0045 (up)", () => {
    const result = convertSdkCurrency(
      {
        currency_per_usd: 1,
        reward_multiplier: 1,
        min_reward: 0,
        max_reward: null,
        rounding_mode: "nearest",
      },
      0.00445,
    );
    expect(result).toBe(0.0045);
  });

  it("nearest mode: 0.00444 rounds to 0.0044 (down)", () => {
    const result = convertSdkCurrency(
      {
        currency_per_usd: 1,
        reward_multiplier: 1,
        min_reward: 0,
        max_reward: null,
        rounding_mode: "nearest",
      },
      0.00444,
    );
    expect(result).toBe(0.0044);
  });

  it("min_reward clamp: 0.003 with min 0.01 → $0.01", () => {
    const result = convertSdkCurrency(
      {
        currency_per_usd: 1,
        reward_multiplier: 1,
        min_reward: 0.01,
        max_reward: null,
        rounding_mode: "nearest",
      },
      0.003,
    );
    expect(result).toBe(0.01);
  });

  it("max_reward clamp: 10.00 with max 5.00 → $5.00", () => {
    const result = convertSdkCurrency(
      {
        currency_per_usd: 1,
        reward_multiplier: 1,
        min_reward: 0,
        max_reward: 5.0,
        rounding_mode: "nearest",
      },
      10.0,
    );
    expect(result).toBe(5.0);
  });

  it("negative input → $0.00", () => {
    const result = convertSdkCurrency(
      {
        currency_per_usd: 1,
        reward_multiplier: 1,
        min_reward: 0,
        max_reward: null,
        rounding_mode: "nearest",
      },
      -1.5,
    );
    expect(result).toBe(0);
  });

  it("zero input → $0.00", () => {
    const result = convertSdkCurrency(
      {
        currency_per_usd: 1,
        reward_multiplier: 1,
        min_reward: 0,
        max_reward: null,
        rounding_mode: "nearest",
      },
      0,
    );
    expect(result).toBe(0);
  });

  it("complex calculation maintains 4 decimals: 7 coins @ 1000/USD with x0.8 → $0.0056", () => {
    const result = convertSdkCurrency(
      {
        currency_per_usd: 1000,
        reward_multiplier: 0.8,
        min_reward: 0,
        max_reward: null,
        rounding_mode: "nearest",
      },
      7,
    );
    expect(result).toBe(0.0056);
  });

  it("ensures no cent rounding: 0.0099 stays 0.0099, not 0.01", () => {
    const result = convertSdkCurrency(
      {
        currency_per_usd: 1,
        reward_multiplier: 1,
        min_reward: 0,
        max_reward: null,
        rounding_mode: "nearest",
      },
      0.0099,
    );
    expect(result).toBe(0.0099);
  });

  it("very small amounts: 0.0001 → $0.0001", () => {
    const result = convertSdkCurrency(
      {
        currency_per_usd: 1,
        reward_multiplier: 1,
        min_reward: 0,
        max_reward: null,
        rounding_mode: "nearest",
      },
      0.0001,
    );
    expect(result).toBe(0.0001);
  });

  it("sub-0.0001 amounts round correctly: 0.00009 → $0.0001", () => {
    const result = convertSdkCurrency(
      {
        currency_per_usd: 1,
        reward_multiplier: 1,
        min_reward: 0,
        max_reward: null,
        rounding_mode: "nearest",
      },
      0.00009,
    );
    expect(result).toBe(0.0001);
  });

  it("sub-0.0001 amounts round down: 0.000049 → $0.0000", () => {
    const result = convertSdkCurrency(
      {
        currency_per_usd: 1,
        reward_multiplier: 1,
        min_reward: 0,
        max_reward: null,
        rounding_mode: "nearest",
      },
      0.000049,
    );
    expect(result).toBe(0);
  });
});
