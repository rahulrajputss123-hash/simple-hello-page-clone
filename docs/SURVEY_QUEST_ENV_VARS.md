# Survey Quest Environment Variables - Complete List

## Required Environment Variables

Add these to your `.env` file:

```bash
# CPX Research (https://publisher.cpx-research.com/)
CPX_APP_ID=your_cpx_app_id
CPX_SECURE_HASH_SECRET=your_cpx_hash_secret

# TheoremReach (https://theoremreach.com/publisher/signup)
THEOREMREACH_API_KEY=your_theoremreach_api_key
THEOREMREACH_SECRET=your_theoremreach_secret_key

# Public base URL (used for TheoremReach callback URL reconstruction)
PUBLIC_BASE_URL=https://cashgpt.in
```

## Provider Settings in Database

### TheoremReach Provider Configuration

In your `sdk_offerwall_providers` table, ensure TheoremReach provider has:

```sql
-- TheoremReach specific settings
app_id: '25361'
currency_per_usd: 1.0
reward_multiplier: 0.8
```

**Important Notes**:
- **App ID must be 25361** (TheoremReach's app identifier)
- `currency_per_usd = 1` means the `currency` field is already in USD
- `reward_multiplier = 0.8` means users get 80% of survey payout
- Use `currency` field from postback, NOT `reward` field

### CPX Research Provider Configuration

```sql
-- CPX Research specific settings  
currency_per_usd: 1.0
reward_multiplier: 0.8
```

### Timewall Provider Configuration

No special configuration needed - uses existing offerwall integration.

## Postback URLs to Configure

Configure these URLs in your provider dashboards:

```
CPX Research:     https://yourdomain.com/api/postback/cpxresearch
TheoremReach:     https://yourdomain.com/api/postback/theoremreach
Timewall:         https://yourdomain.com/api/postback/timewall
```

Replace `yourdomain.com` with your actual domain (same as `PUBLIC_BASE_URL`).

## Verification

After setting up, verify:

1. **Environment variables loaded**: Check `process.env.CPX_APP_ID`, etc.
2. **Provider configured**: Query `sdk_offerwall_providers` table
3. **Postback URLs**: Test with provider's postback tester
4. **Signature verification**: Run `node test-theoremreach-hash.js`
5. **Test quest**: Create quest with `required_surveys=1`, complete survey, check `automation_logs`

## Troubleshooting

**CPX signature fails**: Check `CPX_SECURE_HASH_SECRET` matches dashboard exactly
**TheoremReach signature fails**: Check `THEOREMREACH_SECRET`, verify base64url encoding
**Zero reward**: TheoremReach must use `currency` field, check `currency_per_usd=1`
**No progress**: Check network in `allowed_networks`, payout >= `min_payout_usd`
