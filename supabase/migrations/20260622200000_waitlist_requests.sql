-- Demandes d'accès (liste d'attente) lorsque les inscriptions publiques sont fermées.

CREATE TABLE IF NOT EXISTS public.waitlist_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  shop_name text NOT NULL,
  channel text NOT NULL,
  channel_other text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT waitlist_requests_channel_check
    CHECK (channel IN ('snapchat', 'telegram', 'tiktok', 'instagram', 'other'))
);

CREATE INDEX IF NOT EXISTS idx_waitlist_requests_created_at
  ON public.waitlist_requests (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_waitlist_requests_email
  ON public.waitlist_requests (lower(email));

ALTER TABLE public.waitlist_requests ENABLE ROW LEVEL SECURITY;

-- Accès service_role uniquement (API /api/waitlist).

COMMENT ON TABLE public.waitlist_requests IS 'Demandes d''accès à la plateforme (waitlist)';
