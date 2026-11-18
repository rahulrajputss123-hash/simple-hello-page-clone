/**
 * Survey Feed Server Tests
 */

import { describe, it, expect } from "vitest";
import { createHmac } from "crypto";

/**
 * Sign a TheoremReach URL (for /surveys request or entry_link).
 * Hash: base64url(HMAC-SHA1(secret, fullUrlWithoutHash))
 */
function signTheoremReachUrl(url: string, secret: string): string {
  const signature = createHmac("sha1", secret)
    .update(url)
    .digest(); // Raw binary

  // Base64url encoding: replace + with -, / with _, remove =
  return signature
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

describe("TheoremReach URL Signing", () => {
  it("should match documentation example", () => {
    // Example from TheoremReach docs
    const key = "ZZ6VkORqV25iSWOVb5cwZ03zpns";
    const url = "https://www.abc.com/ex.aspx?abc=def&vid=123";
    const expectedHash = "VNBMolYjJug6cDQqOX4oddfteDw";

    const actualHash = signTheoremReachUrl(url, key);

    expect(actualHash).toBe(expectedHash);
  });

  it("should produce consistent hashes", () => {
    const secret = "test-secret";
    const url = "https://example.com/test?param=value";

    const hash1 = signTheoremReachUrl(url, secret);
    const hash2 = signTheoremReachUrl(url, secret);

    expect(hash1).toBe(hash2);
  });

  it("should produce different hashes for different URLs", () => {
    const secret = "test-secret";
    const url1 = "https://example.com/test?param=value1";
    const url2 = "https://example.com/test?param=value2";

    const hash1 = signTheoremReachUrl(url1, secret);
    const hash2 = signTheoremReachUrl(url2, secret);

    expect(hash1).not.toBe(hash2);
  });

  it("should be base64url encoded (no + / =)", () => {
    const secret = "test-secret";
    const url = "https://example.com/test";

    const hash = signTheoremReachUrl(url, secret);

    expect(hash).not.toMatch(/[+/=]/);
  });
});
