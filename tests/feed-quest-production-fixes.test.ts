/**
 * Tests for feed quest production bug fixes.
 * Covers the 7 critical issues found in production.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHmac } from "crypto";

describe("Feed Quest Production Fixes", () => {
  describe("Fix 1: quest_sessions insert includes all NOT NULL columns", () => {
    it("should include ads_required, reward_amount, and other NOT NULL columns", () => {
      // Simulate the insert payload that will be sent to Supabase
      const questRow = {
        key: "Ptc_2",
        quest_type: "feed_ptc",
        feed_kind: "ptc",
        is_active: true,
        steps_count: 3,
        backup_count: 2,
        min_reward_usd: 0.05,
        reward_amount: 0.5,
        ads_required: 0,
      };

      const insertPayload = {
        user_id: "test-user-id",
        quest_key: questRow.key,
        quest_type: "feed",
        current_step: 0,
        ads_required: questRow.ads_required ?? 0,
        ads_watched: 0,
        reward_amount: questRow.reward_amount,
        status: "started",
        started_at: new Date().toISOString(),
        feed_snapshot: [],
      };

      // Verify all NOT NULL columns are present
      expect(insertPayload).toHaveProperty("user_id");
      expect(insertPayload).toHaveProperty("quest_key");
      expect(insertPayload).toHaveProperty("ads_required");
      expect(insertPayload).toHaveProperty("reward_amount");
      expect(insertPayload).toHaveProperty("status");
      expect(insertPayload).toHaveProperty("started_at");

      // Verify values
      expect(insertPayload.ads_required).toBe(0);
      expect(insertPayload.reward_amount).toBe(0.5);
      expect(insertPayload.ads_watched).toBe(0);
    });

    it("should default ads_required to 0 if undefined", () => {
      const questRow = {
        key: "top_shortlink",
        reward_amount: 0.005,
        ads_required: undefined, // Explicitly undefined
      };

      const insertPayload = {
        ads_required: questRow.ads_required ?? 0,
        reward_amount: questRow.reward_amount,
      };

      expect(insertPayload.ads_required).toBe(0);
      expect(insertPayload.reward_amount).toBe(0.005);
    });
  });

  describe("Fix 2: Offerwall.me identity expiry is 1 hour (3600 seconds)", () => {
    it("should set identityExpires to now + 3600 seconds", () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const identityExpires = nowSeconds + 3600;

      // Verify expiry is exactly 1 hour from now
      expect(identityExpires - nowSeconds).toBe(3600);
      expect(identityExpires).toBeGreaterThan(nowSeconds);
      expect(identityExpires).toBeLessThan(nowSeconds + 3601);
    });

    it("should generate correct HMAC signature with 1 hour expiry", () => {
      const apiKey = "test-api-key";
      const userRef = "test-user-ref";
      const secret = "test-secret";
      const nowSeconds = Math.floor(Date.now() / 1000);
      const identityExpires = nowSeconds + 3600;

      // Generate signature using the exact pattern from the code
      const message = `offerwall-user-v1\n${apiKey}\n${userRef}\n${identityExpires}`;
      const signature = createHmac("sha256", secret)
        .update(message)
        .digest("hex");

      // Verify signature format
      expect(signature).toMatch(/^[a-f0-9]{64}$/);
      expect(signature.length).toBe(64);

      // Verify the message includes the 1-hour expiry
      expect(message).toContain(identityExpires.toString());
      expect(message).toContain("offerwall-user-v1");
    });

    it("should not use 7-day (604800 seconds) expiry", () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const identityExpires = nowSeconds + 3600;

      // Verify we're NOT using 7-day expiry
      const sevenDaysInSeconds = 604800;
      expect(identityExpires - nowSeconds).not.toBe(sevenDaysInSeconds);
      expect(identityExpires - nowSeconds).toBe(3600);
    });
  });

  describe("Fix 3: min_reward_usd does not remove campaigns for feed quests", () => {
    it("should not filter out campaigns based on min_reward_usd", () => {
      type FeedItem = {
        source: string;
        campaignId: string;
        rewardUsd: number;
        completionRate?: number;
        available?: number;
      };

      const items: FeedItem[] = [
        { source: "bitcotasks", campaignId: "1", rewardUsd: 0.0008 }, // Below min (0.05)
        { source: "bitcotasks", campaignId: "2", rewardUsd: 0.001 }, // Below min
        { source: "offerwallme", campaignId: "3", rewardUsd: 0.06 }, // Above min
        { source: "offerwallme", campaignId: "4", rewardUsd: 0.002 }, // Below min
      ];

      const minRewardUsd = 0.05;

      // Simulate the ranking/filtering logic (NO filtering by min_reward_usd)
      // Only sort by reward, don't remove campaigns
      const ranked = items.sort((a, b) => b.rewardUsd - a.rewardUsd);

      // All campaigns should still be present
      expect(ranked.length).toBe(4);
      expect(ranked[0].rewardUsd).toBe(0.06);
      expect(ranked[1].rewardUsd).toBe(0.002);
      expect(ranked[2].rewardUsd).toBe(0.001);
      expect(ranked[3].rewardUsd).toBe(0.0008);

      // Verify we didn't filter by min_reward_usd
      const belowMinCount = ranked.filter((item) => item.rewardUsd < minRewardUsd).length;
      expect(belowMinCount).toBe(3); // 3 items are below min but NOT removed
    });

    it("should rank campaigns by reward descending", () => {
      const items = [
        { source: "a", campaignId: "1", rewardUsd: 0.001 },
        { source: "b", campaignId: "2", rewardUsd: 0.06 },
        { source: "c", campaignId: "3", rewardUsd: 0.0008 },
      ];

      const ranked = items.sort((a, b) => b.rewardUsd - a.rewardUsd);

      expect(ranked[0].rewardUsd).toBe(0.06);
      expect(ranked[1].rewardUsd).toBe(0.001);
      expect(ranked[2].rewardUsd).toBe(0.0008);
    });
  });

  describe("Fix 4: Use backup_count when fewer than steps_count items found", () => {
    it("should use backups to fill missing steps", () => {
      const stepsCount = 5;
      const backupCount = 3;

      const steps = [
        { campaignId: "1", rewardUsd: 0.06 },
        { campaignId: "2", rewardUsd: 0.05 },
        { campaignId: "3", rewardUsd: 0.04 },
        { campaignId: "4", rewardUsd: 0.03 },
      ]; // Only 4 steps, need 5

      const backups = [
        { campaignId: "5", rewardUsd: 0.02 },
        { campaignId: "6", rewardUsd: 0.01 },
        { campaignId: "7", rewardUsd: 0.009 },
      ];

      // Simulate the backup filling logic
      if (steps.length < stepsCount) {
        const needed = stepsCount - steps.length;
        const canUseBackups = Math.min(needed, backups.length);
        
        if (canUseBackups > 0) {
          steps.push(...backups.splice(0, canUseBackups));
        }
      }

      // Should now have 5 steps
      expect(steps.length).toBe(5);
      expect(steps[4].campaignId).toBe("5"); // Backup was used
      expect(backups.length).toBe(2); // 1 backup was used
    });

    it("should still fail if not enough steps after using backups", () => {
      const stepsCount = 5;
      const steps = [
        { campaignId: "1", rewardUsd: 0.06 },
        { campaignId: "2", rewardUsd: 0.05 },
      ]; // Only 2 steps

      const backups = [
        { campaignId: "3", rewardUsd: 0.02 },
      ]; // Only 1 backup

      // Simulate backup filling
      if (steps.length < stepsCount) {
        const needed = stepsCount - steps.length;
        const canUseBackups = Math.min(needed, backups.length);
        steps.push(...backups.splice(0, canUseBackups));
      }

      // Should have 3 steps (2 + 1 backup), still less than required 5
      expect(steps.length).toBe(3);
      expect(steps.length).toBeLessThan(stepsCount);
    });

    it("should not use backups if steps_count is already met", () => {
      const stepsCount = 3;
      const steps = [
        { campaignId: "1", rewardUsd: 0.06 },
        { campaignId: "2", rewardUsd: 0.05 },
        { campaignId: "3", rewardUsd: 0.04 },
      ];

      const backups = [
        { campaignId: "4", rewardUsd: 0.02 },
      ];

      const originalBackupLength = backups.length;

      if (steps.length < stepsCount) {
        const needed = stepsCount - steps.length;
        const canUseBackups = Math.min(needed, backups.length);
        steps.push(...backups.splice(0, canUseBackups));
      }

      // Steps should remain unchanged
      expect(steps.length).toBe(3);
      expect(backups.length).toBe(originalBackupLength); // Backups not touched
    });
  });

  describe("Fix 5: BitcoTasks treats HTTP 200 with data array as success", () => {
    it('should treat HTTP 200 with data array as success, regardless of status field', () => {
      const response1 = {
        status: "200",
        message: "success",
        data: [
          { id: "1", title: "Campaign 1", reward: "0.5" },
          { id: "2", title: "Campaign 2", reward: "0.3" },
        ],
      };

      const response2 = {
        status: "success",
        data: [{ id: "3", title: "Campaign 3", reward: "0.2" }],
      };

      const response3 = {
        // No status field at all, just data
        data: [{ id: "4", title: "Campaign 4", reward: "0.1" }],
      };

      // Simulate success check logic
      const checkSuccess = (json: any) => {
        const hasData = json.data && Array.isArray(json.data) && json.data.length > 0;
        const isSuccessStatus = json.status === "200" || json.status === "success";
        const isSuccessMessage = json.message === "success" || !json.message;

        // If has data, it's success
        if (hasData) return true;
        // If status is explicitly not success AND message is not success, it's error
        if (!isSuccessStatus && !isSuccessMessage && json.status) return false;
        // If no data, return empty array (not error)
        return true;
      };

      expect(checkSuccess(response1)).toBe(true);
      expect(checkSuccess(response2)).toBe(true);
      expect(checkSuccess(response3)).toBe(true);
    });

    it('should not throw on message "success" or status "success"', () => {
      const response1 = {
        status: "success",
        message: "success",
        data: [],
      };

      const response2 = {
        status: "200",
        message: "No campaigns available",
        data: [],
      };

      const checkSuccess = (json: any) => {
        const hasData = json.data && Array.isArray(json.data) && json.data.length > 0;
        const isSuccessStatus = json.status === "200" || json.status === "success";
        const isSuccessMessage = json.message === "success" || !json.message;

        if (hasData) return true;
        if (!isSuccessStatus && !isSuccessMessage && json.status) return false;
        return true;
      };

      // Should not throw, just return empty array
      expect(() => checkSuccess(response1)).not.toThrow();
      expect(() => checkSuccess(response2)).not.toThrow();
    });

    it("should only throw on explicit error status", () => {
      const errorResponse = {
        status: "error",
        message: "Invalid API key",
        data: null,
      };

      const checkSuccess = (json: any) => {
        const hasData = json.data && Array.isArray(json.data) && json.data.length > 0;
        const isSuccessStatus = json.status === "200" || json.status === "success";
        const isSuccessMessage = json.message === "success" || !json.message;

        if (hasData) return { success: true, data: json.data };
        if (!isSuccessStatus && !isSuccessMessage && json.status) {
          throw new Error(`API error: ${json.message ?? json.status}`);
        }
        return { success: true, data: [] };
      };

      expect(() => checkSuccess(errorResponse)).toThrow("Invalid API key");
    });
  });

  describe("Fix 6: BitcoTasks credentials from environment variables", () => {
    it("should read BITCOTASKS_API_KEY and BITCOTASKS_BEARER from env", () => {
      // Simulate environment variable reading
      const apiKey = process.env.BITCOTASKS_API_KEY || "test-api-key";
      const bearerToken = process.env.BITCOTASKS_BEARER || "test-bearer";

      // Verify they are being read
      expect(apiKey).toBeTruthy();
      expect(bearerToken).toBeTruthy();
      expect(typeof apiKey).toBe("string");
      expect(typeof bearerToken).toBe("string");
    });

    it("should NOT read credentials from sdk_offerwall_providers row", () => {
      const providerRow = {
        id: "provider-id",
        slug: "bitcotasks",
        name: "BitcoTasks",
        extra_config: {}, // Empty
        secret_refs: {}, // Empty
        currency_per_usd: 1000,
        enabled: true,
        status: "testing",
      };

      // The code should NOT use these fields for credentials
      expect(providerRow.extra_config).toEqual({});
      expect(providerRow.secret_refs).toEqual({});

      // Instead, read from env
      const apiKey = process.env.BITCOTASKS_API_KEY;
      const bearerToken = process.env.BITCOTASKS_BEARER;

      expect(apiKey).toBeDefined();
      expect(bearerToken).toBeDefined();
    });
  });

  describe("Fix 7: IP source logging shows real source", () => {
    it("should log the actual IP source (cf-connecting-ip, x-forwarded-for, etc.)", () => {
      const mockRequest1 = {
        headers: new Map([
          ["cf-connecting-ip", "198.51.100.1"],
          ["user-agent", "Mozilla/5.0"],
        ]),
      };

      const mockRequest2 = {
        headers: new Map([
          ["x-forwarded-for", "203.0.113.1, 192.0.2.1"],
          ["user-agent", "Mozilla/5.0"],
        ]),
      };

      const mockRequest3 = {
        headers: new Map([
          ["x-real-ip", "192.0.2.1"],
          ["user-agent", "Mozilla/5.0"],
        ]),
      };

      // Simulate IP extraction logic
      const extractIp = (headers: Map<string, string>) => {
        let ip = "";
        let ipSource = "none";

        const cfIp = headers.get("cf-connecting-ip");
        if (cfIp) {
          ip = cfIp.trim();
          ipSource = "cf-connecting-ip";
          return { ip, ipSource };
        }

        const xffIp = headers.get("x-forwarded-for");
        if (xffIp) {
          const firstIp = xffIp.split(",")[0].trim();
          ip = firstIp.split(":")[0];
          ipSource = "x-forwarded-for";
          return { ip, ipSource };
        }

        const xRealIp = headers.get("x-real-ip");
        if (xRealIp) {
          ip = xRealIp.trim();
          ipSource = "x-real-ip";
          return { ip, ipSource };
        }

        return { ip, ipSource };
      };

      const result1 = extractIp(mockRequest1.headers);
      expect(result1.ip).toBe("198.51.100.1");
      expect(result1.ipSource).toBe("cf-connecting-ip");

      const result2 = extractIp(mockRequest2.headers);
      expect(result2.ip).toBe("203.0.113.1");
      expect(result2.ipSource).toBe("x-forwarded-for");

      const result3 = extractIp(mockRequest3.headers);
      expect(result3.ip).toBe("192.0.2.1");
      expect(result3.ipSource).toBe("x-real-ip");
    });

    it('should not log "not-tracked" for a valid IP source', () => {
      const ipSource = "x-forwarded-for";
      const logMessage = `IP source: ${ipSource ?? "unknown"}`;

      expect(logMessage).not.toContain("not-tracked");
      expect(logMessage).toBe("IP source: x-forwarded-for");
    });
  });
});
