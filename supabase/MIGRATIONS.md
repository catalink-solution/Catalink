# Supabase migrations — Catalink

## État production (project `mgcijucvkmctlsufuxhq`)

Migrations appliquées en prod (ordre chronologique) :

| Version | Name |
|---------|------|
| 20260619134545 | cart_checkout_v1 |
| 20260619172612 | orders_tracking_fields |
| 20260619172623 | product_categories_and_plan |
| 20260619211216 | shop_logo_and_product_categories |
| 20260619213448 | orders_tracking_status |
| 20260620125406 | v2_new_tables |
| 20260620125454 | v2_alter_existing |
| 20260620125518 | v2_rls_policies |
| 20260620125557 | v2_functions |
| 20260620143659 | phase_d_review_lookup |
| 20260620210227 | story_templates_and_exports |
| 20260620212115 | modules_1_3_5_6_foundation |
| 20260621155615 | product_variants_v3_foundation |
| 20260621155642 | create_order_v3_variant_support |
| 20260621162959 | ai_smart_import_engine |
| 20260622092429 | ai_import_visual_fingerprints |
| 20260622205508 | admin_dashboard |
| 20260622212800 | waitlist_requests |
| 20260622213318 | waitlist_unique_and_status |
| 20260623120000 | security_sprint_pre_launch *(partiellement via MCP en 3 blocs)* |

## Fichiers locaux (`supabase/migrations/`)

Les migrations historiques v2 ne sont pas encore dumpées depuis prod. Pour reconstruire une base vierge :

1. `supabase link --project-ref mgcijucvkmctlsufuxhq`
2. `supabase db pull` (récupère le schéma complet)
3. Ou appliquer les fichiers locaux dans l'ordre sur une base vide

## Security sprint (20260623120000)

Voir `20260623120000_security_sprint_pre_launch.sql` :

- Vue `shops_storefront` (colonnes publiques uniquement)
- Suppression `public read shops` et `public create orders`
- Products/variants/images : lecture publique limitée aux boutiques actives non suspendues
- RPC `create_order` : rejet boutiques suspendues
- RPC `award_loyalty_on_delivery` : réservé au vendeur authentifié
- Storage `product-images` : upload scopé par `shop_id`
