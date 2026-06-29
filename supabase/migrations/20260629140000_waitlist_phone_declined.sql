-- Waitlist : téléphone WhatsApp + statut declined (soft-delete).

ALTER TABLE public.waitlist_requests
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS phone_normalized text,
  ADD COLUMN IF NOT EXISTS declined_at timestamptz,
  ADD COLUMN IF NOT EXISTS declined_by text;

ALTER TABLE public.waitlist_requests
  DROP CONSTRAINT IF EXISTS waitlist_requests_status_check;

ALTER TABLE public.waitlist_requests
  ADD CONSTRAINT waitlist_requests_status_check
  CHECK (status IN ('pending', 'invited', 'registered', 'declined'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_waitlist_requests_phone_normalized_unique
  ON public.waitlist_requests (phone_normalized)
  WHERE phone_normalized IS NOT NULL;

COMMENT ON COLUMN public.waitlist_requests.phone IS 'Numéro WhatsApp saisi par le prospect';
COMMENT ON COLUMN public.waitlist_requests.phone_normalized IS 'Téléphone normalisé pour dédoublonnage et wa.me';
