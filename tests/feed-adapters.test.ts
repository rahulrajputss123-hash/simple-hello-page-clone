import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchFeed } from "../src/lib/quests/feed-adapters.server";
import type { FeedProvider, FeedContext } from "../src/lib/quests/feed-adapters.server";

// Mock environment variables
vi.stubEnv("BITCOTASKS_API_KEY", "test_bitcotasks_key");
vi.stubEnv("OFFERWALLME_API_KEY", "test_offerwallme_key");
vi.stubEnv("OFFERWALLME_BEARER_TOKEN", "test_bearer");
vi.stubEnv("OFFERWALLME_SECRET", "test_secret");

describe("Feed Adapters", () => {
  const mockContext: FeedContext = {
    userRef: "user123",
    ip: "1.2.3.4",
    country: "US",
    userAgent: "Mozilla/5.0",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe("BitcoTasks adapter", () => {
    const bitcoTasksProvider: FeedProvider = {
      id: "btc-id",
      key: "bitcotasks",
      name: "BitcoTasks",
      api_key: null,
      bearer_token: null,
      secret: null,
      currency_per_usd: 100000,
      enabled: true,
      status: "active",
    };

    it("should fetch PTC campaigns from bitcotasks", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "200",
          message: "Success",
          data: [
            { id: "1", title: "Ad 1", reward: "50", duration: "30", url: "https://example.com/1" },
            { id: "2", title: "Ad 2", reward: "100", duration: "60", url: "https://example.com/2" },
          ],
        }),
      });

      const items = await fetchFeed("ptc", bitcoTasksProvider, mockContext);

      expect(items).toHaveLength(2);
      expect(items[0]).toMatchObject({
        source: "bitcotasks",
        campaignId: "1",
        title: "Ad 1",
        rewardRaw: 50,
        rewardUsd: 0.0005, // 50 / 100000
        durationSeconds: 30,
      });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("https://bitcotasks.com/api/"),
        expect.objectContaining({
          headers: { "User-UA": "Mozilla/5.0" },
        })
      );
    });

    it("should fetch shortlink campaigns from bitcotasks", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "200",
          data: [
            { id: "sl1", title: "Shortlink 1", reward: "200", completion_rate: "80", available: "100", url: "https://short.link/1" },
          ],
        }),
      });

      const items = await fetchFeed("shortlink", bitcoTasksProvider, mockContext);

      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject({
        source: "bitcotasks",
        campaignId: "sl1",
        completionRate: 80,
        available: 100,
      });
    });

    it("should fetch article campaigns from bitcotasks", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "200",
          data: [
            { id: "art1", title: "Article 1", reward: "300", available: "50", url: "https://read.it/1" },
          ],
        }),
      });

      const items = await fetchFeed("article", bitcoTasksProvider, mockContext);

      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject({
        source: "bitcotasks",
        campaignId: "art1",
        title: "Article 1",
      });
    });

    it("should throw error if BITCOTASKS_API_KEY missing", async () => {
      vi.stubEnv("BITCOTASKS_API_KEY", "");

      await expect(fetchFeed("ptc", bitcoTasksProvider, mockContext)).rejects.toThrow(
        "BitcoTasks credentials not configured"
      );
    });
  });

  describe("Offerwall.me adapter", () => {
    const offerwallMeProvider: FeedProvider = {
      id: "owm-id",
      key: "offerwallme",
      name: "Offerwall.me",
      api_key: null,
      bearer_token: null,
      secret: null,
      currency_per_usd: 10000,
      enabled: true,
      status: "active",
    };

    it("should fetch PTC campaigns from offerwallme", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            { url: "https://offerwall.me/click?1=camp1", title: "PTC 1", reward: "100", duration: "45" },
            { url: "https://offerwall.me/click?1=camp2", title: "PTC 2", reward: "150", duration: "60" },
          ],
        }),
      });

      const items = await fetchFeed("ptc", offerwallMeProvider, mockContext);

      expect(items).toHaveLength(2);
      expect(items[0]).toMatchObject({
        source: "offerwallme",
        campaignId: "camp1",
        title: "PTC 1",
        rewardUsd: 0.01, // 100 / 10000
      });
    });

    it("should fetch shortlink campaigns from offerwallme", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            { id: "123", name: "Link 1", reward: "200", remaining_views: "500", shortlink: "https://short.link/abc" },
          ],
        }),
      });

      const items = await fetchFeed("shortlink", offerwallMeProvider, mockContext);

      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject({
        source: "offerwallme",
        campaignId: "123",
        title: "Link 1",
        available: 500,
      });
    });

    it("should return empty array for article (not supported)", async () => {
      const items = await fetchFeed("article", offerwallMeProvider, mockContext);

      expect(items).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should throw error if OFFERWALLME credentials missing", async () => {
      vi.stubEnv("OFFERWALLME_API_KEY", "");

      await expect(fetchFeed("ptc", offerwallMeProvider, mockContext)).rejects.toThrow(
        "Offerwall.me credentials not configured"
      );
    });

    it("should filter shortlinks with 0 remaining_views", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            { id: "1", name: "Link 1", reward: "100", remaining_views: "10", shortlink: "https://x.co/1" },
            { id: "2", name: "Link 2", reward: "200", remaining_views: "0", shortlink: "https://x.co/2" },
            { id: "3", name: "Link 3", reward: "300", remaining_views: "5", shortlink: "https://x.co/3" },
          ],
        }),
      });

      const items = await fetchFeed("shortlink", offerwallMeProvider, mockContext);

      expect(items).toHaveLength(2);
      expect(items.find(i => i.campaignId === "2")).toBeUndefined();
    });
  });

  describe("Provider slug matching", () => {
    it("should match 'offerwallme' slug (not 'offerwall.me')", async () => {
      const provider: FeedProvider = {
        id: "test",
        key: "offerwallme",
        name: "Test",
        api_key: null,
        bearer_token: null,
        secret: null,
        currency_per_usd: 1000,
        enabled: true,
        status: "active",
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const items = await fetchFeed("ptc", provider, mockContext);
      expect(items).toEqual([]);
      expect(global.fetch).toHaveBeenCalled();
    });

    it("should return empty for unknown provider", async () => {
      const provider: FeedProvider = {
        id: "unknown",
        key: "unknown_provider",
        name: "Unknown",
        api_key: null,
        bearer_token: null,
        secret: null,
        currency_per_usd: 1000,
        enabled: true,
        status: "active",
      };

      const items = await fetchFeed("ptc", provider, mockContext);
      expect(items).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
