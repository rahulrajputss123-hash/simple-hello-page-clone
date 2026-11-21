# Survey Profile Testing Instructions

## Manual Test: Profile Save with Birth Date

### Prerequisites
1. Start dev server: `npm run dev`
2. Have database access (Supabase dashboard or psql)
3. Have a test user account

### Test Steps

1. **Navigate to the app**
   - Open the app in browser
   - Log in with test account
   - Go to home page where surveys are displayed

2. **Open profile form**
   - Click "Complete your profile for better surveys" card
   - Profile dialog should open

3. **Fill in valid birth date**
   - Birth Date: Select a date that makes user between 13-100 years old
     - Example: If current year is 2024, select a date between 1924-01-01 and 2011-12-31
   - Gender: Select Male or Female
   - Postal Code: (Optional) Enter valid postal code (e.g., "110001" for India)
   - Country: Select a country (e.g., India)

4. **Submit form**
   - Click "Save Profile"
   - Should show "Saving..." then close dialog on success
   - Should NOT show any error messages

5. **Verify in database**
   Run this SQL query to check the saved profile:

```sql
-- Replace 'YOUR_USER_ID' with actual user ID
SELECT 
  user_id,
  birth_date,
  EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date)) AS calculated_age,
  gender,
  postal_code,
  country_code,
  created_at,
  updated_at
FROM user_survey_profiles
WHERE user_id = 'YOUR_USER_ID';
```

### Expected Results

**Database row should show:**
- `birth_date`: YYYY-MM-DD format (e.g., "2000-05-15")
- `calculated_age`: Between 13 and 100
- `gender`: "male" or "female"
- `postal_code`: Value entered or NULL if skipped
- `country_code`: 2-letter country code (e.g., "IN")
- `created_at`: Timestamp when profile was first created
- `updated_at`: Timestamp when profile was last updated

**UI should show:**
- Profile card should disappear from home page (since profile now exists)
- New surveys should appear if profile enables targeting

### Age Validation Tests

Test these scenarios to verify validation:

1. **Valid ages (should save successfully)**
   - Birth date: 13 years ago (minimum)
   - Birth date: 25 years ago (typical)
   - Birth date: 100 years ago (maximum)

2. **Invalid ages (should show error)**
   - Birth date: 12 years ago → "You must be at least 13 years old to complete surveys"
   - Birth date: 101 years ago → "Please enter a valid birth date"
   - Future date → Browser should prevent selection (native date picker)

### Query Invalidation Test

After saving profile:
1. Check that surveys list refreshes automatically
2. New targeted surveys should appear (if available for user's demographics)
3. No page refresh should be needed

### Server Logs to Check

Look for these log messages:
```
[survey-feed] CPX HTTP 200
[survey-feed] TheoremReach update_profile HTTP 200
[survey-feed] TheoremReach update_profile success
```

If TheoremReach returns 422:
```
[survey-feed] TheoremReach update_profile 422 error. 
Request keys: user_id, ip, country_code, attributes. 
Attribute keys: facet_hash, postal_code (or just facet_hash if no postal_code)
```

## Troubleshooting

**Profile won't save:**
- Check browser console for errors
- Verify all required fields are filled
- Check network tab for API response

**Validation error:**
- Verify birth date results in age 13-100
- Check server logs for detailed zod validation error

**Surveys not refreshing:**
- Check browser console for query invalidation
- Manually refresh page to verify new profile is saved
- Check survey feed API calls in network tab

## Sample SQL Output (Expected)

```
 user_id                              | birth_date | calculated_age | gender | postal_code | country_code | created_at                  | updated_at
--------------------------------------+------------+----------------+--------+-------------+--------------+-----------------------------+---------------------------
 12345678-1234-1234-1234-123456789012 | 2000-05-15 |             24 | male   | 110001      | IN           | 2024-11-20 10:30:00.123+00  | 2024-11-20 10:30:00.123+00
```

## Notes

- User can update their profile later (upsert behavior)
- Profile data is sent to CPX Research and TheoremReach APIs for targeting
- Age is calculated dynamically, not stored in database
- Postal code is optional but recommended for better targeting
