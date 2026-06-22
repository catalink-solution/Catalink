-- Admin dashboard : statut compte, abonnements, journal d'audit.

-- Colonnes boutique (compte vendeur)
ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS subscription_started_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz;

ALTER TABLE public.shops
  DROP CONSTRAINT IF EXISTS shops_subscription_status_check;

ALTER TABLE public.shops
  ADD CONSTRAINT shops_subscription_status_check
  CHECK (subscription_status IN ('active', 'expired', 'trialing', 'cancelled'));

CREATE INDEX IF NOT EXISTS idx_shops_subscription_status ON public.shops (subscription_status);
CREATE INDEX IF NOT EXISTS idx_shops_is_suspended ON public.shops (is_suspended);

-- Journal des actions administrateur
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email text NOT NULL,
  action text NOT NULL,
  target_user_id uuid,
  target_shop_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON public.admin_audit_log (created_at DESC);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Aucune policy publique : accès service_role uniquement via API admin.

COMMENT ON TABLE public.admin_audit_log IS 'Trace des actions plateforme (suspend, plan, etc.)';
COMMENT ON COLUMN public.shops.subscription_status IS 'active | expired | trialing | cancelled';
COMMENT ON COLUMN public.shops.is_suspended IS 'Compte vendeur suspendu par admin';
