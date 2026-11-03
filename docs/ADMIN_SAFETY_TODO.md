# Admin Safety Features - Implementation Status

## ✅ COMPLETED (Part 1 - Commit 6c73935)

### 1. Database Schema
- ✅ Created `admin_audit_log` table with RLS (admin/finance/support can read, service role only writes)
- ✅ Created `adjustment_requests` table for >$100 adjustments requiring 2-admin approval
- ✅ Extended `user_roles` constraint to support: admin, finance, support roles
- ✅ Added fraud detection helper functions:
  - `count_device_duplicates(device_id)`
  - `account_age_days(user_id)`
  - `count_approved_withdrawals(user_id)`
- ✅ Created `admin_list_audit_logs()` RPC for paginated audit log

### 2. Audit Logging
- ✅ Created `src/lib/admin-audit.server.ts` with `logAdminAction()` helper
- ✅ Added audit logging to:
  - `adminAdjustWalletImpl` - logs wallet adjustments with before/after balances
  - `adminSetFlagImpl` - logs flag/unflag actions
  - `adminUpdateWithdrawalImpl` - logs approve/reject with status changes
  - `adminUpdateOfferClaimImpl` - logs approve/reject with reward amounts
  - `adminRespondTicketImpl` - logs ticket responses

### 3. Function Signatures Updated
- ✅ All admin impl functions now accept `adminId` as first parameter
- ✅ Updated wallet adjust reason validation (min 5 chars, was 2)
- ✅ Updated function calls in `coinquest.functions.ts` to pass `context.userId` as adminId

## 🚧 TODO (Part 2 - Needs Implementation)

### 1. Admin Role Check Audit

**FILES TO CHECK:**
- `src/lib/offers.functions.ts` - Admin offer management functions
- `src/lib/marketplace.functions.ts` - Marketplace admin functions (if any)

**Functions found that need admin check:**
From `offers.functions.ts`:
- ✅ `adminDashboard` - Already has `assertAdmin`
- ✅ `listAdminOffers` - MISSING admin check
- ✅ `createOffer` - MISSING admin check  
- ✅ `updateOffer` - MISSING admin check
- ✅ `patchOffer` - MISSING admin check
- ✅ `listOfferProviders` - MISSING admin check
- ✅ `upsertOfferProvider` - MISSING admin check
- ✅ `syncOfferProvider` - MISSING admin check
- ✅ `adminRefreshFeed` - Already has `assertAdmin`
- ✅ `adminSignProofUrl` - Already has `assertAdmin`

**ACTION NEEDED:**
Add `assertAdmin` check to all functions marked as MISSING above.

### 2. Audit Log UI Tab
Create new tab in `admin.tsx`:
- Filter by: admin (dropdown), action (text search), date range (from/to)
- Pagination (25 per page)
- Display: timestamp, admin email, action, target type/id, before/after diff, note
- Use `admin_list_audit_logs()` RPC

### 3. Wallet Adjust Improvements

**A. UI Changes in admin.tsx Users tab:**
- Replace hardcoded "Manual admin adjustment" with a reason text input (min 5 chars)
- Add confirm dialog showing: user, amount (+/-), reason before submit
- For amounts >$100 absolute: create adjustment_request instead of immediate apply

**B. New Functions Needed:**
```typescript
// In coinquest.server.ts
export async function createAdjustmentRequestImpl(
  adminId: string,
  userId: string,
  amount: number,
  reason: string
)

export async function listAdjustmentRequestsImpl(status?: 'pending'|'approved'|'rejected')

export async function approveAdjustmentRequestImpl(
  approverId: string,
  requestId: string,
  note?: string
)

export async function rejectAdjustmentRequestImpl(
  approverId: string,
  requestId: string,
  note: string
)
```

**C. New UI Tab:**
- "Adjustment Requests" tab showing pending requests
- Each request shows: requester, user, amount, reason, requested_at
- Cannot approve own request (check server-side)
- Approve button calls `approveAdjustmentRequestImpl` which:
  1. Verifies requester != approver
  2. Calls `adminAdjustWalletImpl`
  3. Updates request status to 'approved'

### 4. Fraud Signals in Payout Cards

**In adminListWithdrawalsImpl:** Fetch and return fraud signals for each withdrawal:
```typescript
{
  accountAgeDays: number,
  lifetimeEarned: number,
  approvedWithdrawalsCount: number,
  isFlagged: boolean,
  deviceDuplicatesCount: number,
  hasDuplicateBinancePay: boolean,
  riskLevel: 'low' | 'medium' | 'high'
}
```

**Risk Level Rules:**
- High: (accountAgeDays < 3 AND first withdrawal) OR deviceDuplicatesCount >= 2 OR isFlagged
- Medium: accountAgeDays < 7 OR hasDuplicateBinancePay
- Low: else

**UI Changes in admin.tsx withdrawals tab:**
Add risk badge and fraud details under each payout card:
```
[🔴 HIGH RISK]
• Account age: 2 days
• Lifetime earned: $5.20
• Previous approved: 0
• Flagged: Yes
• Shared device: 3 accounts
```

### 5. Users Tab Enhancements

**A. "Same Device" Button:**
When clicked, show modal/expand section with list of all users sharing that device_id:
- Query: `SELECT id, name, email, wallet_balance, is_flagged, created_at FROM profiles WHERE device_id = ? ORDER BY created_at DESC`
- Display as list with flag status

**B. "Suspicious Users" Filter:**
Add toggle button that filters to users matching ANY of:
- Flagged
- Device shared by 2+ accounts
- Account age < 3 days with withdrawal
- Has duplicate Binance Pay ID

### 6. Extended Roles Implementation

**A. New Tables/Data:**
- user_roles already exists, just verify check constraint includes: admin, finance, support

**B. New Functions:**
```typescript
// In coinquest.server.ts or new admin-roles.server.ts
export async function assignRoleImpl(adminId: string, userEmail: string, role: 'admin'|'finance'|'support')
export async function removeRoleImpl(adminId: string, userEmail: string, role: string)
export async function listStaffImpl() // Returns all users with roles
```

**C. Role Enforcement:**
Modify all admin handler functions to check specific roles:
- support: only tickets tab (adminRespondTicket, adminListTickets)
- finance: tickets + withdrawals + claims (add +adminUpdateWithdrawal, adminUpdateOfferClaim, adminListWithdrawals, adminListClaims)
- admin: everything

**D. UI Changes:**
1. New "Staff" tab in admin.tsx:
   - List all users with roles (email, roles, assigned date)
   - Add role form: email input, role dropdown, assign button
   - Remove button for each role

2. Hide tabs based on user's role:
   ```typescript
   const { roles } = useAuth(); // Need to expose this
   const canSeeOffers = roles.includes('admin');
   const canSeePayouts = roles.includes('admin') || roles.includes('finance');
   const canSeeTickets = roles.includes('admin') || roles.includes('finance') || roles.includes('support');
   ```

## 📋 TESTING CHECKLIST

After implementation, manually test:

### Audit Log
- [ ] Adjust wallet and verify audit log entry
- [ ] Flag user and verify audit log entry
- [ ] Approve withdrawal and verify audit log entry  
- [ ] Reject claim and verify audit log entry
- [ ] Respond to ticket and verify audit log entry
- [ ] Audit log tab shows all entries with correct filtering
- [ ] Pagination works

### Wallet Adjust
- [ ] Cannot submit without reason (min 5 chars)
- [ ] Confirm dialog shows correct details
- [ ] Amount ≤$100 applies immediately
- [ ] Amount >$100 creates adjustment_request
- [ ] Cannot approve own adjustment request
- [ ] Second admin can approve/reject request
- [ ] Approved request applies adjustment and logs audit

### Fraud Signals
- [ ] New account (<3 days) shows HIGH risk
- [ ] Flagged user shows HIGH risk
- [ ] Device with 2+ accounts shows HIGH or MEDIUM risk
- [ ] All fraud signals display correctly in payout card
- [ ] "Same device" button shows all matching accounts

### Users Tab
- [ ] "Suspicious users" filter works
- [ ] Shows correct users based on filter
- [ ] "Same device" button works

### Roles
- [ ] Can assign admin/finance/support roles by email
- [ ] Can remove roles
- [ ] Finance user only sees: dashboard, withdrawals, claims, tickets tabs
- [ ] Support user only sees: dashboard, tickets tab
- [ ] Finance user can approve/reject withdrawals and claims
- [ ] Support user can only respond to tickets
- [ ] Role checks enforced server-side (test with API calls)

## 📝 MIGRATION ORDER

1. `20270730000000_admin_safety_features.sql` (already created)
2. No additional migrations needed - all features use existing tables

## ⚠️ IMPORTANT NOTES

- Audit logging uses try/catch to never fail primary operations
- All admin functions must call `assertAdmin` or role-specific check
- RLS policies prevent client-side writes to audit_log and adjustment_requests
- Adjustment requests >$100 require different approver than requester (CHECK constraint in DB)
- Fraud signals are computed on-demand (no cached values)
- Extended roles are additive (support < finance < admin in permissions)
