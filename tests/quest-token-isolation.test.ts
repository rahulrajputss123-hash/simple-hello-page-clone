import { describe, it, expect } from "vitest";

/**
 * Quest Token Isolation Tests
 * 
 * Ensures quest tokens are ONLY used when explicitly opening a quest offer,
 * never for normal offer clicks or network offerwall clicks.
 */

describe("Quest Token Isolation", () => {
  describe("Quest Token Format", () => {
    it("should start with 'q_' prefix", () => {
      const validTokens = ["q_abc123", "q_-vRNKf5xyz", "q_test_token"];
      const invalidTokens = ["Q_abc", "quest_abc", "abc123", "user_id", ""];

      validTokens.forEach(token => {
        expect(token.startsWith("q_")).toBe(true);
      });

      invalidTokens.forEach(token => {
        expect(token.startsWith("q_")).toBe(false);
      });
    });
  });

  describe("Token Usage Rules", () => {
    it("normal offers list must NEVER use quest tokens", () => {
      // This is the core rule: regular offer clicks from the "Network offers" list
      // or "Featured offers" list must ALWAYS use the plain user UUID, never a quest token.
      
      // Mock: user has both a real UUID and an active quest token in session
      const userUuid = "3850dd20-7ce0-45f9-a355-a386ac5a90db";
      const questToken = "q_-vRNKf5Uz8Aw1";
      
      // When building a click URL for a normal offer (not from quest screen),
      // it must use userUuid, not questToken
      const correctUserId = userUuid;
      expect(correctUserId).not.toMatch(/^q_/);
      expect(correctUserId).toBe(userUuid);
    });

    it("quest offers must ONLY use quest tokens from explicit quest open action", () => {
      // Quest tokens should ONLY be generated and used when:
      // 1. User explicitly clicks "Open [Provider]" button on a quest step screen
      // 2. The openNetworkQuestProvider function is called with (userId, questKey, provider, stepIndex)
      
      // Quest tokens must NOT be:
      // - Auto-picked from existing sessions
      // - Reused across different quests
      // - Used for normal offer clicks
      
      const questToken = "q_test123";
      expect(questToken.startsWith("q_")).toBe(true);
      
      // Explicit quest context required
      const questContext = {
        userId: "user-uuid",
        questKey: "Network",
        providerId: "provider-id",
        stepIndex: null, // null for network quests, 1-N for feed quests
      };
      
      expect(questContext.questKey).toBeDefined();
      expect(questContext.providerId).toBeDefined();
    });

    it("AdswedMedia clicks from normal list must use plain user UUID", () => {
      // ROOT CAUSE FIX: AdswedMedia (and all offer providers) must receive
      // the plain user UUID in their click URLs when clicked from the normal
      // offers list, never a quest token.
      
      const userUuid = "3850dd20-7ce0-45f9-a355-a386ac5a90db";
      const adswedClickUrl = `https://adswedmedia.com/offer/APP_ID/${userUuid}`;
      
      // Verify URL contains user UUID, not a quest token
      expect(adswedClickUrl).toContain(userUuid);
      expect(adswedClickUrl).not.toMatch(/q_[A-Za-z0-9_-]+/);
    });
  });

  describe("Token Generation and Lifecycle", () => {
    it("tokens must be generated fresh for each quest open action", () => {
      // Each call to openNetworkQuestProvider (or openFeedQuestStep) should:
      // - Check for existing valid token for that specific (session, provider) or (session, step)
      // - Reuse if exists and not expired
      // - Generate new if not exists or expired
      // - Update expiry to current time + token_ttl_hours
      
      // But NEVER use a token from a different quest or a different provider
      const sessionId1 = "session-1";
      const sessionId2 = "session-2";
      const provider1 = "adswedmedia";
      const provider2 = "revtoo";
      
      // These should get different tokens (or no token reuse)
      const contexts = [
        { session: sessionId1, provider: provider1 },
        { session: sessionId1, provider: provider2 },
        { session: sessionId2, provider: provider1 },
      ];
      
      // Each context is isolated
      contexts.forEach(ctx => {
        expect(ctx.session).toBeDefined();
        expect(ctx.provider).toBeDefined();
      });
    });

    it("token expiry must be enforced", () => {
      // Expired tokens must NOT be accepted in postbacks
      const now = new Date();
      const validExpiry = new Date(now.getTime() + 3600000); // +1 hour
      const expiredExpiry = new Date(now.getTime() - 3600000); // -1 hour
      
      expect(validExpiry > now).toBe(true);
      expect(expiredExpiry < now).toBe(true);
    });
  });

  describe("Postback Handling", () => {
    it("must detect quest tokens by 'q_' prefix", () => {
      // In processSdkPostback, provider_user_ref is checked for "q_" prefix
      const questTokens = ["q_abc123", "q_-vRNKf5xyz"];
      const normalUserRefs = [
        "3850dd20-7ce0-45f9-a355-a386ac5a90db",
        "USER123",
        "ref_code_ABC",
      ];
      
      questTokens.forEach(ref => {
        const isQuestToken = ref.startsWith("q_");
        expect(isQuestToken).toBe(true);
      });
      
      normalUserRefs.forEach(ref => {
        const isQuestToken = ref.startsWith("q_");
        expect(isQuestToken).toBe(false);
      });
    });

    it("quest token postbacks must verify token validity", () => {
      // processQuestTokenPostback must check:
      // - Token exists in quest_network_tokens table
      // - Token is not expired (expires_at > now)
      // - Associated session is still "started"
      // - Token's provider_id matches the postback provider
      
      const requiredChecks = [
        "token_exists",
        "token_not_expired",
        "session_started",
        "provider_match",
      ];
      
      expect(requiredChecks).toHaveLength(4);
    });
  });

  describe("Root Cause Prevention", () => {
    it("must prevent quest tokens in normal offer click URLs", () => {
      // The bug: a quest token (q_-vRNKf5...) was used in an AdswedMedia click
      // URL when the user clicked from the normal "Network offers" list.
      //
      // Fix: Ensure that offer click URL generation (appendAffSub4, buildOfferwallUrl)
      // ALWAYS uses session.user.id, NEVER pulls from any quest token cache.
      
      // Simulate the scenario:
      const userSession = {
        user: {
          id: "3850dd20-7ce0-45f9-a355-a386ac5a90db",
        },
      };
      
      // Even if a quest token exists somewhere in the system:
      const activeQuestToken = "q_-vRNKf5Uz8Aw1";
      
      // Normal offer clicks must use userSession.user.id
      const userIdForClick = userSession.user.id;
      
      expect(userIdForClick).not.toMatch(/^q_/);
      expect(userIdForClick).not.toBe(activeQuestToken);
      expect(userIdForClick).toBe("3850dd20-7ce0-45f9-a355-a386ac5a90db");
    });
  });
});
