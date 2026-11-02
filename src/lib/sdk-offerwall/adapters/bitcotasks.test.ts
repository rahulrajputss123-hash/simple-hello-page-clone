import { describe, it, expect, vi, beforeEach } from "vitest";
import { bitcotasksSdkAdapter, FEED_KIND_OFFER_TYPES } from "./bitcotasks.server";
import type { SdkOfferwallProvider } from "../types";

// Mock provider configuration
const mockProvider: SdkOfferwallProvider = {
  id: "test-bitcotasks-id",
  slug: "bitcotasks",
  name: "BitcoTasks",
  enabled: true,
  status: "active",
  integration_type: "api",
  platforms: ["web", "android", "ios"],
  user_identity_mode: "user_uuid",
  transaction_id_param: "transId",
  user_id_param: "subId",
  reward_param: "reward",
  dedupe_strategy: "transaction_id",
  dedupe_window_hours: 48,
  postback_auth_mode: "ip_allowlist",
  postback_ip_allowlist: ["45.14.135.48"],
  postback_signature_secret_ref: "BITCOTASKS_SECRET",
  currency_per_usd: 1000,
  app_id: null,
  logo_url: null,
  tagline: null,
  lock_type: "none",
  unlock_at: null,
  required_lifetime_earned: null,
  display_order: 0,
  extra_config: null,
  secret_refs: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe("BitcoTasks SDK Adapter", () => {
  beforeEach(() => {
    // Set secret in env
    process.env.BITCOTASKS_SECRET = "test-secret-key";
  });

  describe("parsePostback", () => {
    it("credits a valid normal postback (status=1, debug=0)", () => {
      const payload = {
        subId: "user-uuid-123",
        transId: "txn-456",
        offer_name: "Test Offer",
        offer_type: "offer",
        reward: "1000",
        reward_name: "Credits",
        reward_value: "1000",
        payout: "1.00",
        userIp: "1.2.3.4",
        country: "US",
        status: "1",
        debug: "0",
        // Valid signature: md5("user-uuid-123txn-4561000test-secret-key")
        signature: "e8f5c3a7d2b9f6e1a4c8d7b3e9f2a5c1",
      };

      // Compute actual signature for verification
      const crypto = require("crypto");
      const actualSig = crypto
        .createHash("md5")
        .update(`${payload.subId}${payload.transId}${payload.reward}test-secret-key`)
        .digest("hex");
      payload.signature = actualSig;

      const result = bitcotasksSdkAdapter.parsePostback(mockProvider, payload);

      expect(result.providerTransactionId).toBe("txn-456");
      expect(result.providerUserRef).toBe("user-uuid-123");
      expect(result.providerOfferId).toBe("Test Offer");
      expect(result.currencyAmount).toBe(1000);
      expect(result.raw).toEqual(payload);
    });

    it("credits nothing when signature is invalid", () => {
      const payload = {
        subId: "user-uuid-123",
        transId: "txn-456",
        offer_name: "Test Offer",
        offer_type: "offer",
        reward: "1000",
        status: "1",
        debug: "0",
        signature: "invalid-signature",
      };

      const result = bitcotasksSdkAdapter.parsePostback(mockProvider, payload);

      expect(result.providerTransactionId).toBe(""); // Empty = rejected
      expect(result.currencyAmount).toBe(0);
    });

    it("credits nothing when debug=1 (test postback)", () => {
      const payload = {
        subId: "user-uuid-123",
        transId: "txn-test-789",
        offer_name: "Test Offer",
        offer_type: "offer",
        reward: "500",
        status: "1",
        debug: "1", // Test postback
      };

      const crypto = require("crypto");
      const actualSig = crypto
        .createHash("md5")
        .update(`${payload.subId}${payload.transId}${payload.reward}test-secret-key`)
        .digest("hex");
      payload.signature = actualSig;

      const result = bitcotasksSdkAdapter.parsePostback(mockProvider, payload);

      expect(result.providerTransactionId).toBe("txn-test-789"); // Valid signature
      expect(result.currencyAmount).toBe(0); // But no credit due to debug=1
    });

    it("credits nothing when status=2 (chargeback)", () => {
      const payload = {
        subId: "user-uuid-123",
        transId: "txn-chargeback-999",
        offer_name: "Charged Back Offer",
        offer_type: "offer",
        reward: "2000",
        status: "2", // Chargeback
        debug: "0",
      };

      const crypto = require("crypto");
      const actualSig = crypto
        .createHash("md5")
        .update(`${payload.subId}${payload.transId}${payload.reward}test-secret-key`)
        .digest("hex");
      payload.signature = actualSig;

      const result = bitcotasksSdkAdapter.parsePostback(mockProvider, payload);

      expect(result.providerTransactionId).toBe("txn-chargeback-999"); // Valid signature
      expect(result.currencyAmount).toBe(0); // But no credit due to status=2
    });

    it("logs warning when reward_value differs from currency_per_usd", () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const payload = {
        subId: "user-uuid-123",
        transId: "txn-mismatch",
        offer_name: "Test Offer",
        offer_type: "offer",
        reward: "1000",
        reward_value: "500", // Different from provider's 1000
        status: "1",
        debug: "0",
      };

      const crypto = require("crypto");
      const actualSig = crypto
        .createHash("md5")
        .update(`${payload.subId}${payload.transId}${payload.reward}test-secret-key`)
        .digest("hex");
      payload.signature = actualSig;

      bitcotasksSdkAdapter.parsePostback(mockProvider, payload);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("reward_value (500) differs from provider currency_per_usd (1000)"),
      );

      consoleWarnSpy.mockRestore();
    });

    it("returns empty transactionId when secret is missing", () => {
      delete process.env.BITCOTASKS_SECRET;

      const payload = {
        subId: "user-uuid-123",
        transId: "txn-456",
        reward: "1000",
        status: "1",
        debug: "0",
        signature: "any-signature",
      };

      const result = bitcotasksSdkAdapter.parsePostback(mockProvider, payload);

      expect(result.providerTransactionId).toBe(""); // Cannot verify without secret
      expect(result.currencyAmount).toBe(0);
    });
  });

  describe("FEED_KIND_OFFER_TYPES mapping", () => {
    it("maps ptc feed kind to ptc offer_type", () => {
      expect(FEED_KIND_OFFER_TYPES.ptc).toEqual(["ptc"]);
    });

    it("maps shortlink feed kind to shortlink offer_type", () => {
      expect(FEED_KIND_OFFER_TYPES.shortlink).toEqual(["shortlink"]);
    });

    it("maps article feed kind to article and task offer_types", () => {
      expect(FEED_KIND_OFFER_TYPES.article).toEqual(["article", "task"]);
    });
  });
});

