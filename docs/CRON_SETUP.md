# Offer Feed Cron Setup

## Overview

The offer feed cache needs periodic refreshing to keep network offers up-to-date. The cron job refreshes:
- All enabled providers
- All countries with existing cache entries
- Priority countries: IN, BD, PK, MA, US (always included)

## Vercel Cron Configuration

The `vercel.json` file includes a cron configuration that runs every 6 hours:

```json
{
  "crons": [
    {
      "path": "/api/cron/refresh-offer-feed",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

**Important Notes:**
- Vercel Hobby plans only support daily crons (0 0 * * *)
- Pro and Enterprise plans support hourly and custom schedules
- The cron uses Vercel's built-in x-vercel-cron-id header for authentication on Vercel-hosted crons
- For additional security, set `OFFER_FEED_CRON_SECRET` environment variable

## Environment Variables

Set these in your Vercel project settings:

```bash
# Required for cron authentication
OFFER_FEED_CRON_SECRET=your-secret-key-here  # Generate with: openssl rand -base64 32

# Network API credentials (already configured)
TOROX_FEED_SOURCE_ID=...
TOROX_FEED_TOKEN=...
# ... other provider credentials
```

## Authentication

The cron route accepts authentication via:
1. `x-cron-secret` header
2. `Authorization: Bearer <secret>` header  
3. `?secret=<secret>` query parameter

Vercel's built-in cron includes `x-vercel-cron-id` which is also accepted.

## Alternative: External Cron Service

If you need more frequent refreshes or are on Vercel Hobby plan, use an external service:

### Option 1: cron-job.org (Free)

1. Sign up at https://cron-job.org
2. Create a new cron job:
   - URL: `https://your-domain.vercel.app/api/cron/refresh-offer-feed`
   - Schedule: Every 5 hours (or as needed)
   - Add header: `x-cron-secret: your-secret-key`
3. Enable the job

### Option 2: EasyCron (Free tier available)

1. Sign up at https://www.easycron.com
2. Create cron job with same settings as above

### Option 3: Custom GitHub Actions

Create `.github/workflows/refresh-feed.yml`:

```yaml
name: Refresh Offer Feed

on:
  schedule:
    - cron: '0 */5 * * *'  # Every 5 hours
  workflow_dispatch:  # Manual trigger

jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - name: Call refresh endpoint
        run: |
          curl -X POST \
            -H "x-cron-secret: ${{ secrets.OFFER_FEED_CRON_SECRET }}" \
            https://your-domain.vercel.app/api/cron/refresh-offer-feed
```

## Monitoring

Check feed health in the admin dashboard:
- Navigate to Admin → Country Analytics
- View "Feed Health Status" panel
- Monitor:
  - Fresh vs Expired cache rows
  - Sync errors per provider
  - Zero-offer feeds (potential parsing issues)

## Rate Limiting

The cron automatically handles provider-specific rate limits:

- **GemiAd**: 5 requests/min (12-second delay between countries)
- **Torox**: 30-second timeout with 1 retry
- **Others**: No specific rate limiting

## Troubleshooting

### High Expired Row Count

If many cache rows are expired:
1. Check that cron is running (Vercel dashboard → Cron Logs)
2. Verify `OFFER_FEED_CRON_SECRET` is set correctly
3. Check network provider credentials are valid
4. Review automation_logs for specific errors

### Torox Timeouts

Torox API can be slow in some regions:
- Timeout increased to 30 seconds (from 15)
- One automatic retry on timeout
- Errors logged with country-specific details

### AdSwedMedia Zero Offers

If AdSwedMedia shows 35+ rows with 0 offers:
- Check if feed is actually empty for those countries
- Verify parsing logic for AdSwedMedia response format
- Review sync_error in offer_feed_cache for specific errors

### Pending Claims (Revtoo/Affike)

These providers have no postback integration:
- Claims stay "pending" indefinitely
- Requires manual admin review
- Count pending claims:
  ```sql
  SELECT provider_slug, COUNT(*), 
         MAX(created_at) as oldest
  FROM offer_claims oc
  JOIN offers o ON oc.offer_id = o.id
  WHERE oc.status = 'pending'
    AND o.provider_slug IN ('revtoo', 'affike')
  GROUP BY provider_slug;
  ```

## Manual Refresh

Admins can manually refresh a specific provider+country:
1. Go to Admin → Offer Feed Automation
2. Select provider
3. Choose country (optional, defaults to US)
4. Click "Refresh Now"
