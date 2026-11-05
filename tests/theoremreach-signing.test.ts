import { describe, it, expect } from "vitest";
import { createHmac } from "crypto";

/**
 * Unit test for TheoremReach URL signing per their documentation.
 * Example from docs:
 * - Secret: ZZ6VkORqV25iSWOVb5cwZ03zpns
 * - URL: https://www.abc.com/ex.aspx?abc=def&vid=123
 * - Expected hash: VNBMolYjJug6cDQqOX4oddfteDw
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
    const secret = "ZZ6VkORqV25iSWOVb5cwZ03zpns";
    const url = "https://www.abc.com/ex.aspx?abc=def&vid=123";
    const expectedHash = "VNBMolYjJug6cDQqOX4oddfteDw";

    const actualHash = signTheoremReachUrl(url, secret);

    expect(actualHash).toBe(expectedHash);
  });

  it("should produce base64url encoding (no + / =)", () => {
    const secret = "test-secret";
    const url = "https://example.com/test?param=value";

    const hash = signTheoremReachUrl(url, secret);

    // Base64url should not contain +, /, or =
    expect(hash).not.toContain("+");
    expect(hash).not.toContain("/");
    expect(hash).not.toContain("=");
  });

  it("should be deterministic for same input", () => {
    const secret = "my-secret";
    const url = "https://example.com/api?key=123";

    const hash1 = signTheoremReachUrl(url, secret);
    const hash2 = signTheoremReachUrl(url, secret);

    expect(hash1).toBe(hash2);
  });

  it("should differ for different URLs", () => {
    const secret = "my-secret";
    const url1 = "https://example.com/api?key=123";
    const url2 = "https://example.com/api?key=456";

    const hash1 = signTheoremReachUrl(url1, secret);
    const hash2 = signTheoremReachUrl(url2, secret);

    expect(hash1).not.toBe(hash2);
  });
});
