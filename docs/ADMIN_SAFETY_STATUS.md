# Admin Safety Features - Implementation Status

## ✅ COMPLETED (Commits: e739ab5, fd67ca4)

### 1. Database & Migrations ✅
- Split migrations to match live DB:
  - `20270730000000_extend_app_role_enum.sql` - Add finance, support roles
  - `20270730000001_admin_safety_tables.sql` - All tables and functions
- Tables: `admin_audit_log`, `adjustment_requests` with proper RLS
- Helper functions: `count_device_duplicates`, `account_age_days`, `count_approved_withdrawals`
- RPC: `admin_list_audit_logs` for paginated audit viewing

### 2. Role System ✅
- Created `requireRole(userId, allowedRoles[])` helper in `admin-audit.server.ts`
- Replaced all `assertAdmin` with `requireRole` throughout codebase
- Role enforcement:
  - **admin**: Full access to everything
  - **finance**: Payouts, claims, tickets
  - **support**: Tickets only
- Updated functions in:
  - `coinquest.functions.ts` - All admin functions
  - `offers.functions.ts` - All admin offer functions

### 3. Audit Logging ✅
- `logAdminAction()` helper logs all admin actions
- Audit logging added to:
  - `adminAdjustWalletImpl` - wallet adjustments with before/after
  - `adminSetFlagImpl` - user flag/unflag
  - `adminUpdateWithdrawalImpl` - withdrawal approve/reject
  - `adminUpdateOfferClaimImpl` - claim approve/reject
  - `adminRespondTicketImpl` - ticket responses
  - Adjustment request create/approve/reject
  - Role assign/remove

### 4. Server Functions ✅
**Wallet Adjustment Requests:**
- `createAdjustmentRequestImpl` - For amounts >$100
- `listAdjustmentRequestsImpl` - List with status filter
- `approveAdjustmentRequestImpl` - Approve (different admin required)
- `rejectAdjustmentRequestImpl` - Reject with reason

**Audit Log:**
- `adminListAuditLogsImpl` - Paginated with filters (admin, action, date range)

**Fraud Signals:**
- `getWithdrawalFraudSignalsImpl` - Returns risk assessment:
  - accountAgeDays
  - lifetimeEarned
  - approvedWithdrawalsCount
  - isFlagged
  - deviceDuplicatesCount
  - riskLevel (low/medium/high)

**Users:**
- `getUsersWithSameDeviceImpl` - List all users on same device_id

**Staff Management:**
- `assignRoleImpl` - Assign role by email
- `removeRoleImpl` - Remove role (prevents removing own admin)
- `listStaffImpl` - List all staff with roles

### 5. Client Function Exports ✅
All server functions exported in `coinquest.functions.ts` with:
- Proper Zod validation
- Role checks using `requireRole`
- Error handling

## 🚧 TODO - UI Components (admin.tsx)

### 1. Audit Log Tab (admin only)
**Location:** New tab in admin panel  
**Features:**
- Filter inputs: Admin dropdown, Action text search, Date range (from/to)
- Table showing: Timestamp, Admin email, Action, Target, Before/After diff, Note
- Pagination (25 per page)
- Call: `adminListAuditLogs()`

### 2. Wallet Adjust UI Improvements
**Location:** Users tab, each user card  
**Current:** Amount input + "Adjust" button  
**New:**
1. Add "Reason" text input (required, min 5 chars)
2. Add confirm dialog showing: user email, amount (+/-), reason
3. **Amount ≤$100:** Call `adminAdjustWallet()` immediately
4. **Amount >$100:** Call `createAdjustmentRequest()` instead

**New Section:** "Pending Adjustments" (above users list or separate subtab)
- List pending adjustment requests
- Show: requester, user, amount, reason, requested date
- "Approve" button (disabled if requester === current admin)
- "Reject" button with reason input
- Call: `listAdjustmentRequests()`, `approveAdjustmentRequest()`, `rejectAdjustmentRequest()`

### 3. Fraud Signals in Payout Cards
**Location:** Withdrawals tab, each withdrawal card  
**Add below existing payout details:**
```tsx
<FraudSignalsDisplay withdrawalId={request.id} />
```

**Component to create:**
- Fetch `getWithdrawalFraudSignals(withdrawalId)` on mount
- Display:
  - Risk badge: 🔴 HIGH / 🟡 MEDIUM / 🟢 LOW
  - Account age: X days
  - Lifetime earned: $X.XX
  - Previous approved: X withdrawals
  - Flagged: Yes/No
  - Shared device: X accounts
- Style: Similar to existing warning badges

### 4. Users Tab - Same Device Button
**Location:** Users tab, each user card (if device_id exists)  
**Add button:** "Same device (X)" showing count  
**On click:**
- Open modal/dialog
- Call `getUsersWithSameDevice(deviceId)`
- Display list: name, email, balance, flagged status, created date
- Each entry shows if flagged

### 5. Users Tab - Suspicious Filter
**Location:** Users tab, next to search and "Flagged only"  
**Add button:** "Suspicious only"  
**When active:**
- Client-side filter showing users where:
  - is_flagged === true, OR
  - device_duplicates >= 2 (need to fetch/cache), OR
  - Account age < 3 days AND has withdrawal request

**Implementation:**
- May need to enhance `adminListUsers` to include fraud signals
- OR fetch signals separately for visible users

### 6. Staff Section (admin only)
**Location:** New tab "Staff" in admin panel  
**Features:**

**List Section:**
- Table/cards showing all staff
- Columns: Email, Name, Roles (badges), Assigned Date
- "Remove" button for each role
- Cannot remove own admin role (disabled + tooltip)

**Add Role Section:**
- Email input
- Role dropdown (admin/finance/support)
- "Assign" button
- Success/error toast

**Functions:**
- Call `listStaff()` on mount
- Call `assignRole(email, role)` on assign
- Call `removeRole(email, role)` on remove

### 7. Tab Visibility by Role
**Location:** admin.tsx tab buttons  
**Logic:**
```tsx
const userRoles = getUserRoles(); // Need to expose from useAuth or fetch

const canSee = {
  dashboard: true, // everyone
  offers: userRoles.includes('admin'),
  quests: userRoles.includes('admin'),
  tasks: userRoles.includes('admin'),
  banners: userRoles.includes('admin'),
  onboarding: userRoles.includes('admin'),
  withdrawals: userRoles.includes('admin') || userRoles.includes('finance'),
  claims: userRoles.includes('admin') || userRoles.includes('finance'),
  tickets: userRoles.includes('admin') || userRoles.includes('finance') || userRoles.includes('support'),
  users: userRoles.includes('admin'),
  providers: userRoles.includes('admin'),
  'sdk-offerwalls': userRoles.includes('admin'),
  automation: userRoles.includes('admin'),
  'offer-feed': userRoles.includes('admin'),
  campaigns: userRoles.includes('admin'),
  'proof-reviews': userRoles.includes('admin'),
  advertisers: userRoles.includes('admin'),
  audit: userRoles.includes('admin'),
  staff: userRoles.includes('admin'),
};

// Filter tabs
tabs.filter(([key]) => canSee[key])
```

## 📝 TESTING CHECKLIST

After UI implementation, test:

### Audit Log
- [ ] Audit log tab visible to admin only
- [ ] Filter by admin works
- [ ] Filter by action works (text search)
- [ ] Date range filter works
- [ ] Pagination works (25 per page)
- [ ] All past actions show in log

### Wallet Adjust
- [ ] Cannot submit without reason (min 5 chars)
- [ ] Confirm dialog shows correct user, amount, reason
- [ ] Amount $50 applies immediately
- [ ] Amount $150 creates adjustment request
- [ ] Pending adjustments list shows request
- [ ] Cannot approve own request (button disabled + error message)
- [ ] Different admin can approve request
- [ ] Approval applies adjustment and updates request status
- [ ] Rejection updates request status with note
- [ ] All actions logged in audit log

### Fraud Signals
- [ ] Risk badge shows (High/Medium/Low) with correct color
- [ ] Account age displays correctly
- [ ] Lifetime earned displays correctly
- [ ] Previous approved withdrawals count correct
- [ ] Flagged status shows
- [ ] Device duplicates count correct
- [ ] High risk: new account (<3 days) with first withdrawal
- [ ] High risk: 2+ accounts on same device
- [ ] High risk: flagged user
- [ ] Medium risk: account age < 7 days

### Users Tab
- [ ] "Same device" button shows count
- [ ] Clicking button shows modal with all matching users
- [ ] Modal shows flagged status for each user
- [ ] "Suspicious users" filter shows correct users
- [ ] Filter includes flagged users
- [ ] Filter includes users with device duplicates >= 2

### Staff Management
- [ ] Staff tab visible to admin only
- [ ] List shows all staff with roles
- [ ] Can assign role by email
- [ ] Cannot assign duplicate role (error)
- [ ] Can remove role
- [ ] Cannot remove own admin role (disabled + error)
- [ ] All role actions logged in audit log

### Role Enforcement
- [ ] Finance user sees: dashboard, withdrawals, claims, tickets
- [ ] Finance user does NOT see: offers, quests, tasks, users, staff, audit
- [ ] Support user sees: dashboard, tickets only
- [ ] Support user does NOT see: withdrawals, claims, offers, users
- [ ] Finance can approve/reject withdrawals and claims
- [ ] Support can only respond to tickets
- [ ] Server-side role checks prevent API bypass

## 🎯 Implementation Priority

1. **Fraud signals in payout cards** (critical for safety)
2. **Wallet adjust improvements** (confirm dialog + adjustment requests)
3. **Staff management tab** (role assignment/removal)
4. **Tab visibility by role** (hide unauthorized tabs)
5. **Audit log tab** (for transparency)
6. **Users tab enhancements** (same device, suspicious filter)

## 📦 Files Changed So Far

- `supabase/migrations/20270730000000_extend_app_role_enum.sql` (new)
- `supabase/migrations/20270730000001_admin_safety_tables.sql` (new)
- `src/lib/admin-audit.server.ts` (new)
- `src/lib/coinquest.server.ts` (audit logging + new functions)
- `src/lib/coinquest.functions.ts` (role checks + new exports)
- `src/lib/offers.functions.ts` (role checks)

## 📦 Files To Change

- `src/routes/_authenticated/admin.tsx` (all UI components)
- `src/lib/auth.tsx` (expose user roles if needed)

## ⚠️ Important Notes

- All fraud detection helpers (`count_device_duplicates`, etc.) are SECURITY DEFINER and service_role only
- Must call via `supabaseAdmin.rpc()` from server functions after role check
- Audit logging uses try/catch to never fail primary operations
- Adjustment requests >$100 have CHECK constraint: requester != approver
- RLS prevents client writes to audit_log and adjustment_requests
