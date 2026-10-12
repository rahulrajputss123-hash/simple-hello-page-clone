DROP INDEX IF EXISTS public.offers_provider_external_uniq;
CREATE UNIQUE INDEX offers_provider_external_uniq ON public.offers (provider_id, external_offer_id);