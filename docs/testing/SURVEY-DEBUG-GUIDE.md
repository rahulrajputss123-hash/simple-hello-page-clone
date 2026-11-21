# Survey Quest Debug Guide

## Current Commits (feature/surveys-section)
- `196d965` - Fixed TheoremReach API body structure (added "user" wrapper)
- `d0efdb2` - Restored Timewall card + forced survey refresh after profile save
- `c5c75c7` - Added comprehensive logging for debugging

## What to Test

### 1. Deploy Latest Changes
Deploy the latest commit (`c5c75c7`) to preview/production and check the logs.

### 2. Test Quest Survey Feed

**Steps:**
1. Open a survey quest in the quest dialog
2. Check browser console and server logs

**Expected Logs:**

```
[quest-survey-feed] Quest survey-quest-1 for user 12345678
[quest-survey-feed] IP: 103.211.53.251, Country: IN, Has Profile: true
[quest-survey-feed] Allowed networks: cpxresearch, theoremreach, timewall
[quest-survey-feed] Filters: minPayout=$0.50, maxLoi=35min
[quest-survey-feed] Raw surveys count: 15
[quest-survey-feed] Networks status: cpxresearch(10), theoremreach(5), timewall(0)
[quest-survey-feed] After filter: CPX=10, TheoremReach=5
[quest-survey-feed] Added Timewall wall card
[quest-survey-feed] Final survey count: 16
```

### 3. Check CPX Response

**Expected CPX Logs:**
```
[survey-feed] CPX profile params sent: main_info, gender, user_country_code, zip_code, birthday_day, birthday_month, birthday_year
[survey-feed] CPX HTTP 200
[survey-feed] CPX returned 10 surveys (status: success, count_available: 336)
```

**If CPX returns 0 surveys:**
- Check if CPX_APP_ID and CPX_SECURE_HASH are set in env
- Verify user's country is supported by CPX
- Check if profile data is being sent correctly

### 4. Check TheoremReach Response

**Expected TheoremReach Logs:**
```
[survey-feed] TheoremReach update_profile HTTP 200
[survey-feed] TheoremReach update_profile success
[survey-feed] TheoremReach HTTP 200
[survey-feed] TheoremReach returned 5 surveys
```

**If TheoremReach returns 422:**
- Check the error message in logs
- Verify request body structure has "user" wrapper
- Look for: `Body structure: user.{user_id, ip, country_code, attributes}`

**If TheoremReach returns 0 surveys:**
- Check if user's country is supported
- Verify Publisher API is enabled in TheoremReach dashboard
- Check if profile data is correct

### 5. Verify Timewall Card

**Expected:**
- Timewall card should ALWAYS appear at the bottom of quest dialog
- Even if CPX and TheoremReach return 0 surveys
- Card should say "Timewall Surveys / Browse more surveys"

**Log to look for:**
```
[quest-survey-feed] Added Timewall wall card
```

**If Timewall card not showing:**
- Check if "timewall" is in quest's allowed_networks
- Check if timewall provider exists in sdk_offerwall_providers table
- Look for log: `[quest-survey-feed] Timewall provider not found in database`

### 6. Test Profile Save and Refresh

**Steps:**
1. Fill out profile form (birth date, gender, postal code, country)
2. Click "Save Profile"
3. Immediately check if surveys refresh

**Expected Behavior:**
- Profile dialog closes
- Home surveys refresh within 2-3 seconds
- Quest surveys refresh within 2-3 seconds
- New targeted surveys appear (if available)

**Logs to check:**
```
[survey-feed] CPX profile params sent: main_info, gender, user_country_code, zip_code, birthday_day, birthday_month, birthday_year
[survey-feed] TheoremReach update_profile HTTP 200
```

## Common Issues and Solutions

### Issue 1: No Surveys in Quest Dialog

**Possible Causes:**
1. **IP/Country Detection Failed**
   - Log: `Unable to determine IP address` or `Unable to determine country`
   - Solution: Check geo detection in production logs

2. **CPX/TheoremReach API Errors**
   - Look for HTTP error codes (401, 403, 422, 500)
   - Check error messages in logs

3. **Profile Not Found**
   - Log: `Has Profile: false`
   - Solution: User needs to fill profile first

4. **Filters Too Restrictive**
   - Log: `After filter: CPX=0, TheoremReach=0`
   - Solution: Check minPayoutUsd and maxLoi in quest settings

5. **Country Not Supported**
   - CPX/TheoremReach may not have surveys for user's country
   - Check `count_available` in CPX response

### Issue 2: TheoremReach 422 Error

**Root Cause:** Request body missing "user" wrapper

**Fixed in commit `196d965`**

**Verify fix in logs:**
```
Body structure: user.{user_id, ip, country_code, attributes}
```

Should be:
```json
{
  "user": {
    "user_id": "...",
    "ip": "...",
    "country_code": "...",
    "attributes": { ... }
  }
}
```

### Issue 3: Surveys Don't Refresh After Profile Save

**Fixed in commit `d0efdb2`**

**What happens:**
1. Profile saved to database
2. Query invalidated
3. `refetchQueries()` called immediately
4. New survey request made with profile data
5. Surveys update within 2-3 seconds

**If still not refreshing:**
- Check browser console for refetch logs
- Verify profile was actually saved (check database)
- Check if new survey requests are being made (network tab)

## SQL Queries for Debugging

### Check if profile exists:
```sql
SELECT * FROM user_survey_profiles 
WHERE user_id = 'YOUR_USER_ID';
```

### Check Timewall provider:
```sql
SELECT * FROM sdk_offerwall_providers 
WHERE slug = 'timewall';
```

### Check quest configuration:
```sql
SELECT 
  key, 
  quest_type, 
  allowed_networks, 
  min_payout_usd, 
  max_loi 
FROM quests 
WHERE key LIKE '%survey%';
```

### Check survey inventory logs (after 10+ minutes):
```sql
SELECT 
  context->>'country' AS country,
  context->>'network' AS network,
  context->>'count' AS count,
  context->>'has_profile' AS has_profile,
  context->>'reason' AS reason,
  created_at
FROM automation_logs
WHERE event_type = 'survey_inventory'
  AND user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 20;
```

## Next Steps

1. **Deploy** latest changes (`c5c75c7`)
2. **Open quest dialog** with a survey quest
3. **Check server logs** for the detailed logging output
4. **Copy and paste logs** to identify the exact problem
5. **Share logs** if surveys still not appearing

The logs will tell us EXACTLY why surveys aren't showing:
- Is API returning 0 surveys?
- Are there API errors?
- Is filtering removing all surveys?
- Is profile data correct?
- Is country supported?

With these logs, we can fix the exact issue!
