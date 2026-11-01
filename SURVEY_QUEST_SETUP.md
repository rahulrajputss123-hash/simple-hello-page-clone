# Survey Quest Setup Guide

## Overview

Survey quests allow users to complete surveys from CPX Research, TheoremReach, and/or Timewall. Each completed survey earns:
- **80% of survey payout** (normal platform credit)
- **Step reward** (configured per quest)
- **Final bonus** (after all surveys completed)

Progress is tracked via verified postbacks only. Same survey cannot count twice in the same quest session.

---

## Environment Variables

Add these to your `.env` file:

```bash
# CPX Research
CPX_APP_ID=your_app_id_here
CPX_SECURE_HASH_SECRET=your_secure_hash_secret_here

# TheoremReach
THEOREMREACH_API_KEY=your_api_key_here
THEOREMREACH_SECRET=your_secret_key_here

# Base URL (for TheoremReach callback URL reconstruction)
PUBLIC_BASE_URL=https://cashgpt.in
```

### Getting Credentials

#### CPX Research
1. Sign up at [CPX Research Publisher Portal](https://publisher.cpx-research.com/)
2. Create an app/integration
3. Get your **App ID** and **Secure Hash Secret** from the dashboard
4. Configure postback URL: `https://yourdomain.com/api/postback/cpxresearch`

#### TheoremReach
1. Sign up at [TheoremReach Publisher Portal](https://theoremreach.com/publisher/signup)
2. Get your **API Key** and **Secret Key** from Settings
3. Configure postback URL: `https://yourdomain.com/api/postback/theoremreach`
4. **Important**: TheoremReach uses HMAC-SHA1 signature verification (base64url encoded)

#### Timewall
Timewall currently uses the existing offerwall integration. No additional credentials needed for basic wall display.

---

## Migration Setup

Run the survey quest migration:

```bash
# The migration is already in supabase/migrations/
# Apply it with:
supabase db push

# Or if using hosted Supabase:
supabase migration up
```

The migration adds:
- `required_surveys` (1-10) to `quests` table
- `allowed_networks` (text array) to `quests` table
- `min_payout_usd` (numeric) to `quests` table
- `max_loi` (integer, nullable) to `quests` table
- `survey_network` and `survey_id` to `quest_sessions` table
- Unique index for survey deduplication

---

## Provider Configuration

### CPX Research

**Authentication**: MD5 hash
- Hash: `md5(user_id + "-" + secret)`
- User ID: Supabase user UUID
- Subid: Quest session ID

**API Endpoint**: 
```
GET https://live-api.cpx-research.com/api/get-surveys.php
```

**Parameters**:
- `app_id`: Your CPX app ID
- `ext_user_id`: User UUID
- `subid_1`: Session ID
- `output_method`: "api"
- `ip_user`: User's IP address
- `user_agent`: User's User-Agent
- `secure_hash`: MD5 hash

**Postback Fields**:
- Transaction ID: `transaction_id`
- Survey ID: `survey_id` (offer_id)
- Payout: `payout_usd` (in USD)
- User ID: `user_id`

---

### TheoremReach

**Authentication**: HMAC-SHA1 (base64url encoded)
- Algorithm: `HMAC-SHA1(secret, callback_url_without_hash)`
- Encoding: Base64url (+ → -, / → _, remove =)
- Hash param: `&hash=` appended to URL

**API Endpoint**:
```
GET https://api.theoremreach.com/api/publishers/v1/surveys
```

**Parameters**:
- `api_key`: Your API key
- `user_id`: User UUID
- `ip`: User's IP address
- `country_code`: 2-letter country code (from CF-IPCountry header)
- `hash`: HMAC-SHA1 signature

**Postback Fields**:
- Transaction ID: `transaction_id`
- Survey ID: `survey_id` (offer_id)
- **Currency**: Use `currency` field (USD), NOT `reward` field
- User ID: `user_id`

**Example Hash Generation**:
```typescript
import { createHmac } from "crypto";

const secret = "ZZ6VkORqV25iSWOVb5cwZ03zpns";
const url = "https://www.abc.com/ex.aspx?abc=def&vid=123";

const hash = createHmac("sha1", secret)
  .update(url)
  .digest()
  .toString("base64")
  .replace(/\+/g, "-")
  .replace(/\//g, "_")
  .replace(/=/g, "");

console.log(hash); // Output: VNBMolYjJug6cDQqOX4oddfteDw
```

---

### Timewall

Timewall displays as a single wall card (no list API available).
Uses existing offerwall integration via `buildOfferwallUrl('timewall', userId)`.

---

## Creating a Survey Quest

1. **Go to Admin Panel** → Quests Manager
2. Click **"New Quest"**
3. Select **"Survey"** quest type
4. Configure:
   - **Label**: Display name (e.g., "Survey Master")
   - **Icon**: Lucide icon name or URL
   - **Required surveys**: 1-10 (how many surveys to complete)
   - **Step reward**: USD paid per survey (e.g., $0.10)
   - **Final bonus**: USD paid after all surveys done (e.g., $1.00)
   - **Allowed networks**: Check CPX, TheoremReach, and/or Timewall
   - **Min payout USD**: Filter low-paying surveys (default: $0.50)
   - **Max LOI**: Filter long surveys in minutes (optional)
5. **Save** the quest

---

## Reward Calculation Example

Quest configuration:
- Required surveys: 5
- Step reward: $0.10
- Final bonus: $1.00
- Min payout: $0.50

User completes 5 surveys with payouts: $0.80, $1.00, $0.75, $1.20, $0.60

**Total earnings**:
```
Survey payouts (80%):  $0.64 + $0.80 + $0.60 + $0.96 + $0.48 = $3.48
Step rewards:          5 × $0.10 = $0.50
Final bonus:           $1.00
----------------------------------------
Total:                 $4.98
```

---

## Progress Tracking Flow

1. **User starts quest** → Creates `quest_sessions` record
2. **User clicks survey** → Opens survey in provider's platform
3. **User completes survey** → Provider sends postback
4. **Postback verified** → Server processes:
   - Credit 80% to wallet (normal flow)
   - Find active survey quest sessions
   - Verify survey network is allowed
   - Verify payout >= min_payout_usd
   - Check for duplicate (survey_network + survey_id)
   - Insert `quest_step_credits` with metadata
   - Credit step reward
   - If all surveys done → credit final bonus

---

## Deduplication Strategy

Survey quests use `quest_step_credits.metadata` for deduplication:

```json
{
  "survey_network": "cpxresearch",
  "survey_id": "12345",
  "conversion_id": "uuid"
}
```

Query checks:
```sql
SELECT id FROM quest_step_credits
WHERE session_id = $1
AND metadata @> '{"survey_network": "cpxresearch", "survey_id": "12345"}'
```

Same survey cannot count twice in the same session, even with multiple postbacks.

---

## Testing

### Manual Testing

1. **Create test survey quest** with `required_surveys: 1` and `min_payout_usd: 0.01`
2. **Start quest** as a user
3. **Complete a survey** on CPX or TheoremReach
4. **Check logs** in `automation_logs` table:
   ```sql
   SELECT * FROM automation_logs
   WHERE user_id = 'your-user-id'
   AND event_type IN ('sdk_postback', 'quest_automation', 'wallet_credit')
   ORDER BY created_at DESC
   LIMIT 20;
   ```
5. **Verify**:
   - Postback received and signature valid
   - Wallet credited 80% of survey payout
   - Quest step recorded in `quest_step_credits`
   - Step reward credited
   - Quest completed if required_surveys met

### Unit Tests

Run TheoremReach signature verification tests:

```bash
npm test src/lib/sdk-offerwall/adapters/theoremreach.test.ts
```

Tests verify:
- HMAC-SHA1 signature generation
- Base64url encoding (no +, /, or =)
- Documented example validation
- URL case sensitivity

---

## Troubleshooting

### CPX Research Issues

**Problem**: Postback signature invalid
- **Check**: `CPX_SECURE_HASH_SECRET` matches dashboard
- **Check**: Hash format is `md5(user_id + "-" + secret)` (no spaces)
- **Check**: `user_id` in postback matches Supabase UUID

**Problem**: No surveys returned
- **Check**: User IP and country code are correct
- **Check**: `CPX_APP_ID` is valid
- **Check**: Account has surveys for user's country

### TheoremReach Issues

**Problem**: Signature verification fails
- **Check**: `THEOREMREACH_SECRET` matches dashboard
- **Check**: Using raw binary digest (not hex) before base64url
- **Check**: Base64url encoding: + → -, / → _, remove =
- **Check**: Signing full URL without &hash= parameter

**Problem**: Zero reward amount
- **Check**: Using `currency` field, NOT `reward` field
- **Check**: `currency_per_usd = 1` in provider config
- **Check**: `reward_multiplier = 0.8` in provider config

### Survey Quest Issues

**Problem**: Survey completed but no progress
- **Check**: Quest session status is "started"
- **Check**: Survey network in `allowed_networks`
- **Check**: Payout >= `min_payout_usd`
- **Check**: Provider postback reached server (check logs)
- **Check**: Signature verification passed

**Problem**: Same survey counted twice
- **Check**: Deduplication query in `quest_step_credits`
- **Check**: `survey_id` and `survey_network` in metadata
- **Bug**: Contact support if duplicates persist

---

## Production Checklist

- [ ] All environment variables set
- [ ] Migration applied to production database
- [ ] CPX Research postback URL configured
- [ ] TheoremReach postback URL configured
- [ ] Test survey quest created and verified
- [ ] Monitoring set up for `automation_logs`
- [ ] Wallet balance alerts configured
- [ ] Admin can view survey quest sessions

---

## API Reference

### Server Functions

#### `fetchSurveyFeed`
Fetches mixed survey list from allowed networks.

**Input**:
```typescript
{
  questKey: string;
  sessionId: string;
}
```

**Output**:
```typescript
{
  surveys: Array<{
    id: string;
    network: "cpxresearch" | "theoremreach" | "timewall";
    title: string;
    payoutUsd: number;
    loi: number;
    rating?: number;
    conversionRate?: number;
    entryLink: string;
  }>;
}
```

#### `startSurveyQuest`
Creates a new survey quest session.

**Input**:
```typescript
{
  questKey: string;
}
```

**Output**:
```typescript
{
  sessionId: string;
}
```

#### `getSurveyQuestProgress`
Returns survey completion progress.

**Input**:
```typescript
{
  questKey: string;
}
```

**Output**:
```typescript
{
  completed: number;
  required: number;
  isComplete: boolean;
}
```

---

## Support

For issues or questions:
1. Check `automation_logs` table for postback errors
2. Verify environment variables are correct
3. Test with single-survey quest first
4. Review TheoremReach test suite for signature debugging
5. Contact provider support if surveys not showing

---

## Version History

- **v1.0** (2027-08-10): Initial survey quest implementation
  - CPX Research integration
  - TheoremReach integration (HMAC-SHA1)
  - Timewall placeholder
  - Progress tracking via verified postbacks
  - Admin UI and server functions
