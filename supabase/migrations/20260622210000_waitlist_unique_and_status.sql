-- Waitlist : email unique + suivi invitation.

ALTER TABLE public.waitlist_requests
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS invited_at timestamptz,
  ADD COLUMN IF NOT EXISTS invited_by text;

ALTER TABLE public.waitlist_requests
  DROP CONSTRAINT IF EXISTS waitlist_requests_status_check;

ALTER TABLE public.waitlist_requests
  ADD CONSTRAINT waitlist_requests_status_check
  CHECK (status IN ('pending', 'invited', 'registered'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_waitlist_requests_email_unique
  ON public.waitlist_requests (lower(email));

COMMENT ON COLUMN public.waitlist_requests.status IS 'pending | invited | registered';
