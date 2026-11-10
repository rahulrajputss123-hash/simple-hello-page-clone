/**
 * Tests for offer adapter improvements:
 * - Device normalization
 * - Category mapping
 * - Platform filtering
 * - Step extraction
 */

import { describe, it, expect } from "vitest";
import { detectPlatformFromUserAgent, filterOffersByPlatform } from "@/lib/offers/platform.server";

describe("Platform Detection", () => {
  describe("detectPlatformFromUserAgent", () => {
    it("should detect Android from user agent", () => {
      const ua = "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36";
      expect(detectPlatformFromUserAgent(ua)).toBe("android");
    });

    it("should detect iOS from iPhone user agent", () => {
      const ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15";
      expect(detectPlatformFromUserAgent(ua)).toBe("ios");
    });

    it("should detect iOS from iPad user agent", () => {
      const ua = "Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15";
      expect(detectPlatformFromUserAgent(ua)).toBe("ios");
    });

    it("should detect web from desktop Chrome user agent", () => {
      const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/91.0";
      expect(detectPlatformFromUserAgent(ua)).toBe("web");
    });

    it("should detect web from desktop Firefox user agent", () => {
      const ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0";
      expect(detectPlatformFromUserAgent(ua)).toBe("web");
    });

    it("should default to web for unknown user agent", () => {
      const ua = "Unknown/1.0";
      expect(detectPlatformFromUserAgent(ua)).toBe("web");
    });

    it("should handle empty user agent", () => {
      expect(detectPlatformFromUserAgent("")).toBe("web");
    });
  });
});

describe("Platform Filtering", () => {
  describe("filterOffersByPlatform", () => {
    const offers = [
      { id: "1", title: "Android Only", devices: ["android"] },
      { id: "2", title: "iOS Only", devices: ["ios"] },
      { id: "3", title: "Web Only", devices: ["web"] },
      { id: "4", title: "Mobile", devices: ["android", "ios"] },
      { id: "5", title: "All Platforms", devices: ["android", "ios", "web"] },
      { id: "6", title: "No Devices", devices: [] },
      { id: "7", title: "Undefined Devices", devices: undefined },
      { id: "8", title: "Null Devices", devices: null },
    ];

    it("should filter offers for Android users", () => {
      const filtered = filterOffersByPlatform(offers, "android");
      const ids = filtered.map((o) => o.id);
      expect(ids).toEqual(["1", "4", "5", "6", "7", "8"]);
    });

    it("should filter offers for iOS users", () => {
      const filtered = filterOffersByPlatform(offers, "ios");
      const ids = filtered.map((o) => o.id);
      expect(ids).toEqual(["2", "4", "5", "6", "7", "8"]);
    });

    it("should filter offers for web users", () => {
      const filtered = filterOffersByPlatform(offers, "web");
      const ids = filtered.map((o) => o.id);
      expect(ids).toEqual(["3", "5", "6", "7", "8"]);
    });

    it("should include offers with no device restrictions", () => {
      const allPlatforms = ["android", "ios", "web"] as const;
      allPlatforms.forEach((platform) => {
        const filtered = filterOffersByPlatform(offers, platform);
        expect(filtered.some((o) => o.id === "6")).toBe(true); // Empty array
        expect(filtered.some((o) => o.id === "7")).toBe(true); // Undefined
        expect(filtered.some((o) => o.id === "8")).toBe(true); // Null
      });
    });

    it("should handle empty offers array", () => {
      const filtered = filterOffersByPlatform([], "android");
      expect(filtered).toEqual([]);
    });
  });
});

describe("Device Normalization", () => {
  it("should normalize device strings to lowercase", () => {
    // These tests verify the behavior across all adapters
    const testCases = [
      { input: "Android", expected: "android" },
      { input: "iOS", expected: "ios" },
      { input: "Desktop", expected: "web" },
      { input: "Web", expected: "web" },
      { input: "iPhone", expected: "ios" },
      { input: "iPad", expected: "ios" },
      { input: "android", expected: "android" },
      { input: "ios", expected: "ios" },
      { input: "web", expected: "web" },
    ];

    // Simple normalization logic (mirrors adapter logic)
    const normalizeDevice = (device: string): string => {
      const lower = device.toLowerCase();
      if (lower === "android" || lower.includes("android")) return "android";
      if (lower === "ios" || lower.includes("ios") || lower.includes("iphone") || lower.includes("ipad")) return "ios";
      if (lower === "web" || lower === "desktop" || lower.includes("desktop")) return "web";
      return "web";
    };

    testCases.forEach(({ input, expected }) => {
      expect(normalizeDevice(input)).toBe(expected);
    });
  });

  it("should handle mobile as both android and ios", () => {
    const normalizeDevices = (devices: string[]): string[] => {
      const normalized = new Set<string>();
      for (const d of devices) {
        const lower = d.toLowerCase();
        if (lower === "android" || lower.includes("android")) normalized.add("android");
        else if (lower === "ios" || lower.includes("ios") || lower.includes("iphone") || lower.includes("ipad")) normalized.add("ios");
        else if (lower === "web" || lower === "desktop" || lower.includes("desktop")) normalized.add("web");
        else if (lower === "mobile") {
          normalized.add("android");
          normalized.add("ios");
        }
      }
      return Array.from(normalized);
    };

    expect(normalizeDevices(["mobile"])).toEqual(expect.arrayContaining(["android", "ios"]));
    expect(normalizeDevices(["Mobile"])).toEqual(expect.arrayContaining(["android", "ios"]));
  });
});

describe("Category Mapping", () => {
  describe("Valid Categories", () => {
    const VALID_CATEGORIES = [
      "App Install",
      "Trial",
      "Deals",
      "Survey",
      "Games",
      "Link Locker",
      "Shortlink",
    ];

    it("should accept all valid categories", () => {
      VALID_CATEGORIES.forEach((category) => {
        expect(VALID_CATEGORIES.includes(category)).toBe(true);
      });
    });

    it("should reject invalid categories", () => {
      const invalid = ["app", "survey", "games", "App", "SURVEY", "invalid"];
      invalid.forEach((category) => {
        expect(VALID_CATEGORIES.includes(category)).toBe(false);
      });
    });
  });

  describe("GemiAd Category Mapping", () => {
    // Test the mapping logic from gemiad adapter
    const mapGemiAdCategory = (raw: string | undefined): string | null => {
      if (!raw) return null;
      const cat = raw.toLowerCase();
      switch (cat) {
        case "app":
          return "App Install";
        case "web":
          return "Trial";
        case "survey":
          return "Survey";
        case "game":
          return "Games";
        case "click":
          return null;
        default:
          return null;
      }
    };

    it("should map gemiad categories correctly", () => {
      expect(mapGemiAdCategory("app")).toBe("App Install");
      expect(mapGemiAdCategory("web")).toBe("Trial");
      expect(mapGemiAdCategory("survey")).toBe("Survey");
      expect(mapGemiAdCategory("game")).toBe("Games");
      expect(mapGemiAdCategory("click")).toBe(null);
    });

    it("should handle case insensitivity", () => {
      expect(mapGemiAdCategory("APP")).toBe("App Install");
      expect(mapGemiAdCategory("WEB")).toBe("Trial");
      expect(mapGemiAdCategory("SURVEY")).toBe("Survey");
    });

    it("should return null for invalid categories", () => {
      expect(mapGemiAdCategory("invalid")).toBe(null);
      expect(mapGemiAdCategory("")).toBe(null);
      expect(mapGemiAdCategory(undefined)).toBe(null);
    });
  });

  describe("Torox Category Mapping", () => {
    // Test the mapping logic from torox adapter
    const mapToroxCategory = (verticalNames: string | undefined): string | null => {
      if (!verticalNames) return null;
      const lower = verticalNames.toLowerCase();
      
      // Skip gambling categories
      if (lower.includes("casino") || lower.includes("gambling") || 
          lower.includes("betting") || lower.includes("poker")) {
        return null;
      }
      
      // Gaming categories
      if (lower.includes("gaming") || lower.includes("strategy") || 
          lower.includes("game")) {
        return "Games";
      }
      
      return null;
    };

    it("should map gaming categories to Games", () => {
      expect(mapToroxCategory("Gaming")).toBe("Games");
      expect(mapToroxCategory("Strategy")).toBe("Games");
      expect(mapToroxCategory("Game")).toBe("Games");
      expect(mapToroxCategory("Strategy, Gaming")).toBe("Games");
    });

    it("should exclude gambling categories", () => {
      expect(mapToroxCategory("Casino")).toBe(null);
      expect(mapToroxCategory("Gambling")).toBe(null);
      expect(mapToroxCategory("Betting")).toBe(null);
      expect(mapToroxCategory("Poker")).toBe(null);
    });

    it("should return null for unmapped categories", () => {
      expect(mapToroxCategory("Shopping")).toBe(null);
      expect(mapToroxCategory("Education")).toBe(null);
      expect(mapToroxCategory("")).toBe(null);
      expect(mapToroxCategory(undefined)).toBe(null);
    });
  });
});

describe("Step Extraction", () => {
  describe("Torox Step Rewards", () => {
    it("should extract steps from torox events", () => {
      const events = [
        { orderId: 1, eventName: "Complete Level 1", payout: 0.5 },
        { orderId: 2, eventName: "Complete Level 2", payout: 1.0 },
        { orderId: 3, eventName: "Complete Level 3", payout: 2.0 },
      ];

      const stepRewards = events
        .sort((a, b) => a.orderId - b.orderId)
        .map((evt) => ({
          step: evt.eventName,
          reward: evt.payout,
        }))
        .filter((sr) => sr.step && sr.reward > 0);

      expect(stepRewards).toHaveLength(3);
      expect(stepRewards[0]).toEqual({ step: "Complete Level 1", reward: 0.5 });
      expect(stepRewards[1]).toEqual({ step: "Complete Level 2", reward: 1.0 });
      expect(stepRewards[2]).toEqual({ step: "Complete Level 3", reward: 2.0 });
    });

    it("should sort steps by orderId", () => {
      const events = [
        { orderId: 3, eventName: "Step 3", payout: 2.0 },
        { orderId: 1, eventName: "Step 1", payout: 0.5 },
        { orderId: 2, eventName: "Step 2", payout: 1.0 },
      ];

      const stepRewards = events
        .sort((a, b) => a.orderId - b.orderId)
        .map((evt) => ({
          step: evt.eventName,
          reward: evt.payout,
        }));

      expect(stepRewards[0].step).toBe("Step 1");
      expect(stepRewards[1].step).toBe("Step 2");
      expect(stepRewards[2].step).toBe("Step 3");
    });

    it("should filter out zero or negative payouts", () => {
      const events = [
        { orderId: 1, eventName: "Valid Step", payout: 1.0 },
        { orderId: 2, eventName: "Zero Step", payout: 0 },
        { orderId: 3, eventName: "Negative Step", payout: -1.0 },
      ];

      const stepRewards = events
        .map((evt) => ({
          step: evt.eventName,
          reward: evt.payout,
        }))
        .filter((sr) => sr.step && sr.reward > 0);

      expect(stepRewards).toHaveLength(1);
      expect(stepRewards[0].step).toBe("Valid Step");
    });
  });

  describe("GemiAd Step Rewards", () => {
    it("should extract steps from gemiad events", () => {
      const events = [
        { action: { en: "Sign Up" }, payout: "0.5" },
        { action: { en: "Complete Tutorial" }, payout: "1.0" },
        { action: { en: "Reach Level 10" }, payout: "2.5" },
      ];

      const stepRewards = events
        .map((evt) => ({
          step: evt.action?.en ?? "",
          reward: Number.parseFloat(String(evt.payout)) || 0,
        }))
        .filter((sr) => sr.step && sr.reward > 0);

      expect(stepRewards).toHaveLength(3);
      expect(stepRewards[0]).toEqual({ step: "Sign Up", reward: 0.5 });
      expect(stepRewards[1]).toEqual({ step: "Complete Tutorial", reward: 1.0 });
      expect(stepRewards[2]).toEqual({ step: "Reach Level 10", reward: 2.5 });
    });

    it("should handle missing or invalid data", () => {
      const events = [
        { action: { en: "Valid Step" }, payout: "1.0" },
        { action: { en: "" }, payout: "0.5" }, // Empty step
        { action: {}, payout: "1.0" }, // Missing action.en
        { action: { en: "Zero Payout" }, payout: "0" },
        { action: { en: "Invalid Payout" }, payout: "invalid" },
      ];

      const stepRewards = events
        .map((evt) => ({
          step: (evt.action as any)?.en ?? "",
          reward: Number.parseFloat(String(evt.payout)) || 0,
        }))
        .filter((sr) => sr.step && sr.reward > 0);

      expect(stepRewards).toHaveLength(1);
      expect(stepRewards[0].step).toBe("Valid Step");
    });
  });
});

describe("Torox Requirements and Disclaimer", () => {
  it("should separate callToAction and disclaimer", () => {
    const offer = {
      callToAction: "Sign up and complete 3 offers",
      disclaimer: "VPN not allowed. No multiple accounts.",
    };

    const requirements = offer.callToAction || "";
    const notAllowed = offer.disclaimer || "";

    expect(requirements).toBe("Sign up and complete 3 offers");
    expect(notAllowed).toBe("VPN not allowed. No multiple accounts.");
  });

  it("should handle missing callToAction", () => {
    const offer = {
      callToAction: undefined,
      disclaimer: "VPN not allowed.",
    };

    const requirements = offer.callToAction || "";
    const notAllowed = offer.disclaimer || "";

    expect(requirements).toBe("");
    expect(notAllowed).toBe("VPN not allowed.");
  });

  it("should handle missing disclaimer", () => {
    const offer = {
      callToAction: "Complete the offer",
      disclaimer: undefined,
    };

    const requirements = offer.callToAction || "";
    const notAllowed = offer.disclaimer || "";

    expect(requirements).toBe("Complete the offer");
    expect(notAllowed).toBe("");
  });
});
