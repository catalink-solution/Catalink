-- Logs erreurs produit (bêta) — trace côté serveur, accès service_role uniquement.

CREATE TABLE IF NOT EXISTS public.app_error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text,
  route text NOT NULL DEFAULT '',
  action text NOT NULL,
  message text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_error_logs_created_at
  ON public.app_error_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_app_error_logs_action
  ON public.app_error_logs (action);

ALTER TABLE public.app_error_logs ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.app_error_logs IS 'Erreurs applicatives bêta (API + dashboard vendeur)';
