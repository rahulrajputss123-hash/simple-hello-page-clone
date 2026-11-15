-- Apply Pending Migrations
-- Run this in Supabase Dashboard > SQL Editor

-- ============================================
-- Migration 1: Enable pgcrypto extension
-- File: 20261112130000_enable_pgcrypto.sql
-- ============================================
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ============================================
-- Migration 2: Add defaults to quest_sessions
-- File: 20261112140000_quest_sessions_ads_required_default.sql
-- ============================================
ALTER TABLE public.quest_sessions 
  ALTER COLUMN ads_required SET DEFAULT 0;

ALTER TABLE public.quest_sessions 
  ALTER COLUMN ads_watched SET DEFAULT 0;

-- ============================================
-- Migration 3: Add binance_pay_id to payout_methods
-- File: 20261112150000_add_binance_pay_id_to_payout_methods.sql
-- Status: ALREADY APPLIED (column exists)
-- ============================================
-- ALTER TABLE public.payout_methods
-- ADD COLUMN IF NOT EXISTS binance_pay_id text;

-- COMMENT ON COLUMN public.payout_methods.binance_pay_id IS 'Binance Pay ID for cryptocurrency payouts';

-- ============================================
-- Verification Queries
-- ============================================

-- Check if pgcrypto works
SELECT encode(gen_random_bytes(16), 'hex') as test_random;

-- Check quest_sessions defaults
SELECT column_name, column_default 
FROM information_schema.columns 
WHERE table_name = 'quest_sessions' 
  AND column_name IN ('ads_required', 'ads_watched');

-- Check binance_pay_id column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'payout_methods' 
  AND column_name = 'binance_pay_id';
