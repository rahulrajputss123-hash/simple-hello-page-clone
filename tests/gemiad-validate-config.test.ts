import { describe, it, expect } from "vitest";
import { gemiAdAdapter } from "@/lib/offers/adapters/gemiad.server";

describe("GemiAd validateConfig", () => {
  it("should return error when config is empty", () => {
    const result = gemiAdAdapter.validateConfig?.({});
    expect(result).toBe("GemiAd placement_id is not configured in sync_config.");
  });

  it("should return error when only placement_id is provided", () => {
    const result = gemiAdAdapter.validateConfig?.({
      placement_id: "test-placement-123",
    });
    expect(result).toBe("GemiAd api_key is not configured in sync_config.");
  });

  it("should return null when both placement_id and api_key are provided", () => {
    const result = gemiAdAdapter.validateConfig?.({
      placement_id: "test-placement-123",
      api_key: "test-api-key-456",
    });
    expect(result).toBeNull();
  });

  it("should return error when placement_id is empty string", () => {
    const result = gemiAdAdapter.validateConfig?.({
      placement_id: "",
      api_key: "test-api-key-456",
    });
    expect(result).toBe("GemiAd placement_id is not configured in sync_config.");
  });

  it("should return error when api_key is empty string", () => {
    const result = gemiAdAdapter.validateConfig?.({
      placement_id: "test-placement-123",
      api_key: "",
    });
    expect(result).toBe("GemiAd api_key is not configured in sync_config.");
  });

  it("should return error when placement_id is whitespace only", () => {
    const result = gemiAdAdapter.validateConfig?.({
      placement_id: "   ",
      api_key: "test-api-key-456",
    });
    expect(result).toBe("GemiAd placement_id is not configured in sync_config.");
  });

  it("should return error when api_key is whitespace only", () => {
    const result = gemiAdAdapter.validateConfig?.({
      placement_id: "test-placement-123",
      api_key: "   ",
    });
    expect(result).toBe("GemiAd api_key is not configured in sync_config.");
  });

  it("should trim whitespace from valid values", () => {
    const result = gemiAdAdapter.validateConfig?.({
      placement_id: "  test-placement-123  ",
      api_key: "  test-api-key-456  ",
    });
    expect(result).toBeNull();
  });
});
