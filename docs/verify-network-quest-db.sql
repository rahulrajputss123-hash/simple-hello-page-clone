-- Network Chain Quest Database Verification Script
-- Run this to verify the database schema is correctly applied

\echo '===================================='
\echo 'Network Chain Quest DB Verification'
\echo '===================================='
\echo ''

-- Check migration applied
\echo 'Checking if migration is applied...'
SELECT EXISTS(
  SELECT 1 FROM _sqlx_migrations 
  WHERE version = 20270809000000 
  AND description = 'network_quest_type'
) AS migration_applied;

\echo ''
\echo 'Checking quest_type enum includes network...'
SELECT EXISTS(
  SELECT 1 FROM pg_enum e
  JOIN pg_type t ON e.enumtypid = t.oid
  WHERE t.typname = 'quest_type' AND e.enumlabel = 'network'
) AS enum_has_network;

\echo ''
\echo 'Checking quests table has network columns...'
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'quests' 
  AND column_name IN (
    'network_provider_ids',
    'required_count',
    'min_qualifying_usd',
    'token_ttl_hours',
    'reward_hold_hours'
  )
ORDER BY column_name;

\echo ''
\echo 'Checking quest_network_tokens table exists...'
SELECT EXISTS(
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'quest_network_tokens'
) AS tokens_table_exists;

\echo ''
\echo 'Checking quest_network_tokens columns...'
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'quest_network_tokens'
ORDER BY ordinal_position;

\echo ''
\echo 'Checking quest_network_tokens indexes...'
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'quest_network_tokens'
ORDER BY indexname;

\echo ''
\echo 'Checking quest_network_completions table exists...'
SELECT EXISTS(
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'quest_network_completions'
) AS completions_table_exists;

\echo ''
\echo 'Checking quest_network_completions columns...'
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'quest_network_completions'
ORDER BY ordinal_position;

\echo ''
\echo 'Checking quest_network_completions indexes...'
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'quest_network_completions'
ORDER BY indexname;

\echo ''
\echo 'Checking sdk_offerwall_conversions status enum...'
SELECT enumlabel 
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'sdk_offerwall_conversion_status'
ORDER BY e.enumsortorder;

\echo ''
\echo 'Checking for quest_absorbed status...'
SELECT EXISTS(
  SELECT 1 FROM pg_enum e
  JOIN pg_type t ON e.enumtypid = t.oid
  WHERE t.typname = 'sdk_offerwall_conversion_status' 
    AND e.enumlabel = 'quest_absorbed'
) AS has_quest_absorbed_status;

\echo ''
\echo 'Sample query: Network quests'
SELECT 
  quest_key,
  label,
  quest_type,
  network_provider_ids,
  required_count,
  min_qualifying_usd,
  step_reward,
  reward_amount,
  is_enabled
FROM quests
WHERE quest_type = 'network'
LIMIT 5;

\echo ''
\echo 'Sample query: Quest tokens'
SELECT 
  LEFT(token, 10) || '...' AS token_preview,
  user_id,
  quest_key,
  provider_id,
  kind,
  created_at,
  expires_at
FROM quest_network_tokens
ORDER BY created_at DESC
LIMIT 5;

\echo ''
\echo 'Sample query: Network completions'
SELECT 
  nc.session_id,
  nc.provider_id,
  nc.conversion_id,
  nc.step_index,
  nc.kind,
  nc.completed_at,
  p.name AS provider_name
FROM quest_network_completions nc
LEFT JOIN sdk_offerwall_providers p ON nc.provider_id = p.id
ORDER BY nc.completed_at DESC
LIMIT 5;

\echo ''
\echo 'Sample query: Quest-absorbed conversions'
SELECT 
  id,
  provider_id,
  user_id_or_token AS quest_token,
  payout_usd,
  status,
  created_at
FROM sdk_offerwall_conversions
WHERE status = 'quest_absorbed'
ORDER BY created_at DESC
LIMIT 5;

\echo ''
\echo 'Sample query: Step credits'
SELECT 
  sc.session_id,
  sc.provider_id,
  sc.step_index,
  sc.step_reward,
  sc.credited_at,
  qs.quest_key,
  qs.user_id
FROM quest_step_credits sc
JOIN quest_sessions qs ON sc.session_id = qs.id
ORDER BY sc.credited_at DESC
LIMIT 5;

\echo ''
\echo '===================================='
\echo 'Verification Complete'
\echo '===================================='
