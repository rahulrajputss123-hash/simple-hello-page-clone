# Requirements Status Check

## 1. Tab visibility by role ❌ **NOT DONE**
- **Current**: All tabs visible to all admins
- **Required**: 
  - Support sees only: Tickets
  - Finance sees: Payouts, Claims, Tickets  
  - Admin sees: Everything
  - Open first allowed tab by default
- **Action needed**: Add role filtering to tab list and default tab selection

## 2. Users tab: "Suspicious users" filter ❌ **NOT DONE**
- **Current**: Only "Flagged" filter exists
- **Required**: "Suspicious users" filter (flagged OR sharing device_id OR account <3 days with earnings)
- **Action needed**: Add filter button and server-side query logic

## 3. Staff tab: allow assigning admin ⚠️ **PARTIAL**
- **Current**: Can assign finance/support only
- **Required**: Allow assigning admin role
- **Server-side protection**: ❌ **NOT DONE** - Admin must NOT be able to remove their own admin role
- **Action needed**: 
  - Add admin to role assignment UI
  - Add server-side check in removeRole to prevent self-removal

## 4. Audit Log tab: date range and expandable rows ❌ **NOT DONE**
- **Current**: Only admin/action filters
- **Required**: 
  - Date range filter (start/end dates)
  - Expandable row showing before/after changes
- **Action needed**: Add date inputs, modify query, add expand/collapse UI

## 5. requireRole usage in all admin functions ✅ **MOSTLY DONE**
**Functions still using assertAdmin (need conversion):**
- `upsertManualOffer` in offers.functions.ts
- `deleteManualOffer` in offers.functions.ts
- `getFeedAutomation` in offers.functions.ts
- `updateFeedSettings` in offers.functions.ts
- `updateNetworkFeedSettings` in offers.functions.ts
- `adminRefreshFeed` in offers.functions.ts (this one already has requireRole above it)
- `updateOfferControls` in offers.functions.ts
- `adminSignProofUrl` in offers.functions.ts

**Functions with requireRole ✅:**
All coinquest.functions.ts admin functions have requireRole with appropriate roles.

---

## Summary
- ❌ **1/5 requirements fully complete**
- ⚠️ **1/5 partially complete**
- ❌ **3/5 not started**

## Action Plan
1. Add roles array to auth context
2. Implement tab visibility filtering
3. Add suspicious users filter
4. Add admin role assignment with self-removal protection
5. Add date range filter and expandable rows to audit log
6. Replace remaining assertAdmin calls with requireRole
