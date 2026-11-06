import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { toroxAdapter } from "@/lib/offers/adapters/torox.server";
import type { OfferProvider } from "@/lib/offers/provider-types";

describe("Torox adapter with no context (admin sync)", () => {
  const mockProvider: OfferProvider = {
    id: "test-id",
    slug: "torox",
    name: "Torox",
    provider_type: "cpa",
    enabled: true,
    sync_config: {},
    default_revenue_share: 0.8,
    sync_status: "ok",
    sync_error: null,
    last_synced_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Store original env vars
  const originalEnv = {
    TOROX_FEED_SOURCE_ID: process.env.TOROX_FEED_SOURCE_ID,
    TOROX_FEED_TOKEN: process.env.TOROX_FEED_TOKEN,
  };

  beforeEach(() => {
    // Set test env vars
    process.env.TOROX_FEED_SOURCE_ID = "test-source-123";
    process.env.TOROX_FEED_TOKEN = "test-token-456";
  });

  afterEach(() => {
    // Restore original env vars
    process.env.TOROX_FEED_SOURCE_ID = originalEnv.TOROX_FEED_SOURCE_ID;
    process.env.TOROX_FEED_TOKEN = originalEnv.TOROX_FEED_TOKEN;
    vi.restoreAllMocks();
  });

  it("should not throw when context is undefined", async () => {
    // Mock fetch to return valid campaigns
    const mockCampaigns = [
      {
        id: "campaign-1",
        name: "Test Campaign 1",
        payout: 5.0,
        countries: ["US", "CA"],
        devices: ["android", "ios"],
        category: "app",
      },
      {
        id: "campaign-2",
        name: "Test Campaign 2",
        payout: 3.0,
        countries: ["GB"], // Should not be filtered when no context
        devices: ["web"],
        category: "signup",
      },
      {
        id: "campaign-3",
        name: "Test Campaign 3",
        payout: 2.5,
        countries: [], // Available everywhere
        devices: ["android"],
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ campaigns: mockCampaigns }),
      json: async () => ({ campaigns: mockCampaigns }),
    } as Response);

    // Call without context (admin sync path)
    const offers = await toroxAdapter.fetchOffers(mockProvider, undefined);

    // Should return all campaigns without geo filtering
    expect(offers).toHaveLength(3);
    expect(offers[0].externalOfferId).toBe("campaign-1");
    expect(offers[1].externalOfferId).toBe("campaign-2");
    expect(offers[2].externalOfferId).toBe("campaign-3");
    
    // All offers should have click URL sentinel
    expect(offers[0].clickUrl).toBe("torox://campaign/campaign-1");
    expect(offers[1].clickUrl).toBe("torox://campaign/campaign-2");
    expect(offers[2].clickUrl).toBe("torox://campaign/campaign-3");
  });

  it("should filter by country when context is provided", async () => {
    const mockCampaigns = [
      {
        id: "campaign-us",
        name: "US Only Campaign",
        payout: 5.0,
        countries: ["US"],
      },
      {
        id: "campaign-gb",
        name: "GB Only Campaign",
        payout: 3.0,
        countries: ["GB"],
      },
      {
        id: "campaign-all",
        name: "Worldwide Campaign",
        payout: 2.5,
        countries: ["ALL"],
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ campaigns: mockCampaigns }),
      json: async () => ({ campaigns: mockCampaigns }),
    } as Response);

    // Call with US context
    const offers = await toroxAdapter.fetchOffers(mockProvider, { country: "US", ip: "1.2.3.4" });

    // Should only return US and ALL campaigns
    expect(offers).toHaveLength(2);
    expect(offers[0].externalOfferId).toBe("campaign-us");
    expect(offers[1].externalOfferId).toBe("campaign-all");
  });

  it("should return full catalog when context has no country", async () => {
    const mockCampaigns = [
      {
        id: "campaign-1",
        name: "Campaign 1",
        payout: 5.0,
        countries: ["US"],
      },
      {
        id: "campaign-2",
        name: "Campaign 2",
        payout: 3.0,
        countries: ["GB"],
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ campaigns: mockCampaigns }),
      json: async () => ({ campaigns: mockCampaigns }),
    } as Response);

    // Call with context but no country
    const offers = await toroxAdapter.fetchOffers(mockProvider, { ip: "1.2.3.4" } as any);

    // Should return all campaigns (no geo filtering)
    expect(offers).toHaveLength(2);
  });

  it("should handle empty countries array (worldwide availability)", async () => {
    const mockCampaigns = [
      {
        id: "campaign-worldwide",
        name: "Worldwide Campaign",
        payout: 5.0,
        countries: [], // Empty = available everywhere
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ campaigns: mockCampaigns }),
      json: async () => ({ campaigns: mockCampaigns }),
    } as Response);

    // With context (should include because countries is empty)
    const offers1 = await toroxAdapter.fetchOffers(mockProvider, { country: "US", ip: "1.2.3.4" });
    expect(offers1).toHaveLength(1);

    // Without context (should also include)
    const offers2 = await toroxAdapter.fetchOffers(mockProvider, undefined);
    expect(offers2).toHaveLength(1);
  });
});
