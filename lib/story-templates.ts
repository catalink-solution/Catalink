/** Story template configuration (built-in presets + DB custom templates). */

export type BackgroundStyle = "dark" | "light" | "gradient" | "blurred";
export type PricePosition = "top" | "center" | "bottom";
export type LogoPosition = "top-left" | "top-center" | "bottom";

export type StoryBadge = "NOUVEAU" | "STOCK LIMITÉ" | "FLASH SALE" | "DISPONIBLE";

export type StoryTemplateConfig = {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  ctaText: string;
  pricePosition: PricePosition;
  logoPosition: LogoPosition;
  backgroundStyle: BackgroundStyle;
  showLogo: boolean;
  showPromoCode: boolean;
  isBuiltin?: boolean;
  presetKey?: string | null;
  /** Badge affiché en haut de la story (templates intégrés uniquement). */
  badge?: StoryBadge | null;
};

export type DbStoryTemplate = {
  id: string;
  shop_id: string;
  name: string;
  primary_color: string;
  secondary_color: string;
  cta_text: string;
  price_position: PricePosition;
  logo_position: LogoPosition;
  background_style: BackgroundStyle;
  show_logo: boolean;
  show_promo_code: boolean;
  preset_key: string | null;
  created_at: string | null;
};

export const BUILTIN_TEMPLATES: StoryTemplateConfig[] = [
  {
    id: "builtin-flash-sale",
    name: "Flash Sale",
    primaryColor: "#ef4444",
    secondaryColor: "#0a0a0a",
    ctaText: "J'EN PROFITE →",
    pricePosition: "bottom",
    logoPosition: "top-left",
    backgroundStyle: "gradient",
    showLogo: true,
    showPromoCode: true,
    isBuiltin: true,
    presetKey: "flash-sale",
    badge: "FLASH SALE",
  },
  {
    id: "builtin-nouveau-drop",
    name: "Nouveau Drop",
    primaryColor: "#6366f1",
    secondaryColor: "#0c4a6e",
    ctaText: "VOIR LE DROP →",
    pricePosition: "bottom",
    logoPosition: "top-left",
    backgroundStyle: "gradient",
    showLogo: true,
    showPromoCode: false,
    isBuiltin: true,
    presetKey: "nouveau-drop",
    badge: "NOUVEAU",
  },
  {
    id: "builtin-stock-limite",
    name: "Stock Limité",
    primaryColor: "#f59e0b",
    secondaryColor: "#1c1917",
    ctaText: "RÉSERVER MA TAILLE →",
    pricePosition: "bottom",
    logoPosition: "top-left",
    backgroundStyle: "dark",
    showLogo: true,
    showPromoCode: false,
    isBuiltin: true,
    presetKey: "stock-limite",
    badge: "STOCK LIMITÉ",
  },
  {
    id: "builtin-luxe-premium",
    name: "Luxe Premium",
    primaryColor: "#d4af37",
    secondaryColor: "#0d0d0d",
    ctaText: "COMMANDER →",
    pricePosition: "bottom",
    logoPosition: "top-left",
    backgroundStyle: "dark",
    showLogo: true,
    showPromoCode: false,
    isBuiltin: true,
    presetKey: "luxe-premium",
    badge: "DISPONIBLE",
  },
];

export function dbToTemplate(row: DbStoryTemplate): StoryTemplateConfig {
  return {
    id: row.id,
    name: row.name,
    primaryColor: row.primary_color,
    secondaryColor: row.secondary_color,
    ctaText: row.cta_text,
    pricePosition: row.price_position,
    logoPosition: row.logo_position,
    backgroundStyle: row.background_style,
    showLogo: row.show_logo,
    showPromoCode: row.show_promo_code,
    isBuiltin: false,
    presetKey: row.preset_key,
  };
}

export function templateToDbInsert(
  shopId: string,
  t: Omit<StoryTemplateConfig, "id" | "isBuiltin">
) {
  return {
    shop_id: shopId,
    name: t.name,
    primary_color: t.primaryColor,
    secondary_color: t.secondaryColor,
    cta_text: t.ctaText,
    price_position: t.pricePosition,
    logo_position: t.logoPosition,
    background_style: t.backgroundStyle,
    show_logo: t.showLogo,
    show_promo_code: t.showPromoCode,
    preset_key: t.presetKey ?? null,
  };
}
