-- Admin panel: accurate totals and pagination support
-- Fixes bug where admin panel only showed stats for the latest 200 users

-- Security-hardened function to compute exact admin totals
-- Only callable by service role (never by regular users)
CREATE OR REPLACE FUNCTION public.admin_compute_totals()
RETURNS TABLE(
  total_users BIGINT,
  flagged_users BIGINT,
  total_lifetime_earned NUMERIC,
  total_lifetime_withdrawn NUMERIC,
  total_wallet_liability NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_users,
    COUNT(*) FILTER (WHERE is_flagged = TRUE)::BIGINT AS flagged_users,
    COALESCE(SUM(lifetime_earned), 0) AS total_lifetime_earned,
    COALESCE(SUM(lifetime_withdrawn), 0) AS total_lifetime_withdrawn,
    COALESCE(SUM(wallet_balance), 0) AS total_wallet_liability
  FROM public.profiles;
END;
$$;

-- Grant execute only to service_role
REVOKE ALL ON FUNCTION public.admin_compute_totals() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_compute_totals() FROM anon;
REVOKE ALL ON FUNCTION public.admin_compute_totals() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.admin_compute_totals() TO service_role;

COMMENT ON FUNCTION public.admin_compute_totals IS 'Computes accurate admin panel totals over all profiles. Service role only.';
