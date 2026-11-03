# Survey Quest Setup - Quick Reference

## Environment Variables (Required)

```bash
# CPX Research
CPX_APP_ID=your_app_id
CPX_SECURE_HASH_SECRET=your_hash_secret

# TheoremReach
THEOREMREACH_API_KEY=your_api_key
THEOREMREACH_SECRET=your_secret_key
# TheoremReach App ID in provider settings: 25361

# Base URL for callback reconstruction
PUBLIC_BASE_URL=https://cashgpt.in
```

## Provider Setup

### CPX Research
1. Sign up: https://publisher.cpx-research.com/
2. Get App ID + Secure Hash Secret from dashboard
3. Postback URL: `https://yourdomain.com/api/postback/cpxresearch`
4. Authentication: MD5 hash = `md5(user_id + "-" + secret)`

### TheoremReach  
1. Sign up: https://theoremreach.com/publisher/signup
2. Get API Key + Secret from Settings
3. Set App ID to **25361** in provider config
4. Postback URL: `https://yourdomain.com/api/postback/theoremreach`
5. Authentication: HMAC-SHA1 with base64url encoding (+ → -, / → _, no =)
6. **Important**: Use `currency` field (USD), NOT `reward` field

### Timewall
- Uses existing offerwall integration
- No additional credentials needed

## Quick Test

1. Create survey quest: required_surveys=1, min_payout_usd=0.01, all networks
2. Start quest, complete a CPX or TheoremReach survey
3. Check `automation_logs` for postback and progress tracking
4. Verify wallet credit (80%) + step reward + completion bonus

## Troubleshooting

- **Signature fails**: Check secrets match dashboard, verify hash format
- **No progress**: Check quest session active, network allowed, payout >= minimum
- **TheoremReach zero reward**: Must use `currency` field, not `reward`
- **Duplicate steps**: Check `quest_step_credits.metadata` for survey_network+survey_id

## Documentation
- Full setup: SURVEY_QUEST_SETUP.md
- Implementation: SURVEY_QUEST_IMPLEMENTATION.md
- Postback verification: TASK3_TIMEWALL_POSTBACK_VERIFICATION.md
