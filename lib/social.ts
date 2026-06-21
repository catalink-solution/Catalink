import type { Shop } from "./types";

export type SocialPlatform =
  | "whatsapp"
  | "snapchat"
  | "telegram"
  | "instagram"
  | "tiktok";

export type SocialLink = {
  platform: SocialPlatform;
  label: string;
  href: string;
  icon: string;
};

function isUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

/** Remove surrounding spaces and a leading "@", and strip inner spaces. */
function handle(value: string): string {
  return value.trim().replace(/\s+/g, "").replace(/^@+/, "");
}

/**
 * Builds clean, deep-linkable social URLs from raw shop fields.
 * - Tolerates values already given as full links (used as-is).
 * - Strips "@" and spaces for usernames.
 * - WhatsApp keeps digits only.
 */
export function buildSocialLinks(shop: Shop): SocialLink[] {
  const links: SocialLink[] = [];

  if (shop.whatsapp) {
    const number = shop.whatsapp.replace(/\D/g, "");
    if (number) {
      links.push({
        platform: "whatsapp",
        label: "WhatsApp",
        href: `https://wa.me/${number}`,
        icon: "/icons/social/whatsapp.png",
      });
    }
  }

  if (shop.snapchat) {
    const v = shop.snapchat;
    links.push({
      platform: "snapchat",
      label: "Snapchat",
      href: isUrl(v) ? v.trim() : `https://www.snapchat.com/add/${handle(v)}`,
      icon: "/icons/social/snapchat.png",
    });
  }

  if (shop.telegram) {
    const v = shop.telegram;
    links.push({
      platform: "telegram",
      label: "Telegram",
      href: isUrl(v) ? v.trim() : `https://t.me/${handle(v)}`,
      icon: "/icons/social/telegram.png",
    });
  }

  if (shop.instagram) {
    const v = shop.instagram;
    links.push({
      platform: "instagram",
      label: "Instagram",
      href: isUrl(v) ? v.trim() : `https://www.instagram.com/${handle(v)}`,
      icon: "/icons/social/instagram.png",
    });
  }

  if (shop.tiktok) {
    const v = shop.tiktok;
    links.push({
      platform: "tiktok",
      label: "TikTok",
      href: isUrl(v) ? v.trim() : `https://www.tiktok.com/@${handle(v)}`,
      icon: "/icons/social/tiktok.png",
    });
  }

  return links;
}
