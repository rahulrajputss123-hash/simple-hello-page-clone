# Network Chain Quest - Debug Guide

Quick reference for troubleshooting Network Chain Quest issues.

---

## 🔍 Common Issues & Solutions

### Issue 1: Quest token not generated
**Symptoms:** Clicking provider tile doesn't open offerwall

**Debug Steps:**
```sql
-- Check if quest exists and is enabled
SELECT * FROM quests WHERE quest_key = 'YOUR_QUEST_KEY';

-- Check if provider is in pool
SELECT network_provider_ids FROM quests WHERE quest_key = 'YOUR_QUEST_KEY';

-- Check if user has active session
SELECT * FROM quest_sessions 
WHERE quest_key = 'YOUR_QUEST_KEY' AND user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC LIMIT 1;
```

**Common Causes:**
- Quest not enabled (`is_enabled = false`)
- Provider ID not in `network_provider_ids` array
- Quest not unlocked for user
- Session not in 'started' status

---

### Issue 2: Postback not creating completion
**Symptoms:** User completes offer but provider tile doesn't turn "done"

**Debug Steps:**
```sql
-- Check if postback was received
SELECT * FROM sdk_offerwall_conversions 
WHERE user_id_or_token LIKE 'q_%' 
ORDER BY created_at DESC LIMIT 5;

-- Check token validity
SELECT * FROM quest_network_tokens 
WHERE token = 'YOUR_TOKEN'
AND expires_at > NOW();

-- Check if completion was recorded
SELECT * FROM quest_network_completions 
WHERE session_id = 'YOUR_SESSION_ID'
ORDER BY completed_at DESC;
```

**Common Causes:**
- Token expired (`expires_at < NOW()`)
- Provider mismatch (token.provider_id ≠ postback.provider_id)
- Below min USD threshold (`payout_usd < min_qualifying_usd`)
- Session already completed or expired
- Postback provider not sending correct user_id

**Check Logs:**
```bash
# Search for quest token processing
grep "q_" logs/postback.log | tail -20

# Check for validation errors
grep "quest token" logs/error.log | tail -20
```

---

### Issue 3: Step reward not credited
**Symptoms:** Completion recorded but no wallet credit

**Debug Steps:**
```sql
-- Check if step credit claim exists
SELECT * FROM quest_step_credits 
WHERE session_id = 'YOUR_SESSION_ID'
ORDER BY credited_at DESC;

-- Check wallet transactions
SELECT * FROM wallet_transactions 
WHERE user_id = 'YOUR_USER_ID' 
AND source = 'quest_step'
ORDER BY created_at DESC LIMIT 5;

-- Check step_index assignment
SELECT provider_id, step_index, completed_at 
FROM quest_network_completions 
WHERE session_id = 'YOUR_SESSION_ID'
ORDER BY step_index;
```

**Common Causes:**
- Duplicate completion (UNIQUE constraint blocked it)
- Step reward = 0 in quest config
- Wallet credit RPC failed (check error logs)
- Race condition (retry exhausted)

---

### Issue 4: Final bonus not paid
**Symptoms:** K networks completed but quest stays "in progress"

**Debug Steps:**
```sql
-- Count completions
SELECT COUNT(DISTINCT provider_id) as completed_networks
FROM quest_network_completions 
WHERE session_id = 'YOUR_SESSION_ID';

-- Compare to required count
SELECT required_count FROM quests 
WHERE quest_key = 'YOUR_QUEST_KEY';

-- Check session status
SELECT status, completed_at FROM quest_sessions 
WHERE id = 'YOUR_SESSION_ID';

-- Check final bonus transaction
SELECT * FROM wallet_transactions 
WHERE user_id = 'YOUR_USER_ID' 
AND source = 'quest_completion'
AND metadata->>'quest_key' = 'YOUR_QUEST_KEY'
ORDER BY created_at DESC LIMIT 1;
```

**Common Causes:**
- Completions < required_count (some were rejected)
- Session status not updated (check finishQuestSession logic)
- reward_amount = 0 in quest config
- reward_hold_hours not elapsed yet

---

### Issue 5: Same provider counts twice
**Symptoms:** User completes same provider twice and both count

**Debug Steps:**
```sql
-- Check for duplicate completions
SELECT provider_id, COUNT(*) as count
FROM quest_network_completions 
WHERE session_id = 'YOUR_SESSION_ID'
GROUP BY provider_id
HAVING COUNT(*) > 1;

-- Verify unique constraint exists
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'quest_network_completions' 
AND indexdef LIKE '%UNIQUE%';
```

**Expected:** No duplicates (UNIQUE constraint should prevent)

**If duplicates exist:**
- UNIQUE index missing (check migration applied)
- Different tokens used (check token reuse logic)
- Bug in openQuestNetworkImpl

---

### Issue 6: Normal postbacks broken
**Symptoms:** Regular offerwall conversions not crediting wallet

**Debug Steps:**
```sql
-- Check recent non-quest conversions
SELECT * FROM sdk_offerwall_conversions 
WHERE user_id_or_token NOT LIKE 'q_%' 
ORDER BY created_at DESC LIMIT 10;

-- Check their status
SELECT status, COUNT(*) 
FROM sdk_offerwall_conversions 
WHERE user_id_or_token NOT LIKE 'q_%' 
AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY status;

-- Check milestone events
SELECT * FROM task_events 
WHERE event_name = 'offerwall_earning' 
ORDER BY created_at DESC LIMIT 10;
```

**Expected:** Status = 'confirmed', wallet credited, milestone events exist

**If broken:**
- Postback handler modified incorrectly (check conditionals)
- Quest logic running on non-quest tokens
- Database constraints blocking normal flow

---

### Issue 7: Provider tiles not updating
**Symptoms:** User completes offer but UI doesn't refresh

**Debug Steps:**
1. Open browser DevTools → Network tab
2. Filter by "getNetworkQuestProgress"
3. Check if polling requests are firing every 5s
4. Check response payload for provider status

**Common Causes:**
- Polling stopped (component unmounted)
- API returning cached data
- Provider ID mismatch (UUID format)
- Session query not finding completion

**Fix:**
```javascript
// In browser console
queryClient.invalidateQueries({ queryKey: ['networkQuestProgress'] })
```

---

## 🛠️ Useful SQL Queries

### View full quest flow for a user
```sql
WITH quest_info AS (
  SELECT id as session_id, user_id, quest_key, status, started_at, completed_at
  FROM quest_sessions
  WHERE user_id = 'YOUR_USER_ID' 
    AND quest_key = 'YOUR_QUEST_KEY'
  ORDER BY created_at DESC LIMIT 1
)
SELECT 
  'Session' as type,
  qi.status,
  qi.started_at as timestamp,
  NULL as detail
FROM quest_info qi
UNION ALL
SELECT 
  'Token' as type,
  t.provider_id::text as status,
  t.created_at as timestamp,
  LEFT(t.token, 20) as detail
FROM quest_info qi
JOIN quest_network_tokens t ON t.session_id = qi.session_id
UNION ALL
SELECT 
  'Conversion' as type,
  c.status::text,
  c.created_at as timestamp,
  c.payout_usd::text as detail
FROM quest_info qi
JOIN quest_network_completions nc ON nc.session_id = qi.session_id
JOIN sdk_offerwall_conversions c ON c.id = nc.conversion_id
UNION ALL
SELECT 
  'Step Credit' as type,
  sc.step_index::text,
  sc.credited_at as timestamp,
  sc.step_reward::text as detail
FROM quest_info qi
JOIN quest_step_credits sc ON sc.session_id = qi.session_id
ORDER BY timestamp;
```

### Find stuck sessions
```sql
SELECT 
  qs.id,
  qs.user_id,
  qs.quest_key,
  qs.status,
  COUNT(DISTINCT nc.provider_id) as networks_done,
  q.required_count,
  qs.started_at,
  NOW() - qs.started_at as elapsed
FROM quest_sessions qs
JOIN quests q ON qs.quest_key = q.quest_key
LEFT JOIN quest_network_completions nc ON nc.session_id = qs.id
WHERE qs.status = 'started'
  AND q.quest_type = 'network'
GROUP BY qs.id, qs.user_id, qs.quest_key, qs.status, q.required_count, qs.started_at
HAVING COUNT(DISTINCT nc.provider_id) >= q.required_count
ORDER BY qs.started_at DESC;
```

### Check for duplicate step credits
```sql
SELECT 
  session_id,
  provider_id,
  step_index,
  COUNT(*) as credit_count
FROM quest_step_credits
GROUP BY session_id, provider_id, step_index
HAVING COUNT(*) > 1;
```

### Audit wallet credits vs completions
```sql
SELECT 
  qs.quest_key,
  qs.user_id,
  COUNT(DISTINCT nc.provider_id) as networks_done,
  COUNT(sc.id) as step_credits,
  SUM(sc.step_reward) as total_step_rewards,
  SUM(wt.amount) as total_wallet_credits
FROM quest_sessions qs
LEFT JOIN quest_network_completions nc ON nc.session_id = qs.id
LEFT JOIN quest_step_credits sc ON sc.session_id = qs.id
LEFT JOIN wallet_transactions wt ON wt.user_id = qs.user_id 
  AND wt.source IN ('quest_step', 'quest_completion')
  AND wt.metadata->>'session_id' = qs.id::text
WHERE qs.quest_key = 'YOUR_QUEST_KEY'
GROUP BY qs.id, qs.quest_key, qs.user_id
HAVING COUNT(DISTINCT nc.provider_id) != COUNT(sc.id);
```

---

## 📊 Monitoring Queries

### Real-time quest activity
```sql
SELECT 
  qs.quest_key,
  COUNT(DISTINCT qs.id) as active_sessions,
  COUNT(nc.id) as total_completions_today,
  AVG(nc.step_index) as avg_progress
FROM quest_sessions qs
JOIN quests q ON qs.quest_key = q.quest_key
LEFT JOIN quest_network_completions nc ON nc.session_id = qs.id 
  AND nc.completed_at > NOW() - INTERVAL '24 hours'
WHERE q.quest_type = 'network'
  AND qs.status = 'started'
GROUP BY qs.quest_key;
```

### Provider performance
```sql
SELECT 
  p.name,
  COUNT(nc.id) as completions,
  AVG(c.payout_usd) as avg_payout,
  COUNT(DISTINCT nc.session_id) as unique_users
FROM quest_network_completions nc
JOIN sdk_offerwall_providers p ON nc.provider_id = p.id
JOIN sdk_offerwall_conversions c ON nc.conversion_id = c.id
WHERE nc.completed_at > NOW() - INTERVAL '7 days'
GROUP BY p.id, p.name
ORDER BY completions DESC;
```

### Quest completion funnel
```sql
WITH funnel AS (
  SELECT 
    qs.quest_key,
    COUNT(DISTINCT CASE WHEN EXISTS(
      SELECT 1 FROM quest_network_completions nc 
      WHERE nc.session_id = qs.id AND nc.step_index >= 1
    ) THEN qs.id END) as step1_users,
    COUNT(DISTINCT CASE WHEN EXISTS(
      SELECT 1 FROM quest_network_completions nc 
      WHERE nc.session_id = qs.id AND nc.step_index >= 2
    ) THEN qs.id END) as step2_users,
    COUNT(DISTINCT CASE WHEN EXISTS(
      SELECT 1 FROM quest_network_completions nc 
      WHERE nc.session_id = qs.id AND nc.step_index >= 3
    ) THEN qs.id END) as step3_users,
    COUNT(DISTINCT CASE WHEN qs.status = 'completed' THEN qs.id END) as completed_users
  FROM quest_sessions qs
  JOIN quests q ON qs.quest_key = q.quest_key
  WHERE q.quest_type = 'network'
  GROUP BY qs.quest_key
)
SELECT 
  quest_key,
  step1_users,
  step2_users,
  ROUND(100.0 * step2_users / NULLIF(step1_users, 0), 1) as step2_retention_pct,
  step3_users,
  ROUND(100.0 * step3_users / NULLIF(step2_users, 0), 1) as step3_retention_pct,
  completed_users,
  ROUND(100.0 * completed_users / NULLIF(step1_users, 0), 1) as completion_rate_pct
FROM funnel;
```

---

## 🧪 Testing Helpers

### Manually create test token
```sql
INSERT INTO quest_network_tokens (token, user_id, session_id, quest_key, provider_id, kind, expires_at)
VALUES (
  'q_test_token_123456789012',
  'YOUR_USER_ID',
  'YOUR_SESSION_ID',
  'YOUR_QUEST_KEY',
  'PROVIDER_UUID',
  'network',
  NOW() + INTERVAL '24 hours'
);
```

### Manually trigger completion
```sql
-- Insert conversion
INSERT INTO sdk_offerwall_conversions (
  provider_id, user_id_or_token, external_tx_id, payout_usd, status
)
VALUES (
  'PROVIDER_UUID',
  'q_test_token_123456789012',
  'test_tx_' || gen_random_uuid(),
  0.50,
  'quest_absorbed'
)
RETURNING id;

-- Insert completion (use returned ID)
INSERT INTO quest_network_completions (
  session_id, provider_id, conversion_id, step_index, kind
)
VALUES (
  'YOUR_SESSION_ID',
  'PROVIDER_UUID',
  'RETURNED_CONVERSION_ID',
  1,
  'network'
);
```

### Reset quest session for retest
```sql
-- WARNING: Only use in dev/staging!
DELETE FROM quest_step_credits WHERE session_id = 'YOUR_SESSION_ID';
DELETE FROM quest_network_completions WHERE session_id = 'YOUR_SESSION_ID';
DELETE FROM quest_network_tokens WHERE session_id = 'YOUR_SESSION_ID';
UPDATE quest_sessions SET status = 'started', completed_at = NULL WHERE id = 'YOUR_SESSION_ID';
```

---

## 🚨 Emergency Fixes

### Stuck session won't complete
```sql
-- Check if requirements met
SELECT 
  COUNT(DISTINCT provider_id) as done,
  (SELECT required_count FROM quests WHERE quest_key = qs.quest_key) as required
FROM quest_network_completions nc
JOIN quest_sessions qs ON nc.session_id = qs.id
WHERE qs.id = 'STUCK_SESSION_ID'
GROUP BY qs.quest_key;

-- If done >= required, manually complete
UPDATE quest_sessions 
SET status = 'completed', completed_at = NOW() 
WHERE id = 'STUCK_SESSION_ID';

-- Then credit final bonus manually
-- (Use creditWallet RPC with source='quest_completion')
```

### Remove bad completion
```sql
-- Find the bad completion
SELECT * FROM quest_network_completions 
WHERE session_id = 'SESSION_ID' 
ORDER BY completed_at DESC;

-- Delete it
DELETE FROM quest_step_credits WHERE session_id = 'SESSION_ID' AND provider_id = 'BAD_PROVIDER_ID';
DELETE FROM quest_network_completions WHERE id = 'BAD_COMPLETION_ID';
```

### Fix duplicate step credits
```sql
-- Keep earliest, delete duplicates
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY session_id, provider_id ORDER BY credited_at ASC) as rn
  FROM quest_step_credits
)
DELETE FROM quest_step_credits
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);
```

---

## 📝 Notes

- Always check logs first: postback.log, error.log, quest.log
- Use transaction wrappers when running manual fixes
- Test in staging before applying to production
- Document any manual interventions for audit trail
- Monitor wallet balance consistency after manual fixes

---

**Last Updated:** 2027-08-09  
**Maintainer:** Development Team
