export type Shop = {
  id: string;
  user_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  whatsapp: string | null;
  telegram: string | null;
  snapchat: string | null;
  instagram: string | null;
  tiktok: string | null;
  plan: string | null;
  logo_url: string | null;
  created_at: string | null;
  is_suspended?: boolean;
  suspended_at?: string | null;
  subscription_status?: string | null;
  subscription_started_at?: string | null;
  subscription_expires_at?: string | null;
  owner_first_name?: string | null;
  owner_last_name?: string | null;
  notify_order_email?: boolean;
  notify_status_email?: boolean;
  notify_catalink_marketing?: boolean;
};

export type ProductCategory = {
  id: string;
  shop_id: string;
  name: string;
  created_at: string | null;
};

export type Product = {
  id: string;
  shop_id: string | null;
  name: string;
  price: number;
  description: string | null;
  image_url: string | null;
  category: string | null;
  product_main_category: string | null;
  product_custom_category_id: string | null;
  sizes: string[] | null;
  is_active: boolean;
  track_stock: boolean;
  has_variants: boolean;
  related_product_ids: string[] | null;
  created_at: string | null;
};

/** Legacy size-only stock entry (système actuel, conservé). */
export type ProductVariant = {
  id: string;
  product_id: string;
  size: string;
  stock: number;
};

// ─── Système de variantes V3 (multi-attributs, type Shopify) ────────────────

export type ProductAttribute = {
  id: string;
  product_id: string;
  name: string;
  position: number;
  created_at: string | null;
};

export type ProductAttributeValue = {
  id: string;
  attribute_id: string;
  value: string;
  /** Code couleur HEX (#RRGGBB) pour l'attribut « Couleur ». Null sinon. */
  hex: string | null;
  position: number;
  created_at: string | null;
};

/** Une combinaison concrète (ex : Noir / 42). `price` null = prix de base produit. */
export type ProductSku = {
  id: string;
  product_id: string;
  sku: string | null;
  price: number | null;
  stock_quantity: number;
  active: boolean;
  created_at: string | null;
};

export type ProductSkuValue = {
  sku_id: string;
  attribute_value_id: string;
};

export type ProductSkuImage = {
  id: string;
  sku_id: string;
  image_url: string;
  sort_order: number;
  created_at: string | null;
};

export type ProductImage = {
  id: string;
  product_id: string;
  image_url: string;
  position: number;
  created_at: string | null;
};

export type OrderStatus =
  | "new"
  | "supplying"
  | "received"
  | "shipped"
  | "delivered"
  | "cancelled";

export type Order = {
  id: string;
  shop_id: string | null;
  customer_id: string | null;
  customer_name: string | null;
  customer_contact: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  message: string | null;
  quantity: number | null;
  status: OrderStatus | string | null;
  total: number;
  tracking_number: string | null;
  tracking_carrier: string | null;
  tracking_status: string | null;
  tracking_status_at: string | null;
  tracking_last_event: string | null;
  tracking_last_event_at: string | null;
  campaign_link_id: string | null;
  ref_code: string | null;
  promo_code: string | null;
  loyalty_points_awarded?: boolean;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string | null;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  size: string | null;
  quantity: number;
  unit_price: number;
  sku_id: string | null;
  variant_label: string | null;
  created_at: string | null;
};

export type Notification = {
  id: string;
  user_id: string;
  shop_id: string | null;
  type: string;
  title: string;
  message: string | null;
  data: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string | null;
};

export type Customer = {
  id: string;
  shop_id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  orders_count: number;
  total_spent: number;
  first_order_at: string | null;
  last_order_at: string | null;
  is_vip: boolean;
  internal_note: string | null;
  created_at: string | null;
};

export type Review = {
  id: string;
  shop_id: string;
  product_id: string | null;
  order_id: string | null;
  customer_name: string | null;
  rating: number;
  comment: string | null;
  photo_url: string | null;
  is_published: boolean;
  created_at: string | null;
};

export type TrackingEvent = {
  id: string;
  order_id: string;
  status: string | null;
  description: string | null;
  location: string | null;
  event_time: string | null;
  created_at: string | null;
};

export type AbandonedCart = {
  id: string;
  shop_id: string;
  session_id: string;
  items: unknown;
  total: number;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  status: string;
  reminded_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type CampaignLink = {
  id: string;
  shop_id: string;
  name: string;
  influencer_name: string | null;
  ref_code: string;
  promo_code: string | null;
  collaboration_cost: number | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string | null;
};

export type CampaignVisit = {
  id: string;
  shop_id: string;
  campaign_link_id: string | null;
  visitor_id: string | null;
  session_id: string | null;
  user_agent: string | null;
  ip_hash: string | null;
  created_at: string | null;
};

export type StoryTemplate = {
  id: string;
  shop_id: string;
  name: string;
  primary_color: string;
  secondary_color: string;
  cta_text: string;
  price_position: string;
  logo_position: string;
  background_style: string;
  show_logo: boolean;
  show_promo_code: boolean;
  preset_key: string | null;
  created_at: string | null;
};

export type StoryExport = {
  id: string;
  shop_id: string;
  product_id: string | null;
  template_id: string | null;
  image_url: string | null;
  created_at: string | null;
};

export type QuickReply = {
  id: string;
  shop_id: string;
  title: string;
  body: string;
  category: string;
  sort_order: number;
  created_at: string | null;
};
