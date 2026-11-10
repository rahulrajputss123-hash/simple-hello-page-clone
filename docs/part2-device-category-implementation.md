# Part 2: Device Normalization & Category Mapping Implementation

## Overview
This document summarizes the implementation of Part 2 requirements (B: Device Normalization, C: Category Mapping) for offer data verification.

## Part B: Device Normalization

### B4: Shared normalizeDevices Function ✅
**Location**: `src/lib/offers/normalize-devices.ts`

**Rules Implemented**:
- Desktop → web
- Mobile → [android, ios]
- All/empty/null → skip (empty array)
- Lowercase normalization
- Deduplication
- Alphabetical sort
- Only valid values: android, ios, web

**Usage**: Every adapter and backfill script now imports and uses this shared function.

### B5: Adapters Updated ✅

All adapters now use the shared `normalizeDevices` function:

1. **Revtoo** (`src/lib/offers/adapters/revtoo.server.ts`)
   - Removed local normalizeDevices
   - Imports shared function
   - Normalizes `raw.os` array

2. **OGAds** (`src/lib/offers/adapters/ogads.server.ts`)
   - Removed local normalizeDevices
   - Imports shared function
   - Normalizes comma-separated `raw.device` string

3. **AdswedMedia** (`src/lib/offers/adapters/adswedmedia.server.ts`)
   - Removed local normalizeDevices
   - Imports shared function
   - Normalizes `raw.devices` array/string

4. **Affike** (`src/lib/offers/adapters/affike.server.ts`)
   - Removed local normalizeDevices
   - Imports shared function
   - Normalizes `raw.devices` array

5. **Torox** (`src/lib/offers/adapters/torox.server.ts`)
   - Removed local normalizeDevice
   - Imports shared function
   - Normalizes `raw.os` single value

6. **GemiAd** (`src/lib/offers/adapters/gemiad.server.ts`)
   - Removed local mapDevice
   - Imports shared function
   - Normalizes `raw.device` array

7. **AdBlueMedia** (`src/lib/offers/adapters/adbluemedia.server.ts`)
   - Sets `devices: []` with comment
   - Network provides no device information
   - Complies with requirement B5

### B6: Backfill Script Updated ✅
**Location**: `scripts/backfill-offer-devices-category.ts`

- Removed local normalizeDevices implementation
- Imports shared function from `@/lib/offers/normalize-devices`
- All provider cases use shared normalizeDevices
- CPXResearch: returns normalized ["android", "ios", "web"]
- AdBlueMedia: returns [] (no device info)

## Part C: Category Mapping

### Valid Categories (7 types)
1. App Install
2. Trial
3. Deals
4. Survey
5. Games
6. Link Locker
7. Shortlink

### C6: Torox Category Mapping ✅
**Location**: `src/lib/offers/adapters/torox.server.ts`

**Mapping Rules**:
- `verticalNames` containing "gaming", "strategy", "game" → **Games**
- `verticalNames` containing "survey" → **Survey**
- Mobile OS (ios/android) + `packageId` present → **App Install**
- Casino/gambling/betting/poker → `null` (excluded by default config)
- Everything else → `null`

**Implementation**: Updated `mapCategory()` function to accept `verticalNames`, `os`, and `packageId` parameters.

### C7: GemiAd Category Mapping ✅
**Location**: `src/lib/offers/adapters/gemiad.server.ts`

**Mapping Rules** (confirmed per API spec):
- `category: "app"` → **App Install**
- `category: "web"` → **Trial**
- `category: "survey"` → **Survey**
- `category: "game"` → **Games**
- `category: "click"` → `null` (click-only offers don't fit categories)
- Everything else → `null`

### C8: Other Providers Category Mapping ✅

**Revtoo** (`src/lib/offers/adapters/revtoo.server.ts`):
- `category: "survey"` → **Survey**
- Everything else → `null`
- Note: Revtoo primarily provides survey offers

**Affike** (`src/lib/offers/adapters/affike.server.ts`):
- Validates `raw.category` against VALID_CATEGORIES array
- Only exact matches (case-sensitive) are accepted
- Supports all 7 valid categories
- Invalid values → `null`

**AdswedMedia** (`src/lib/offers/adapters/adswedmedia.server.ts`):
- Takes first item from `raw.categories` array
- Validates against VALID_CATEGORIES array
- Only exact matches (case-sensitive) are accepted
- Supports all 7 valid categories
- Invalid values → `null`

**AdBlueMedia** (`src/lib/offers/adapters/adbluemedia.server.ts`):
- Maps numeric `category_id` to categories via ADBLUEMEDIA_CATEGORY_MAP
- Mappings:
  - "1" → App Install
  - "2" → Survey
  - "3" → Trial
  - "4" → Trial (sign-up)
  - "5" → Deals
  - "6" → Games
  - "7" → Link Locker
  - "8" → Shortlink
  - "9" → Deals
- Unknown IDs → `null`

**OGAds** (`src/lib/offers/adapters/ogads.server.ts`):
- Always returns `category: null`
- Network API provides no category information
- This is correct per C9 (null where network has no usable category)

### C9: Null Category Handling ✅

Categories are `null` only where the network truly has no usable category:
- **OGAds**: API provides no category field → always `null`
- **Torox**: Gambling offers (excluded by config) → `null`
- **GemiAd**: Click-only offers → `null`
- **All others**: Unmapped/unknown category values → `null`

### C10: Backfill Script Category Logic ✅
**Location**: `scripts/backfill-offer-devices-category.ts`

Updated to match adapter logic:
- **Torox**: Checks verticalNames for survey/gaming, checks packageId+os for App Install
- **GemiAd**: Maps app/web/survey/game/click categories
- **Revtoo**: Maps "survey" category
- **AdswedMedia**: Validates first category from array
- **Affike**: Validates category against valid list
- **AdBlueMedia**: Maps category_id using same map as adapter
- **OGAds**: No category extraction (API has none)
- **CPXResearch**: Always "Survey"

## Verification

### SQL Verification Script ✅
**Location**: `scripts/verify-devices-category.sql`

Provides queries to verify:
1. **Invalid devices check**: Find any offers with devices not in [android, ios, web]
2. **Device distribution**: Count offers by device combinations per provider
3. **Category distribution**: Count offers by category (including NULL) per provider
4. **NULL category investigation**: Show raw category fields for NULL categories
5. **Raw category values**: List distinct raw category values per provider
6. **Overall summary**: Offers per provider with device/category status

### How to Verify

After syncing offers (user will do this manually), run:

```bash
# Connect to database and run verification queries
psql $DATABASE_URL -f scripts/verify-devices-category.sql
```

Expected results:
- Query 1 (invalid devices): **0 rows** - no invalid device values
- Query 2 (device distribution): Valid combinations of [android, ios, web] only
- Query 3 (category distribution): Valid categories + NULL counts per provider
- Query 4 (NULL categories): Only where provider has no category info
- Query 5 (raw values): Shows what raw values map to each category
- Query 6 (summary): All providers have device and category data processed

## Files Modified

### New Files
- `src/lib/offers/normalize-devices.ts` - Shared device normalization function
- `scripts/verify-devices-category.sql` - SQL verification queries
- `docs/part2-device-category-implementation.md` - This document

### Modified Files
- `src/lib/offers/adapters/revtoo.server.ts` - Use shared normalizeDevices
- `src/lib/offers/adapters/ogads.server.ts` - Use shared normalizeDevices
- `src/lib/offers/adapters/adswedmedia.server.ts` - Use shared normalizeDevices
- `src/lib/offers/adapters/affike.server.ts` - Use shared normalizeDevices, validate categories
- `src/lib/offers/adapters/torox.server.ts` - Use shared normalizeDevices, update category mapping
- `src/lib/offers/adapters/gemiad.server.ts` - Use shared normalizeDevices, confirm category mapping
- `src/lib/offers/adapters/adbluemedia.server.ts` - Add empty devices array with comment
- `scripts/backfill-offer-devices-category.ts` - Use shared normalizeDevices, update category logic

## Next Steps

1. **User will manually sync offers** (as requested - skipping automated sync work)
2. **Run SQL verification**: `psql $DATABASE_URL -f scripts/verify-devices-category.sql`
3. **Review results**: Confirm no invalid devices, check NULL category counts
4. **Run backfill if needed**: `bun run scripts/backfill-offer-devices-category.ts --apply`

## Notes

- All adapters now use consistent device normalization
- Category mappings match each provider's actual API response format
- NULL categories only where provider has no category information
- Backfill script can populate devices/categories for existing offers from raw_payload
- SQL verification script provides evidence of data quality
