# Coin Quest Rewards

# CoinQuest — Lovable Build Prompt

## App Overview

Build a full-stack web app (PWA-ready) called **CoinQuest** — a rewards/earning platform where users watch ads and complete offers to earn real-money credits into an in-app wallet. Use Supabase for auth, database, and backend logic.

## Design System (must match exactly)

- Background: cream (#FFF8EC), secondary cream (#FBF0DC)

- Primary dark: deep jade green (#0F3D3E), secondary jade (#144C4D)

- Accent success: mint green (#2FD897)

- Accent reward/currency: coin-gold (#FFB627), gold-dark (#F09A00)

- Text: ink (#16261F), soft ink (#5C6F66)

- Cards: white (#FFFFFF), border (#EFE4CC)

- Fonts: "Baloo 2" (rounded, weight 700-800) for headings/numbers/currency amounts, "Inter" for body/UI text

- Rounded cards (16-22px radius), soft shadows, mobile-first layout, bottom tab navigation

## Pages & Navigation

Bottom nav: Home, Offers, Task, Refer, Support (5 tabs)

### 1. Auth flow (before main app)

- Sign up (email or phone + OTP), Login, Forgot Password

- On first login: onboarding screen asking name, and optional referral code entry

- Store user in `users` table: id, name, email/phone, wallet_balance, referral_code, referred_by, device_id, created_at, kyc_status

### 2. Home

- Header: logo left (the "C" brand mark is TAPPABLE → opens Profile & Settings screen), wallet balance pill top-right (tap → Wallet screen)

- Add a small notification bell icon near the wallet pill (tap → Notifications inbox: list of alerts like "Quest completed", "Withdrawal approved", "New offer available")

- Greeting banner with daily streak counter and progress bar toward a bonus

- "Starter Quests" — 3 cards: 5 ads/$1, 25 ads/$1, 50 ads/$1, shown as circular progress dials. Tapping "Watch" starts an ad session that the SERVER verifies before crediting the wallet (do not credit on client-side timer alone — create a `quest_sessions` table with status: started/verified/credited)

- "Featured Offers" list — pulled from an `offers` table (title, icon, description, reward_amount, requirements, is_featured flag)

- "Offerwall" section — grid of partner network placeholder cards (name, description, reward range, "Open" button) — these are placeholders for later native SDK integration, not live yet

### 3. Offers tab

- Same Featured Offers list (filter `is_featured = true` from `offers` table) + same Offerwall grid — pulled from the same tables as Home, not duplicated data

### 4. Task tab

- Numbered task list from a `tasks` table (title, description, progress, reward, status: locked/active/completed)

- Show a progress bar for multi-step tasks

- Tasks can optionally be flagged `is_featured` so they also appear in the Offers tab list

### 5. Wallet screen (tap wallet pill from Home — must support full withdraw + history flow)

- Current balance (large, top), lifetime earned, lifetime withdrawn as small stats

- Two tabs within Wallet: "History" and "Payout Methods"

- **History tab**: full transaction list (source, amount, date, status: pending/completed/failed) pulled from `wallet_transactions` table, with filter chips (All / Earned / Withdrawn), tap a pending withdrawal to see status detail or cancel it while still pending

- **Payout Methods tab**: list of saved UPI IDs / bank accounts, "Add new method" form, set a default method, delete a method

- "Withdraw" button (prominent, top of Wallet screen) → choose saved payout method (or add new), enter amount (validate against minimum payout $5.00 and current balance), confirm → creates a row in `withdrawal_requests` table with status pending, holds that amount from available balance so it can't be double-spent, shows up on History tab

- KYC step if withdrawal amount crosses a threshold: collect full name + ID number, store as `kyc_status: pending`, block withdrawal until KYC approved by admin

### 5b. Profile & Settings screen (opened by tapping the "C" brand mark, top-left, from any screen)

- Profile header: avatar (editable), name (editable), email/phone (editable with re-verification), member-since date

- KYC status badge (Not started / Pending / Verified)

- Account section: Change password, Manage payout methods (links to Wallet → Payout Methods tab), Referral code (quick access)

- Preferences section: Push notification toggle, Language selector, optional Dark mode toggle

- Support & Legal section: Help/Support (links to Support tab), Terms & Conditions, Privacy Policy, Payout Policy, App version number

- Danger zone: Logout (confirmation dialog), Delete account (confirmation dialog, explains wallet balance is forfeited or must be withdrawn first)

### 5c. Onboarding tutorial (first app open only, before or right after signup)

- 3 swipeable intro screens: "Complete quests & offers" → "Earn into your wallet" → "Invite friends for bonus $", with a "Get Started" button on the last screen

### 5d. Empty & error states (apply across all list-based screens)

- Offers/Task/Offerwall: "No offers available right now — check back soon" empty state with an icon

- Wallet history: "No transactions yet — complete your first quest to see it here"

- Network error state: retry button, friendly message, no raw error codes shown to user

### 6. Refer tab

- Referral code display + copy button

- Stats: friends invited, referral earnings (computed from `users` table where `referred_by = current_user.referral_code` joined with completed quest data)

- Share buttons (WhatsApp/Telegram/Copy link) — generate a shareable link with the referral code as a query param

- "How it works" steps

### 7. Support tab

- Search bar (searches an `faq` table)

- Open ticket status banner if user has an active ticket

- Contact cards: Live Chat (placeholder), Email

- FAQ accordion list from `faq` table

- "Raise a ticket" form → creates row in `support_tickets` table (subject, description, status, created_at)

### 8. Legal pages (simple static pages, linked from Support/Profile)

- Terms & Conditions

- Privacy Policy

- Payout Policy (explains minimum cash-out, processing time, KYC requirement)

## Admin Panel (separate route, e.g. /admin, protected by an admin role)

- Manage `offers` table: add/edit/remove offers, toggle featured

- Manage `tasks` table

- Review `withdrawal_requests`: approve/reject, mark paid

- Review `kyc` submissions: approve/reject

- View flagged/suspicious accounts (same device_id used by multiple accounts, abnormal quest-completion speed)

- View support tickets, respond, close

## Database tables needed (Supabase)

`users`, `wallet_transactions`, `quest_sessions`, `offers`, `tasks`, `withdrawal_requests`, `kyc_submissions`, `support_tickets`, `faq`, `referrals`

## Anti-fraud requirements

- One account per device: store a device fingerprint/ID at signup, flag duplicates

- Ad/quest credit only after server-side verification of session completion, never trust a client-side timer alone

- Rate-limit quest completions (e.g., can't complete 50 ads in 2 minutes)

## Important technical note

This build should be treated as the web app + backend + admin panel only. Real rewarded-video ad SDKs (AdMob, Unity Ads) and real offerwall SDKs (AdGem, OfferToro, Digital Turbine/Fyber) require a native mobile wrapper (e.g., Capacitor) added after this web app is built — they cannot be embedded as pure web components. Leave clearly marked integration points (e.g., a `startAdSession()` function and an `<OfferwallSlot />` component) so those SDKs can be dropped in later.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0ca9701e-3ba4-468e-a8f5-23a6434e4426).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
