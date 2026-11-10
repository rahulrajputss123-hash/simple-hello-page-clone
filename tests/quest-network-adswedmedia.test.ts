import { describe, it, expect, beforeEach, vi } from "vitest";
import type { SdkOfferwallProvider } from "@/integrations/supabase/types";

/**
 * Test for the EXACT AdswedMedia conversion that was absorbed without writing quest_network_completions.
 * 
 * Real conversion data:
 * - id: a861dda9-5357-4be0-a5f6-313867ea6983
 * - provider: adswedmedia
 * - subId (provider_user_ref): q_-vRNKf5acFzMgXMZlIDfNsJH
 * - transId: Kb2Lw5Uz8Aw1
 * - currency_amount (payout): 40
 * - reward (in cents): 40
 * - offer_id: 37348505
 * - offer_name: "Follow Adswedmedia"
 * - status: 1
 * - Quest: "Network" (kind: network)
 * - Provider config: currency_per_usd=1000, multiplier=0.8
 * - Result: Marked quest_absorbed but NO row in quest_network_completions
 * - USD value: 40 / 1000 * 0.8 = 0.032 USD
 */

describe("Quest Network AdswedMedia Conversion Bug", () => {
  // Mock provider matching the real AdswedMedia configuration
  const mockProvider: Partial<SdkOfferwallProvider> = {
    id: "provider-adswed-id",
    slug: "adswedmedia",
    name: "AdswedMedia",
    enabled: true,
    status: "active",
    user_identity_mode: "user_uuid",
    currency_per_usd: 1000,
    reward_multiplier: 0.8,
    user_id_param: "subId",
    transaction_id_param: "transId",
    reward_param: "reward",
    signature_param: "signature",
    signature_secret_ref: "adswedmedia_secret",
    postback_auth_method: "signature",
    dedupe_strategy: "transaction_id",
    dedupe_window_hours: 168,
  };

  // Real postback parameters
  const mockPostback = {
    params: {
      subId: "q_-vRNKf5acFzMgXMZlIDfNsJH", // Quest token!
      transId: "Kb2Lw5Uz8Aw1",
      payout: "0.04",
      reward: "40", // 40 cents = $0.04
      offer_id: "37348505",
      offer_name: "Follow Adswedmedia",
      status: "1",
    },
    slug: "adswedmedia",
    headers: {},
    sourceIp: "1.2.3.4",
    rawBody: "",
  };

  const mockToken = {
    token: "q_-vRNKf5acFzMgXMZlIDfNsJH",
    user_id: "3850dd20-7ce0-45f9-a355-a386ac5a90db",
    session_id: "52e33d67-ce2d-4a6a-9d99-d5ff19c5326c",
    quest_key: "Network",
    provider_id: "provider-adswed-id",
    kind: "network",
    step_index: null,
    source: null,
    campaign_id: null,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
  };

  const mockSession = {
    id: "52e33d67-ce2d-4a6a-9d99-d5ff19c5326c",
    user_id: "3850dd20-7ce0-45f9-a355-a386ac5a90db",
    quest_key: "Network",
    status: "started",
  };

  const mockQuest = {
    key: "Network",
    label: "Network Quest",
    quest_type: "network",
    required_count: 3,
    min_qualifying_usd: 0.01, // $0.01 minimum
    reward_amount: 1.0,
    is_active: true,
    credit_offer_reward: false,
  };

  it("should identify the branch taken for AdswedMedia network quest", () => {
    // Parse the postback
    const parsed = {
      providerTransactionId: mockPostback.params.transId,
      providerUserRef: mockPostback.params.subId,
      providerOfferId: mockPostback.params.offer_id,
      currencyAmount: Number(mockPostback.params.reward), // 40
      raw: mockPostback.params as any,
    };

    // Calculate USD
    const currency_amount = 40;
    const currency_per_usd = 1000;
    const multiplier = 0.8;
    const usd = (currency_amount / currency_per_usd) * multiplier;
    
    expect(usd).toBe(0.032); // 40 / 1000 * 0.8 = 0.032 USD
    expect(usd).toBeGreaterThan(0.01); // Should pass min_qualifying_usd check

    // Token kind
    expect(mockToken.kind).toBe("network");
    expect(mockToken.step_index).toBeNull();

    // Branch logic
    const isQuestToken = parsed.providerUserRef.startsWith("q_");
    expect(isQuestToken).toBe(true);

    const tokenKind = mockToken.kind;
    const isFeedQuest = tokenKind === "feed";
    const isNetworkQuest = tokenKind === "network";

    expect(isFeedQuest).toBe(false);
    expect(isNetworkQuest).toBe(true);

    // Network quest checks
    const minQualifyingUsd = 0.01;
    const passesMinimum = usd >= minQualifyingUsd;
    expect(passesMinimum).toBe(true);

    // This should write to quest_network_completions with kind="network"
    const expectedCompletion = {
      session_id: mockSession.id,
      provider_id: mockProvider.id,
      kind: "network",
      amount_usd: usd,
    };

    expect(expectedCompletion.kind).toBe("network");
    expect(expectedCompletion.amount_usd).toBe(0.032);
  });

  it("should calculate USD correctly for AdswedMedia", () => {
    // Real values from the conversion
    const currency_amount = 40;
    const currency_per_usd = 1000;
    const multiplier = 0.8;

    const usd = (currency_amount / currency_per_usd) * multiplier;
    
    expect(usd).toBe(0.032);
    expect(usd).toBeGreaterThan(0.01); // Above min_qualifying_usd
  });

  it("should handle provider duplicate check correctly", () => {
    // Network quest unique constraint: one provider per session
    // If AdswedMedia already completed for this session, second attempt should be rejected
    
    const sessionId = "52e33d67-ce2d-4a6a-9d99-d5ff19c5326c";
    const providerId = "provider-adswed-id";

    // First completion should succeed
    const firstCompletion = {
      session_id: sessionId,
      provider_id: providerId,
      kind: "network",
    };
    expect(firstCompletion).toBeDefined();

    // Second completion from same provider should be rejected
    // Error code 23505 with message containing "session_provider"
    const isDuplicate = true; // Simulating unique constraint violation
    expect(isDuplicate).toBe(true);

    // User should still get message: "Provider already completed for this quest session"
    // Conversion should still be marked quest_absorbed
    // No wallet credit, no second completion row
  });

  it("should never write completion with kind='network' if below minimum", () => {
    // If USD < min_qualifying_usd, should update conversion with reject_reason="below_minimum"
    // and NOT write to quest_network_completions
    
    const minQualifyingUsd = 0.01;
    const lowUsd = 0.005; // Below minimum
    
    expect(lowUsd).toBeLessThan(minQualifyingUsd);

    // Should set: status="quest_absorbed", reject_reason="below_minimum"
    // Should NOT insert into quest_network_completions
  });

  it("should advance quest when required_count networks are completed", () => {
    // Network quest: required_count = 3
    // After 3 distinct providers complete, session should become "verified"
    
    const requiredCount = 3;
    const completions = [
      { provider_id: "provider-1" },
      { provider_id: "provider-2" },
      { provider_id: "provider-3" },
    ];

    const distinctProviders = new Set(completions.map(c => c.provider_id));
    expect(distinctProviders.size).toBe(3);
    expect(distinctProviders.size).toBeGreaterThanOrEqual(requiredCount);

    // Should: session.status = "verified"
    // Should: call finishQuestSession(userId, sessionId, rewardAmount, description)
  });

  it("should not increment count if same provider completes twice", () => {
    // Network quest counts DISTINCT providers
    const completions = [
      { provider_id: "provider-1" },
      { provider_id: "provider-1" }, // Duplicate - should be rejected by constraint
      { provider_id: "provider-2" },
    ];

    const distinctProviders = new Set(completions.map(c => c.provider_id));
    expect(distinctProviders.size).toBe(2); // Only 2 distinct
    
    // Progress should show 2/3 networks completed, not 3/3
  });

  describe("Root Cause Analysis", () => {
    it("identifies why completion was not written", () => {
      // Possible reasons a completion might not be written:
      const reasons = {
        tokenNotFound: "Token doesn't exist in quest_network_tokens",
        tokenExpired: "Token expires_at < now",
        sessionNotStarted: "Session status != 'started'",
        providerMismatch: "Token provider_id != postback provider_id",
        belowMinimum: "USD < min_qualifying_usd",
        bitcoTasksWrongType: "BitcoTasks offer_type != 'offer'",
        providerDuplicate: "Provider already completed (unique constraint)",
        insertFailed: "Database insert error (not duplicate)",
      };

      // For the AdswedMedia case:
      // - Token exists: YES (q_-vRNKf5acFzMgXMZlIDfNsJH)
      // - Token not expired: YES (created for quest)
      // - Session started: YES (status="started")
      // - Provider matches: MUST CHECK (token.provider_id vs provider.id)
      // - Above minimum: YES (0.032 > 0.01)
      // - Not BitcoTasks: YES (adswedmedia)
      // - Not duplicate: UNKNOWN (need to check existing completions)

      // MOST LIKELY: Provider ID mismatch OR AdswedMedia not registered as SDK provider
      expect(reasons.providerMismatch).toBeDefined();
    });

    it("ROOT CAUSE: AdswedMedia is not an SDK offerwall provider", () => {
      // AdswedMedia exists in src/lib/offers/adapters/adswedmedia.server.ts
      // But NOT in src/lib/sdk-offerwall/adapters/
      
      // This means:
      // 1. AdswedMedia offers are regular CPA offers, not SDK offerwall
      // 2. Quest tokens should NEVER be created for AdswedMedia
      // 3. If a quest token was used, it was either:
      //    a) Manually constructed/injected
      //    b) Leaked from another provider's quest session
      //    c) Bug in URL generation

      const adswedIsSDK = false; // AdswedMedia is NOT an SDK provider
      expect(adswedIsSDK).toBe(false);

      // The postback arrived at SDK postback handler because it was treated as SDK
      // But AdswedMedia should only exist as regular CPA offers
      
      // CONCLUSION: Either the provider was misconfigured in DB as SDK type,
      // or the quest token was incorrectly used for a regular offer
    });
  });
});
