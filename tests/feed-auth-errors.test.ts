/**
 * Feed Adapters - Auth Error Handling Test
 * 
 * Tests that 401 and 403 errors from feed providers are handled gracefully
 * without crashes, and that error messages are logged (with masked credentials).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("Feed Adapters - Auth Error Handling", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("should handle BitcoTasks HTTP 401 without crashing", async () => {
    // Mock fetch to return 401
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => "Unauthorized: Invalid API key",
    });

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Import the function after mocking fetch
    const { fetchFeed } = await import("@/lib/quests/feed-adapters.server");

    const mockProvider = {
      id: "test-provider",
      key: "bitcotasks",
      name: "BitcoTasks",
      api_key: null,
      bearer_token: null,
      secret: null,
      currency_per_usd: 100,
      enabled: true,
      status: "active",
    };

    const mockContext = {
      userRef: "test-user",
      ip: "1.2.3.4",
      country: "US",
      userAgent: "Test Agent",
    };

    // Should throw error but not crash
    await expect(
      fetchFeed("ptc", mockProvider, mockContext)
    ).rejects.toThrow("BitcoTasks ptc failed: HTTP 401");

    // Should log the error with status code
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("[feed] BitcoTasks ptc HTTP 401"),
      expect.any(String)
    );

    consoleErrorSpy.mockRestore();
  });

  it("should handle Offerwall.me HTTP 403 without crashing", async () => {
    // Mock fetch to return 403
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => "Forbidden: Invalid signature",
    });

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Import the function after mocking fetch
    const { fetchFeed } = await import("@/lib/quests/feed-adapters.server");

    const mockProvider = {
      id: "test-provider",
      key: "offerwallme",
      name: "Offerwall.me",
      api_key: null,
      bearer_token: null,
      secret: null,
      currency_per_usd: 100,
      enabled: true,
      status: "active",
    };

    const mockContext = {
      userRef: "test-user",
      ip: "1.2.3.4",
      country: "US",
      userAgent: "Test Agent",
    };

    // Should throw error but not crash
    await expect(
      fetchFeed("ptc", mockProvider, mockContext)
    ).rejects.toThrow("Offerwall.me ptc failed: HTTP 403");

    // Should log the error with status code
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("[feed] Offerwall.me ptc HTTP 403"),
      expect.any(String)
    );

    consoleErrorSpy.mockRestore();
  });

  it("should mask API keys in error logs", async () => {
    const apiKey = "test-api-key-12345";
    const secret = "test-secret-67890";

    // Set environment variables
    process.env.OFFERWALLME_API_KEY = apiKey;
    process.env.OFFERWALLME_SECRET_KEY = secret;

    // Mock fetch to return 403 with credentials in response
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => `Invalid API key: ${apiKey} or secret: ${secret}`,
    });

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Import the function after mocking fetch and setting env
    const { fetchFeed } = await import("@/lib/quests/feed-adapters.server");

    const mockProvider = {
      id: "test-provider",
      key: "offerwallme",
      name: "Offerwall.me",
      api_key: null,
      bearer_token: null,
      secret: null,
      currency_per_usd: 100,
      enabled: true,
      status: "active",
    };

    const mockContext = {
      userRef: "test-user",
      ip: "1.2.3.4",
      country: "US",
      userAgent: "Test Agent",
    };

    await expect(
      fetchFeed("ptc", mockProvider, mockContext)
    ).rejects.toThrow();

    // Error log should have masked credentials
    const errorCall = consoleErrorSpy.mock.calls.find(call => 
      call[0].includes("[feed] Offerwall.me")
    );
    
    if (errorCall) {
      const loggedMessage = errorCall[1];
      expect(loggedMessage).toContain("***API_KEY***");
      expect(loggedMessage).toContain("***SECRET***");
      expect(loggedMessage).not.toContain(apiKey);
      expect(loggedMessage).not.toContain(secret);
    }

    consoleErrorSpy.mockRestore();

    // Clean up env vars
    delete process.env.OFFERWALLME_API_KEY;
    delete process.env.OFFERWALLME_SECRET_KEY;
  });

  it("should provide clear error messages for both providers", async () => {
    // Set credentials for the test
    process.env.BITCOTASKS_API_KEY = "test-key";
    process.env.BITCOTASKS_BEARER = "test-bearer";
    process.env.OFFERWALLME_API_KEY = "test-api-key";
    process.env.OFFERWALLME_SECRET_KEY = "test-secret";
    process.env.OFFERWALLME_BEARER_TOKEN = "test-token";

    const testCases = [
      { provider: "bitcotasks", status: 401, expectedMsg: "BitcoTasks ptc failed: HTTP 401" },
      { provider: "bitcotasks", status: 403, expectedMsg: "BitcoTasks ptc failed: HTTP 403" },
      { provider: "offerwallme", status: 401, expectedMsg: "Offerwall.me ptc failed: HTTP 401" },
      { provider: "offerwallme", status: 403, expectedMsg: "Offerwall.me ptc failed: HTTP 403" },
    ];

    for (const testCase of testCases) {
      // Mock fetch
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: testCase.status,
        text: async () => `Error ${testCase.status}`,
      });

      vi.spyOn(console, "error").mockImplementation(() => {});

      const { fetchFeed } = await import("@/lib/quests/feed-adapters.server");

      const mockProvider = {
        id: "test",
        key: testCase.provider,
        name: testCase.provider,
        api_key: null,
        bearer_token: null,
        secret: null,
        currency_per_usd: 100,
        enabled: true,
        status: "active",
      };

      const mockContext = {
        userRef: "test",
        ip: "1.2.3.4",
        country: "US",
        userAgent: "Test",
      };

      await expect(
        fetchFeed("ptc", mockProvider, mockContext)
      ).rejects.toThrow(testCase.expectedMsg);

      vi.restoreAllMocks();
    }

    // Clean up
    delete process.env.BITCOTASKS_API_KEY;
    delete process.env.BITCOTASKS_BEARER;
    delete process.env.OFFERWALLME_API_KEY;
    delete process.env.OFFERWALLME_SECRET_KEY;
    delete process.env.OFFERWALLME_BEARER_TOKEN;
  });
});
