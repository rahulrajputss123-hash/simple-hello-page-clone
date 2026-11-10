/**
 * Test Torox adapter with real API response shape.
 * Tests both admin sync (no context) and user requests (with context).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { toroxAdapter } from "../src/lib/offers/adapters/torox.server";
import type { OfferProvider } from "../src/lib/offers/provider-types";

describe("Torox Adapter - Real API Shape", () => {
  const mockProvider: OfferProvider = {
    id: "test-provider-id",
    slug: "torox",
    name: "Torox",
    provider_type: "cpa",
    enabled: true,
    status: "live",
    sync_config: {
      exclude_real_money_gambling: true,
    },
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
    process.env.TOROX_FEED_SOURCE_ID = "17058";
    process.env.TOROX_FEED_TOKEN = "aebbfa702ee068efdada47c8b7c61645";
    process.env.TOROX_API_BASE = "https://api.wall.torox.io";
  });

  afterEach(() => {
    // Restore original env
    Object.assign(process.env, originalEnv);
    vi.restoreAllMocks();
  });

  it("should parse real Torox API response shape (bare array)", async () => {
    // Real API response shape
    const mockOffers = [
      {
        offerId: 19661247,
        name: "Pulsz.com - Get 1 Million Gold Coins",
        description: "Register using full valid details and get your 1M free Gold Coins &#039; 30 FREE Sweeps Coins! &ndash; Social Casino &egrave;",
        callToAction: "Register using full valid details",
        disclaimer: "This offer requires identity verification",
        payoutType: "CPA",
        payout: 60,
        amount: 60000,
        geos: "US",
        os: "web",
        packageId: "",
        landingUrl: "https://example.com/landing",
        image: "https://static.offertoro.com/image1.png",
        coverImage: "https://static.offertoro.com/cover1.png",
        verticalNames: "Real Money Casino",
        pinned: false,
        promoted: true,
        completions: 28,
        rating: 20000,
      },
      {
        offerId: 19661248,
        name: "Gaming App - Install &amp; Play",
        description: "Download and play for 5 minutes",
        callToAction: "Install and reach level 5",
        payoutType: "CPE",
        payout: 2.50,
        amount: 2500,
        geos: "US,IN,GB",
        os: "android",
        image: "https://static.offertoro.com/image2.png",
        verticalNames: "Gaming - Strategy",
        pinned: false,
        promoted: false,
        completions: 150,
        rating: 25000,
        events: [
          {
            eventId: 2735584,
            orderId: 1,
            eventName: "Install and open",
            payout: 1.0,
            amount: 1000,
            timeframeMin: 0,
            timeframeMax: null,
          },
          {
            eventId: 2735585,
            orderId: 2,
            eventName: "Reach level 5",
            payout: 1.5,
            amount: 1500,
            timeframeMin: 0,
            timeframeMax: 3600,
          },
        ],
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockOffers),
    } as Response);

    // Call with no context (admin sync)
    const offers = await toroxAdapter.fetchOffers(mockProvider, undefined);

    // Should have 1 offer (casino excluded by default)
    expect(offers).toHaveLength(1);
    
    const offer = offers[0];
    expect(offer.externalOfferId).toBe("19661248");
    expect(offer.title).toBe("Gaming App - Install & Play");
    expect(offer.description).not.toContain("&amp;");
    expect(offer.description).not.toContain("&#039;");
    expect(offer.requirements).toContain("Install and reach level 5");
    expect(offer.networkPayout).toBe(2.50);
    expect(offer.countries).toEqual(["US", "IN", "GB"]);
    expect(offer.devices).toEqual(["android"]);
    expect(offer.category).toBe("Games");
    expect(offer.isFeatured).toBe(false);
    expect(offer.clickUrl).toBe("torox://campaign/19661248");
    expect(offer.icon).toBe("https://static.offertoro.com/image2.png");
    
    // Check step rewards
    expect(offer.stepRewards).toHaveLength(2);
    expect(offer.stepRewards?.[0]).toEqual({
      step: "Install and open",
      reward: 1.0,
    });
    expect(offer.stepRewards?.[1]).toEqual({
      step: "Reach level 5",
      reward: 1.5,
    });
  });

  it("should decode HTML entities in description", async () => {
    const mockOffers = [
      {
        offerId: 123,
        name: "Test Offer",
        description: "Description with &amp; &uuml; &#039; &ndash; &egrave; entities",
        payout: 5.00,
        geos: "US",
        os: "web",
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockOffers),
    } as Response);

    const offers = await toroxAdapter.fetchOffers(mockProvider, undefined);

    expect(offers[0].description).not.toContain("&amp;");
    expect(offers[0].description).not.toContain("&#039;");
    expect(offers[0].description).not.toContain("&ndash;");
    expect(offers[0].description).not.toContain("&egrave;");
  });

  it("should exclude gambling offers when exclude_real_money_gambling is true", async () => {
    const mockOffers = [
      {
        offerId: 1,
        name: "Casino Offer",
        payout: 50,
        geos: "US",
        os: "web",
        verticalNames: "Real Money Casino",
      },
      {
        offerId: 2,
        name: "Poker Offer",
        payout: 30,
        geos: "US",
        os: "web",
        verticalNames: "Online Poker",
      },
      {
        offerId: 3,
        name: "Betting Offer",
        payout: 40,
        geos: "US",
        os: "web",
        verticalNames: "Sports Betting",
      },
      {
        offerId: 4,
        name: "Game Offer",
        payout: 20,
        geos: "US",
        os: "web",
        verticalNames: "Gaming - Casual",
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockOffers),
    } as Response);

    const offers = await toroxAdapter.fetchOffers(mockProvider, undefined);

    // Should only have the game offer
    expect(offers).toHaveLength(1);
    expect(offers[0].externalOfferId).toBe("4");
    expect(offers[0].title).toBe("Game Offer");
  });

  it("should include gambling offers when exclude_real_money_gambling is false", async () => {
    const providerNoExclude: OfferProvider = {
      ...mockProvider,
      sync_config: {
        exclude_real_money_gambling: false,
      },
    };

    const mockOffers = [
      {
        offerId: 1,
        name: "Casino Offer",
        payout: 50,
        geos: "US",
        os: "web",
        verticalNames: "Real Money Casino",
      },
      {
        offerId: 2,
        name: "Game Offer",
        payout: 20,
        geos: "US",
        os: "web",
        verticalNames: "Gaming - Casual",
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockOffers),
    } as Response);

    const offers = await toroxAdapter.fetchOffers(providerNoExclude, undefined);

    // Should have both offers
    expect(offers).toHaveLength(2);
    expect(offers.map(o => o.externalOfferId)).toEqual(["1", "2"]);
  });

  it("should filter by country when context is provided", async () => {
    const mockOffers = [
      {
        offerId: 1,
        name: "US Only",
        payout: 10,
        geos: "US",
        os: "web",
      },
      {
        offerId: 2,
        name: "India Only",
        payout: 20,
        geos: "IN",
        os: "web",
      },
      {
        offerId: 3,
        name: "Multi Country",
        payout: 30,
        geos: "US,IN,GB",
        os: "web",
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockOffers),
    } as Response);

    const offers = await toroxAdapter.fetchOffers(mockProvider, {
      country: "IN",
      ip: "203.0.113.1",
    });

    // Should have India-targeted offers only
    expect(offers).toHaveLength(2);
    expect(offers.map(o => o.externalOfferId)).toEqual(["2", "3"]);
  });

  it("should return full catalog when context is undefined (admin sync)", async () => {
    const mockOffers = [
      {
        offerId: 1,
        name: "US Only",
        payout: 10,
        geos: "US",
        os: "web",
      },
      {
        offerId: 2,
        name: "India Only",
        payout: 20,
        geos: "IN",
        os: "web",
      },
      {
        offerId: 3,
        name: "UK Only",
        payout: 30,
        geos: "GB",
        os: "web",
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockOffers),
    } as Response);

    const offers = await toroxAdapter.fetchOffers(mockProvider, undefined);

    // Should have all offers (no geo filtering)
    expect(offers).toHaveLength(3);
    expect(offers.map(o => o.externalOfferId)).toEqual(["1", "2", "3"]);
  });

  it("should handle offers wrapper object", async () => {
    const mockResponse = {
      offers: [
        {
          offerId: 123,
          name: "Test",
          payout: 5.00,
          geos: "US",
          os: "web",
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockResponse),
    } as Response);

    const offers = await toroxAdapter.fetchOffers(mockProvider, undefined);
    expect(offers).toHaveLength(1);
  });

  it("should handle data wrapper object", async () => {
    const mockResponse = {
      data: [
        {
          offerId: 456,
          name: "Test",
          payout: 10.00,
          geos: "IN",
          os: "android",
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockResponse),
    } as Response);

    const offers = await toroxAdapter.fetchOffers(mockProvider, undefined);
    expect(offers).toHaveLength(1);
  });

  it("should provide detailed skip reasons when no offers pass filtering", async () => {
    const mockOffers = [
      { name: "No ID", payout: 10, geos: "US", os: "web" }, // Invalid offerId
      { offerId: 1, name: "", payout: 10, geos: "US", os: "web" }, // Missing name
      { offerId: 2, name: "No Payout", payout: 0, geos: "US", os: "web" }, // Invalid payout
      { offerId: 3, name: "Casino", payout: 10, geos: "US", os: "web", verticalNames: "Real Money Casino" }, // Gambling
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockOffers),
    } as Response);

    await expect(
      toroxAdapter.fetchOffers(mockProvider, undefined)
    ).rejects.toThrow(/none passed filtering/);
    
    await expect(
      toroxAdapter.fetchOffers(mockProvider, undefined)
    ).rejects.toThrow(/Skip reasons/);
  });

  it("should use coverImage as fallback when image is missing", async () => {
    const mockOffers = [
      {
        offerId: 1,
        name: "Test",
        payout: 5.00,
        geos: "US",
        os: "web",
        coverImage: "https://example.com/cover.png",
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockOffers),
    } as Response);

    const offers = await toroxAdapter.fetchOffers(mockProvider, undefined);
    expect(offers[0].icon).toBe("https://example.com/cover.png");
  });

  it("should mark pinned/promoted offers as featured", async () => {
    const mockOffers = [
      {
        offerId: 1,
        name: "Pinned",
        payout: 5.00,
        geos: "US",
        os: "web",
        pinned: true,
        promoted: false,
      },
      {
        offerId: 2,
        name: "Promoted",
        payout: 5.00,
        geos: "US",
        os: "web",
        pinned: false,
        promoted: true,
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockOffers),
    } as Response);

    const offers = await toroxAdapter.fetchOffers(mockProvider, undefined);
    expect(offers[0].isFeatured).toBe(true);
    expect(offers[1].isFeatured).toBe(true);
  });

  it("should normalize device names", async () => {
    const mockOffers = [
      { offerId: 1, name: "Web", payout: 5.00, geos: "US", os: "web" },
      { offerId: 2, name: "iOS", payout: 5.00, geos: "US", os: "ios" },
      { offerId: 3, name: "Android", payout: 5.00, geos: "US", os: "android" },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockOffers),
    } as Response);

    const offers = await toroxAdapter.fetchOffers(mockProvider, undefined);
    expect(offers[0].devices).toEqual(["web"]);
    expect(offers[1].devices).toEqual(["ios"]);
    expect(offers[2].devices).toEqual(["android"]);
  });
});
