# Offer Feed Cron Setup

## Overview

The offer feed cache is refreshed automatically on two schedules:

1. **Supabase pg_cron** (primary): Runs every 30 minutes
2. **Vercel Cron** (backup): Runs once daily at 3 AM UTC

Both call the same endpoint: `POST /api/cron/refresh-offer-feed`

---

## Supabase pg_cron Setup

### 1. Run Migration

Apply the migration file:
```
supabase/migrations/20270902000000_offer_feed_cron.sql
```

This creates:
- `public.refresh_offer_feed_cron()` function
- Cron schedule: `*/30 * * * *` (every 30 minutes)

### 2. Configure Secret in Supabase Vault

The secret must be stored in Supabase Vault (not as a plain env var):

1. Go to Supabase Dashboard → Project Settings → Vault
2. Create a new secret:
   - **Name**: `offer_feed_cron_secret`
   - **Value**: Same value as `CRON_SECRET` (or `OFFER_FEED_CRON_SECRET`) from Vercel

**Important**: The secret name must be exactly `offer_feed_cron_secret` (no typo, case-sensitive).

### 3. Verify Cron Job

```sql
-- View scheduled jobs
SELECT * FROM cron.job;

-- Check execution history
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;

-- Manually trigger (for testing)
SELECT public.refresh_offer_feed_cron();
```

### 4. Troubleshooting

If the cron job fails:

```sql
-- Check for warnings in logs (missing secret)
-- Look for: "offer_feed_cron_secret missing in vault"

-- Unschedule and reschedule if needed
SELECT cron.unschedule('refresh-offer-feed-every-30min');
SELECT cron.schedule(
  'refresh-offer-feed-every-30min',
  '*/30 * * * *',
  'select public.refresh_offer_feed_cron();'
);
```

---

## Vercel Cron Setup (Backup)

### vercel.json Configuration

```json
{
  "crons": [{
    "path": "/api/cron/refresh-offer-feed",
    "schedule": "0 3 * * *"
  }]
}
```

**Schedule**: Once daily at 3:00 AM UTC (backup to pg_cron)

### Environment Variables

Set in Vercel Dashboard → Project Settings → Environment Variables:

- **`CRON_SECRET`** (Vercel standard): Used by both Vercel Cron and Supabase pg_cron
- **`OFFER_FEED_CRON_SECRET`** (legacy/optional): Alternative secret name

**Important**: At least one of these must be set. The endpoint rejects requests if both are empty/undefined.

---

## Endpoint Authentication

### Supported Methods
- `GET /api/cron/refresh-offer-feed`
- `POST /api/cron/refresh-offer-feed`

### Authentication (any of these)
1. **Authorization header** (recommended):
   ```
   Authorization: Bearer <CRON_SECRET>
   ```

2. **Custom header**:
   ```
   x-cron-secret: <CRON_SECRET>
   ```

3. **Query parameter** (testing only):
   ```
   ?secret=<CRON_SECRET>
   ```

### Secret Validation
- Uses constant-time comparison to prevent timing attacks
- Accepts either `CRON_SECRET` or `OFFER_FEED_CRON_SECRET`
- Rejects if configured secret is empty/undefined
- Rejects "Bearer undefined" or empty values

---

## Manual Testing

### Local Test
```bash
curl -X POST http://localhost:3000/api/cron/refresh-offer-feed \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Production Test
```bash
curl -X POST https://cashgpt.in/api/cron/refresh-offer-feed \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Expected Response
```json
{
  "ok": true,
  "refreshed": [
    {"provider": "gemiad", "country": "US", "count": 50},
    {"provider": "torox", "country": "IN", "count": 45}
  ],
  "errors": []
}
```

---

## Monitoring

### Check Cache Updates
```sql
-- View recent cache updates
SELECT provider_id, country, offer_count, last_synced_at, expires_at, sync_error
FROM offer_feed_cache
ORDER BY last_synced_at DESC
LIMIT 20;

-- Check for errors
SELECT provider_id, country, sync_error, last_synced_at
FROM offer_feed_cache
WHERE sync_error IS NOT NULL
ORDER BY last_synced_at DESC;
```

### Vercel Function Logs
Look for these log entries:
```
[refreshAllFeedsImpl] Processing 20 of 45 total tasks
[refreshProviderCountry] gemiad US completed in 1234ms - 50 offers
[refreshAllFeedsImpl] Completed in 5678ms - refreshed: 20, errors: 0
```

---

## Secret Synchronization

**Critical**: The secret in Supabase Vault (`offer_feed_cron_secret`) must match the secret in Vercel (`CRON_SECRET` or `OFFER_FEED_CRON_SECRET`).

If you rotate the secret:
1. Update in Vercel Dashboard
2. Update in Supabase Vault
3. Test manually with curl

---

## Architecture

```
Supabase pg_cron (every 30 min)
  ↓
  calls public.refresh_offer_feed_cron()
    ↓
    retrieves secret from vault.decrypted_secrets
      ↓
      HTTP POST to https://cashgpt.in/api/cron/refresh-offer-feed
        ↓
        Authorization: Bearer <secret>
          ↓
          refreshAllFeedsImpl() (batched, 20 tasks/run)

Vercel Cron (daily at 3 AM UTC)
  ↓
  calls /api/cron/refresh-offer-feed directly
    ↓
    Authorization: Bearer <CRON_SECRET> (injected by Vercel)
      ↓
      refreshAllFeedsImpl() (batched, 20 tasks/run)
```
