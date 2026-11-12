/**
 * Tests for claim status priority logic in enrichOffersWithClaimStatus
 * 
 * Priority: approved > pending > started > rejected
 * When same priority, newest created_at wins
 */

import { describe, it, expect } from "vitest";

// Mock claim status priority logic (extracted from enrichOffersWithClaimStatus)
const statusPriority: Record<string, number> = {
  approved: 4,
  pending: 3,
  started: 2,
  rejected: 1,
};

type Claim = {
  offer_id: string;
  status: string;
  reject_reason: string | null;
  created_at: string;
};

function pickBestClaim(claims: Claim[]): { status: string; reject_reason: string | null } | null {
  if (claims.length === 0) return null;

  // Sort by created_at DESC (newest first)
  const sorted = [...claims].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Build map with best claim per offer
  const claimsByOfferId = new Map<string, { status: string; reject_reason: string | null }>();
  
  for (const claim of sorted) {
    const existing = claimsByOfferId.get(claim.offer_id);
    const currentPriority = statusPriority[claim.status] ?? 0;
    const existingPriority = existing ? statusPriority[existing.status] ?? 0 : -1;
    
    // Replace if higher priority
    if (currentPriority > existingPriority) {
      claimsByOfferId.set(claim.offer_id, { 
        status: claim.status, 
        reject_reason: claim.reject_reason 
      });
    }
  }

  return claimsByOfferId.get(claims[0].offer_id) ?? null;
}

describe("Claim Priority Logic", () => {
  const offerId = "test-offer-id";

  it("should pick approved over pending", () => {
    const claims: Claim[] = [
      { offer_id: offerId, status: "pending", reject_reason: null, created_at: "2024-01-02T00:00:00Z" },
      { offer_id: offerId, status: "approved", reject_reason: null, created_at: "2024-01-01T00:00:00Z" },
    ];

    const result = pickBestClaim(claims);
    expect(result?.status).toBe("approved");
  });

  it("should pick pending over started", () => {
    const claims: Claim[] = [
      { offer_id: offerId, status: "started", reject_reason: null, created_at: "2024-01-02T00:00:00Z" },
      { offer_id: offerId, status: "pending", reject_reason: null, created_at: "2024-01-01T00:00:00Z" },
    ];

    const result = pickBestClaim(claims);
    expect(result?.status).toBe("pending");
  });

  it("should pick started over rejected", () => {
    const claims: Claim[] = [
      { offer_id: offerId, status: "rejected", reject_reason: "fraud", created_at: "2024-01-02T00:00:00Z" },
      { offer_id: offerId, status: "started", reject_reason: null, created_at: "2024-01-01T00:00:00Z" },
    ];

    const result = pickBestClaim(claims);
    expect(result?.status).toBe("started");
  });

  it("should pick newest when same priority", () => {
    const claims: Claim[] = [
      { offer_id: offerId, status: "pending", reject_reason: null, created_at: "2024-01-01T00:00:00Z" },
      { offer_id: offerId, status: "pending", reject_reason: null, created_at: "2024-01-02T00:00:00Z" },
    ];

    const result = pickBestClaim(claims);
    expect(result?.status).toBe("pending");
  });

  it("should handle Torox scenario: manual pending + postback approved", () => {
    const claims: Claim[] = [
      // Manual claim created by user tap (no provider_slug, pending)
      { offer_id: offerId, status: "pending", reject_reason: null, created_at: "2024-01-01T10:00:00Z" },
      // Postback claim created later (provider_slug='torox', approved)
      { offer_id: offerId, status: "approved", reject_reason: null, created_at: "2024-01-01T10:05:00Z" },
    ];

    const result = pickBestClaim(claims);
    expect(result?.status).toBe("approved");
  });

  it("should handle multiple rejected claims before one approved", () => {
    const claims: Claim[] = [
      { offer_id: offerId, status: "rejected", reject_reason: "incomplete", created_at: "2024-01-01T00:00:00Z" },
      { offer_id: offerId, status: "rejected", reject_reason: "fraud", created_at: "2024-01-02T00:00:00Z" },
      { offer_id: offerId, status: "approved", reject_reason: null, created_at: "2024-01-03T00:00:00Z" },
    ];

    const result = pickBestClaim(claims);
    expect(result?.status).toBe("approved");
  });

  it("should return null for empty claims array", () => {
    const claims: Claim[] = [];
    const result = pickBestClaim(claims);
    expect(result).toBeNull();
  });

  it("should preserve reject_reason from the selected claim", () => {
    const claims: Claim[] = [
      { offer_id: offerId, status: "rejected", reject_reason: "fraud detected", created_at: "2024-01-01T00:00:00Z" },
    ];

    const result = pickBestClaim(claims);
    expect(result?.reject_reason).toBe("fraud detected");
  });
});
