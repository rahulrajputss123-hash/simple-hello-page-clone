-- Extend app_role enum to add finance and support roles
-- Split into separate file because ALTER TYPE cannot be in same transaction as other changes

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'finance';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'support';

COMMENT ON TYPE public.app_role IS 'Staff roles: user (regular), admin (full access), finance (payouts/claims), support (tickets only).';
