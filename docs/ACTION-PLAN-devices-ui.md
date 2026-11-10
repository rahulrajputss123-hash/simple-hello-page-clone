# ACTION PLAN: Get Devices/Categories Showing in UI

## Problem

You don't see provider names, devices, or categories on offer cards because:
1. **The data isn't in the database yet** - `offers.devices` and `offers.category` are empty/null
2. The UI code I wrote will work, but only after you populate the data

## Root Cause

The `devices` and `category` fields were added to the schema, but:
- **Existing offers** were synced BEFORE the normalization code was added
- **New syncs** will populate devices/category correctly
- **You need to backfill existing offers** from their `raw_payload`

## Solution: 3-Step Process

### Step 1: Verify Current State

Run this to see how many offers are missing devices:

```bash
psql $DATABASE_URL -c "
SELECT 
  op.slug as provider,
  COUNT(*) as total_offers,
  COUNT(*) FILTER (WHERE devices IS NULL OR jsonb_array_length(devices) = 0) as missing_devices,
  COUNT(*) FILTER (WHERE category IS NULL) as missing_category
FROM offers o
LEFT JOIN offer_providers op ON o.provider_id = op.id
WHERE o.source = 'network'
GROUP BY op.slug
ORDER BY total_offers DESC;
"
```

Expected: Most/all network offers have empty devices and null category.

### Step 2: Run Backfill Script

This will extract devices and categories from `raw_payload` for ALL existing offers:

```bash
# Dry run first (see what would change)
bun run scripts/backfill-offer-devices-category.ts

# Check the output, then apply:
bun run scripts/backfill-offer-devices-category.ts --apply
```

This will:
- Extract devices from raw payload per provider:
  - Torox: `raw.os`
  - GemiAd: `raw.device`
  - Revtoo: `raw.os`
  - Affike: `raw.devices`
  - AdswedMedia: `raw.devices`
  - OGAds: `raw.device`
  - CPXResearch: ["android", "ios", "web"]
  - AdBlueMedia: [] (no device info)
- Extract category from raw payload
- Normalize everything (desktop/PC → web)
- Update database

### Step 3: Verify UI

After backfill:

```bash
# Check that devices are populated
psql $DATABASE_URL -c "
SELECT 
  op.slug as provider,
  COUNT(*) FILTER (WHERE jsonb_array_length(devices) > 0) as has_devices,
  COUNT(*) FILTER (WHERE category IS NOT NULL) as has_category
FROM offers o
LEFT JOIN offer_providers op ON o.provider_id = op.id
WHERE o.source = 'network'
GROUP BY op.slug;
"
```

Then **refresh your app** and check offer cards - you should see:
- Provider name badge (e.g., "Torox", "GemiAd")
- Device chips (Android, iOS, Web, or "All devices")
- Category chip (Games, Survey, App Install, etc.)

## Why This Happened

The flow is:
1. **Adapter** → returns NormalizedOffer with devices/category
2. **offerRowFromNormalized** → includes devices/category in DB row
3. **upsert** → writes to database
4. **Query** → JOINs offer_providers for name, selects devices/category
5. **UI** → displays the data

BUT: If offers were synced BEFORE the normalization code existed, they have:
- Empty `devices` array
- NULL `category`
- Valid `raw_payload` (contains the raw data)

The backfill script extracts from `raw_payload` to populate the fields.

## Future Syncs

After you run the backfill once:
- **New syncs** will automatically populate devices/category
- **Existing offers** will be updated on next sync (last_seen_at updated)
- No need to re-run backfill

## Quick Test

If you want to test with ONE provider first:

```sql
-- Backfill just Torox offers
UPDATE offers o
SET 
  devices = CASE 
    WHEN raw_payload->>'os' = 'android' THEN '["android"]'::jsonb
    WHEN raw_payload->>'os' = 'ios' THEN '["ios"]'::jsonb
    WHEN raw_payload->>'os' = 'web' THEN '["web"]'::jsonb
    ELSE '[]'::jsonb
  END,
  category = CASE
    WHEN raw_payload->>'verticalNames' ILIKE '%gaming%' THEN 'Games'
    WHEN raw_payload->>'verticalNames' ILIKE '%survey%' THEN 'Survey'
    WHEN raw_payload->>'packageId' IS NOT NULL 
         AND raw_payload->>'os' IN ('android', 'ios') THEN 'App Install'
    ELSE NULL
  END
FROM offer_providers op
WHERE o.provider_id = op.id
  AND op.slug = 'torox'
  AND o.source = 'network'
  AND raw_payload IS NOT NULL;
```

Then refresh app and check Torox offers specifically.

## Summary

**What you need to do RIGHT NOW:**

```bash
# 1. Run backfill
bun run scripts/backfill-offer-devices-category.ts --apply

# 2. Check results
psql $DATABASE_URL -c "
  SELECT COUNT(*) as offers_with_devices 
  FROM offers 
  WHERE devices IS NOT NULL 
    AND jsonb_array_length(devices) > 0;
"

# 3. Refresh your app browser
# You should now see devices and categories on ALL offer cards
```

The UI code is already correct - it just needs the data to exist in the database!
