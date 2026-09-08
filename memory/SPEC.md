# CashGPT Premium Onboarding Spec

## Purpose
CashGPT now has a premium first-run onboarding flow that introduces users to earning features without changing the existing Home screen.

## User flow
1. Welcome
2. Choose Avatar (nine fixed options)
3. Profile (display name, gender, date of birth)
4. Features Offers
5. Quest
6. Watch & Earn
7. Offerwall
8. Refer & Earn
9. You're Ready (shows the real wallet balance)
10. Start Earning navigates to the existing `/home` route

Steps 4–8 are static educational content and do not call live earning APIs. Feature progress displays 1/5 through 5/5.

## Data model
- Existing `profiles` is extended with `gender` and `date_of_birth`; `avatar_url`, `onboarded`, and `has_seen_onboarding` remain the user profile/completion fields.
- Existing `onboarding_steps` is extended with `experience='premium'`, step content, type, CTA, accent, and illustration fields. Existing `experience='tour'` rows continue to power the coach-mark tour.
- Migration: `supabase/migrations/20261228000000_premium_onboarding.sql`.

## Admin
The Admin → Onboarding tab manages premium steps: add, edit, delete, reorder, enable/disable, duplicate, and preview. Changes are admin-gated through the existing Supabase role middleware.

## Auth and roles
Supabase Auth provides sessions. Existing `profiles.onboarded=false` users enter onboarding; authenticated admins use the existing `user_roles` admin role to manage configuration.

## Existing Home protection
`src/routes/_authenticated/home.tsx` was not modified for this feature.