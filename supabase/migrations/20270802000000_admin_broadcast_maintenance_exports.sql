-- Admin Features: Broadcast Notifications, Maintenance Mode, CSV Exports
-- All new tables have RLS enabled with NO policies and all client privileges revoked

-- ============================================================================
-- PART 1: Broadcast Notifications
-- ============================================================================

-- Rate limit tracking table
CREATE TABLE IF NOT EXISTS broadcast_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sent_at timestamptz NOT NULL DEFAULT NOW(),
  created_at timestamptz NOT NULL DEFAULT NOW()
);

-- Enable RLS with no policies - service_role only
ALTER TABLE broadcast_rate_limits ENABLE ROW LEVEL SECURITY;

-- Revoke all client privileges
REVOKE ALL ON TABLE broadcast_rate_limits FROM authenticated, anon;

-- Index for rate limit checks
CREATE INDEX IF NOT EXISTS idx_broadcast_rate_limits_admin_sent 
  ON broadcast_rate_limits(admin_id, sent_at DESC);

-- Broadcast notification function
CREATE OR REPLACE FUNCTION admin_send_broadcast(
  p_admin_id uuid,
  p_title text,
  p_message text,
  p_active_only boolean DEFAULT false
)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_recent_count integer;
  v_target_users uuid[];
  v_sent_count integer := 0;
BEGIN
  -- Check rate limit: max 3 broadcasts per hour
  SELECT COUNT(*)
  INTO v_recent_count
  FROM broadcast_rate_limits
  WHERE admin_id = p_admin_id
    AND sent_at >= NOW() - INTERVAL '1 hour';

  IF v_recent_count >= 3 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Rate limit exceeded. Maximum 3 broadcasts per hour.',
      'sent_count', 0
    );
  END IF;

  -- Get target users
  IF p_active_only THEN
    -- Only users active in last 30 days, excluding flagged
    SELECT ARRAY_AGG(DISTINCT p.id)
    INTO v_target_users
    FROM profiles p
    WHERE p.is_flagged = false
      AND EXISTS (
        SELECT 1
        FROM wallet_transactions wt
        WHERE wt.user_id = p.id
          AND wt.created_at >= NOW() - INTERVAL '30 days'
      );
  ELSE
    -- All users except flagged
    SELECT ARRAY_AGG(id)
    INTO v_target_users
    FROM profiles
    WHERE is_flagged = false;
  END IF;

  -- Send notifications to all target users
  -- notifications table uses: user_id, title, body, kind, is_read
  INSERT INTO notifications (user_id, title, body, kind, is_read)
  SELECT
    unnest(v_target_users),
    p_title,
    p_message,
    'info',
    false;

  GET DIAGNOSTICS v_sent_count = ROW_COUNT;

  -- Record rate limit
  INSERT INTO broadcast_rate_limits (admin_id, sent_at)
  VALUES (p_admin_id, NOW());

  -- Write audit log using correct columns
  INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, before, after, note)
  VALUES (
    p_admin_id,
    'broadcast_notification',
    'notification',
    'broadcast',
    NULL,
    jsonb_build_object(
      'title', p_title,
      'message', p_message,
      'active_only', p_active_only,
      'sent_count', v_sent_count
    ),
    format('Broadcast sent to %s users', v_sent_count)
  );

  RETURN jsonb_build_object(
    'success', true,
    'sent_count', v_sent_count
  );
END;
$$;

REVOKE ALL ON FUNCTION admin_send_broadcast(uuid, text, text, boolean) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_send_broadcast(uuid, text, text, boolean) TO service_role;

COMMENT ON FUNCTION admin_send_broadcast IS 'Send broadcast notification to all or active users. Rate limited to 3 per hour per admin. Excludes flagged users. Service role only.';

-- ============================================================================
-- PART 2: Maintenance Mode
-- ============================================================================

-- Settings table for maintenance mode and other global settings
CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  created_at timestamptz NOT NULL DEFAULT NOW()
);

-- Enable RLS with no policies - service_role only for writes, public for reads via function
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Revoke all client privileges
REVOKE ALL ON TABLE app_settings FROM authenticated, anon;

-- Insert maintenance mode setting if not exists
INSERT INTO app_settings (key, value)
VALUES ('maintenance_mode', jsonb_build_object(
  'enabled', false,
  'message', 'We are currently performing maintenance. Please check back soon.'
))
ON CONFLICT (key) DO NOTHING;

-- Insert ads enabled feature flag if not exists
INSERT INTO app_settings (key, value)
VALUES ('ads_enabled', jsonb_build_object('enabled', false))
ON CONFLICT (key) DO NOTHING;

-- Function to toggle maintenance mode
CREATE OR REPLACE FUNCTION admin_set_maintenance_mode(
  p_admin_id uuid,
  p_enabled boolean,
  p_message text DEFAULT NULL
)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_value jsonb;
  v_old_value jsonb;
BEGIN
  -- Get old value for audit
  SELECT value INTO v_old_value
  FROM app_settings
  WHERE key = 'maintenance_mode';

  -- Build new value
  v_new_value := jsonb_build_object(
    'enabled', p_enabled,
    'message', COALESCE(p_message, 'We are currently performing maintenance. Please check back soon.')
  );

  -- Update settings
  UPDATE app_settings
  SET 
    value = v_new_value,
    updated_by = p_admin_id,
    updated_at = NOW()
  WHERE key = 'maintenance_mode';

  -- Write audit log using correct columns
  INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, before, after, note)
  VALUES (
    p_admin_id,
    'maintenance_mode_toggle',
    'app_setting',
    'maintenance_mode',
    v_old_value,
    v_new_value,
    format('Maintenance mode %s', CASE WHEN p_enabled THEN 'enabled' ELSE 'disabled' END)
  );

  RETURN jsonb_build_object(
    'success', true,
    'enabled', p_enabled
  );
END;
$$;

REVOKE ALL ON FUNCTION admin_set_maintenance_mode(uuid, boolean, text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_set_maintenance_mode(uuid, boolean, text) TO service_role;

COMMENT ON FUNCTION admin_set_maintenance_mode IS 'Toggle maintenance mode on/off. Service role only.';

-- Function to check if maintenance mode is active (public read)
-- Returns only {enabled, message}
CREATE OR REPLACE FUNCTION get_maintenance_status()
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'enabled', (value->>'enabled')::boolean,
    'message', value->>'message'
  )
  INTO v_result
  FROM app_settings
  WHERE key = 'maintenance_mode';

  RETURN COALESCE(v_result, jsonb_build_object('enabled', false, 'message', ''));
END;
$$;

GRANT EXECUTE ON FUNCTION get_maintenance_status() TO authenticated, anon;

COMMENT ON FUNCTION get_maintenance_status IS 'Get current maintenance mode status. Callable by authenticated and anon users.';

-- ============================================================================
-- PART 3: CSV Export Functions
-- ============================================================================

-- Function to export users to CSV format (admin only)
-- Does not use RETURNING id
CREATE OR REPLACE FUNCTION admin_export_users_csv(
  p_admin_id uuid,
  p_flagged_only boolean DEFAULT false,
  p_active_only boolean DEFAULT false
)
RETURNS TABLE(
  id text,
  email text,
  name text,
  referral_code text,
  wallet_balance numeric,
  held_balance numeric,
  lifetime_earned numeric,
  lifetime_withdrawn numeric,
  is_flagged boolean,
  created_at text
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_export_count integer;
BEGIN
  -- Count records for audit
  SELECT COUNT(*)
  INTO v_export_count
  FROM profiles p
  WHERE (NOT p_flagged_only OR p.is_flagged = true)
    AND (
      NOT p_active_only OR
      EXISTS (
        SELECT 1
        FROM wallet_transactions wt
        WHERE wt.user_id = p.id
          AND wt.created_at >= NOW() - INTERVAL '30 days'
      )
    );

  -- Write audit log using correct columns
  INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, before, after, note)
  VALUES (
    p_admin_id,
    'csv_export_users',
    'export',
    'users',
    NULL,
    jsonb_build_object(
      'flagged_only', p_flagged_only,
      'active_only', p_active_only,
      'record_count', v_export_count
    ),
    format('Exported %s users to CSV', v_export_count)
  );

  -- Return CSV data
  RETURN QUERY
  SELECT
    p.id::text,
    p.email,
    p.name,
    p.referral_code,
    p.wallet_balance,
    p.held_balance,
    p.lifetime_earned,
    p.lifetime_withdrawn,
    p.is_flagged,
    p.created_at::text
  FROM profiles p
  WHERE (NOT p_flagged_only OR p.is_flagged = true)
    AND (
      NOT p_active_only OR
      EXISTS (
        SELECT 1
        FROM wallet_transactions wt
        WHERE wt.user_id = p.id
          AND wt.created_at >= NOW() - INTERVAL '30 days'
      )
    )
  ORDER BY p.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION admin_export_users_csv(uuid, boolean, boolean) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_export_users_csv(uuid, boolean, boolean) TO service_role;

COMMENT ON FUNCTION admin_export_users_csv IS 'Export users to CSV format. Admin only. Writes single audit log entry. Service role only.';

-- Function to export transactions to CSV format (admin only)
-- Does not use RETURNING id
CREATE OR REPLACE FUNCTION admin_export_transactions_csv(
  p_admin_id uuid,
  p_user_id uuid DEFAULT NULL,
  p_days integer DEFAULT 30
)
RETURNS TABLE(
  id text,
  user_id text,
  user_email text,
  amount numeric,
  kind text,
  source text,
  status text,
  description text,
  created_at text
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_export_count integer;
BEGIN
  -- Count records for audit
  SELECT COUNT(*)
  INTO v_export_count
  FROM wallet_transactions wt
  WHERE (p_user_id IS NULL OR wt.user_id = p_user_id)
    AND wt.created_at >= NOW() - (p_days || ' days')::interval;

  -- Write audit log using correct columns
  INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, before, after, note)
  VALUES (
    p_admin_id,
    'csv_export_transactions',
    'export',
    'transactions',
    NULL,
    jsonb_build_object(
      'user_id', p_user_id,
      'days', p_days,
      'record_count', v_export_count
    ),
    format('Exported %s transactions to CSV', v_export_count)
  );

  -- Return CSV data
  RETURN QUERY
  SELECT
    wt.id::text,
    wt.user_id::text,
    p.email as user_email,
    wt.amount,
    wt.kind,
    wt.source,
    wt.status,
    wt.description,
    wt.created_at::text
  FROM wallet_transactions wt
  LEFT JOIN profiles p ON p.id = wt.user_id
  WHERE (p_user_id IS NULL OR wt.user_id = p_user_id)
    AND wt.created_at >= NOW() - (p_days || ' days')::interval
  ORDER BY wt.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION admin_export_transactions_csv(uuid, uuid, integer) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_export_transactions_csv(uuid, uuid, integer) TO service_role;

COMMENT ON FUNCTION admin_export_transactions_csv IS 'Export wallet transactions to CSV format. Admin only. Writes single audit log entry. Service role only.';

-- Function to export payouts to CSV format (admin or finance)
-- Does not use RETURNING id
CREATE OR REPLACE FUNCTION admin_export_payouts_csv(
  p_admin_id uuid,
  p_status text DEFAULT NULL,
  p_days integer DEFAULT 30
)
RETURNS TABLE(
  id text,
  user_id text,
  user_email text,
  user_name text,
  amount numeric,
  method_type text,
  status text,
  reference_id text,
  transaction_hash text,
  admin_note text,
  created_at text,
  updated_at text
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_export_count integer;
BEGIN
  -- Count records for audit
  SELECT COUNT(*)
  INTO v_export_count
  FROM withdrawal_requests wr
  WHERE (p_status IS NULL OR wr.status = p_status)
    AND wr.created_at >= NOW() - (p_days || ' days')::interval;

  -- Write audit log using correct columns
  INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, before, after, note)
  VALUES (
    p_admin_id,
    'csv_export_payouts',
    'export',
    'payouts',
    NULL,
    jsonb_build_object(
      'status', p_status,
      'days', p_days,
      'record_count', v_export_count
    ),
    format('Exported %s payouts to CSV', v_export_count)
  );

  -- Return CSV data
  RETURN QUERY
  SELECT
    wr.id::text,
    wr.user_id::text,
    p.email as user_email,
    p.name as user_name,
    wr.amount,
    wr.method_type,
    wr.status,
    wr.reference_id,
    wr.transaction_hash,
    wr.admin_note,
    wr.created_at::text,
    wr.updated_at::text
  FROM withdrawal_requests wr
  LEFT JOIN profiles p ON p.id = wr.user_id
  WHERE (p_status IS NULL OR wr.status = p_status)
    AND wr.created_at >= NOW() - (p_days || ' days')::interval
  ORDER BY wr.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION admin_export_payouts_csv(uuid, text, integer) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_export_payouts_csv(uuid, text, integer) TO service_role;

COMMENT ON FUNCTION admin_export_payouts_csv IS 'Export payout/withdrawal requests to CSV format. Admin or finance role. Writes single audit log entry. Service role only.';

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Index for active user checks
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_created 
  ON wallet_transactions(user_id, created_at DESC)
  WHERE kind IN ('earned', 'bonus');

-- Index for maintenance mode lookup
CREATE INDEX IF NOT EXISTS idx_app_settings_key 
  ON app_settings(key);

COMMENT ON TABLE broadcast_rate_limits IS 'Tracks broadcast notification sends for rate limiting. RLS enabled with no policies. Service role only.';
COMMENT ON TABLE app_settings IS 'Global application settings including maintenance mode. RLS enabled with no policies. Read via get_maintenance_status() function.';
