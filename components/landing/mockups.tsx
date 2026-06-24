import Image from "next/image";
import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  MessageCircle,
  Package,
  ShoppingBag,
  Store,
  Users,
  Zap,
} from "lucide-react";

export const HERO_ASSETS = {
  heroPhoneMockup: "/landing/hero/catalink-phone-mockup.png",
  iphone: "/landing/hero/iphone-17-pro.png",
  snapchat: "/landing/hero/snapchat-3d.png",
  tiktok: "/landing/hero/tiktok-3d.png",
  instagram: "/landing/hero/instagram-3d.png",
  telegram: "/landing/hero/telegram-3d.png",
  whatsapp: "/landing/hero/whatsapp-3d.png",
  whatsappBanner: "/hero/bandeauwhatsapp-clean.png",
} as const;

/** Mockup PNG hero — remplace l’ancien iPhone CSS/JSX */
export function HeroPhoneMockup() {
  return (
    <div className="relative z-20 w-[240px] -translate-x-10 sm:w-[270px] lg:w-[305px] xl:w-[340px] 2xl:w-[380px]">
      <Image
        src={HERO_ASSETS.heroPhoneMockup}
        alt="Aperçu boutique Maboutique sur iPhone"
        width={720}
        height={1290}
        priority
        unoptimized
        className="h-auto w-full object-contain drop-shadow-2xl"
      />
    </div>
  );
}

/** Bandeau WhatsApp hero — image PNG prête */
export function HeroWhatsAppBanner({ className = "" }: { className?: string }) {
  return (
    <div className={`w-[200px] sm:w-[230px] lg:w-[260px] xl:w-[280px] ${className}`}>
      <Image
        src={HERO_ASSETS.whatsappBanner}
        alt="Nouvelle commande WhatsApp"
        width={774}
        height={270}
        priority
        unoptimized
        className="h-auto w-full object-contain drop-shadow-2xl"
      />
    </div>
  );
}

/** Calibré sur /landing/hero/iphone-17-pro.png — écran noir opaque, contenu par-dessus */
export const IPHONE_SCREEN_INSETS = {
  top: "4.1%",
  left: "6.2%",
  right: "6.2%",
  bottom: "3.4%",
  borderRadius: "11%",
} as const;

const SCREEN_INSETS = IPHONE_SCREEN_INSETS;

const HERO_PRODUCTS = [
  {
    name: "Maillot France",
    price: "45 €",
    image: "/landing/hero/maillot-france.png",
  },
  {
    name: "Sneakers",
    price: "89 €",
    image: "/landing/hero/sneakers.png",
  },
  {
    name: "Lunettes de soleil",
    price: "35 €",
    image: "/landing/hero/lunettes.png",
  },
  {
    name: "Parfum",
    price: "59 €",
    image: "/landing/hero/parfum.png",
  },
];

const CATEGORIES = ["Tous", "Hauts", "Bas", "Accessoires"];

/** Produits hero — réutilisé par la section demo (compact) */
export const STORE_PRODUCTS = HERO_PRODUCTS;

const SIZE_MAP = {
  default: "w-[min(100%,300px)] sm:w-[320px]",
  compact: "w-[min(100%,260px)] sm:w-[280px]",
} as const;

export function HeroStoreScreen({
  dense = false,
  crispImages = false,
  largeProducts = false,
  storeName = "Urban Select",
  storeSlug = "urban-select",
}: {
  dense?: boolean;
  crispImages?: boolean;
  largeProducts?: boolean;
  storeName?: string;
  storeSlug?: string;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#080a12]">
      <div
        className="shrink-0 px-2.5 pb-2 pt-7 text-center sm:px-3 sm:pt-8"
        style={{ background: "linear-gradient(135deg,#141824,#0a0d14)" }}
      >
        <p className="mb-0.5 font-mono text-[6px] text-indigo-300/60 sm:text-[7px]">
          catalink.app/{storeSlug}
        </p>
        <p className={`font-bold text-white ${dense ? "text-[11px]" : "text-xs sm:text-sm"}`}>
          {storeName}
        </p>
        <p className="mt-0.5 text-[7px] text-zinc-400 sm:text-[8px]">
          Mode · Streetwear · Accessoires
        </p>
      </div>

      <div className="shrink-0 flex gap-1 overflow-x-auto px-2 py-1.5 scrollbar-none sm:px-2.5">
        {CATEGORIES.map((cat, i) => (
          <span
            key={cat}
            className="shrink-0 rounded-full px-2 py-0.5 text-[7px] font-semibold sm:text-[8px]"
            style={
              i === 0
                ? { background: "rgba(99,102,241,0.2)", color: "#c4b5fd" }
                : { color: "#71717a" }
            }
          >
            {cat}
          </span>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden px-2 pb-1 sm:px-2.5">
        <div className="grid h-full grid-cols-2 gap-1.5 sm:gap-2">
          {HERO_PRODUCTS.map((p) => (
            <div
              key={p.name}
              className={`flex min-h-0 flex-col overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.03] ${
                largeProducts ? "p-1" : "p-1 sm:p-1.5"
              }`}
            >
              <div
                className={`relative flex min-h-0 items-center justify-center overflow-hidden rounded-md ${
                  largeProducts ? "flex-[0_0_70%] basis-[70%]" : "h-[52px] shrink-0 sm:h-[58px]"
                }`}
                style={{ background: "linear-gradient(180deg, #0e1018 0%, #080a12 100%)" }}
              >
                <Image
                  src={p.image}
                  alt={p.name}
                  width={largeProducts ? 120 : 72}
                  height={largeProducts ? 120 : 72}
                  sizes={largeProducts ? "120px" : "72px"}
                  quality={100}
                  unoptimized={crispImages}
                  className="max-h-[92%] max-w-[92%] object-contain"
                />
              </div>
              <div
                className={`flex min-h-0 flex-1 flex-col justify-center ${
                  largeProducts ? "px-0.5 py-0.5" : "px-0.5 py-1 sm:px-1 sm:py-1.5"
                }`}
              >
                <p
                  className={`truncate font-semibold leading-tight text-zinc-200 ${
                    largeProducts ? "text-[8px] sm:text-[9px]" : "text-[7px] sm:text-[8px]"
                  }`}
                >
                  {p.name}
                </p>
                <p
                  className={`font-bold text-violet-300 ${
                    largeProducts ? "text-[9px] sm:text-[10px]" : "text-[8px] sm:text-[9px]"
                  }`}
                >
                  {p.price}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="shrink-0 px-2 pb-2.5 pt-1 sm:px-2.5 sm:pb-3">
        <div
          className="flex w-full items-center justify-center gap-1 rounded-full py-1.5 text-[7px] font-bold text-white sm:gap-1.5 sm:py-2 sm:text-[8px]"
          style={{
            background: "linear-gradient(to right,#22c55e,#16a34a)",
            boxShadow: "0 4px 16px rgba(34,197,94,0.3)",
          }}
        >
          <Image
            src={HERO_ASSETS.whatsapp}
            alt=""
            width={14}
            height={14}
            className="h-3 w-3 shrink-0 object-contain sm:h-3.5 sm:w-3.5"
            aria-hidden
          />
          Commander sur WhatsApp
        </div>
        <p className="mt-1.5 text-center text-[6px] text-zinc-500 sm:text-[7px]">
          Paiement à la livraison ou en main propre
        </p>
      </div>
    </div>
  );
}

type PhoneStoreMockProps = {
  size?: keyof typeof SIZE_MAP;
  showWhatsApp?: boolean;
  className?: string;
  storeName?: string;
  storeSlug?: string;
};

export function PhoneStoreMock({
  size = "default",
  showWhatsApp = true,
  className = "",
  storeName,
  storeSlug,
}: PhoneStoreMockProps) {
  const dense = size === "compact";

  return (
    <div className={`relative ${className}`}>
      <div className={`relative mx-auto ${SIZE_MAP[size]}`}>
        {showWhatsApp && (
          <div
            className="absolute -right-2 top-[12%] z-[5] max-w-[150px] scale-90 rounded-xl border border-green-500/20 bg-[#0a1410]/90 p-2 opacity-90 shadow-md backdrop-blur-sm"
            style={{ boxShadow: "0 6px 24px -10px rgba(34,197,94,0.3)" }}
          >
            <div className="flex items-start gap-1.5">
              <Image src={HERO_ASSETS.whatsapp} alt="" width={20} height={20} className="h-5 w-5" />
              <div className="min-w-0">
                <p className="text-[8px] font-semibold text-green-300">WhatsApp</p>
                <p className="mt-0.5 text-[7px] leading-snug text-zinc-500">Sneakers · 89 €</p>
              </div>
            </div>
          </div>
        )}

        <div className={`relative animate-float`}>
          <Image
            src={HERO_ASSETS.iphone}
            alt=""
            width={560}
            height={1140}
            className="relative block h-auto w-full select-none pointer-events-none"
            aria-hidden
          />
          <div
            className="absolute overflow-hidden"
            style={{
              top: SCREEN_INSETS.top,
              left: SCREEN_INSETS.left,
              right: SCREEN_INSETS.right,
              bottom: SCREEN_INSETS.bottom,
              borderRadius: SCREEN_INSETS.borderRadius,
            }}
          >
            <HeroStoreScreen dense={dense} storeName={storeName} storeSlug={storeSlug} />
          </div>
        </div>
      </div>
    </div>
  );
}

type DashboardPreviewProps = {
  variant?: "hero" | "full";
  className?: string;
};

export function DashboardPreviewMock({ variant = "full", className = "" }: DashboardPreviewProps) {
  const orders = [
    { id: "#1042", product: "Maillot France × 1", status: "Nouveau", amount: "45 €" },
    { id: "#1041", product: "Sneakers × 1", status: "Confirmé", amount: "89 €" },
    { id: "#1040", product: "Parfum × 1", status: "Livré", amount: "59 €" },
  ];

  if (variant === "hero") {
    const navItems = [
      { label: "Vue d'ensemble", icon: LayoutDashboard, active: true },
      { label: "Commandes", icon: ClipboardList, active: false },
      { label: "Produits", icon: Package, active: false },
      { label: "Clients", icon: Users, active: false },
    ];

    const kpis = [
      { label: "Commandes", value: "128", delta: "+12%" },
      { label: "Chiffre d'affaires", value: "4 820 €", delta: "+18%" },
      { label: "Nouveaux clients", value: "64", delta: "+8%" },
      { label: "Panier moyen", value: "72 €", delta: "+5%" },
    ];

    const linePoints = [28, 42, 38, 55, 48, 72, 65];

    return (
      <div
        className={`overflow-hidden rounded-2xl border ${className}`}
        style={{
          background: "#06080f",
          borderColor: "rgba(99,102,241,0.28)",
          boxShadow:
            "0 0 0 1px rgba(99,102,241,0.1), 0 40px 100px -24px rgba(0,0,0,0.85), 0 0 100px -30px rgba(79,70,229,0.4)",
        }}
      >
        <div
          className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5"
          style={{ background: "#04060c" }}
        >
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
          </div>
          <span className="font-mono text-[10px] text-zinc-500">catalink.app/dashboard</span>
          <div className="w-10" />
        </div>

        <div className="grid grid-cols-[148px_1fr]">
          <div className="border-r border-white/[0.06] p-3" style={{ background: "#05070e" }}>
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-white/[0.06] p-2">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
              >
                C
              </div>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-bold text-zinc-200">Catalink</p>
                <p className="truncate text-[8px] text-zinc-500">Tableau de bord</p>
              </div>
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="mb-0.5 flex items-center gap-2 rounded-lg px-2.5 py-2 text-[10px]"
                  style={
                    item.active
                      ? { background: "rgba(99,102,241,0.15)", color: "#a5b4fc", fontWeight: 600 }
                      : { color: "#71717a" }
                  }
                >
                  <Icon size={12} />
                  <span className="truncate">{item.label}</span>
                </div>
              );
            })}
          </div>

          <div className="p-4">
            <div className="mb-3">
              <p className="text-sm font-extrabold tracking-tight">Tableau de bord</p>
              <p className="text-[9px] text-zinc-500">7 derniers jours</p>
            </div>

            <div className="mb-3 grid grid-cols-4 gap-2">
              {kpis.map((k) => (
                <div
                  key={k.label}
                  className="rounded-lg border border-white/[0.06] p-2"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                >
                  <p className="text-[7px] uppercase tracking-wider text-zinc-500">{k.label}</p>
                  <p className="mt-0.5 text-[11px] font-bold text-zinc-100">{k.value}</p>
                  <p className="text-[8px] font-semibold text-green-400">{k.delta}</p>
                </div>
              ))}
            </div>

            <div
              className="mb-3 rounded-lg border border-white/[0.06] p-3"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[9px] font-semibold text-zinc-400">Activité</span>
                <BarChart3 size={11} className="text-violet-400" />
              </div>
              <svg viewBox="0 0 280 56" className="h-14 w-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="heroLineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(124,58,237,0.35)" />
                    <stop offset="100%" stopColor="rgba(124,58,237,0)" />
                  </linearGradient>
                </defs>
                <path
                  d={`M0,${56 - linePoints[0]} ${linePoints.map((p, i) => `L${(i / (linePoints.length - 1)) * 280},${56 - p}`).join(" ")} L280,56 L0,56 Z`}
                  fill="url(#heroLineGrad)"
                />
                <polyline
                  points={linePoints
                    .map((p, i) => `${(i / (linePoints.length - 1)) * 280},${56 - p}`)
                    .join(" ")}
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <p className="mb-2 text-[9px] font-semibold uppercase tracking-wider text-zinc-500">
              Dernières commandes
            </p>
            <div className="space-y-1.5">
              {orders.map((o, i) => (
                <div
                  key={o.id}
                  className="flex items-center gap-2 rounded-lg border border-white/[0.05] px-2.5 py-2 text-[9px]"
                  style={{ background: "rgba(255,255,255,0.03)" }}
                >
                  <div
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white"
                    style={{
                      background: `linear-gradient(135deg, hsl(${240 + i * 30},60%,55%), hsl(${260 + i * 30},60%,45%))`,
                    }}
                  >
                    {["ML", "SN", "PR"][i]}
                  </div>
                  <span className="min-w-0 flex-1 truncate text-zinc-400">{o.product}</span>
                  <span
                    className="shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-semibold"
                    style={
                      o.status === "Nouveau"
                        ? { background: "rgba(99,102,241,0.15)", color: "#a5b4fc" }
                        : o.status === "Confirmé"
                          ? { background: "rgba(245,158,11,0.12)", color: "#fcd34d" }
                          : { background: "rgba(34,197,94,0.12)", color: "#86efac" }
                    }
                  >
                    {o.status}
                  </span>
                  <span className="shrink-0 font-semibold text-zinc-300">{o.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { label: "Vue d'ensemble", icon: LayoutDashboard, active: false },
    { label: "Commandes", icon: ClipboardList, active: true },
    { label: "Produits", icon: Package, active: false },
    { label: "Clients", icon: Users, active: false },
    { label: "Hub Social", icon: Zap, active: false },
  ];

  return (
    <div
      className={`overflow-hidden rounded-2xl border ${className}`}
      style={{
        background: "#06080f",
        borderColor: "rgba(99,102,241,0.25)",
        boxShadow:
          "0 0 0 1px rgba(99,102,241,0.08), 0 40px 100px -20px rgba(0,0,0,0.8), 0 0 80px -20px rgba(79,70,229,0.35)",
      }}
    >
      <div
        className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3"
        style={{ background: "#04060c" }}
      >
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-red-500" />
          <span className="h-3 w-3 rounded-full bg-yellow-500" />
          <span className="h-3 w-3 rounded-full bg-green-500" />
        </div>
        <span className="font-mono text-xs text-[var(--muted)]">catalink.app/dashboard</span>
        <div className="w-16" />
      </div>

      <div className="grid md:grid-cols-[200px_1fr]">
        <div
          className="hidden border-r border-white/[0.06] p-4 md:block"
          style={{ background: "#05070e" }}
        >
          <p className="mb-3 px-2 text-[10px] uppercase tracking-widest text-zinc-600">
            Navigation
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="mb-1 flex cursor-default items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs"
                style={
                  item.active
                    ? { background: "rgba(99,102,241,0.15)", color: "#a5b4fc", fontWeight: 600 }
                    : { color: "#71717a" }
                }
              >
                <Icon size={14} />
                {item.label}
              </div>
            );
          })}
        </div>

        <div className="p-5 sm:p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-lg font-extrabold tracking-tight">Commandes</p>
              <p className="text-xs text-zinc-500">Centralise tes ventes WhatsApp</p>
            </div>
            <div className="flex gap-2">
              {["Toutes", "Nouvelles", "Confirmées"].map((tab, i) => (
                <span
                  key={tab}
                  className="rounded-lg px-2.5 py-1 text-[10px] font-semibold"
                  style={
                    i === 1
                      ? { background: "rgba(99,102,241,0.15)", color: "#a5b4fc" }
                      : { color: "#71717a" }
                  }
                >
                  {tab}
                </span>
              ))}
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
            {[
              { label: "Commandes", icon: ShoppingBag },
              { label: "Produits actifs", icon: Package },
              { label: "Clients", icon: Users },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="rounded-xl border border-white/[0.06] p-3 sm:p-4"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                      {s.label}
                    </span>
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-lg"
                      style={{ background: "rgba(99,102,241,0.12)" }}
                    >
                      <Icon size={14} className="text-indigo-400" />
                    </div>
                  </div>
                  <div className="h-7 w-16 rounded-md bg-white/[0.06]" />
                </div>
              );
            })}
          </div>

          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Dernières commandes
          </p>
          <div className="space-y-2">
            {orders.map((o) => (
              <div
                key={o.id}
                className="flex items-center gap-3 rounded-xl border border-white/[0.05] px-4 py-3 text-xs"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                <span className="w-12 shrink-0 font-mono font-semibold text-[var(--brand-light)]">
                  {o.id}
                </span>
                <span className="min-w-0 flex-1 truncate text-zinc-400">{o.product}</span>
                <span
                  className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold"
                  style={
                    o.status === "Nouveau"
                      ? { background: "rgba(99,102,241,0.15)", color: "#a5b4fc" }
                      : o.status === "Confirmé"
                        ? { background: "rgba(245,158,11,0.12)", color: "#fcd34d" }
                        : { background: "rgba(34,197,94,0.12)", color: "#86efac" }
                  }
                >
                  {o.status}
                </span>
                <span className="w-12 shrink-0 text-right font-semibold text-zinc-200">
                  {o.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SolutionFlowStrip() {
  const steps = [
    { label: "Boutique publique", icon: Store },
    { label: "Panier client", icon: ShoppingBag },
    { label: "WhatsApp", icon: MessageCircle },
    { label: "Dashboard", icon: BarChart3 },
    { label: "Suivi client", icon: Users },
  ];

  return (
    <div className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
      {steps.map((step, i) => {
        const Icon = step.icon;
        return (
          <div key={step.label} className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-200 sm:px-4 sm:py-2.5 sm:text-sm"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              <Icon size={16} className="text-violet-300" />
              {step.label}
            </div>
            {i < steps.length - 1 && (
              <span className="hidden text-violet-400/60 sm:inline">→</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
