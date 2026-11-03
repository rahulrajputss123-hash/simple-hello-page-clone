/**
 * Torox SDK Offerwall adapter tests.
 * Validates MD5 signature verification, payout handling, and reversal detection.
 */
import { describe, it, expect } from "vitest";
import { createHash } from "crypto";

import toroxSdkAdapter from "./torox.server";
import type { SdkOfferwallProvider } from "../types";

const mockProvider: Pick<SdkOfferwallProvider, "postback_signature_secret_ref" | "secret_refs"> = {
  postback_signature_secret_ref: "TOROX_WALL_TOKEN",
  secret_refs: { secret_key: "TOROX_WALL_TOKEN" } as never,
};

// Mock secret
const TEST_SECRET = "test_secret_key_123";

// Helper to generate valid signature
function generateSignature(oid: string, userId: string, secret: string): string {
  return createHash("md5").update(`${oid}-${userId}-${secret}`, "utf8").digest("hex");
}

// Mock environment
const originalEnv = process.env;
beforeEach(() => {
  process.env = { ...originalEnv, TOROX_WALL_TOKEN: TEST_SECRET };
});
afterEach(() => {
  process.env = originalEnv;
});

describe("Torox SDK Adapter", () => {
  describe("Signature Verification", () => {
    it("should credit when signature is valid and payout is positive", () => {
      const oid = "offer_123";
      const userId = "550e8400-e29b-41d4-a716-446655440000";
      const payout = "1.50";
      const sig = generateSignature(oid, userId, TEST_SECRET);

      const result = toroxSdkAdapter.parsePostback!(mockProvider as never, {
        id: "conv_456",
        oid,
        user_id: userId,
        payout,
        sig,
        amount: "2.00",
        o_name: "Test Offer",
      });

      expect(result.providerTransactionId).toBe("conv_456");
      expect(result.providerUserRef).toBe(userId);
      expect(result.providerOfferId).toBe(oid);
      expect(result.currencyAmount).toBe(1.5);
    });

    it("should reject when signature is invalid", () => {
      const oid = "offer_123";
      const userId = "550e8400-e29b-41d4-a716-446655440000";
      const payout = "1.50";
      const invalidSig = "invalid_signature_hash";

      const result = toroxSdkAdapter.parsePostback!(mockProvider as never, {
        id: "conv_456",
        oid,
        user_id: userId,
        payout,
        sig: invalidSig,
      });

      expect(result.providerTransactionId).toBe(""); // Empty = rejected
      expect(result.currencyAmount).toBe(0);
    });

    it("should reject when secret is missing", () => {
      process.env.TOROX_WALL_TOKEN = "";

      const result = toroxSdkAdapter.parsePostback!(mockProvider as never, {
        id: "conv_456",
        oid: "offer_123",
        user_id: "550e8400-e29b-41d4-a716-446655440000",
        payout: "1.50",
        sig: "any_signature",
      });

      expect(result.providerTransactionId).toBe("");
      expect(result.currencyAmount).toBe(0);
    });

    it("should use correct signature format: md5(oid + '-' + user_id + '-' + secret)", () => {
      const oid = "offer_789";
      const userId = "user_abc";
      const secret = "my_secret";

      const expected = createHash("md5")
        .update(`${oid}-${userId}-${secret}`, "utf8")
        .digest("hex");

      expect(expected).toMatch(/^[a-f0-9]{32}$/);
    });
  });

  describe("Payout Handling", () => {
    it("should not credit when payout is zero", () => {
      const oid = "offer_123";
      const userId = "550e8400-e29b-41d4-a716-446655440000";
      const sig = generateSignature(oid, userId, TEST_SECRET);

      const result = toroxSdkAdapter.parsePostback!(mockProvider as never, {
        id: "conv_456",
        oid,
        user_id: userId,
        payout: "0",
        sig,
      });

      expect(result.providerTransactionId).toBe("conv_456"); // Valid signature
      expect(result.currencyAmount).toBe(0); // But no credit
    });

    it("should not credit when payout is negative (reversal)", () => {
      const oid = "offer_123";
      const userId = "550e8400-e29b-41d4-a716-446655440000";
      const sig = generateSignature(oid, userId, TEST_SECRET);

      const result = toroxSdkAdapter.parsePostback!(mockProvider as never, {
        id: "conv_456",
        oid,
        user_id: userId,
        payout: "-1.50",
        sig,
      });

      expect(result.providerTransactionId).toBe("conv_456"); // Valid signature
      expect(result.currencyAmount).toBe(0); // But no credit (reversal)
    });

    it("should use payout field, not amount field", () => {
      const oid = "offer_123";
      const userId = "550e8400-e29b-41d4-a716-446655440000";
      const sig = generateSignature(oid, userId, TEST_SECRET);

      const result = toroxSdkAdapter.parsePostback!(mockProvider as never, {
        id: "conv_456",
        oid,
        user_id: userId,
        payout: "1.50",
        amount: "10.00", // Different from payout
        sig,
      });

      expect(result.currencyAmount).toBe(1.5); // Uses payout, not amount
    });

    it("should handle decimal payouts correctly", () => {
      const oid = "offer_123";
      const userId = "550e8400-e29b-41d4-a716-446655440000";
      const sig = generateSignature(oid, userId, TEST_SECRET);

      const result = toroxSdkAdapter.parsePostback!(mockProvider as never, {
        id: "conv_456",
        oid,
        user_id: userId,
        payout: "0.05",
        sig,
      });

      expect(result.currencyAmount).toBe(0.05);
    });
  });

  describe("Required Fields", () => {
    it("should accept postback with all required fields", () => {
      const oid = "offer_123";
      const userId = "550e8400-e29b-41d4-a716-446655440000";
      const sig = generateSignature(oid, userId, TEST_SECRET);

      const result = toroxSdkAdapter.parsePostback!(mockProvider as never, {
        id: "conv_456",
        oid,
        user_id: userId,
        payout: "1.50",
        sig,
      });

      expect(result.providerTransactionId).toBe("conv_456");
      expect(result.providerUserRef).toBe(userId);
      expect(result.providerOfferId).toBe(oid);
      expect(result.currencyAmount).toBe(1.5);
    });

    it("should handle missing optional fields gracefully", () => {
      const oid = "offer_123";
      const userId = "550e8400-e29b-41d4-a716-446655440000";
      const sig = generateSignature(oid, userId, TEST_SECRET);

      const result = toroxSdkAdapter.parsePostback!(mockProvider as never, {
        id: "conv_456",
        oid,
        user_id: userId,
        payout: "1.50",
        sig,
        // Missing: amount, o_name, event, ip_address, subid1-3, timestamps
      });

      expect(result.providerTransactionId).toBe("conv_456");
      expect(result.currencyAmount).toBe(1.5);
    });
  });

  describe("Provider Configuration", () => {
    it("should have correct integration type", () => {
      expect(toroxSdkAdapter.integrationType).toBe("web_sdk");
    });

    it("should have correct slug", () => {
      expect(toroxSdkAdapter.slug).toBe("torox");
    });
  });

  describe("Raw Payload", () => {
    it("should include raw payload in result", () => {
      const oid = "offer_123";
      const userId = "550e8400-e29b-41d4-a716-446655440000";
      const sig = generateSignature(oid, userId, TEST_SECRET);

      const payload = {
        id: "conv_456",
        oid,
        user_id: userId,
        payout: "1.50",
        sig,
        event: "install",
        ip_address: "1.2.3.4",
      };

      const result = toroxSdkAdapter.parsePostback!(mockProvider as never, payload);

      expect(result.raw).toEqual(payload);
    });
  });
});
