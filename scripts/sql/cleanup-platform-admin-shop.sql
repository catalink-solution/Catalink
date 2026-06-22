/**
 * Plan de nettoyage — boutique vendeur liée au compte admin plateforme
 *
 * ⚠️ NE PAS EXÉCUTER SANS VALIDATION EXPLICITE
 *
 * Cible : contact.catalink@gmail.com
 * user_id : 787c0aa1-3ac1-4481-ab3e-16bac83018af
 * shop_id : 2ec68e07-9714-4568-9cae-9a7feb2f0bc8 (slug: catalink)
 *
 * Inventaire (2026-06-22) :
 * - products: 5
 * - product_images: 5
 * - product_categories: 1
 * - orders: 3
 * - order_items: 4
 * - customers: 2
 * - customer_loyalty: 1
 * - quick_replies: 7
 * - campaign_links: 1
 * - campaign_visits: 4
 * - notifications: 2
 * - reviews: 0
 * - abandoned_carts: 0
 * - story_templates: 0
 * - story_exports: 0
 * - import_jobs: 0
 *
 * Tables impactées (shop_id) :
 * abandoned_carts, campaign_links, campaign_visits, customer_loyalty,
 * customers, import_jobs (+ cascades import_*), notifications, orders
 * (+ order_items), product_categories, products (+ variantes/images),
 * quick_replies, reviews, story_exports, story_templates
 *
 * NON supprimé :
 * - auth.users (contact.catalink@gmail.com)
 * - accès admin (ADMIN_EMAIL)
 */

-- Étape 0 : vérification
SELECT u.id, u.email, u.banned_until, s.id AS shop_id, s.slug
FROM auth.users u
LEFT JOIN shops s ON s.user_id = u.id
WHERE lower(u.email) = 'contact.catalink@gmail.com';

-- Étape 1 : débloquer (déjà fait si banned_until IS NULL et is_suspended = false)
UPDATE public.shops
SET is_suspended = false, suspended_at = NULL
WHERE user_id = '787c0aa1-3ac1-4481-ab3e-16bac83018af';

UPDATE auth.users
SET banned_until = NULL
WHERE id = '787c0aa1-3ac1-4481-ab3e-16bac83018af';

-- Étape 2 : supprimer les données dépendantes (ordre FK)
-- Remplacer SHOP_ID ci-dessous avant exécution

-- BEGIN;

-- DELETE FROM public.order_items
-- WHERE order_id IN (SELECT id FROM public.orders WHERE shop_id = '2ec68e07-9714-4568-9cae-9a7feb2f0bc8');

-- DELETE FROM public.orders WHERE shop_id = '2ec68e07-9714-4568-9cae-9a7feb2f0bc8';

-- DELETE FROM public.customer_loyalty WHERE shop_id = '2ec68e07-9714-4568-9cae-9a7feb2f0bc8';
-- DELETE FROM public.customers WHERE shop_id = '2ec68e07-9714-4568-9cae-9a7feb2f0bc8';

-- DELETE FROM public.campaign_visits WHERE shop_id = '2ec68e07-9714-4568-9cae-9a7feb2f0bc8';
-- DELETE FROM public.campaign_links WHERE shop_id = '2ec68e07-9714-4568-9cae-9a7feb2f0bc8';

-- DELETE FROM public.notifications WHERE shop_id = '2ec68e07-9714-4568-9cae-9a7feb2f0bc8';
-- DELETE FROM public.quick_replies WHERE shop_id = '2ec68e07-9714-4568-9cae-9a7feb2f0bc8';
-- DELETE FROM public.reviews WHERE shop_id = '2ec68e07-9714-4568-9cae-9a7feb2f0bc8';
-- DELETE FROM public.abandoned_carts WHERE shop_id = '2ec68e07-9714-4568-9cae-9a7feb2f0bc8';

-- DELETE FROM public.story_exports WHERE shop_id = '2ec68e07-9714-4568-9cae-9a7feb2f0bc8';
-- DELETE FROM public.story_templates WHERE shop_id = '2ec68e07-9714-4568-9cae-9a7feb2f0bc8';

-- DELETE FROM public.product_images
-- WHERE product_id IN (SELECT id FROM public.products WHERE shop_id = '2ec68e07-9714-4568-9cae-9a7feb2f0bc8');

-- DELETE FROM public.product_variants
-- WHERE product_id IN (SELECT id FROM public.products WHERE shop_id = '2ec68e07-9714-4568-9cae-9a7feb2f0bc8');

-- DELETE FROM public.products WHERE shop_id = '2ec68e07-9714-4568-9cae-9a7feb2f0bc8';
-- DELETE FROM public.product_categories WHERE shop_id = '2ec68e07-9714-4568-9cae-9a7feb2f0bc8';

-- DELETE FROM public.shops WHERE id = '2ec68e07-9714-4568-9cae-9a7feb2f0bc8';

-- COMMIT;

-- Étape 3 : vérification post-nettoyage
-- SELECT u.email, u.banned_until, s.id AS shop_id
-- FROM auth.users u
-- LEFT JOIN shops s ON s.user_id = u.id
-- WHERE lower(u.email) = 'contact.catalink@gmail.com';
-- Attendu : shop_id NULL, banned_until NULL
