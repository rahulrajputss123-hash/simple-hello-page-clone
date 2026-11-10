# Torox Adapter Context Safety

**Status**: ✅ ALREADY FIXED (commit `3ae3415`)  
**New Test Added**: `tests/torox-adapter-no-context.test.ts`  
**Commit**: `168b76a`

## Issue

Admin sync path (`src/lib/offers/sync.server.ts` line ~72) calls `adapter.fetchOffers(provider)` with NO context argument, while `feed-cache.server.ts` passes `{ country, ip }`. This could cause "Cannot read properties of undefined (reading 'country')" errors in adapters that don't safely handle undefined context.

## Solution

The Torox adapter was **already fixed** in commit `3ae3415` to use `context?.country` everywhere and skip geo filtering when no context is provided.

### Code Pattern (Line 259 in torox.server.ts)

```typescript
// When context is undefined (admin sync), skip geo filtering and return full catalog
// Same behavior as adswedmedia adapter
const userCountry = context?.country?.toUpperCase() ?? null;

for (const item of campaigns) {
  // ... campaign parsing ...
  
  const countries = parseCountries(countriesRaw);
  
  // Filter by user country only if context provided (admin sync gets full catalog)
  if (userCountry && countries.length > 0) {
    const hasAll = countries.some((c) => c === "ALL" || c === "*");
    const hasUserCountry = countries.includes(userCountry);
    if (!hasAll && !hasUserCountry) continue;
  }
  
  // ... rest of campaign processing ...
}
```

### Key Features

1. **Safe optional chaining**: Uses `context?.country` to avoid undefined errors
2. **Full catalog fallback**: When context is undefined (admin sync), returns all campaigns without geo filtering
3. **Consistent with other adapters**: Same pattern as adswedmedia adapter

## Other Adapters Checked

All adapters already use safe `context?.country` pattern:

- ✅ **torox.server.ts** - Uses `context?.country?.toUpperCase() ?? null`
- ✅ **adswedmedia.server.ts** - Uses `context?.country` in if statement
- ✅ **affike.server.ts** - Uses `context?.country` in if statement
- ✅ **revtoo.server.ts** - Uses `context?.country` in URL params
- ✅ **ogads.server.ts** - No context usage (always returns full catalog)
- ✅ **gemiad.server.ts** - No context usage (always returns full catalog)
- ✅ **cpxresearch.server.ts** - No context usage (survey provider)
- ✅ **adbluemedia.server.ts** - No context usage (always returns full catalog)

## Test Coverage

Added comprehensive test suite: `tests/torox-adapter-no-context.test.ts`

### Tests (9 total, all passing)

1. ✅ Should not throw when context is undefined (admin sync)
2. ✅ Should return full catalog when context is undefined (no geo filtering)
3. ✅ Should filter by country when context is provided
4. ✅ Should handle API response as array (no campaigns wrapper)
5. ✅ Should validate config correctly
6. ✅ Should handle empty campaigns list
7. ✅ Should handle 401 authentication error
8. ✅ Should handle network timeout
9. ✅ Should use context?.country pattern safely

### Test Results

```
✓ tests/torox-adapter-no-context.test.ts (9 tests) 93ms
  Test Files  1 passed (1)
       Tests  9 passed (9)
```

## Behavior Comparison

### Admin Sync (No Context)

```typescript
// Call from sync.server.ts line ~72
const offers = await adapter.fetchOffers(provider);
// context = undefined

// Result: Full catalog, no geo filtering
// Returns all campaigns regardless of country targeting
```

### User Request (With Context)

```typescript
// Call from feed-cache.server.ts
const offers = await adapter.fetchOffers(provider, {
  country: "IN",
  ip: "203.0.113.1"
});

// Result: Filtered by country
// Returns only campaigns targeting IN or ALL
```

## Related Commits

- `3ae3415` - Fix Torox adapter to handle undefined context (admin sync)
- `168b76a` - test: add torox adapter no-context safety test

## Verification

All tests pass (298/298):

```bash
npm test
# ✓ tests/torox-adapter-no-context.test.ts (9 tests) 93ms
# Test Files  25 passed | 2 skipped (27)
# Tests  298 passed | 26 skipped | 2 todo (326)
```

## Conclusion

- ✅ Torox adapter is **already safe** for admin sync (no context)
- ✅ All other adapters verified safe
- ✅ Comprehensive test coverage added to prevent regression
- ✅ No code changes needed (only tests added)
