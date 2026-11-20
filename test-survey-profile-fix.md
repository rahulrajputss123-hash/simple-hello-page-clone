# Survey Profile Fix - Test Plan

## What Was Fixed

### 1. Birth Date Input (instead of Age)
- **Before**: Single "Age" number input (sent `age: 24`)
- **After**: Three inputs (Day / Month / Year) → sends `birthDate: "2000-01-15"`
- Server now correctly receives `birthDate` as required by schema

### 2. Zod Error Messages
- **Before**: Raw JSON error `[{"code":"invalid_type","expected":"object",...}]`
- **After**: Readable message like `birthDate: Must be a valid date resulting in age 1-99`

### 3. Hinglish → English
- **Before**: "Apni details bharein, behtar surveys paayein"
- **After**: "Complete your profile for better surveys"

All Hinglish removed from survey components.

### 4. Postal Code Made Optional
- **Before**: Required field
- **After**: Optional (matches server schema with `.optional()`)

---

## Manual Test Steps

### Test 1: Valid Birth Date
1. Open app in browser
2. Go to home page where surveys appear
3. Click "Complete your profile for better surveys" card
4. Fill form:
   - Day: `15`
   - Month: `1`
   - Year: `2000`
   - Gender: `Male`
   - Postal Code: `110001` (or leave empty)
   - Country: `IN`
5. Click "Save Profile"
6. **Expected**: Success, dialog closes, card disappears

### Test 2: Verify Database
```sql
SELECT user_id, birth_date, gender, postal_code, country_code, updated_at
FROM user_survey_profiles
WHERE user_id = '<your-user-id>'
LIMIT 1;
```
**Expected**: `birth_date` column has `2000-01-15`

### Test 3: Invalid Date
1. Open profile dialog again (create new account if needed)
2. Enter invalid date:
   - Day: `31`
   - Month: `2` (Feb doesn't have 31 days)
   - Year: `2000`
3. Click "Save Profile"
4. **Expected**: Alert "Please enter a valid date"

### Test 4: Age Too Young
1. Enter today's date minus 6 months (too young)
2. **Expected**: Server validation error: "birthDate: Must be a valid date resulting in age 1-99"
3. Error should display in **red box** at bottom of form (not as raw JSON)

### Test 5: Check English Text
1. Verify card text is English (no Hinglish)
2. Verify dialog description is English
3. Run grep to confirm:
```bash
grep -r "karein\|paayein\|jaayengi" src/components --include="*.tsx"
```
**Expected**: No results

---

## Quick Database Check Script

```javascript
// Run in browser console on cashgpt.in after login
const userId = '<paste-your-user-id>';
fetch(`https://cashgpt.in/api/check-survey-profile?userId=${userId}`)
  .then(r => r.json())
  .then(console.log);
```

Or use Supabase SQL editor:
```sql
SELECT * FROM user_survey_profiles ORDER BY updated_at DESC LIMIT 10;
```

---

## Automated Test (Optional)

If you have test infrastructure:
```typescript
describe('Survey Profile', () => {
  it('should save birth date as YYYY-MM-DD', async () => {
    const profile = {
      birthDate: '2000-01-15',
      gender: 'male',
      postalCode: '110001',
      countryCode: 'IN'
    };
    
    const result = await saveSurveyProfile({ data: profile });
    expect(result.success).toBe(true);
    
    const saved = await getSurveyProfile();
    expect(saved.birthDate).toBe('2000-01-15');
  });
});
```

---

## Rollback Plan (if needed)

If issues occur:
```bash
git revert 471e126
git push origin feature/surveys-section
```

---

## Success Criteria

✅ Form collects day/month/year (not age)  
✅ Server receives `birthDate: "YYYY-MM-DD"`  
✅ Database has `birth_date` column populated  
✅ Zod errors show readable messages (not JSON)  
✅ No Hinglish text visible in UI  
✅ Postal code is optional  
✅ Invalid dates are rejected with clear errors
