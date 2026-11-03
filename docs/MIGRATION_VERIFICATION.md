# Migration 20270809 - Live Database Verification

**Status:** ✅ Migration now matches live database exactly

---

## ✅ Verification Checklist

### 1. quest_network_tokens Table

#### Schema
- ✅ `token` text PRIMARY KEY
- ✅ `user_id` uuid NOT NULL (FK profiles)
- ✅ `session_id` uuid NOT NULL (FK quest_sessions)
- ✅ `provider_id` uuid NOT NULL (FK sdk_offerwall_providers)
- ✅ `quest_key` text NOT NULL
- ✅ `kind` text NOT NULL DEFAULT 'network' CHECK (kind IN ('network', 'feed'))
- ✅ `step_index` integer (nullable)
- ✅ `source` text (nullable)
- ✅ `campaign_id` text (nullable)
- ✅ `expires_at` timestamptz NOT NULL
- ✅ `created_at` timestamptz NOT NULL DEFAULT now()

#### Indexes
- ✅ `quest_network_tokens_network_uniq` UNIQUE (session_id, provider_id) WHERE kind='network'
  - **Fixed:** Removed invalid index with `WHERE expires_at > now()` (Postgres rejects functions in predicates)
- ✅ `quest_network_tokens_session_step_uniq` UNIQUE (session_id, step_index) WHERE step_index IS NOT NULL
- ✅ `quest_network_tokens_user_idx` (user_id)
- ✅ `quest_network_tokens_session_idx` (session_id)
- ✅ `quest_network_tokens_expires_idx` (expires_at)
- ✅ `quest_network_tokens_session_step_idx` (session_id, step_index) WHERE step_index IS NOT NULL

#### Permissions
- ✅ REVOKE ALL FROM anon, authenticated
- ✅ GRANT ALL TO service_role
- ✅ RLS enabled
- ✅ Policy: service_role only
- **Rationale:** Tokens are secrets, should never be exposed to clients

---

### 2. quest_network_completions Table

#### Schema
- ✅ `id` uuid PRIMARY KEY DEFAULT gen_random_uuid()
- ✅ `session_id` uuid NOT NULL (FK quest_sessions)
- ✅ `provider_id` uuid NOT NULL (FK sdk_offerwall_providers)
- ✅ `conversion_id` uuid NOT NULL (FK sdk_offerwall_conversions)
- ✅ `step_index` integer (nullable for extensibility)
  - **Fixed:** Was NOT NULL, now nullable
- ✅ `kind` text NOT NULL DEFAULT 'network' CHECK (kind IN ('network', 'feed'))
  - **Fixed:** Was CHECK ('network'), now includes 'feed'
- ✅ `amount_usd` numeric(10,4) NOT NULL
- ✅ `created_at` timestamptz NOT NULL DEFAULT now()

#### Indexes
- ✅ `quest_network_completions_network_uniq` UNIQUE (session_id, provider_id) WHERE kind='network'
  - **Fixed:** Was `quest_network_completions_session_provider_uniq`
- ✅ `quest_network_completions_step_uniq` UNIQUE (session_id, step_index) WHERE step_index IS NOT NULL
  - **Fixed:** Was `WHERE kind='network'`, now `WHERE step_index IS NOT NULL`
- ✅ `quest_network_completions_conversion_uniq` UNIQUE (conversion_id)
  - **Fixed:** Was non-unique index `quest_network_completions_conversion_idx`
- ✅ `quest_network_completions_session_idx` (session_id)

#### Permissions
- ✅ REVOKE ALL FROM anon, authenticated
- ✅ GRANT ALL TO service_role
- ✅ RLS enabled
- ✅ Policy: service_role only
- **Rationale:** Completions are internal, should never be exposed to clients

---

### 3. Code Updates

#### quests.server.ts
**Function:** `getNetworkQuestProgressImpl`
```typescript
// Before:
const { data: completions } = await db
  .from("quest_network_completions")
  .select("provider_id")
  .eq("session_id", session.id);

// After:
const { data: completions } = await db
  .from("quest_network_completions")
  .select("provider_id")
  .eq("session_id", session.id)
  .eq("kind", "network");  // ✅ Added filter
```

**Function:** `openQuestNetworkImpl`
```typescript
// Before:
const { data: existingCompletion } = await db
  .from("quest_network_completions")
  .select("id")
  .eq("session_id", sessionId)
  .eq("provider_id", providerId)
  .maybeSingle();

// After:
const { data: existingCompletion } = await db
  .from("quest_network_completions")
  .select("id")
  .eq("session_id", sessionId)
  .eq("provider_id", providerId)
  .eq("kind", "network")  // ✅ Added filter
  .maybeSingle();
```

#### postback.server.ts
**Function:** `processQuestTokenPostback`
```typescript
// Already correct:
const { data: existingCompletions } = await db
  .from("quest_network_completions")
  .select("step_index")
  .eq("session_id", session.id)
  .eq("kind", "network");  // ✅ Already filtered

const { data: allCompletions } = await db
  .from("quest_network_completions")
  .select("provider_id")
  .eq("session_id", session.id)
  .eq("kind", "network");  // ✅ Already filtered
```

**Rationale:** Since `quest_network_completions` table is shared between network and feed quests (via `kind` column), all queries must filter by `kind` to ensure network quests don't see feed completions and vice versa.

---

## 🔍 Key Fixes Applied

### Fix 1: Invalid Index Predicate
**Issue:** `quest_network_tokens_session_provider_active_uniq` used `WHERE expires_at > now()`  
**Problem:** PostgreSQL rejects functions (like `now()`) in index predicates  
**Solution:** Replaced with `quest_network_tokens_network_uniq` using `WHERE kind='network'`

### Fix 2: step_index Nullability
**Issue:** `step_index integer NOT NULL`  
**Problem:** Not extensible for feed quests (which need nullable step_index)  
**Solution:** Changed to `step_index integer` (nullable)

### Fix 3: kind CHECK Constraint
**Issue:** `CHECK (kind IN ('network'))`  
**Problem:** Cannot support feed quests  
**Solution:** Changed to `CHECK (kind IN ('network', 'feed'))`

### Fix 4: Index Names and Predicates
**Issue:** Old index names and WHERE clauses didn't match live DB  
**Solution:** 
- `session_provider_uniq` → `network_uniq` with `WHERE kind='network'`
- `session_step_uniq` with `WHERE kind='network'` → `step_uniq` with `WHERE step_index IS NOT NULL`
- `conversion_idx` (non-unique) → `conversion_uniq` (UNIQUE)

### Fix 5: Permissions
**Issue:** `GRANT SELECT, INSERT, UPDATE, DELETE ... TO authenticated`  
**Problem:** Tokens are secrets, should never be exposed to client  
**Solution:** `REVOKE ALL FROM anon, authenticated; GRANT ALL TO service_role`

### Fix 6: Missing kind Filters
**Issue:** Code didn't filter by `kind='network'` in some queries  
**Problem:** Network quests could see feed completions  
**Solution:** Added `.eq("kind", "network")` filters to all queries

---

## ✅ Build Verification

```bash
$ npm run build
✓ built in 4.36s
Exit Code: 0
```

**Status:** ✅ Build passes with all fixes

---

## 📋 Migration Idempotency

All operations use:
- `CREATE TABLE IF NOT EXISTS`
- `CREATE INDEX IF NOT EXISTS`
- `ADD COLUMN IF NOT EXISTS`
- `IF NOT EXISTS` checks for constraints
- Conditional CHECK constraint updates

**Result:** Migration can be run multiple times safely ✅

---

## 🎯 Conclusion

**Migration 20270809000000_network_quest_type.sql is now identical in effect to the live database.**

All fixes applied:
1. ✅ Removed invalid index with now()
2. ✅ Made step_index nullable
3. ✅ Updated kind CHECK to include 'feed'
4. ✅ Fixed all index names and predicates
5. ✅ Fixed permissions (REVOKE + GRANT)
6. ✅ Added kind filters to code

**Status:** Ready for deployment  
**Tested:** Build passes ✅  
**Verified:** Schema matches live DB ✅

---

**Date:** 2027-08-09  
**Commit:** 659f544
