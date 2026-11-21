# Manual Database Migrations

This file documents database migrations that were applied manually to production and are not yet tracked in the automated migration system. These should be reconciled with `supabase_migrations` when the migration infrastructure is set up.

---

## user_survey_profiles Table

**Date Applied:** November 2024 (exact date to be confirmed from production logs)

**Purpose:** Store user demographic profiles for survey targeting (CPX Research, TheoremReach, Timewall)

**SQL Applied:**

```sql
-- Create user_survey_profiles table
CREATE TABLE IF NOT EXISTS user_survey_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  birth_date DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  postal_code TEXT,
  country_code TEXT NOT NULL CHECK (length(country_code) = 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_user_survey_profiles_user_id 
  ON user_survey_profiles(user_id);

-- Enable Row Level Security
ALTER TABLE user_survey_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see and modify their own profile
CREATE POLICY user_survey_profiles_user_policy 
  ON user_survey_profiles
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Service role has full access
CREATE POLICY user_survey_profiles_service_policy 
  ON user_survey_profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

**Schema Details:**

- `user_id`: UUID, Primary Key, Foreign Key to users(id)
- `birth_date`: DATE, NOT NULL (used to calculate age dynamically)
- `gender`: TEXT, NOT NULL, CHECK ('male' or 'female')
- `postal_code`: TEXT, NULLABLE (optional zip/postal code)
- `country_code`: TEXT, NOT NULL, CHECK (2-character ISO 3166-1 alpha-2)
- `created_at`: TIMESTAMPTZ, NOT NULL, DEFAULT NOW()
- `updated_at`: TIMESTAMPTZ, NOT NULL, DEFAULT NOW()

**Notes:**

1. The `birth_date` column stores the user's date of birth in `YYYY-MM-DD` format
2. Age is calculated dynamically in application code, not stored in the database
3. Previously there was an `age` column which has been replaced by `birth_date`
4. The `postal_code` column was made NULLABLE to support countries/users without postal codes
5. Survey providers receive different data:
   - **CPX Research**: birthday_day, birthday_month, birthday_year, gender, zip_code, user_country_code
   - **TheoremReach**: age (calculated), gender, postal_code, country_code
   - **Timewall**: No profile API integration (wall-only)

**Related Code:**

- `src/lib/surveys/survey-profile.functions.ts` - Profile CRUD operations
- `src/components/SurveyProfileCard.tsx` - User-facing profile form
- `src/lib/surveys/survey-feed.server.ts` - Integration with survey APIs

**Status:** ✅ Applied to production, needs reconciliation in supabase_migrations

---

## Future Migrations

Document any additional manual migrations below using the same format.
