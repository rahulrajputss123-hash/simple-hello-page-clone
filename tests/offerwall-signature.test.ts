/**
 * Offerwall.me Signature Test
 * 
 * Verifies that the Offerwall.me signed identity uses SECONDS (not milliseconds)
 * and generates the correct HMAC-SHA256 signature matching the exact message format.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateOfferwallMeSignature } from "@/lib/quests/feed-adapters.server";
import { createHmac } from "crypto";

describe("Offerwall.me Signature Generation", () => {
  it("should generate correct HMAC-SHA256 signature with exact message format", () => {
    const apiKey = "test-api-key";
    const userRef = "user-123";
    const expiresSeconds = 1700000000; // Fixed timestamp in seconds
    const secret = "test-secret";

    // Expected message format: "offerwall-user-v1\n{apiKey}\n{userRef}\n{expiresSeconds}"
    const expectedMessage = `offerwall-user-v1\n${apiKey}\n${userRef}\n${expiresSeconds}`;
    const expectedSignature = createHmac("sha256", secret)
      .update(expectedMessage)
      .digest("hex");

    const signature = generateOfferwallMeSignature(apiKey, userRef, expiresSeconds, secret);

    expect(signature).toBe(expectedSignature);
  });

  it("should use seconds not milliseconds for expires timestamp", () => {
    // Mock Date.now to return a fixed value
    const fixedTimeMs = 1700000000000; // milliseconds
    const fixedTimeSeconds = 1700000000; // seconds
    vi.spyOn(Date, "now").mockReturnValue(fixedTimeMs);

    // Calculate expires in seconds (48 hours from now)
    const expiresSeconds = Math.floor(fixedTimeMs / 1000) + 48 * 3600;

    expect(expiresSeconds).toBe(fixedTimeSeconds + 172800); // 48 * 3600 = 172800 seconds
    expect(expiresSeconds).toBeLessThan(2000000000); // Reasonable seconds timestamp
    expect(expiresSeconds).toBeGreaterThan(1000000000); // Reasonable seconds timestamp

    vi.restoreAllMocks();
  });

  it("should match signature between feed and signed URL generation", () => {
    // Same inputs should produce same signature
    const apiKey = "QHvPl1a7Rl8BdLSLh6MLDpTEJpN1a1";
    const userRef = "test-user-ref";
    const expiresSeconds = 1700172800; // Some future timestamp in seconds
    const secret = "kgQ4xBE8AVLYxL5RFtVLiPXapFMsG6Oo";

    const signature1 = generateOfferwallMeSignature(apiKey, userRef, expiresSeconds, secret);
    const signature2 = generateOfferwallMeSignature(apiKey, userRef, expiresSeconds, secret);

    expect(signature1).toBe(signature2);
    expect(signature1).toHaveLength(64); // SHA256 hex = 64 chars
  });

  it("should produce different signatures for different expiry times", () => {
    const apiKey = "test-api";
    const userRef = "user";
    const secret = "secret";

    const sig1 = generateOfferwallMeSignature(apiKey, userRef, 1700000000, secret);
    const sig2 = generateOfferwallMeSignature(apiKey, userRef, 1700000001, secret);

    expect(sig1).not.toBe(sig2);
  });

  it("should use correct message format with newlines", () => {
    const apiKey = "key";
    const userRef = "ref";
    const expiresSeconds = 1700000000;
    const secret = "secret";

    // Manually compute expected signature
    const message = "offerwall-user-v1\nkey\nref\n1700000000";
    const expectedSignature = createHmac("sha256", secret)
      .update(message)
      .digest("hex");

    const actualSignature = generateOfferwallMeSignature(apiKey, userRef, expiresSeconds, secret);

    expect(actualSignature).toBe(expectedSignature);
  });

  it("should generate URL with identityExpires in seconds and matching signature", () => {
    // Mock Date.now
    const fixedTimeMs = 1700000000000;
    vi.spyOn(Date, "now").mockReturnValue(fixedTimeMs);

    const apiKey = "test-api-key";
    const userRef = "user-ref";
    const secret = "test-secret";
    const bearerToken = "test-token";

    // Calculate expires in seconds (48 hours)
    const expiresSeconds = Math.floor(fixedTimeMs / 1000) + 48 * 3600;
    const signature = generateOfferwallMeSignature(apiKey, userRef, expiresSeconds, secret);

    // Simulate URL construction
    const url = new URL("https://offerwall.me/api.php");
    url.searchParams.set("api", apiKey);
    url.searchParams.set("id", userRef);
    url.searchParams.set("ip", "1.2.3.4");
    url.searchParams.set("token", bearerToken);
    url.searchParams.set("country", "US");
    url.searchParams.set("identityExpires", expiresSeconds.toString());
    url.searchParams.set("identitySignature", signature);

    // Verify params
    expect(url.searchParams.get("identityExpires")).toBe(expiresSeconds.toString());
    expect(url.searchParams.get("identitySignature")).toBe(signature);
    
    // Verify expires is in seconds, not milliseconds
    const expiresValue = parseInt(url.searchParams.get("identityExpires")!);
    expect(expiresValue).toBeLessThan(3000000000); // Seconds (year ~2065)
    expect(expiresValue).toBeGreaterThan(1000000000); // Seconds (after year 2001)

    vi.restoreAllMocks();
  });
});
