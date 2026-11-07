/**
 * Feed Quest Tests
 * 
 * Tests feed quest ranking, filtering, and core logic.
 * Note: Full integration tests require live network feeds.
 */

import { describe, it, expect } from "vitest";
import { rankAndFilterFeed, type FeedItem } from "./feed-adapters.server";

describe("Feed Quest Ranking", () => {
  const mockItems: FeedItem[] = [
    {
      source: "offerwall.me",
      campaignId: "ptc1",
      title: "PTC Ad 1",
      rewardRaw: 1000,
      rewardUsd: 1.00,
      durationSeconds: 30,
      url: "https://example.com/1",
      raw: {},
    },
    {
      source: "offerwall.me",
      campaignId: "ptc2",
      title: "PTC Ad 2",
      rewardRaw: 500,
      rewardUsd: 0.50,
      durationSeconds: 15,
      url: "https://example.com/2",
      raw: {},
    },
    {
      source: "offerwall.me",
      campaignId: "ptc3",
      title: "PTC Ad 3",
      rewardRaw: 500,
      rewardUsd: 0.50,
      durationSeconds: 45,
      url: "https://example.com/3",
      raw: {},
    },
  ];

  it("should rank PTC by reward DESC then duration ASC", () => {
    const { steps } = rankAndFilterFeed(mockItems, {
      kind: "ptc",
      stepsCount: 3,
      backupCount: 0,
      minRewardUsd: 0,
      minCompletionRate: 0,
      maxPerNetwork: null,
      blockedDomains: [],
    });

    expect(steps.length).toBe(3);
    // $1.00 first
    expect(steps[0].rewardUsd).toBe(1.00);
    // $0.50 with 15s before $0.50 with 45s
    expect(steps[1].durationSeconds).toBe(15);
    expect(steps[2].durationSeconds).toBe(45);
  });

  it("should NOT filter by min_reward_usd (bug fix: use for ordering only)", () => {
    const { steps } = rankAndFilterFeed(mockItems, {
      kind: "ptc",
      stepsCount: 10,
      backupCount: 0,
      minRewardUsd: 0.75, // This should NOT remove campaigns
      minCompletionRate: 0,
      maxPerNetwork: null,
      blockedDomains: [],
    });

    // Bug fix: min_reward_usd should NOT filter campaigns
    // All 3 campaigns should be present, sorted by reward DESC, then duration ASC
    expect(steps.length).toBe(3);
    expect(steps[0].rewardUsd).toBe(1.00);
    // Items 2 and 3 both have 0.50 reward, sorted by duration (15 < 45)
    expect(steps[1].rewardUsd).toBe(0.50);
    expect(steps[1].durationSeconds).toBe(15);
    expect(steps[2].rewardUsd).toBe(0.50);
    expect(steps[2].durationSeconds).toBe(45);
  });

  it("should filter by blocked_domains", () => {
    const items: FeedItem[] = [
      {
        source: "offerwall.me",
        campaignId: "1",
        title: "Good Ad",
        rewardRaw: 1000,
        rewardUsd: 1.00,
        url: "https://good.com/ad",
        raw: {},
      },
      {
        source: "offerwall.me",
        campaignId: "2",
        title: "Bad Ad",
        rewardRaw: 1000,
        rewardUsd: 1.00,
        url: "https://spam.com/ad",
        raw: {},
      },
    ];

    const { steps } = rankAndFilterFeed(items, {
      kind: "ptc",
      stepsCount: 10,
      backupCount: 0,
      minRewardUsd: 0,
      minCompletionRate: 0,
      maxPerNetwork: null,
      blockedDomains: ["spam.com"],
    });

    expect(steps.length).toBe(1);
    expect(steps[0].title).toBe("Good Ad");
  });

  it("should enforce max_per_network", () => {
    const items: FeedItem[] = [
      {
        source: "network1",
        campaignId: "1",
        title: "Ad 1",
        rewardRaw: 1000,
        rewardUsd: 1.00,
        url: "https://example.com/1",
        raw: {},
      },
      {
        source: "network1",
        campaignId: "2",
        title: "Ad 2",
        rewardRaw: 900,
        rewardUsd: 0.90,
        url: "https://example.com/2",
        raw: {},
      },
      {
        source: "network1",
        campaignId: "3",
        title: "Ad 3",
        rewardRaw: 800,
        rewardUsd: 0.80,
        url: "https://example.com/3",
        raw: {},
      },
      {
        source: "network2",
        campaignId: "4",
        title: "Ad 4",
        rewardRaw: 700,
        rewardUsd: 0.70,
        url: "https://example.com/4",
        raw: {},
      },
    ];

    const { steps } = rankAndFilterFeed(items, {
      kind: "ptc",
      stepsCount: 10,
      backupCount: 0,
      minRewardUsd: 0,
      minCompletionRate: 0,
      maxPerNetwork: 2,
      blockedDomains: [],
    });

    expect(steps.length).toBe(3);
    const network1Count = steps.filter((s) => s.source === "network1").length;
    expect(network1Count).toBe(2); // Limited to 2
  });

  it("should split into steps and backups", () => {
    const items: FeedItem[] = Array.from({ length: 15 }, (_, i) => ({
      source: "offerwall.me",
      campaignId: `ad${i}`,
      title: `Ad ${i}`,
      rewardRaw: 1000 - i * 10,
      rewardUsd: (1000 - i * 10) / 1000,
      url: `https://example.com/${i}`,
      raw: {},
    }));

    const { steps, backups } = rankAndFilterFeed(items, {
      kind: "ptc",
      stepsCount: 10,
      backupCount: 3,
      minRewardUsd: 0,
      minCompletionRate: 0,
      maxPerNetwork: null,
      blockedDomains: [],
    });

    expect(steps.length).toBe(10);
    expect(backups.length).toBe(3);
    // Backups should be next best after steps
    expect(backups[0].rewardUsd).toBe(0.90); // 11th item
  });
});

describe("Feed Quest Shortlink Ranking", () => {
  it("should rank shortlinks by reward DESC then completion rate DESC", () => {
    const items: FeedItem[] = [
      {
        source: "offerwall.me",
        campaignId: "1",
        title: "Link 1",
        rewardRaw: 1000,
        rewardUsd: 1.00,
        completionRate: 80,
        available: 10,
        url: "https://example.com/1",
        raw: {},
      },
      {
        source: "offerwall.me",
        campaignId: "2",
        title: "Link 2",
        rewardRaw: 1000,
        rewardUsd: 1.00,
        completionRate: 90,
        available: 10,
        url: "https://example.com/2",
        raw: {},
      },
      {
        source: "offerwall.me",
        campaignId: "3",
        title: "Link 3",
        rewardRaw: 500,
        rewardUsd: 0.50,
        completionRate: 95,
        available: 10,
        url: "https://example.com/3",
        raw: {},
      },
    ];

    const { steps } = rankAndFilterFeed(items, {
      kind: "shortlink",
      stepsCount: 10,
      backupCount: 0,
      minRewardUsd: 0,
      minCompletionRate: 0,
      maxPerNetwork: null,
      blockedDomains: [],
    });

    expect(steps.length).toBe(3);
    // $1.00 with 90% before $1.00 with 80%
    expect(steps[0].completionRate).toBe(90);
    expect(steps[1].completionRate).toBe(80);
    // $0.50 last
    expect(steps[2].rewardUsd).toBe(0.50);
  });

  it("should filter by min_completion_rate for shortlinks", () => {
    const items: FeedItem[] = [
      {
        source: "offerwall.me",
        campaignId: "1",
        title: "Good Link",
        rewardRaw: 1000,
        rewardUsd: 1.00,
        completionRate: 80,
        available: 10,
        url: "https://example.com/1",
        raw: {},
      },
      {
        source: "offerwall.me",
        campaignId: "2",
        title: "Bad Link",
        rewardRaw: 1000,
        rewardUsd: 1.00,
        completionRate: 30,
        available: 10,
        url: "https://example.com/2",
        raw: {},
      },
    ];

    const { steps } = rankAndFilterFeed(items, {
      kind: "shortlink",
      stepsCount: 10,
      backupCount: 0,
      minRewardUsd: 0,
      minCompletionRate: 50,
      maxPerNetwork: null,
      blockedDomains: [],
    });

    expect(steps.length).toBe(1);
    expect(steps[0].completionRate).toBe(80);
  });

  it("should filter by available > 0 for shortlinks", () => {
    const items: FeedItem[] = [
      {
        source: "offerwall.me",
        campaignId: "1",
        title: "Available",
        rewardRaw: 1000,
        rewardUsd: 1.00,
        completionRate: 80,
        available: 10,
        url: "https://example.com/1",
        raw: {},
      },
      {
        source: "offerwall.me",
        campaignId: "2",
        title: "Unavailable",
        rewardRaw: 1000,
        rewardUsd: 1.00,
        completionRate: 90,
        available: 0,
        url: "https://example.com/2",
        raw: {},
      },
    ];

    const { steps } = rankAndFilterFeed(items, {
      kind: "shortlink",
      stepsCount: 10,
      backupCount: 0,
      minRewardUsd: 0,
      minCompletionRate: 0,
      maxPerNetwork: null,
      blockedDomains: [],
    });

    expect(steps.length).toBe(1);
    expect(steps[0].title).toBe("Available");
  });
});

describe("Feed Quest Article Ranking", () => {
  it("should rank articles by reward DESC", () => {
    const items: FeedItem[] = [
      {
        source: "offerwall.me",
        campaignId: "1",
        title: "Article 1",
        rewardRaw: 500,
        rewardUsd: 0.50,
        available: 10,
        url: "https://example.com/1",
        raw: {},
      },
      {
        source: "offerwall.me",
        campaignId: "2",
        title: "Article 2",
        rewardRaw: 1000,
        rewardUsd: 1.00,
        available: 10,
        url: "https://example.com/2",
        raw: {},
      },
      {
        source: "offerwall.me",
        campaignId: "3",
        title: "Article 3",
        rewardRaw: 750,
        rewardUsd: 0.75,
        available: 10,
        url: "https://example.com/3",
        raw: {},
      },
    ];

    const { steps } = rankAndFilterFeed(items, {
      kind: "article",
      stepsCount: 10,
      backupCount: 0,
      minRewardUsd: 0,
      minCompletionRate: 0,
      maxPerNetwork: null,
      blockedDomains: [],
    });

    expect(steps.length).toBe(3);
    expect(steps[0].rewardUsd).toBe(1.00);
    expect(steps[1].rewardUsd).toBe(0.75);
    expect(steps[2].rewardUsd).toBe(0.50);
  });

  it("should filter by available > 0 for articles", () => {
    const items: FeedItem[] = [
      {
        source: "offerwall.me",
        campaignId: "1",
        title: "Available",
        rewardRaw: 1000,
        rewardUsd: 1.00,
        available: 5,
        url: "https://example.com/1",
        raw: {},
      },
      {
        source: "offerwall.me",
        campaignId: "2",
        title: "Unavailable",
        rewardRaw: 1000,
        rewardUsd: 1.00,
        available: 0,
        url: "https://example.com/2",
        raw: {},
      },
    ];

    const { steps } = rankAndFilterFeed(items, {
      kind: "article",
      stepsCount: 10,
      backupCount: 0,
      minRewardUsd: 0,
      minCompletionRate: 0,
      maxPerNetwork: null,
      blockedDomains: [],
    });

    expect(steps.length).toBe(1);
    expect(steps[0].title).toBe("Available");
  });
});

describe("Feed Quest Token Generation", () => {
  it("should generate valid quest tokens", async () => {
    const { generateQuestToken } = await import("./feed-quests.server");
    
    const token1 = generateQuestToken();
    const token2 = generateQuestToken();

    expect(token1).toMatch(/^q_[A-Za-z0-9_-]{24}$/);
    expect(token2).toMatch(/^q_[A-Za-z0-9_-]{24}$/);
    expect(token1).not.toBe(token2); // Should be unique
  });
});

// Integration tests that require live database and network feeds
describe.skip("Feed Quest Integration Tests (requires live setup)", () => {
  it("should start feed quest with real providers", () => {
    // Requires: live database, enabled providers, real IP/country/UA
  });

  it("should open sequential steps", () => {
    // Requires: active session, completed previous steps
  });

  it("should swap unavailable campaign with backup", () => {
    // Requires: feed with unavailable campaign
  });

  it("should reject step N+1 before N is completed", () => {
    // Requires: active session with incomplete steps
  });

  it("should reject expired token", () => {
    // Requires: expired token in database
  });

  it("should reject wrong provider token", () => {
    // Requires: token for provider A, postback from provider B
  });

  it("should never double-pay on replayed postback", () => {
    // Requires: completed step, replay same postback
  });

  it("should not create milestone events for quest postbacks", () => {
    // Requires: quest postback, check task_events table
  });

  it("should credit step reward immediately", () => {
    // Requires: quest completion postback, check wallet
  });

  it("should credit final bonus after last step", () => {
    // Requires: all steps completed, check wallet
  });

  it("should not affect normal (non-quest) postbacks", () => {
    // Requires: normal postback with real user ID
  });
});
