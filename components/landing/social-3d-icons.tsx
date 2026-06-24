import Image from "next/image";
import { X } from "lucide-react";
import { HERO_ASSETS } from "@/components/landing/mockups";

const SOCIAL_POSITIONS = [
  {
    src: HERO_ASSETS.snapchat,
    alt: "Snapchat",
    x: -142,
    y: -172,
    size: 90,
    glow:
      "drop-shadow(0 10px 20px rgba(0,0,0,0.4)) drop-shadow(0 0 14px rgba(255,223,0,0.55)) drop-shadow(0 0 28px rgba(255,193,7,0.32))",
  },
  {
    src: HERO_ASSETS.tiktok,
    alt: "TikTok",
    x: -105,
    y: -52,
    size: 92,
    glow:
      "drop-shadow(0 10px 20px rgba(0,0,0,0.45)) drop-shadow(0 0 12px rgba(0,242,234,0.38)) drop-shadow(0 0 24px rgba(255,45,85,0.28))",
  },
  {
    src: HERO_ASSETS.instagram,
    alt: "Instagram",
    x: -98,
    y: 95,
    size: 88,
    glow:
      "drop-shadow(0 10px 20px rgba(0,0,0,0.4)) drop-shadow(0 0 14px rgba(236,72,153,0.48)) drop-shadow(0 0 26px rgba(249,115,22,0.32))",
  },
  {
    src: HERO_ASSETS.telegram,
    alt: "Telegram",
    x: -104,
    y: 242,
    size: 86,
    glow:
      "drop-shadow(0 10px 20px rgba(0,0,0,0.4)) drop-shadow(0 0 14px rgba(34,158,255,0.52)) drop-shadow(0 0 28px rgba(56,189,248,0.36))",
  },
] as const;

/** Positions verticales desktop — colonne compacte entre texte et téléphone */
const DESKTOP_Y: Record<(typeof SOCIAL_POSITIONS)[number]["alt"], number> = {
  Snapchat: -118,
  TikTok: -32,
  Instagram: 54,
  Telegram: 140,
};

/** Décalage horizontal desktop — colonne d'icônes à droite du bloc texte */
const DESKTOP_SHIFT_X = -135;

export function HeroSocialIcons() {
  return (
    <>
      {SOCIAL_POSITIONS.map((icon, i) => (
        <div
          key={icon.alt}
          className="absolute z-[35] hidden lg:block"
          style={{
            left: `calc(50% + ${icon.x + DESKTOP_SHIFT_X}px)`,
            top: `calc(50% + ${DESKTOP_Y[icon.alt]}px)`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div
            className="animate-float"
            style={{ animationDelay: `${i * 0.6}s`, animationDuration: "5.5s" }}
          >
            <Image
              src={icon.src}
              alt={icon.alt}
              width={icon.size}
              height={icon.size}
              className="object-contain"
              style={{
                width: icon.size,
                height: icon.size,
                filter: icon.glow,
              }}
            />
          </div>
        </div>
      ))}

      {SOCIAL_POSITIONS.slice(0, 3).map((icon, i) => (
        <div
          key={`m-${icon.alt}`}
          className="absolute z-[35] lg:hidden"
          style={{
            left: `calc(50% + ${Math.round(icon.x * 0.55)}px)`,
            top: `calc(50% + ${Math.round(icon.y * 0.55)}px)`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div
            className="animate-float"
            style={{ animationDelay: `${i * 0.6}s`, animationDuration: "5.5s" }}
          >
            <Image
              src={icon.src}
              alt={icon.alt}
              width={64}
              height={64}
              className="h-16 w-16 object-contain"
              style={{
                filter: icon.glow,
              }}
            />
          </div>
        </div>
      ))}
    </>
  );
}

export function WhatsAppHeroNotification({ className = "" }: { className?: string }) {
  return (
    <div
      className={`w-[250px] rounded-2xl border border-green-500/40 bg-[#071209]/95 p-4 backdrop-blur-sm ${className}`}
      style={{
        boxShadow:
          "0 12px 40px -8px rgba(34,197,94,0.5), 0 0 40px -10px rgba(34,197,94,0.3), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-start gap-3">
        <Image
          src={HERO_ASSETS.whatsapp}
          alt=""
          width={44}
          height={44}
          className="h-11 w-11 shrink-0 object-contain"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-green-300">WhatsApp</p>
          <p className="mt-0.5 text-xs leading-snug text-zinc-300">
            Nouvelle commande — Sneakers
          </p>
          <p className="text-base font-extrabold text-white">89 €</p>
        </div>
        <button
          type="button"
          className="shrink-0 text-zinc-500"
          aria-label="Fermer"
          tabIndex={-1}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
