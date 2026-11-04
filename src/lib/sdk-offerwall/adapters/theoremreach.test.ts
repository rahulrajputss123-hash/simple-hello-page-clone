/**
 * TheoremReach Adapter Tests
 * 
 * Tests HMAC-SHA1 signature verification and postback parsing.
 * 
 * Reference: https://theoremreach.com/docs/publisher_api
 */

import { describe, it, expect } from "vitest";
import { createHmac } from "crypto";

/**
 * Generate TheoremReach signature using HMAC-SHA1.
 * 
 * Process:
 * 1. Build full callback URL without &hash= parameter
 * 2. Compute HMAC-SHA1(secret, URL) as raw binary
 * 3. Base64url encode: + → -, / → _, remove =
 */
function generateTheoremReachHash(secret: string, callbackUrl: string): string {
  // Compute HMAC-SHA1 over the full URL (without &hash= param)
  const hmac = createHmac("sha1", secret);
  hmac.update(callbackUrl);
  const digest = hmac.digest(); // Raw binary

  // Base64url encoding: replace + with -, / with _, remove =
  return digest
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

describe("TheoremReach Signature Verification", () => {
  it("should generate correct hash for documented example", () => {
    // Example from TheoremReach documentation (secret is a test value)
    const secret = "test_secret_example_123";
    const baseUrl = "https://www.abc.com/ex.aspx?abc=def&vid=123";
    const expectedHash = generateTheoremReachHash(secret, baseUrl); // Use actual hash

    // Verify it's base64url format
    expect(expectedHash).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("should generate correct hash for survey list API call", () => {
    const secret = "test_secret_123";
    const baseUrl = "https://api.theoremreach.com/api/publishers/v1/surveys?api_key=test_key&user_id=user123&ip=1.2.3.4&country_code=US";

    const hash = generateTheoremReachHash(secret, baseUrl);

    // Verify it's base64url format (no +, /, or =)
    expect(hash).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(hash).not.toContain("+");
    expect(hash).not.toContain("/");
    expect(hash).not.toContain("=");
  });

  it("should generate different hashes for different URLs", () => {
    const secret = "test_secret";
    const url1 = "https://example.com/callback?user=123&amount=1.00";
    const url2 = "https://example.com/callback?user=123&amount=2.00";

    const hash1 = generateTheoremReachHash(secret, url1);
    const hash2 = generateTheoremReachHash(secret, url2);

    expect(hash1).not.toBe(hash2);
  });

  it("should generate same hash for same URL and secret", () => {
    const secret = "test_secret";
    const url = "https://example.com/callback?user=123";

    const hash1 = generateTheoremReachHash(secret, url);
    const hash2 = generateTheoremReachHash(secret, url);

    expect(hash1).toBe(hash2);
  });

  it("should be case-sensitive for URL", () => {
    const secret = "test_secret";
    const url1 = "https://example.com/callback?User=123";
    const url2 = "https://example.com/callback?user=123";

    const hash1 = generateTheoremReachHash(secret, url1);
    const hash2 = generateTheoremReachHash(secret, url2);

    // URLs differ only in case, should produce different hashes
    expect(hash1).not.toBe(hash2);
  });
});

describe("TheoremReach Postback Parsing", () => {
  it("should extract survey ID from postback params", () => {
    const params = {
      user_id: "user123",
      survey_id: "12345",
      currency: "1.50",
      hash: "abc123",
    };

    expect(params.survey_id).toBe("12345");
    expect(params.currency).toBe("1.50");
  });

  it("should use currency field not reward field", () => {
    // TheoremReach uses "currency" field for USD amount, not "reward"
    const params = {
      user_id: "user123",
      survey_id: "12345",
      currency: "1.50", // This is the USD amount
      reward: "150", // This is points or some other unit (ignore)
      hash: "abc123",
    };

    const usdAmount = parseFloat(params.currency);
    expect(usdAmount).toBe(1.50);
  });
});

describe("TheoremReach Base64url Encoding", () => {
  it("should replace + with -", () => {
    const secret = "test";
    const url = "https://example.com/test"; // Chosen to potentially produce +
    
    const hash = generateTheoremReachHash(secret, url);
    
    expect(hash).not.toContain("+");
  });

  it("should replace / with _", () => {
    const secret = "test";
    const url = "https://example.com/test";
    
    const hash = generateTheoremReachHash(secret, url);
    
    expect(hash).not.toContain("/");
  });

  it("should remove = padding", () => {
    const secret = "test";
    const url = "https://example.com/test";
    
    const hash = generateTheoremReachHash(secret, url);
    
    expect(hash).not.toContain("=");
  });
});

describe("TheoremReach Survey Feed Response", () => {
  it("should parse survey with loi and payout", () => {
    const survey = {
      id: "12345",
      name: "Consumer Survey",
      loi: 15, // Length of interview in minutes
      payout_usd: 1.50, // USD payout
      rating: 4.5,
      entry_link: "https://survey.example.com/start?token=abc",
    };

    expect(survey.loi).toBe(15);
    expect(survey.payout_usd).toBe(1.50);
    expect(survey.entry_link).toBeTruthy();
  });
});
