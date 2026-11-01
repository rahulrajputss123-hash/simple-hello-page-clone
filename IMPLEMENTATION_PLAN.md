# Network Quest - Remaining Implementation

## Status: Step Rewards ✅ | Admin UI 🔄 | Client UI 🔄

### ✅ COMPLETED
- Database migration with kind, step_index, partial unique indexes
- Postback handler with step reward payment
- Token validation (provider match, expiry, session status)
- Atomic step_index assignment with retry
- creditStepReward exported and integrated

### 🔄 IN PROGRESS

#### 1. Update Reward Totals in QuestCard
**File:** `src/components/QuestCard.tsx`
- Network quests: sum(step_rewards) + reward_amount
- Update `displayReward` calculation
- Same logic needed in QuestDetailsDialog

#### 2. Admin Multi-Select for Providers
**File:** `src/components/admin/QuestsManager.tsx`
- Replace comma-separated UUID input
- Fetch enabled sdk_offerwall_providers
- Multi-select with provider names + logos
- Maintain order (array of UUIDs)
- Validate: pool.length >= required_count && pool.length <= 10

#### 3. QuestDetailsDialog Provider Grid
**File:** `src/components/QuestDetailsDialog.tsx`
- Fetch progress via `getNetworkQuestProgress`
- Grid of provider tiles (2-3 per row)
- Each tile: logo, name, ✓ if done, tappable if not
- On tap: `openQuestNetwork({ questKey, providerId })`
- Pre-open URL in new tab (avoid popup blockers)
- Poll every 5s while dialog open
- Poll on window focus event
- Instructions: "Complete an offer, survey or task. PTC/shortlinks may not count."
- Reward display: "Step rewards: $X.XX each" + "Completion bonus: $Y.YY" + "Total: $Z.ZZ"

### Testing Checklist
- [ ] Admin can create network quest with 3-5 providers
- [ ] Quest card shows correct total (steps + bonus)
- [ ] Details dialog shows provider tiles
- [ ] Tap tile → opens URL with quest token
- [ ] Complete offer → postback marks "quest_absorbed"
- [ ] Step reward credited immediately
- [ ] Provider tile turns green with ✓
- [ ] Same provider twice → only counts once
- [ ] Below min USD → doesn't count
- [ ] After K providers → final bonus credited
- [ ] Quest conversions don't trigger milestones
- [ ] Normal postbacks still work (wallet credit + milestones)
- [ ] Expired token → rejected
- [ ] Wrong provider → rejected
- [ ] Replay → idempotent (no double-pay)

