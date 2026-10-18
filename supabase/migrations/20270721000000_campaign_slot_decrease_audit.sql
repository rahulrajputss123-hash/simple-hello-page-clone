-- Migration: Campaign slot decrease audit and admin-only enforcement
-- Created: 2027-07-21
-- 
-- Adds audit logging for slot decreases and helper function to handle refunds

-- Audit log table for slot changes
CREATE TABLE IF NOT EXISTS public.campaign_slot_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  editor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  old_slots integer NOT NULL CHECK (old_slots > 0),
  new_slots integer NOT NULL CHECK (new_slots > 0),
  amount_refunded numeric(10,2) NOT NULL DEFAULT 0 CHECK (amount_refunded >= 0),
  min_allowed_slots integer NOT NULL CHECK (min_allowed_slots >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS campaign_slot_audit_campaign_idx 
  ON public.campaign_slot_audit (campaign_id, created_at DESC);
CREATE INDEX IF NOT EXISTS campaign_slot_audit_editor_idx 
  ON public.campaign_slot_audit (editor_id, created_at DESC);

GRANT SELECT ON public.campaign_slot_audit TO authenticated;
GRANT ALL ON public.campaign_slot_audit TO service_role;
ALTER TABLE public.campaign_slot_audit ENABLE ROW LEVEL SECURITY;

-- Admin can view all audit logs
CREATE POLICY "admins view all slot audit logs" ON public.campaign_slot_audit
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Advertisers can view their own campaigns' audit logs
CREATE POLICY "advertisers view own campaign slot audit" ON public.campaign_slot_audit
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.advertiser_id = auth.uid()
    )
  );

COMMENT ON TABLE public.campaign_slot_audit IS 
  'Audit log for campaign slot changes, especially decreases';
COMMENT ON COLUMN public.campaign_slot_audit.min_allowed_slots IS 
  'Minimum slots allowed at time of change (based on consumed/reserved)';
COMMENT ON COLUMN public.campaign_slot_audit.amount_refunded IS 
  'Amount refunded to advertiser wallet when slots decreased';

-- Function to calculate how many slots are consumed or reserved
-- Returns the minimum number of slots that must remain
CREATE OR REPLACE FUNCTION public.mkt_campaign_slot_usage(p_campaign_id uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH usage AS (
    -- Count approved submissions
    SELECT COALESCE(COUNT(*), 0)::integer AS approved_count
    FROM campaign_submissions
    WHERE campaign_id = p_campaign_id
      AND status = 'approved'
  ),
  pending AS (
    -- Count pending review submissions
    SELECT COALESCE(COUNT(*), 0)::integer AS pending_count
    FROM campaign_submissions  
    WHERE campaign_id = p_campaign_id
      AND status = 'pending_review'
  ),
  clicks AS (
    -- Count active (unexpired) clicks
    SELECT COALESCE(COUNT(*), 0)::integer AS active_clicks
    FROM campaign_clicks
    WHERE campaign_id = p_campaign_id
      AND status = 'active'
      AND expires_at > now()
  )
  SELECT (u.approved_count + p.pending_count + c.active_clicks)::integer
  FROM usage u, pending p, clicks c
$$;

COMMENT ON FUNCTION public.mkt_campaign_slot_usage(uuid) IS
  'Calculate minimum slots needed based on approved submissions, pending reviews, and active clicks';

