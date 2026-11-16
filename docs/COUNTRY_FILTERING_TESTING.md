# Country Filtering System - Testing Guide

## Pre-Deployment Checklist

### 1. Migration Testing

Run migrations in order on a database copy:

```sql
-- Verify no syntax errors
BEGIN;
\i supabase/migrations/20261112100000_add_country_tracking.sql
\i supabase/migrations/20261112110000_add_country_to_events_and_claims.sql
\i supabase/migrations/20261112120000_offer_country_availability.sql
ROLLBACK; -- Test only, don't commit

-- Then apply for real
BEGIN;
\i supabase/migrations/20261112100000_add_country_tracking.sql
\i supabase/migrations/20261112110000_add_country_to_events_and_claims.sql
\i supabase/migrations/20261112120000_offer_country_availability.sql
COMMIT;
```

**Verify:**
- ✅ Migrations complete without errors
- ✅ Existing data unchanged:
  ```sql
  SELECT COUNT(*) FROM profiles; -- Should match pre-migration count
  SELECT COUNT(*) FROM offer_click_events; -- Should match
  SELECT COUNT(*) FROM offer_claims; -- Should match
  ```
- ✅ New columns added with NULL values:
  ```sql
  SELECT country, country_updated_at FROM profiles LIMIT 5;
  SELECT user_id, country FROM offer_click_events LIMIT 5;
  SELECT country FROM offer_claims LIMIT 5;
  ```
- ✅ New table created:
  ```sql
  SELECT COUNT(*) FROM offer_country_availability; -- Should be 0 initially
  ```

### 2. Country Detection Testing

**Test request with BD header:**
```bash
curl -H "x-vercel-ip-country: BD" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     https://your-domain.vercel.app/api/featured-feed
```

**Expected:**
- User's profile.country updates to "BD"
- Only BD-available offers returned
- No US offers if they're not available in BD

**Test request with no country header:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://your-domain.vercel.app/api/featured-feed
```

**Expected:**
- Falls back to default_country (US)
- US offers returned
- profile.country remains NULL (no header to detect)

### 3. Country Tracking Testing

**Test click tracking:**
```typescript
// After clicking an offer, verify database
SELECT user_id, country, created_at 
FROM offer_click_events 
WHERE offer_id = 'TEST_OFFER_ID'
ORDER BY created_at DESC 
LIMIT 1;
```

**Expected:**
- user_id populated
- country = request country or profile country

**Test claim tracking:**
```typescript
// After creating a claim, verify database
SELECT user_id, country, status, created_at 
FROM offer_claims 
WHERE offer_id = 'TEST_OFFER_ID' AND user_id = 'TEST_USER_ID'
ORDER BY created_at DESC 
LIMIT 1;
```

**Expected:**
- country = request country or profile country
- All other fields intact

### 4. Country Availability Testing

**After first cron run, verify availability table:**
```sql
-- Check availability was populated
SELECT 
  op.slug as provider,
  oca.country,
  COUNT(DISTINCT oca.offer_id) as offer_count
FROM offer_country_availability oca
JOIN offer_providers op ON oca.provider_id = op.id
GROUP BY op.slug, oca.country
ORDER BY op.slug, oca.country;
```

**Expected for GemiAd:**
- Multiple countries per offer (uses offer.countries array)

**Expected for others (Torox, Revtoo, etc):**
- One country per refresh (uses requested country)

### 5. Feed Filtering Testing

**Test BD user sees only BD offers:**
```sql
-- Simulate assembleFeaturedImpl logic
SELECT o.id, o.title, o.provider_id
FROM offers o
WHERE o.source = 'network'
  AND o.is_active = true
  AND (
    -- Available in BD
    EXISTS (
      SELECT 1 FROM offer_country_availability oca 
      WHERE oca.offer_id = o.id AND oca.country = 'BD'
    )
    -- OR global offer (no availability entries)
    OR NOT EXISTS (
      SELECT 1 FROM offer_country_availability oca 
      WHERE oca.offer_id = o.id
    )
  )
LIMIT 10;
```

**Test fallback behavior:**
- Country with no offers → empty state (NOT US offers)
- No country header → US offers (default_country)

### 6. Claim Validation Testing

**Test claim for wrong-country offer:**
```bash
# User in BD tries to claim US-only offer
curl -X POST \
  -H "x-vercel-ip-country: BD" \
  -H "Authorization: Bearer BD_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"offerId": "US_ONLY_OFFER_ID"}' \
  https://your-domain.vercel.app/api/claim-offer
```

**Expected:**
- HTTP 400 or 403
- Error: "This offer is not available in your region."
- Logged in automation_logs with source = "claim_country_blocked"

**Test claim for available offer:**
```bash
# User in BD claims BD-available offer
curl -X POST \
  -H "x-vercel-ip-country: BD" \
  -H "Authorization: Bearer BD_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"offerId": "BD_AVAILABLE_OFFER_ID"}' \
  https://your-domain.vercel.app/api/claim-offer
```

**Expected:**
- Success response
- Claim created with country = "BD"

### 7. Admin Dashboard Testing

**Access country analytics:**
```
Navigate to: /admin (or wherever CountryAnalyticsDashboard is mounted)
```

**Verify displays:**
- ✅ Countries with activity listed
- ✅ Distinct offers available per country
- ✅ Clicks count matches database
- ✅ Claims by status correct
- ✅ Distinct users count correct
- ✅ Reward totals match approved claims

**SQL verification:**
```sql
-- Verify "Unknown" country count
SELECT COUNT(*) FROM offer_click_events WHERE country IS NULL;
SELECT COUNT(*) FROM offer_claims WHERE country IS NULL;

-- Verify specific country (e.g., BD)
SELECT 
  COUNT(DISTINCT offer_id) as offers_clicked,
  COUNT(*) as total_clicks,
  COUNT(DISTINCT user_id) as unique_users
FROM offer_click_events
WHERE country = 'BD'
  AND created_at >= NOW() - INTERVAL '7 days';
```

**Feed health panel:**
- ✅ Shows all providers
- ✅ Fresh vs expired counts correct
- ✅ Errors displayed if present
- ✅ Zero-offer rows flagged

### 8. Cron Refresh Testing

**Test cron authentication:**
```bash
# Without secret - should fail
curl -X POST https://your-domain.vercel.app/api/cron/refresh-offer-feed

# With wrong secret - should fail
curl -X POST \
  -H "x-cron-secret: wrong-secret" \
  https://your-domain.vercel.app/api/cron/refresh-offer-feed

# With correct secret - should succeed
curl -X POST \
  -H "x-cron-secret: $OFFER_FEED_CRON_SECRET" \
  https://your-domain.vercel.app/api/cron/refresh-offer-feed
```

**Expected success response:**
```json
{
  "ok": true,
  "refreshed": [
    {"provider": "gemiad", "country": "US", "count": 45},
    {"provider": "torox", "country": "US", "count": 32},
    ...
  ],
  "errors": [
    {"provider": "torox", "country": "NP", "message": "Torox fetch failed (timeout): ..."}
  ]
}
```

**After cron run, verify:**
```sql
-- Check expired count decreased
SELECT 
  op.slug,
  COUNT(*) FILTER (WHERE ofc.expires_at > NOW()) as fresh,
  COUNT(*) FILTER (WHERE ofc.expires_at <= NOW()) as expired
FROM offer_feed_cache ofc
JOIN offer_providers op ON ofc.provider_id = op.id
GROUP BY op.slug;
```

**Priority countries refreshed:**
```sql
SELECT DISTINCT country 
FROM offer_feed_cache 
WHERE last_synced_at > NOW() - INTERVAL '1 hour'
ORDER BY country;
-- Should include: BD, IN, MA, PK, US + any existing cache countries
```

### 9. Provider-Specific Testing

**Torox timeout handling:**
```sql
-- Check for timeout-specific errors
SELECT country, sync_error, last_synced_at
FROM offer_feed_cache
WHERE provider_id = (SELECT id FROM offer_providers WHERE slug = 'torox')
  AND sync_error LIKE '%timeout%'
ORDER BY last_synced_at DESC;
```

**GemiAd rate limiting:**
- Monitor cron run duration for GemiAd
- Should have ~12 second delays between requests
- No 429 errors in logs

**AdSwedMedia zero offers:**
```sql
SELECT country, offer_count, sync_error, last_synced_at
FROM offer_feed_cache
WHERE provider_id = (SELECT id FROM offer_providers WHERE slug = 'adswedmedia')
  AND offer_count = 0
ORDER BY last_synced_at DESC;
```

Expected: Investigate if feed is truly empty or parsing issue

## Manual Test Scenarios

### Scenario 1: New user from Bangladesh

1. User signs up with BD IP
2. Check profile: `country` should be "BD"
3. Load feed: only BD offers shown
4. Click offer: `offer_click_events.country` = "BD"
5. Claim offer: `offer_claims.country` = "BD"

### Scenario 2: User travels (US → India)

1. User in US sees US offers
2. User travels to India (IN header)
3. Load feed: `profile.country` updates to "IN"
4. Feed shows IN offers
5. Old US-only offers disappear

### Scenario 3: VPN/Proxy user

1. User has BD in profile
2. Request has no country header
3. Falls back to profile country: "BD"
4. Sees BD offers

### Scenario 4: Country with no offers

1. User from rare country (e.g., "AQ" - Antarctica)
2. No offers available for AQ
3. Feed shows:
   - Empty state, OR
   - Only global offers (offers with no availability entries)
4. Does NOT show US offers incorrectly

## Known Issues to Document

### Revtoo & Affike Pending Claims

**Query to count:**
```sql
SELECT 
  o.provider_slug,
  COUNT(*) as pending_count,
  MIN(oc.created_at) as oldest_claim,
  MAX(oc.created_at) as newest_claim,
  DATE_PART('day', NOW() - MIN(oc.created_at)) as days_pending
FROM offer_claims oc
JOIN offers o ON oc.offer_id = o.id
WHERE oc.status = 'pending'
  AND o.provider_slug IN ('revtoo', 'affike')
GROUP BY o.provider_slug;
```

**Expected:** ~133 claims for Revtoo pending since early October (no postback)

### AdSwedMedia Zero Offers

**Investigation needed:**
```sql
-- Check recent syncs
SELECT country, offer_count, sync_error, last_synced_at
FROM offer_feed_cache
WHERE provider_id = (SELECT id FROM offer_providers WHERE slug = 'adswedmedia')
ORDER BY last_synced_at DESC
LIMIT 20;
```

**If 35/49 rows have offer_count = 0:**
- Could be empty feed for those countries
- Could be parsing issue
- Check sync_error field for clues

### OGAds Single Expired Row

```sql
SELECT country, offer_count, sync_error, expires_at, last_synced_at
FROM offer_feed_cache
WHERE provider_id = (SELECT id FROM offer_providers WHERE slug = 'ogads');
```

Review error message and fix or document

## Rollback Plan

If issues found in production:

1. **Disable cron temporarily:**
   - Remove from vercel.json
   - Redeploy

2. **Rollback migrations (if needed):**
   ```sql
   BEGIN;
   DROP TABLE IF EXISTS offer_country_availability;
   ALTER TABLE offer_claims DROP COLUMN IF EXISTS country;
   ALTER TABLE offer_click_events DROP COLUMN IF EXISTS country;
   ALTER TABLE offer_click_events DROP COLUMN IF EXISTS user_id;
   ALTER TABLE profiles DROP COLUMN IF EXISTS country_updated_at;
   ALTER TABLE profiles DROP COLUMN IF EXISTS country;
   COMMIT;
   ```

3. **Revert code changes:**
   ```bash
   git revert <commit-hash>
   git push
   ```

## Success Criteria

✅ All migrations apply cleanly  
✅ Existing data unchanged  
✅ Country detection works (request header → profile)  
✅ Clicks tracked with user_id and country  
✅ Claims tracked with country  
✅ offer_country_availability populated after feed refresh  
✅ Feed filtered by country (BD users see BD offers only)  
✅ Claims rejected for wrong-country offers  
✅ Admin dashboard shows accurate country analytics  
✅ Feed health panel shows provider status  
✅ Cron runs successfully with proper authentication  
✅ Priority countries (IN, BD, PK, MA, US) refreshed  
✅ Torox timeouts handled with retry  
✅ GemiAd rate limiting respected (12s delay)  
✅ No performance degradation on feed assembly  

## Post-Deployment Monitoring

Monitor for 48 hours:

1. **Database growth:**
   ```sql
   SELECT pg_size_pretty(pg_total_relation_size('offer_country_availability'));
   ```

2. **Feed performance:**
   - Measure feed load time before/after
   - Should be < 500ms difference

3. **Cron execution:**
   - Check Vercel cron logs
   - Verify runs every 6 hours
   - Monitor error rate

4. **Country distribution:**
   ```sql
   SELECT country, COUNT(*) as user_count
   FROM profiles
   WHERE country IS NOT NULL
   GROUP BY country
   ORDER BY user_count DESC
   LIMIT 20;
   ```

5. **Error logs:**
   ```sql
   SELECT source, COUNT(*) as error_count
   FROM automation_logs
   WHERE status = 'error'
     AND source IN ('claim_country_blocked', 'start_claim_country_blocked', 'torox_click_url')
     AND created_at > NOW() - INTERVAL '24 hours'
   GROUP BY source;
   ```
