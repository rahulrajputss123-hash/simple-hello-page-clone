-- Admin safety features: audit log, adjustment approvals, extended roles

-- ============================================================================
-- 1. ADMIN AUDIT LOG
-- ============================================================================

CREATE TABLE public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  before JSONB,
  after JSONB,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_audit_log_admin_id ON public.admin_audit_log(admin_id);
CREATE INDEX idx_admin_audit_log_action ON public.admin_audit_log(action);
CREATE INDEX idx_admin_audit_log_created_at ON public.admin_audit_log(created_at DESC);
CREATE INDEX idx_admin_audit_log_target ON public.admin_audit_log(target_type, target_id);

-- RLS: Only admins can read, nobody can write from client (service role only)
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_audit_log_read_policy ON public.admin_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'finance', 'support')
    )
  );

-- No INSERT/UPDATE/DELETE policies - service role only

COMMENT ON TABLE public.admin_audit_log IS 'Audit trail of all admin actions. Read-only from client, service role writes only.';

-- ============================================================================
-- 2. WALLET ADJUSTMENT REQUESTS (for amounts > $100)
-- ============================================================================

CREATE TABLE public.adjustment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (ABS(amount) > 100),
  reason TEXT NOT NULL CHECK (LENGTH(TRIM(reason)) >= 5),
  requested_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approval_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_at TIMESTAMPTZ,
  CONSTRAINT different_approver CHECK (requested_by != approved_by OR approved_by IS NULL)
);

CREATE INDEX idx_adjustment_requests_status ON public.adjustment_requests(status);
CREATE INDEX idx_adjustment_requests_user_id ON public.adjustment_requests(user_id);
CREATE INDEX idx_adjustment_requests_requested_by ON public.adjustment_requests(requested_by);
CREATE INDEX idx_adjustment_requests_created_at ON public.adjustment_requests(created_at DESC);

-- RLS: Admins can read all, nobody can write from client
ALTER TABLE public.adjustment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY adjustment_requests_read_policy ON public.adjustment_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'finance')
    )
  );

COMMENT ON TABLE public.adjustment_requests IS 'Wallet adjustment requests requiring two-admin approval for amounts > $100.';

-- ============================================================================
-- 3. EXTENDED ROLES (admin, finance, support)
-- ============================================================================

-- user_roles table already exists, just add check constraint for new roles
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_check 
  CHECK (role IN ('admin', 'finance', 'support'));

COMMENT ON TABLE public.user_roles IS 'Staff roles: admin (full access), finance (payouts/claims), support (tickets only).';

-- ============================================================================
-- 4. FRAUD DETECTION HELPERS
-- ============================================================================

-- Function to count profiles sharing the same device_id
CREATE OR REPLACE FUNCTION public.count_device_duplicates(p_device_id TEXT)
RETURNS INTEGER
LANGUAGE SQL
STABLE
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.profiles
  WHERE device_id = p_device_id
    AND device_id IS NOT NULL
    AND device_id != ''
    AND device_id != 'server';
$$;

-- Function to get account age in days
CREATE OR REPLACE FUNCTION public.account_age_days(p_user_id UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
AS $$
  SELECT EXTRACT(DAY FROM NOW() - created_at)::INTEGER
  FROM public.profiles
  WHERE id = p_user_id;
$$;

-- Function to count approved withdrawals for a user
CREATE OR REPLACE FUNCTION public.count_approved_withdrawals(p_user_id UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.withdrawal_requests
  WHERE user_id = p_user_id
    AND status = 'approved';
$$;

-- Grant execute to authenticated users (used in admin panel)
GRANT EXECUTE ON FUNCTION public.count_device_duplicates(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.account_age_days(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_approved_withdrawals(UUID) TO authenticated;

-- ============================================================================
-- 5. ADMIN ACTIONS RPC (for list pagination)
-- ============================================================================

-- Paginated audit log listing
CREATE OR REPLACE FUNCTION public.admin_list_audit_logs(
  p_admin_id UUID DEFAULT NULL,
  p_action TEXT DEFAULT NULL,
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL,
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 25
)
RETURNS TABLE(
  id UUID,
  admin_id UUID,
  admin_email TEXT,
  action TEXT,
  target_type TEXT,
  target_id TEXT,
  before JSONB,
  after JSONB,
  note TEXT,
  created_at TIMESTAMPTZ,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offset INTEGER;
  v_total BIGINT;
BEGIN
  -- Verify caller has admin role
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'finance', 'support')
  ) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  v_offset := (GREATEST(p_page, 1) - 1) * p_page_size;

  -- Get total count
  SELECT COUNT(*) INTO v_total
  FROM public.admin_audit_log aal
  WHERE (p_admin_id IS NULL OR aal.admin_id = p_admin_id)
    AND (p_action IS NULL OR aal.action ILIKE '%' || p_action || '%')
    AND (p_date_from IS NULL OR aal.created_at >= p_date_from)
    AND (p_date_to IS NULL OR aal.created_at <= p_date_to);

  RETURN QUERY
  SELECT 
    aal.id,
    aal.admin_id,
    p.email AS admin_email,
    aal.action,
    aal.target_type,
    aal.target_id,
    aal.before,
    aal.after,
    aal.note,
    aal.created_at,
    v_total AS total_count
  FROM public.admin_audit_log aal
  LEFT JOIN public.profiles p ON p.id = aal.admin_id
  WHERE (p_admin_id IS NULL OR aal.admin_id = p_admin_id)
    AND (p_action IS NULL OR aal.action ILIKE '%' || p_action || '%')
    AND (p_date_from IS NULL OR aal.created_at >= p_date_from)
    AND (p_date_to IS NULL OR aal.created_at <= p_date_to)
  ORDER BY aal.created_at DESC
  LIMIT p_page_size
  OFFSET v_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_audit_logs TO authenticated;

COMMENT ON FUNCTION public.admin_list_audit_logs IS 'Paginated audit log listing for admin panel. Requires admin/finance/support role.';
