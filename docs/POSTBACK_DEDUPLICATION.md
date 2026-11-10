# Postback Deduplication Verification

## Overview
This document verifies that Torox and GemiAd postback handlers correctly deduplicate on transaction ID only, not on offer ID + user ID combination.

## Requirement
**Dedupe only on transaction ID, never on offer ID + user ID**

This allows the same user to complete the same offer multiple times (if the network allows it), while preventing duplicate credits for the same transaction/conversion.

## Verification

### Torox Postback (`src/lib/offers/torox-postback.server.ts`)

**Deduplication Logic (Line 304):**
```typescript
// 10. Check for duplicate using (provider_slug='torox', external_lead_id=conversionId)
const existingClaim = await supabaseAdmin
  .from("offer_claims")
  .select("id, status")
  .eq("provider_slug", "torox")
  .eq("external_lead_id", conversionId)
  .maybeSingle();
```

**Deduplication Key:**
- `provider_slug='torox'` - Scopes to Torox offers only
- `external_lead_id=conversionId` - Uses Torox's unique conversion ID (`id` parameter from postback)

**✅ Correct:** Deduplicates on transaction ID (`conversionId`) only.

**Database Constraint:**
- Unique constraint on `(provider_slug, external_lead_id)` in `offer_claims` table
- Ensures atomic deduplication even under concurrent requests

---

### GemiAd Postback (`src/lib/offers/gemiad-postback.server.ts`)

**Deduplication Logic (Line 252):**
```typescript
// 9. Check for duplicate using (provider_slug='gemiad', external_lead_id=txid)
const existingClaim = await supabaseAdmin
  .from("offer_claims")
  .select("id, status")
  .eq("provider_slug", "gemiad")
  .eq("external_lead_id", txid)
  .maybeSingle();
```

**Deduplication Key:**
- `provider_slug='gemiad'` - Scopes to GemiAd offers only
- `external_lead_id=txid` - Uses GemiAd's unique transaction ID (`txid` parameter from postback)

**✅ Correct:** Deduplicates on transaction ID (`txid`) only.

**Database Constraint:**
- Unique constraint on `(provider_slug, external_lead_id)` in `offer_claims` table
- Ensures atomic deduplication even under concurrent requests

---

## Behavior

### Same User, Same Offer, Different Transactions
**Scenario:** User completes the same offer multiple times (if network allows)
- Transaction 1: `txid=abc123` → ✅ Credited
- Transaction 2: `txid=xyz789` → ✅ Credited (different transaction ID)
- **Result:** Both transactions are credited (correct behavior)

### Same Transaction, Duplicate Postback
**Scenario:** Network retries the same postback multiple times
- Request 1: `txid=abc123` → ✅ Credited
- Request 2: `txid=abc123` → ❌ Duplicate (same transaction ID)
- **Result:** Only credited once (correct behavior)

### Different Users, Same Offer
**Scenario:** Two different users complete the same offer
- User A: `txid=abc123` → ✅ Credited
- User B: `txid=def456` → ✅ Credited (different user and transaction)
- **Result:** Both users credited (correct behavior)

---

## Conclusion

Both Torox and GemiAd postback handlers correctly implement deduplication based on transaction ID only. They do NOT deduplicate on offer ID + user ID, allowing users to complete the same offer multiple times while preventing duplicate credits for the same transaction.

**Status:** ✅ Verified and working correctly
**Date:** 2027-01-10
