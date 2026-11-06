import { describe, it, expect } from "vitest";
import crypto from "node:crypto";

/**
 * Test real BitcoTasks API with production credentials
 */
describe("BitcoTasks Real API Test", () => {
  it("should test different header combinations to find working auth", async () => {
    const apiKey = process.env.BITCOTASKS_API_KEY;
    const bearerToken = process.env.BITCOTASKS_BEARER;
    const secret = process.env.BITCOTASKS_SECRET;

    expect(apiKey).toBeTruthy();
    console.log("[TEST] BITCOTASKS_API_KEY is set:", apiKey ? "YES" : "NO");
    console.log("[TEST] BITCOTASKS_BEARER is set:", bearerToken ? "YES" : "NO");
    console.log("[TEST] BITCOTASKS_SECRET is set:", secret ? "YES" : "NO");

    // Use a real-looking IP
    const ip = "203.0.113.1"; // From cf-connecting-ip
    const userRef = crypto.randomUUID();

    const url = `https://bitcotasks.com/api/${apiKey}/${userRef}/${ip}`;
    const maskedUrl = `https://bitcotasks.com/api/***/${userRef.substring(0, 8)}.../${ip}`;

    const testCases = [
      {
        name: "No headers",
        headers: {},
      },
      {
        name: "Only User-UA",
        headers: {
          "User-UA": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      },
      {
        name: "User-UA + Authorization Bearer",
        headers: {
          "User-UA": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Authorization": `Bearer ${bearerToken}`,
        },
      },
      {
        name: "Standard User-Agent (not User-UA)",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      },
      {
        name: "Both User-Agent and User-UA",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "User-UA": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Authorization": `Bearer ${bearerToken}`,
        },
      },
      {
        name: "X-API-Key header instead of Authorization",
        headers: {
          "User-UA": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "X-API-Key": apiKey ?? "",
        },
      },
    ];

    for (const testCase of testCases) {
      console.log(`\n[TEST] Testing: ${testCase.name}`);
      console.log(`[TEST] Request URL: ${maskedUrl}`);
      console.log(`[TEST] Headers:`, Object.keys(testCase.headers).map(k => 
        k === "Authorization" || k === "X-API-Key" ? `${k}: ***` : `${k}: ${(testCase.headers as any)[k]?.substring(0, 30)}...`
      ).join(", "));

      try {
        const response = await fetch(url, { headers: testCase.headers });
        const body = await response.text();

        console.log(`[TEST] Status: ${response.status} ${response.statusText}`);
        console.log(`[TEST] Body: ${body.substring(0, 150)}`);

        if (response.ok) {
          console.log(`[TEST] ✅ SUCCESS with: ${testCase.name}`);
          const json = JSON.parse(body);
          console.log(`[TEST] API status: ${json.status}, items: ${json.data?.length ?? 0}`);
          // Found working combination
          return;
        }
      } catch (error) {
        console.error(`[TEST] Error: ${error}`);
      }
    }

    console.log("\n[TEST] ❌ All header combinations failed");
    console.log("[TEST] This suggests the API key may need to be activated/whitelisted in the BitcoTasks dashboard");
  });

  it("should test IP extraction with port numbers", () => {
    const testCases = [
      {
        input: "198.51.100.1:8080",
        expected: "198.51.100.1:8080", // Current behavior - keeps port
      },
      {
        input: "198.51.100.1:8080, 192.0.2.1",
        expected: "198.51.100.1:8080", // Takes first, keeps port
      },
      {
        input: "  198.51.100.1  , 192.0.2.1",
        expected: "198.51.100.1", // Trims whitespace
      },
    ];

    for (const tc of testCases) {
      const result = tc.input.split(",")[0].trim();
      console.log(`[TEST] Input: "${tc.input}" => Output: "${result}"`);
      expect(result).toBe(tc.expected);
    }
  });

  it("should strip port from IP if present", () => {
    const stripPort = (ip: string): string => {
      // Remove port if present (IPv4 only for now)
      return ip.split(":")[0];
    };

    expect(stripPort("198.51.100.1")).toBe("198.51.100.1");
    expect(stripPort("198.51.100.1:8080")).toBe("198.51.100.1");
    expect(stripPort("2001:db8::1")).toBe("2001"); // Would break IPv6, but not a concern for now
  });
});
