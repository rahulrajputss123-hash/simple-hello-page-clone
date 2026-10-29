-- Admin Dashboard Analytics Functions
-- All functions are service_role only for security

-- ============================================================================
-- Daily Signups Split by Google vs Email
-- Uses auth.identities with LATERAL to get first identity per user
-- ============================================================================
CREATE OR REPLACE FUNCTION admin_daily_signups(p_days integer DEFAULT 30)
RETURNS TABLE(
  date date,
  google_signups bigint,
  email_signups bigint
) 
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH daily_users AS (
    SELECT 
      DATE(u.created_at) as signup_date,
      u.id,
      COALESCE(
        (
          SELECT i.provider = 'google'
          FROM auth.identities i 
          WHERE i.user_id = u.id 
          ORDER BY i.created_at ASC
          LIMIT 1
        ),
        false
      ) as is_google
    FROM auth.users u
    WHERE u.created_at >= NOW() - (p_days || ' days')::interval
  )
  SELECT 
    signup_date as date,
    COUNT(*) FILTER (WHERE is_google = true) as google_signups,
    COUNT(*) FILTER (WHERE is_google = false) as email_signups
  FROM daily_users
  GROUP BY signup_date
  ORDER BY signup_date DESC;
END;
$$;

REVOKE ALL ON FUNCTION admin_daily_signups(integer) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_daily_signups(integer) TO service_role;

COMMENT ON FUNCTION admin_daily_signups IS 'Returns daily signup counts split by Google vs email authentication. Uses first identity per user ordered by created_at. Service role only.';

-- ============================================================================
-- Daily Active Users (Active Earners)
-- Uses wallet_transactions with kind/source/status columns
-- ============================================================================
CREATE OR REPLACE FUNCTION admin_daily_active_users(p_days integer DEFAULT 30)
RETURNS TABLE(
  date date,
  dau bigint
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(created_at) as date,
    COUNT(DISTINCT user_id) as dau
  FROM wallet_transactions
  WHERE created_at >= NOW() - (p_days || ' days')::interval
    AND user_id IS NOT NULL
    AND kind IN ('earned', 'bonus')
    AND status = 'completed'
  GROUP BY DATE(created_at)
  ORDER BY date DESC;
END;
$$;

REVOKE ALL ON FUNCTION admin_daily_active_users(integer) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_daily_active_users(integer) TO service_role;

COMMENT ON FUNCTION admin_daily_active_users IS 'Returns daily active earners based on completed earn/bonus wallet transactions. Service role only.';

-- ============================================================================
-- Daily Revenue vs Payout
-- Revenue = kind in (earned, bonus) with status completed
-- Payout = kind withdrawn with status completed
-- ============================================================================
CREATE OR REPLACE FUNCTION admin_daily_revenue_payout(p_days integer DEFAULT 30)
RETURNS TABLE(
  date date,
  revenue numeric,
  payout numeric,
  net_profit numeric
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(wt.created_at) as date,
    COALESCE(SUM(wt.amount) FILTER (WHERE wt.kind IN ('earned', 'bonus') AND wt.status = 'completed'), 0) as revenue,
    COALESCE(ABS(SUM(wt.amount)) FILTER (WHERE wt.kind = 'withdrawn' AND wt.status = 'completed'), 0) as payout,
    COALESCE(SUM(wt.amount) FILTER (WHERE wt.kind IN ('earned', 'bonus') AND wt.status = 'completed'), 0) - 
    COALESCE(ABS(SUM(wt.amount)) FILTER (WHERE wt.kind = 'withdrawn' AND wt.status = 'completed'), 0) as net_profit
  FROM wallet_transactions wt
  WHERE wt.created_at >= NOW() - (p_days || ' days')::interval
  GROUP BY DATE(wt.created_at)
  ORDER BY date DESC;
END;
$$;

REVOKE ALL ON FUNCTION admin_daily_revenue_payout(integer) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_daily_revenue_payout(integer) TO service_role;

COMMENT ON FUNCTION admin_daily_revenue_payout IS 'Returns daily user earnings (earned+bonus) vs withdrawals and net profit. Service role only.';

-- ============================================================================
-- Top Offers by Completions
-- offer_id cast to text
-- ============================================================================
CREATE OR REPLACE FUNCTION admin_top_offers_by_completions(
  p_days integer DEFAULT 30,
  p_limit integer DEFAULT 10
)
RETURNS TABLE(
  offer_id text,
  offer_name text,
  completions bigint,
  approved bigint,
  total_payout numeric
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    oc.offer_id::text,
    o.title as offer_name,
    COUNT(*) as completions,
    COUNT(*) FILTER (WHERE oc.status = 'approved') as approved,
    COALESCE(SUM(oc.payout), 0) as total_payout
  FROM offer_claims oc
  INNER JOIN offers o ON o.id = oc.offer_id
  WHERE oc.created_at >= NOW() - (p_days || ' days')::interval
  GROUP BY oc.offer_id, o.title
  ORDER BY completions DESC
  LIMIT p_limit;
END;
$$;

REVOKE ALL ON FUNCTION admin_top_offers_by_completions(integer, integer) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_top_offers_by_completions(integer, integer) TO service_role;

COMMENT ON FUNCTION admin_top_offers_by_completions IS 'Returns top N offers by completion count for the last M days. Service role only.';

-- ============================================================================
-- User Detail
-- Returns profile, transactions, claims, referrals, masked payouts, devices
-- referred_by holds the referrer's referral CODE
-- total_earned_from_referrals sums wallet_transactions where source = 'referral'
-- Now includes device_info.other_accounts
-- ============================================================================
CREATE OR REPLACE FUNCTION admin_user_detail(p_user_id uuid)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_result jsonb;
  v_profile jsonb;
  v_transactions jsonb;
  v_claims jsonb;
  v_referrals jsonb;
  v_payout_methods jsonb;
  v_devices jsonb;
  v_device_id text;
BEGIN
  -- Get device_id first
  SELECT device_id INTO v_device_id
  FROM profiles
  WHERE id = p_user_id;

  -- Profile info
  SELECT jsonb_build_object(
    'id', p.id,
    'email', p.email,
    'name', p.name,
    'created_at', p.created_at,
    'wallet_balance', p.wallet_balance,
    'held_balance', p.held_balance,
    'lifetime_earned', p.lifetime_earned,
    'lifetime_withdrawn', p.lifetime_withdrawn,
    'is_flagged', p.is_flagged,
    'referral_code', p.referral_code,
    'referred_by_code', p.referred_by
  )
  INTO v_profile
  FROM profiles p
  WHERE p.id = p_user_id;

  -- Recent wallet transactions (last 100)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', wt.id,
      'amount', wt.amount,
      'kind', wt.kind,
      'source', wt.source,
      'status', wt.status,
      'description', wt.description,
      'created_at', wt.created_at
    ) ORDER BY wt.created_at DESC
  ), '[]'::jsonb)
  INTO v_transactions
  FROM (
    SELECT * FROM wallet_transactions
    WHERE user_id = p_user_id
    ORDER BY created_at DESC
    LIMIT 100
  ) wt;

  -- Recent offer claims (last 50)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', oc.id,
      'offer_id', oc.offer_id::text,
      'offer_title', o.title,
      'status', oc.status,
      'payout', oc.payout,
      'created_at', oc.created_at
    ) ORDER BY oc.created_at DESC
  ), '[]'::jsonb)
  INTO v_claims
  FROM (
    SELECT * FROM offer_claims
    WHERE user_id = p_user_id
    ORDER BY created_at DESC
    LIMIT 50
  ) oc
  LEFT JOIN offers o ON o.id = oc.offer_id;

  -- Referrals
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', p2.id,
      'referred_email', p2.email,
      'referred_name', p2.name,
      'created_at', p2.created_at,
      'is_credited', (
        SELECT COUNT(*) > 0
        FROM wallet_transactions wt
        WHERE wt.user_id = p_user_id
          AND wt.source = 'referral'
          AND wt.status = 'completed'
      ),
      'bonus_amount', 5.00
    ) ORDER BY p2.created_at DESC
  ), '[]'::jsonb)
  INTO v_referrals
  FROM profiles p2
  WHERE p2.referred_by = (SELECT referral_code FROM profiles WHERE id = p_user_id);

  -- Add total_earned_from_referrals to referrals object
  v_referrals := jsonb_set(
    v_referrals,
    '{total_earned_from_referrals}',
    to_jsonb((
      SELECT COALESCE(SUM(amount), 0)
      FROM wallet_transactions
      WHERE user_id = p_user_id
        AND source = 'referral'
        AND status = 'completed'
    ))
  );

  -- Payout methods (masked)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', pm.id,
      'method_type', pm.method_type,
      'masked_identifier', CASE
        WHEN pm.account_number IS NOT NULL THEN '****' || RIGHT(pm.account_number, 4)
        WHEN pm.wallet_address IS NOT NULL THEN '****' || RIGHT(pm.wallet_address, 4)
        WHEN pm.paypal_email IS NOT NULL THEN LEFT(pm.paypal_email, 3) || '***'
        ELSE 'N/A'
      END,
      'is_verified', pm.is_verified,
      'created_at', pm.created_at
    ) ORDER BY pm.created_at DESC
  ), '[]'::jsonb)
  INTO v_payout_methods
  FROM payout_methods pm
  WHERE pm.user_id = p_user_id;

  -- Devices (including other_accounts)
  SELECT jsonb_build_object(
    'device_id', v_device_id,
    'platform', (SELECT device_platform FROM profiles WHERE id = p_user_id),
    'app_version', (SELECT app_version FROM profiles WHERE id = p_user_id),
    'last_seen_at', (SELECT last_seen_at FROM profiles WHERE id = p_user_id),
    'other_accounts', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', p3.id,
            'email', p3.email,
            'name', p3.name,
            'wallet_balance', p3.wallet_balance,
            'lifetime_earned', p3.lifetime_earned,
            'is_flagged', p3.is_flagged,
            'created_at', p3.created_at
          )
        )
        FROM profiles p3
        WHERE p3.device_id = v_device_id
          AND v_device_id IS NOT NULL
          AND v_device_id != ''
          AND v_device_id != 'server'
          AND p3.id != p_user_id
      ),
      '[]'::jsonb
    )
  )
  INTO v_devices;

  -- Combine all data
  v_result := jsonb_build_object(
    'profile', v_profile,
    'transactions', v_transactions,
    'claims', v_claims,
    'referrals', v_referrals,
    'payout_methods', v_payout_methods,
    'devices', jsonb_build_array(v_devices)
  );

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION admin_user_detail(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_user_detail(uuid) TO service_role;

COMMENT ON FUNCTION admin_user_detail IS 'Returns comprehensive user detail including profile, transactions, claims, referrals, masked payout methods, and devices with other accounts. Service role only.';

-- ============================================================================
-- User Audit Log Entries
-- ============================================================================
CREATE OR REPLACE FUNCTION admin_user_audit_log(
  p_user_id uuid,
  p_limit integer DEFAULT 50
)
RETURNS TABLE(
  id uuid,
  admin_id uuid,
  admin_email text,
  action text,
  details jsonb,
  created_at timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    aal.id,
    aal.admin_id,
    p.email as admin_email,
    aal.action,
    aal.details,
    aal.created_at
  FROM admin_audit_log aal
  LEFT JOIN profiles p ON p.id = aal.admin_id
  WHERE aal.details->>'user_id' = p_user_id::text
     OR aal.details->>'target_user_id' = p_user_id::text
  ORDER BY aal.created_at DESC
  LIMIT p_limit;
END;
$$;

REVOKE ALL ON FUNCTION admin_user_audit_log(uuid, integer) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_user_audit_log(uuid, integer) TO service_role;

COMMENT ON FUNCTION admin_user_audit_log IS 'Returns audit log entries related to a specific user. Service role only.';
