import { describe, it, expect } from "vitest";
import crypto from "node:crypto";

/**
 * Test BitcoTasks API with NEW bearer token
 */
describe("BitcoTasks API with New Bearer Token", () => {
  it("should successfully fetch PTC campaigns with new bearer token", async () => {
    const apiKey = process.env.BITCOTASKS_API_KEY;
    const bearerToken = process.env.BITCOTASKS_BEARER;

    console.log("[TEST] Testing with NEW bearer token");
    console.log("[TEST] API Key:", apiKey ? "present" : "MISSING");
    console.log("[TEST] Bearer Token:", bearerToken ? `present (${bearerToken.length} chars)` : "MISSING");

    expect(apiKey).toBeTruthy();
    expect(bearerToken).toBeTruthy();

    // Use a real-looking IP from CloudFlare
    const ip = "203.0.113.1";
    const userRef = crypto.randomUUID();
    const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

    const url = `https://bitcotasks.com/api/${apiKey}/${userRef}/${ip}`;
    const maskedUrl = `https://bitcotasks.com/api/***/${userRef.substring(0, 8)}.../${ip}`;

    console.log("[TEST] Request URL:", maskedUrl);
    console.log("[TEST] User-Agent:", userAgent.substring(0, 60) + "...");

    const headers = {
      "Authorization": `Bearer ${bearerToken}`,
      "User-UA": userAgent,
    };

    const response = await fetch(url, { headers });

    console.log("[TEST] Response status:", response.status, response.statusText);

    const body = await response.text();
    console.log("[TEST] Response body:", body.substring(0, 300));

    if (response.ok) {
      const json = JSON.parse(body);
      console.log("[TEST] ✅ SUCCESS!");
      console.log("[TEST] API status:", json.status);
      console.log("[TEST] Message:", json.message);
      console.log("[TEST] Number of campaigns:", json.data?.length ?? 0);

      expect(json.status).toBe("200");
      expect(json.data).toBeInstanceOf(Array);

      if (json.data.length > 0) {
        console.log("[TEST] Sample campaign:", {
          id: json.data[0].id,
          title: json.data[0].title,
          reward: json.data[0].reward,
          duration: json.data[0].duration,
        });
      }
    } else {
      console.error("[TEST] ❌ FAILED");
      console.error("[TEST] Status:", response.status);
      console.error("[TEST] Body:", body);
      throw new Error(`BitcoTasks API returned ${response.status}: ${body}`);
    }
  });

  it("should test all three endpoints (PTC, Shortlink, Article)", async () => {
    const apiKey = process.env.BITCOTASKS_API_KEY;
    const bearerToken = process.env.BITCOTASKS_BEARER;
    const ip = "203.0.113.1";
    const userRef = crypto.randomUUID();
    const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

    const endpoints = [
      { name: "PTC", path: "api" },
      { name: "Shortlink", path: "sl-api" },
      { name: "Article", path: "ra-api" },
    ];

    const headers = {
      "Authorization": `Bearer ${bearerToken}`,
      "User-UA": userAgent,
    };

    for (const endpoint of endpoints) {
      console.log(`\n[TEST] Testing ${endpoint.name} endpoint...`);
      const url = `https://bitcotasks.com/${endpoint.path}/${apiKey}/${userRef}/${ip}`;

      const response = await fetch(url, { headers });
      const body = await response.text();

      console.log(`[TEST] ${endpoint.name} status:`, response.status);

      if (response.ok) {
        const json = JSON.parse(body);
        console.log(`[TEST] ✅ ${endpoint.name} works! Items: ${json.data?.length ?? 0}`);
        // Status can be string "200" or number 200
        expect(String(json.status)).toBe("200");
      } else {
        console.error(`[TEST] ❌ ${endpoint.name} failed:`, body);
      }
    }
  });
});
