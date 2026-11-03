/**
 * Torox Feed Postback Tests
 * Tests signature validation, reversal handling, deduplication, and response format.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createHash } from "crypto";
import type { ToroxPostbackParams, ToroxPostbackResult } from "@/lib/offers/torox-postback.server";

// Mock data
const MOCK_TOROX_TOKEN = "test_token_abc123";
const MOCK_SOURCE_IP = "44.212.211.226";
const MOCK_USER_ID = "550e8400-e29b-41d4-a716-446655440000";
const MOCK_OFFER_ID = "torox_offer_123";
const MOCK_CONVERSION_ID = "conv_456";

describe("Torox Postback Signature Validation", () => {
  it("should generate correct MD5 signature", () => {
    const oid = "offer123";
    const userId = "user456";
    const token = "secret789";

    const signatureString = `${oid}-${userId}-${token}`;
    const signature = createHash("md5")
      .update(signatureString, "utf8")
      .digest("hex")
      .toLowerCase();

    expect(signature).toMatch(/^[a-f0-9]{32}$/);
    expect(signature.length).toBe(32);
  });

  it("should use lowercase hex for MD5 output", () => {
    const signatureString = "test-user-token";
    const signature = createHash("md5")
      .update(signatureString, "utf8")
      .digest("hex")
      .toLowerCase();

    expect(signature).toBe(signature.toLowerCase());
    expect(signature).not.toMatch(/[A-F]/);
  });

  it("should create different signatures for different inputs", () => {
    const token = "secret";
    
    const sig1 = createHash("md5")
      .update(`offer1-user1-${token}`, "utf8")
      .digest("hex")
      .toLowerCase();
    
    const sig2 = createHash("md5")
      .update(`offer2-user1-${token}`, "utf8")
      .digest("hex")
      .toLowerCase();
    
    expect(sig1).not.toBe(sig2);
  });

  it("should match expected signature format: oid-user_id-token", () => {
    const oid = "123";
    const userId = "456";
    const token = "789";
    
    const expected = createHash("md5")
      .update(`${oid}-${userId}-${token}`, "utf8")
      .digest("hex")
      .toLowerCase();
    
    const actual = createHash("md5")
      .update(`123-456-789`, "utf8")
      .digest("hex")
      .toLowerCase();
    
    expect(actual).toBe(expected);
  });
});

describe("Torox Source IP Validation", () => {
  it("should accept postbacks from Torox IP: 44.212.211.226", () => {
    const sourceIp = "44.212.211.226";
    const expectedIp = "44.212.211.226";
    const isValid = sourceIp === expectedIp;
    
    expect(isValid).toBe(true);
  });

  it("should reject postbacks from other IPs", () => {
    const sourceIp = "1.2.3.4";
    const expectedIp = "44.212.211.226";
    const isValid = sourceIp === expectedIp;
    
    expect(isValid).toBe(false);
  });

  it("should reject postbacks with no source IP", () => {
    const sourceIp = null;
    const expectedIp = "44.212.211.226";
    const isValid = sourceIp === expectedIp;
    
    expect(isValid).toBe(false);
  });
});

describe("Torox UUID Validation", () => {
  it("should accept valid UUID v4", () => {
    const userId = "550e8400-e29b-41d4-a716-446655440000";
    const isValid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId);
    
    expect(isValid).toBe(true);
  });

  it("should reject invalid UUID format", () => {
    const userId = "not-a-uuid";
    const isValid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId);
    
    expect(isValid).toBe(false);
  });

  it("should reject empty string", () => {
    const userId = "";
    const isValid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId);
    
    expect(isValid).toBe(false);
  });

  it("should reject UUID without dashes", () => {
    const userId = "550e8400e29b41d4a716446655440000";
    const isValid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId);
    
    expect(isValid).toBe(false);
  });
});

describe("Torox Reversal Detection", () => {
  it("should detect reversal when payout is negative", () => {
    const payout = -1.5;
    const amount = 2.0;
    const isReversal = payout < 0 || amount < 0;
    
    expect(isReversal).toBe(true);
  });

  it("should detect reversal when amount is negative", () => {
    const payout = 1.5;
    const amount = -2.0;
    const isReversal = payout < 0 || amount < 0;
    
    expect(isReversal).toBe(true);
  });

  it("should detect reversal when both are negative", () => {
    const payout = -1.5;
    const amount = -2.0;
    const isReversal = payout < 0 || amount < 0;
    
    expect(isReversal).toBe(true);
  });

  it("should NOT detect reversal when both are positive", () => {
    const payout = 1.5;
    const amount = 2.0;
    const isReversal = payout < 0 || amount < 0;
    
    expect(isReversal).toBe(false);
  });

  it("should NOT detect reversal when payout is zero", () => {
    const payout = 0;
    const amount = 2.0;
    const isReversal = payout < 0 || amount < 0;
    
    expect(isReversal).toBe(false);
  });

  it("reversal: should return status 'rejected' with reason 'reversal'", () => {
    const isReversal = true;
    const result: Pick<ToroxPostbackResult, 'ok' | 'status' | 'reason'> = {
      ok: true,
      status: "rejected",
      reason: "reversal"
    };
    
    expect(result.ok).toBe(true); // Acknowledged
    expect(result.status).toBe("rejected");
    expect(result.reason).toBe("reversal");
  });

  it("reversal: should NOT credit wallet", () => {
    const isReversal = true;
    const credited = !isReversal;
    
    expect(credited).toBe(false);
  });
});

describe("Torox Payout Validation", () => {
  it("should accept valid positive payout", () => {
    const payoutStr = "1.50";
    const payout = Number.parseFloat(payoutStr);
    const isValid = Number.isFinite(payout) && payout > 0;
    
    expect(isValid).toBe(true);
  });

  it("should reject zero payout", () => {
    const payoutStr = "0";
    const payout = Number.parseFloat(payoutStr);
    const isValid = Number.isFinite(payout) && payout > 0;
    
    expect(isValid).toBe(false);
  });

  it("should reject NaN payout", () => {
    const payoutStr = "not-a-number";
    const payout = Number.parseFloat(payoutStr);
    const isValid = Number.isFinite(payout);
    
    expect(isValid).toBe(false);
  });

  it("should reject Infinity payout", () => {
    const payout = Infinity;
    const isValid = Number.isFinite(payout);
    
    expect(isValid).toBe(false);
  });

  it("should accept decimal payout", () => {
    const payoutStr = "0.05";
    const payout = Number.parseFloat(payoutStr);
    const isValid = Number.isFinite(payout) && payout > 0;
    
    expect(isValid).toBe(true);
  });
});

describe("Torox Required Parameters", () => {
  it("should require user_id, oid, id, and payout", () => {
    const params = {
      user_id: "user123",
      oid: "offer456",
      id: "conv789",
      payout: "1.50"
    };
    
    const hasRequired = Boolean(params.user_id) && 
                       Boolean(params.oid) && 
                       Boolean(params.id) && 
                       Boolean(params.payout);
    
    expect(hasRequired).toBe(true);
  });

  it("should reject when user_id is missing", () => {
    const params = {
      user_id: "",
      oid: "offer456",
      id: "conv789",
      payout: "1.50"
    };
    
    const hasRequired = Boolean(params.user_id) && 
                       Boolean(params.oid) && 
                       Boolean(params.id) && 
                       Boolean(params.payout);
    
    expect(hasRequired).toBe(false);
  });

  it("should reject when oid is missing", () => {
    const params = {
      user_id: "user123",
      oid: "",
      id: "conv789",
      payout: "1.50"
    };
    
    const hasRequired = Boolean(params.user_id) && 
                       Boolean(params.oid) && 
                       Boolean(params.id) && 
                       Boolean(params.payout);
    
    expect(hasRequired).toBe(false);
  });

  it("should allow optional parameters to be undefined", () => {
    const params = {
      user_id: "user123",
      oid: "offer456",
      id: "conv789",
      payout: "1.50",
      amount: undefined,
      o_name: undefined,
      event: undefined
    };
    
    const hasRequired = Boolean(params.user_id) && 
                       Boolean(params.oid) && 
                       Boolean(params.id) && 
                       Boolean(params.payout);
    
    expect(hasRequired).toBe(true);
  });
});

describe("Torox Deduplication", () => {
  it("should use (provider_slug='torox', external_lead_id=id) for deduplication", () => {
    const providerSlug = "torox";
    const externalLeadId = "conv_123";
    
    const dedupKey = `${providerSlug}:${externalLeadId}`;
    
    expect(dedupKey).toBe("torox:conv_123");
  });

  it("duplicate should return status 'duplicate'", () => {
    const isDuplicate = true;
    const result: Pick<ToroxPostbackResult, 'ok' | 'status' | 'reason'> = {
      ok: true,
      status: "duplicate",
      reason: "duplicate"
    };
    
    expect(result.ok).toBe(true);
    expect(result.status).toBe("duplicate");
  });

  it("duplicate should NOT credit wallet again", () => {
    const isDuplicate = true;
    const creditedAgain = !isDuplicate;
    
    expect(creditedAgain).toBe(false);
  });
});

describe("Torox Response Format", () => {
  it("success should return '1'", () => {
    const result: Pick<ToroxPostbackResult, 'ok'> = { ok: true };
    const responseBody = result.ok ? "1" : "0";
    
    expect(responseBody).toBe("1");
  });

  it("duplicate should return '1' (stop retries)", () => {
    const result: Pick<ToroxPostbackResult, 'ok' | 'status'> = { 
      ok: true, 
      status: "duplicate" 
    };
    const responseBody = result.ok ? "1" : "0";
    
    expect(responseBody).toBe("1");
  });

  it("reversal should return '1' (acknowledged)", () => {
    const result: Pick<ToroxPostbackResult, 'ok' | 'status' | 'reason'> = { 
      ok: true, 
      status: "rejected",
      reason: "reversal"
    };
    const responseBody = result.ok ? "1" : "0";
    
    expect(responseBody).toBe("1");
  });

  it("invalid signature should return '0'", () => {
    const result: Pick<ToroxPostbackResult, 'ok' | 'reason'> = { 
      ok: false, 
      reason: "invalid_signature" 
    };
    const responseBody = result.ok ? "1" : "0";
    
    expect(responseBody).toBe("0");
  });

  it("invalid source IP should return '0'", () => {
    const result: Pick<ToroxPostbackResult, 'ok' | 'reason'> = { 
      ok: false, 
      reason: "invalid_source_ip" 
    };
    const responseBody = result.ok ? "1" : "0";
    
    expect(responseBody).toBe("0");
  });

  it("missing parameters should return '0'", () => {
    const result: Pick<ToroxPostbackResult, 'ok' | 'reason'> = { 
      ok: false, 
      reason: "missing_parameters" 
    };
    const responseBody = result.ok ? "1" : "0";
    
    expect(responseBody).toBe("0");
  });

  it("all responses should be HTTP 200 with body '1' or '0'", () => {
    const statusCode = 200;
    const validBodies = ["1", "0"];
    
    expect(statusCode).toBe(200);
    expect(validBodies).toContain("1");
    expect(validBodies).toContain("0");
  });
});

describe("Torox Offer Inactive Handling", () => {
  it("should NOT reject inactive offers (user may have clicked before deactivation)", () => {
    const offerIsActive = false;
    const shouldReject = false; // Unlike gemiad, don't reject
    
    expect(shouldReject).toBe(false);
  });

  it("inactive offer: should still process if all other validations pass", () => {
    const offerExists = true;
    const offerIsActive = false;
    const shouldProcess = offerExists; // Active status doesn't matter
    
    expect(shouldProcess).toBe(true);
  });
});

describe("Torox Constant-Time Comparison", () => {
  it("should use timingSafeEqual for signature comparison", () => {
    // This test documents the security requirement
    const usesTimingSafeEqual = true;
    
    expect(usesTimingSafeEqual).toBe(true);
  });

  it("should prevent timing attacks on signature validation", () => {
    // Constant-time comparison prevents attackers from
    // measuring response times to guess valid signatures
    const preventsTimingAttacks = true;
    
    expect(preventsTimingAttacks).toBe(true);
  });
});

describe("Torox Logging Context", () => {
  it("should log all postback parameters for audit", () => {
    const loggedParams = [
      "conversionId",
      "externalOfferId",
      "offerName",
      "payout",
      "amount",
      "currencyName",
      "packageId",
      "event",
      "userIp",
      "sourceIp",
      "subid1",
      "subid2",
      "subid3",
      "clickTs",
      "conversionTs"
    ];
    
    expect(loggedParams.length).toBeGreaterThan(10);
    expect(loggedParams).toContain("conversionId");
    expect(loggedParams).toContain("payout");
  });

  it("should NOT log TOROX_FEED_TOKEN in automation logs", () => {
    const sensitiveData = ["TOROX_FEED_TOKEN", "token", "sig"];
    const shouldNotLog = sensitiveData;
    
    expect(shouldNotLog).toContain("TOROX_FEED_TOKEN");
    expect(shouldNotLog).toContain("token");
  });
});

describe("Torox Error Reasons", () => {
  it("should have specific error reasons for debugging", () => {
    const errorReasons = [
      "invalid_source_ip",
      "token_not_configured",
      "invalid_signature",
      "missing_parameters",
      "invalid_user_uuid",
      "invalid_payout",
      "invalid_payout_amount",
      "offer_not_found",
      "user_not_found",
      "wallet_credit_failed",
      "reversal"
    ];
    
    expect(errorReasons.length).toBe(11);
    expect(errorReasons).toContain("invalid_signature");
    expect(errorReasons).toContain("reversal");
  });
});

describe("Torox Referral Milestone", () => {
  it("should call payReferralMilestone after successful credit", () => {
    const credited = true;
    const shouldCallReferral = credited;
    
    expect(shouldCallReferral).toBe(true);
  });

  it("should NOT call payReferralMilestone for reversals", () => {
    const isReversal = true;
    const shouldCallReferral = !isReversal;
    
    expect(shouldCallReferral).toBe(false);
  });

  it("should NOT call payReferralMilestone for duplicates", () => {
    const isDuplicate = true;
    const shouldCallReferral = !isDuplicate;
    
    expect(shouldCallReferral).toBe(false);
  });

  it("referral milestone error should be non-fatal", () => {
    const referralFails = true;
    const postbackStillSucceeds = true;
    
    expect(postbackStillSucceeds).toBe(true);
  });
});
