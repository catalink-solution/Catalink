import Image from "next/image";
import { HERO_ASSETS } from "@/components/landing/mockups";
import type { SocialPlatform } from "@/lib/social";

const PLATFORM_ASSETS: Record<SocialPlatform, string> = {
  whatsapp: HERO_ASSETS.whatsapp,
  snapchat: HERO_ASSETS.snapchat,
  telegram: HERO_ASSETS.telegram,
  instagram: HERO_ASSETS.instagram,
  tiktok: HERO_ASSETS.tiktok,
};

const PLATFORM_GLOW: Record<SocialPlatform, string> = {
  snapchat:
    "drop-shadow(0 0 12px rgba(255,223,0,0.55)) drop-shadow(0 0 22px rgba(255,193,7,0.32))",
  tiktok:
    "drop-shadow(0 0 10px rgba(0,242,234,0.4)) drop-shadow(0 0 20px rgba(255,45,85,0.28))",
  instagram:
    "drop-shadow(0 0 12px rgba(236,72,153,0.48)) drop-shadow(0 0 22px rgba(249,115,22,0.3))",
  telegram:
    "drop-shadow(0 0 12px rgba(34,158,255,0.5)) drop-shadow(0 0 22px rgba(56,189,248,0.34))",
  whatsapp:
    "drop-shadow(0 0 12px rgba(37,211,102,0.48)) drop-shadow(0 0 22px rgba(34,197,94,0.32))",
};

type Props = {
  platform: SocialPlatform;
  className?: string;
};

export function SocialIcon({ platform, className = "h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16" }: Props) {
  const src = PLATFORM_ASSETS[platform];
  if (!src) return null;

  return (
    <Image
      src={src}
      alt=""
      width={64}
      height={64}
      aria-hidden
      unoptimized
      className={`bg-transparent object-contain ${className}`}
      style={{ filter: PLATFORM_GLOW[platform] }}
    />
  );
}
