/**
 * Test Torox adapter with no context (admin sync scenario).
 * Verifies that fetchOffers works when context is undefined.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { toroxAdapter } from "../src/lib/offers/adapters/torox.server";
import type { OfferProvider } from "../src/lib/offers/provider-types";

describe("Torox Adapter - No Context (Admin Sync)", () => {
  const mockProvider: OfferProvider = {
    id: "test-provider-id",
    slug: "torox",
    name: "Torox",
    provider_type: "cpa",
    enabled: true,
    status: "live",
    sync_config: {},
    currency_per_usd: 1,
    extra_config: {},
    secret_refs: {},
  };

  let originalEnv: Record<string, string | undefined>;

  beforeEach(() => {
    // Save original env
    originalEnv = {
      TOROX_FEED_SOURCE_ID: process.env.TOROX_FEED_SOURCE_ID,
      TOROX_FEED_TOKEN: process.env.TOROX_FEED_TOKEN,
      TOROX_API_BASE: process.env.TOROX_API_BASE,
    };

    // Set test env vars
    process.env.TOROX_FEED_SOURCE_ID = "test-source-id";
    process.env.TOROX_FEED_TOKEN = "test-token";
    process.env.TOROX_API_BASE = "https://api.wall.torox.io";
  });

  afterEach(() => {
    // Restore original env
    Object.assign(process.env, originalEnv);
    vi.restoreAllMocks();
  });

  it("should not throw when context is undefined (admin sync)", async () => {
    // Mock successful API response with campaigns
    const mockCampaigns = [
      {
        id: "campaign-1",
        name: "Test Campaign 1",
        description: "Test description",
        payout: "2.50",
        countries: ["US", "IN"],
        devices: ["android", "ios"],
      },
      {
        campaign_id: "campaign-2",
        title: "Test Campaign 2",
        desc: "Another test",
        amount: 3.00,
        geo: ["ALL"],
        os: ["web"],
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ campaigns: mockCampaigns }),
    } as Response);

    // Call fetchOffers with NO context (admin sync scenario)
    const offers = await toroxAdapter.fetchOffers(mockProvider, undefined);

    // Should return all campaigns without filtering by country
    expect(offers).toHaveLength(2);
    expect(offers[0].externalOfferId).toBe("campaign-1");
    expect(offers[0].title).toBe("Test Campaign 1");
    expect(offers[0].networkPayout).toBe(2.50);
    expect(offers[0].countries).toEqual(["US", "IN"]);
    
    expect(offers[1].externalOfferId).toBe("campaign-2");
    expect(offers[1].title).toBe("Test Campaign 2");
    expect(offers[1].networkPayout).toBe(3.00);
    expect(offers[1].countries).toEqual(["ALL"]);
  });

  it("should return full catalog when context is undefined (no geo filtering)", async () => {
    const mockCampaigns = [
      {
        id: "us-only",
        name: "US Only Campaign",
        payout: 1.00,
        countries: ["US"],
      },
      {
        id: "in-only",
        name: "India Only Campaign",
        payout: 2.00,
        countries: ["IN"],
      },
      {
        id: "uk-only",
        name: "UK Only Campaign",
        payout: 3.00,
        countries: ["GB"],
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ campaigns: mockCampaigns }),
    } as Response);

    // Call with undefined context (admin sync)
    const offers = await toroxAdapter.fetchOffers(mockProvider, undefined);

    // Should return ALL campaigns, no geo filtering
    expect(offers).toHaveLength(3);
    expect(offers.map((o) => o.externalOfferId)).toEqual(["us-only", "in-only", "uk-only"]);
  });

  it("should filter by country when context is provided", async () => {
    const mockCampaigns = [
      {
        id: "us-only",
        name: "US Only Campaign",
        payout: 1.00,
        countries: ["US"],
      },
      {
        id: "in-only",
        name: "India Only Campaign",
        payout: 2.00,
        countries: ["IN"],
      },
      {
        id: "all-countries",
        name: "Global Campaign",
        payout: 3.00,
        countries: ["ALL"],
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ campaigns: mockCampaigns }),
    } as Response);

    // Call with context (user request)
    const offers = await toroxAdapter.fetchOffers(mockProvider, {
      country: "IN",
      ip: "203.0.113.1",
    });

    // Should return only IN and ALL campaigns
    expect(offers).toHaveLength(2);
    expect(offers.map((o) => o.externalOfferId)).toEqual(["in-only", "all-countries"]);
  });

  it("should handle API response as array (no campaigns wrapper)", async () => {
    const mockCampaigns = [
      {
        id: "direct-array",
        name: "Direct Array Campaign",
        payout: 5.00,
      },
    ];

    // Response is array directly, not wrapped in { campaigns: [...] }
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockCampaigns),
    } as Response);

    const offers = await toroxAdapter.fetchOffers(mockProvider, undefined);

    expect(offers).toHaveLength(1);
    expect(offers[0].externalOfferId).toBe("direct-array");
  });

  it("should validate config correctly", () => {
    // Valid config
    const valid = toroxAdapter.validateConfig({});
    expect(valid).toBeNull();

    // Missing SOURCE_ID
    delete process.env.TOROX_FEED_SOURCE_ID;
    const missingSourceId = toroxAdapter.validateConfig({});
    expect(missingSourceId).toContain("TOROX_FEED_SOURCE_ID");

    // Restore and remove TOKEN
    process.env.TOROX_FEED_SOURCE_ID = "test-source-id";
    delete process.env.TOROX_FEED_TOKEN;
    const missingToken = toroxAdapter.validateConfig({});
    expect(missingToken).toContain("TOROX_FEED_TOKEN");
  });

  it("should handle empty campaigns list", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ campaigns: [] }),
    } as Response);

    await expect(
      toroxAdapter.fetchOffers(mockProvider, undefined)
    ).rejects.toThrow("no recognizable campaigns");
  });

  it("should handle 401 authentication error", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    } as Response);

    await expect(
      toroxAdapter.fetchOffers(mockProvider, undefined)
    ).rejects.toThrow("authentication failed");
  });

  it("should handle network timeout", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network timeout"));

    await expect(
      toroxAdapter.fetchOffers(mockProvider, undefined)
    ).rejects.toThrow("Network timeout");
  });

  it("should use context?.country pattern safely", async () => {
    const mockCampaigns = [
      {
        id: "test",
        name: "Test",
        payout: 1.00,
        countries: ["US"],
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ campaigns: mockCampaigns }),
    } as Response);

    // Test 1: context is undefined (should not throw "Cannot read properties of undefined")
    await expect(
      toroxAdapter.fetchOffers(mockProvider, undefined)
    ).resolves.not.toThrow();

    // Test 2: context is defined but country is undefined
    await expect(
      toroxAdapter.fetchOffers(mockProvider, { ip: "1.2.3.4" } as any)
    ).resolves.not.toThrow();

    // Test 3: context and country are both defined
    await expect(
      toroxAdapter.fetchOffers(mockProvider, { country: "US", ip: "1.2.3.4" })
    ).resolves.not.toThrow();
  });
});
