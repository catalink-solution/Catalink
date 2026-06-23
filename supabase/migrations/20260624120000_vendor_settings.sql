-- Sprint 4A: vendor settings (profile, notification preferences).

ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS owner_first_name text,
  ADD COLUMN IF NOT EXISTS owner_last_name text,
  ADD COLUMN IF NOT EXISTS notify_order_email boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_status_email boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_catalink_marketing boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.shops.owner_first_name IS 'Prénom du vendeur (paramètres compte)';
COMMENT ON COLUMN public.shops.owner_last_name IS 'Nom du vendeur (paramètres compte)';
COMMENT ON COLUMN public.shops.notify_order_email IS 'Recevoir un email à chaque nouvelle commande';
COMMENT ON COLUMN public.shops.notify_status_email IS 'Recevoir un email quand le statut commande change (futur)';
COMMENT ON COLUMN public.shops.notify_catalink_marketing IS 'Recevoir les emails marketing Catalink';
COMMENT ON COLUMN public.shops.plan IS 'Plan abonnement (free, pro, …) — upgrade Stripe futur';
