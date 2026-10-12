DROP TABLE IF EXISTS public.kyc_submissions CASCADE;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS kyc_status;

CREATE TABLE public.offer_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  reward_amount numeric NOT NULL DEFAULT 0,
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, offer_id)
);

GRANT SELECT, INSERT ON public.offer_claims TO authenticated;
GRANT ALL ON public.offer_claims TO service_role;

ALTER TABLE public.offer_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own offer claims select" ON public.offer_claims
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER offer_claims_updated_at
  BEFORE UPDATE ON public.offer_claims
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();