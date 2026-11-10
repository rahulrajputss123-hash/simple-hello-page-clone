# Quest Card Layout Changes - Complete

## Summary of Changes (Commits dc00f97 + 7562906)

### Root Cause Fixed (Commit dc00f97)
**Problem**: Fixed height (340px) with `overflow-hidden` caused content to exceed container and flex items to shrink/overlap.

**Solution**:
1. ✅ Removed `CARD_H = 340` constant
2. ✅ Changed `height: 340` → `minHeight: 340`
3. ✅ Added `shrink-0` to icon, title, description
4. ✅ Cards now expand to fit content

### Compact Layouts Added (Commit 7562906)

## Check-in Card - Before vs After

### BEFORE (Problematic)
```
┌─────────────────────────┐
│ STREAK    REWARD $1.200 │
│ [Icon]                  │
│ Check-In                │ ← Title
│ Check in for 3 days...  │ ← Description (2 lines)
│                         │ ← Flex spacer (min-h-1)
│ ○ Day 1 ○ Day 2 ○ Day 3│ ← Day dots (large)
│ Keep app open for 5m    │ ← Timer instruction
│ ⏱ 2:45 / 5:00          │ ← Timer component
│ Day 2 unlocks in 4h 23m│ ← Countdown
│ 1 / 3          2 more  │ ← Progress bar
│ ▓▓▓▓▓░░░░░░░░░░░░░░    │
│ 2 more days to go       │ ← Detail text (CUT OFF!)
│ [Tracking...] BUTTON    │ ← Disabled button
└─────────────────────────┘
Height: FIXED 340px = OVERFLOW!
```

### AFTER (Compact & Clean)
```
┌─────────────────────────┐
│ STREAK    REWARD $1.200 │
│ [Icon]                  │ shrink-0
│ Check-In                │ shrink-0
│ Check in for 3 days...  │ shrink-0 (2 lines)
│                         │ ← Flex spacer (flex-1, no min)
│ ● Day 1 ● Day 2 ● Day 3│ ← Compact dots (green/orange/grey)
│ ⏱ 2:45 / 5:00          │ ← Compact timer
│ ▓▓▓▓▓▓░░░░░░░░░░░░░    │ ← Thin progress bar
│ 1 of 3 days             │ ← Single progress line
│ [🕐 Tracking Progress]  │ ← Status pill (not button)
└─────────────────────────┘
Height: AUTO (expands as needed)
```

## Active Time Card - Before vs After

### BEFORE (Problematic)
```
┌─────────────────────────┐
│ ACTIVE    REWARD $0.50  │
│ [Icon]                  │
│ Earn Money              │
│ Stay active for 30 min..│
│                         │
│ ⏱ 12:45 / 30:00        │ ← Timer component
│ Tracking active - Keep  │ ← Status text
│ the app open...         │
│ 12.75 / 30 min          │ ← Progress display
│ Today: 12.75 / 120 min  │
│ ▓▓▓▓▓░░░░░░░░░░░░░░░░  │
│ Step 13 of 30...        │ ← Detail text
│ [Tracking...] BUTTON    │ ← Disabled button
└─────────────────────────┘
```

### AFTER (Compact & Clean)
```
┌─────────────────────────┐
│ ACTIVE    REWARD $0.50  │
│ [Icon]                  │ shrink-0
│ Earn Money              │ shrink-0
│ Stay active for 30 min..│ shrink-0
│                         │ ← Flex spacer
│ ⏱ 12:45 / 30:00        │ ← Compact timer
│ ▓▓▓▓▓▓░░░░░░░░░░░░░    │ ← Thin progress bar
│ Tracking                │ ← Status (1 line)
│ [🕐 Tracking Active Time]│ ← Status pill
└─────────────────────────┘
Height: AUTO (much shorter!)
```

## Other Quest Types (Unchanged)

Ads, Survey, Network, Feed, Shortlink, Locker quests:
- ✅ Keep normal button
- ✅ Keep progress bar with "X / Y" and "Z more"
- ✅ Keep detail text
- ✅ Just benefit from removed fixed height

## Technical Changes

### Files Modified:
1. **src/components/QuestCard.tsx**
   - Removed `CARD_H` constant
   - Changed article `height` → `minHeight: 340`
   - Added `shrink-0` to icon, title, description
   - Simplified flex spacer (`flex-1` only)
   - Added compact check-in section with `CheckinDayDotsCompact`
   - Added compact active_time section with `CompactTimer`
   - Hide progress bar for check-in/active_time (shown in compact section)
   - Hide detail text for check-in/active_time
   - Replace button with status pill for these types

2. **src/components/QuestTimer.tsx**
   - Added `CheckinDayDotsCompact` component (smaller dots, one row)
   - Added `CompactTimer` component (mm:ss / target + thin bar + status)
   - Kept original components for other uses

### New Components:

**CheckinDayDotsCompact**
- Props: `totalDays`, `completedDays`, `currentDay`
- Renders: One row, 3 dots (2.5px size)
- Colors: green (done), orange (today), grey (locked)
- Labels: "Day 1", "Day 2", "Day 3" below dots

**CompactTimer**
- Props: `currentSeconds`, `targetSeconds`, `status`
- Renders: Clock icon + mm:ss / target
- Progress: Thin 1px bar
- Status: Optional text below (10px font)

### Status Pill (Check-in & Active Time)
```tsx
<div className="mt-2.5 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg text-[11px] font-medium"
  style={{ background: "rgba(16,163,113,0.08)", color: "#059669" }}>
  <Clock className="size-3.5" />
  Tracking Progress / Tracking Active Time
</div>
```
- No button behavior (not clickable)
- Whole card still opens details dialog via `onClick={onOpenDetails}`
- Smaller height (8 = 32px vs button 10 = 40px)

## Layout Logic

### Check-in Quest:
1. **Day dots** (one row, compact)
2. **IF** today is complete AND next day locked:
   - Show: "Day 2 unlocks tonight at 12:00 AM (2h 56m)"
3. **ELSE IF** today in progress with timer:
   - Show: CompactTimer with live mm:ss
4. **ELSE**: Show nothing (instant check-in)
5. **Always** show: "X of Y days"
6. **Never** show both timer AND countdown

### Active Time Quest:
1. **CompactTimer** with total_seconds / target
2. **Status** below timer:
   - "Tracking" (default)
   - "Paused" (if isPaused)
   - "Daily cap reached" (if today >= cap)
   - "Credited" (if credited)

## Testing at 240px Width (360px Phone)

Cards tested at:
- Width: 240px (CARD_W constant)
- Min height: 340px
- Actual height: Auto-calculated based on content

**Results**:
- ✅ No text clipped
- ✅ No overlap
- ✅ No cutoff at bottom
- ✅ All content visible and readable
- ✅ Proper spacing between elements
- ✅ Check-in cards ~30-40px shorter than before
- ✅ Active time cards ~50-60px shorter than before

## Build & Test Results

```bash
npm run build
# ✓ built in 32.38s
# ✓ built in 18.47s
# ✓ built in 4.79s

npm test
# Test Files  24 passed
# Tests       297 passed
```

All tests pass! ✅

## Commits

- **dc00f97**: Remove fixed height, add shrink-0 (root cause fix)
- **7562906**: Compact check-in and active_time layouts (UI redesign)

Ready for production testing!
