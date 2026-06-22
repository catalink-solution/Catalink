import Image from "next/image";
import { FAQ } from "@/components/FAQ";
import {
  Link2,
  LayoutGrid,
  Bell,
  Zap,
  Smartphone,
  BarChart3,
  ArrowRight,
  ShoppingBag,
  Package,
  Users,
  TrendingUp,
  CheckCircle2,
  Store,
  Share2,
  ClipboardList,
} from "lucide-react";

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 h-16 border-b border-white/[0.06]"
      style={{ background: "rgba(3,7,18,0.88)", backdropFilter: "blur(20px)" }}
    >
      <div className="flex items-center">
        <Image
          src="/catalink-logo-v4.png"
          alt="Catalink"
          width={70}
          height={24}
          className="object-contain"
          style={{ height: "auto" }}
          priority
        />
      </div>
      <div className="hidden md:flex items-center gap-8">
        <a href="#fonctionnement" className="text-sm text-[var(--muted)] hover:text-white transition-colors">
          Comment ça marche
        </a>
        <a href="#fonctionnalites" className="text-sm text-[var(--muted)] hover:text-white transition-colors">
          Fonctionnalités
        </a>
        <a href="#tarifs" className="text-sm text-[var(--muted)] hover:text-white transition-colors">
          Tarifs
        </a>
      </div>
      <div className="flex items-center gap-3">
        <a
          href="/login"
          className="hidden text-sm text-[var(--muted)] transition-colors hover:text-white sm:block"
        >
          Connexion
        </a>
        <a href="/waitlist" className="cta-primary text-sm">
          Demander un accès
        </a>
      </div>
    </nav>
  );
}

// ─── Phone Mock ───────────────────────────────────────────────────────────────
function PhoneMock() {
  const products = [
    { name: "T-shirt Premium", price: "60€", color: "from-violet-500/20 to-blue-500/20", icon: <ShoppingBag size={28} className="text-violet-300" /> },
    { name: "Sneakers Urban", price: "160€", color: "from-blue-500/20 to-cyan-500/20", icon: <Zap size={28} className="text-blue-300" /> },
    { name: "Lunettes Vintage", price: "100€", color: "from-indigo-500/20 to-violet-500/20", icon: <Store size={28} className="text-indigo-300" /> },
    { name: "Sac Messenger", price: "250€", color: "from-cyan-500/20 to-blue-500/20", icon: <Package size={28} className="text-cyan-300" /> },
  ];

  return (
    <div className="flex justify-center mt-10 mb-8">
      <div
        className="relative w-[290px] rounded-[3rem] border border-white/15 bg-black p-2.5 animate-float"
        style={{ boxShadow: "0 30px 100px -30px rgba(99,102,241,0.65), 0 0 0 1px rgba(255,255,255,0.05)" }}
      >
        {/* Notch */}
        <div className="absolute top-3.5 left-1/2 z-20 h-5 w-20 -translate-x-1/2 rounded-full bg-black" />

        <div
          className="h-full w-full overflow-hidden rounded-[2.4rem] border border-white/10"
          style={{ background: "#0b1020" }}
        >
          {/* Store header */}
          <div className="px-4 pt-10 pb-4 text-center" style={{ background: "linear-gradient(135deg,#1a1f3a,#101827)" }}>
            <p className="font-mono text-[9px] mb-1.5 text-indigo-300/70">catalink.app/taboutique</p>
            <p className="font-bold text-base text-white mb-0.5">TaBoutique</p>
            <p className="text-[10px] text-zinc-400">Mode • Sneakers • Accessoires</p>
          </div>

          {/* Products grid */}
          <div className="grid grid-cols-2 gap-2.5 p-3">
            {products.map((p) => (
              <div
                key={p.name}
                className="rounded-2xl border border-white/10 p-3 text-center"
                style={{ background: "rgba(255,255,255,0.04)" }}
              >
                <div
                  className={`mx-auto mb-2 h-14 w-14 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center border border-white/10`}
                >
                  {p.icon}
                </div>
                <div className="text-[9px] text-zinc-300 font-semibold mb-1 leading-tight">{p.name}</div>
                <div className="text-[11px] font-bold text-indigo-300">{p.price}</div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="px-3 pb-4">
            <button
              className="w-full rounded-full py-2.5 text-[10px] font-bold text-white"
              style={{ background: "linear-gradient(to right,#3b82f6,#7c3aed)", boxShadow: "0 4px 20px rgba(99,102,241,0.3)" }}
            >
              Commander →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      <div className="landing-grid absolute inset-0 z-0" />
      <div className="landing-glow absolute inset-0 z-0" />
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center pt-20 pb-24">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 mb-8 text-xs font-semibold tracking-widest uppercase text-[var(--brand-light)]"
            style={{ borderColor: "rgba(99,102,241,.35)", background: "rgba(99,102,241,.08)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-accent)] animate-pulse inline-block" />
            Bêta privée ouverte
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-6xl font-extrabold leading-[1.08] tracking-tight mb-6">
            CRÉE TON CATALOGUE.<br />
            PARTAGE TON LIEN.<br />
            <span className="gradient-text">NE PERDS PLUS JAMAIS<br />UNE COMMANDE.</span>
          </h1>

          {/* Sub */}
          <p className="text-lg md:text-xl text-[var(--muted)] max-w-xl mx-auto mb-10 leading-relaxed">
            Transforme tes stories Snapchat, TikTok et Telegram en une boutique
            professionnelle accessible depuis un simple lien.
          </p>

          {/* CTAs */}
          <div className="flex items-center justify-center gap-3 flex-wrap mb-16">
            <a href="/waitlist" className="cta-primary">
              Demander un accès
            </a>
            <a href="#fonctionnement" className="cta-secondary">
              Voir comment ça marche
            </a>
          </div>

          <PhoneMock />
        </div>
      </div>
    </section>
  );
}

// ─── Trust Bar ────────────────────────────────────────────────────────────────
function TrustBar() {
  const platforms = [
    { name: "Snapchat", icon: "/platforms/snapchat.png" },
    { name: "TikTok", icon: "/platforms/tiktok.png" },
    { name: "Telegram", icon: "/platforms/telegram.png" },
    { name: "Instagram", icon: "/platforms/instagram.png" },
  ];

  return (
    <div className="border-t border-[var(--surface-border)] py-8 text-center">
      <p className="text-xs text-[var(--muted)] uppercase tracking-widest mb-6">
        Compatible avec tes plateformes préférées
      </p>

      <div className="flex items-center justify-center gap-10">
  {platforms.map((platform) => (
    <div key={platform.name}>
      <Image
        src={platform.icon}
        alt={platform.name}
        width={140}
        height={140}
        className="object-contain drop-shadow-[0_0_25px_rgba(99,102,241,0.35)]"
      />
    </div>
  ))}
</div>
    </div>
  );
}

// ─── Problem / Solution ───────────────────────────────────────────────────────
function ProblemSolution() {
  return (
    <section id="probleme" className="py-24">
      <div className="container mx-auto px-6">
        <p className="text-xs font-bold tracking-widest uppercase text-[var(--brand-accent)] mb-3">Le problème</p>
        <h2 className="text-4xl font-extrabold tracking-tight mb-4 leading-tight">
          Tu perds des commandes<br />chaque jour. Stop.
        </h2>
        <p className="text-[var(--muted)] max-w-lg mb-12 leading-relaxed">
          Les vendeurs sur les réseaux sociaux jonglent avec des dizaines de messages, des
          screenshots, et des tableaux Excel. C&apos;est chronophage et non professionnel.
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl p-8 border" style={{ background: "rgba(220,38,38,.05)", borderColor: "rgba(220,38,38,.15)" }}>
          <h3 className="font-bold text-red-400 mb-6 flex items-center gap-4 text-xl">
  <Image
    src="/icons/cross-3d.png"
    alt="Sans Catalink"
    width={70}
    height={70}
    className="object-contain drop-shadow-[0_0_18px_rgba(239,68,68,0.55)]"
  />
  Sans Catalink
</h3>
            <div className="space-y-2 text-sm text-[var(--muted)]">
              {["Story Snapchat / TikTok / Telegram", "Avalanche de messages privés", "Captures d'écran pour tout noter", "Doublons, oublis, erreurs"].map((s, i) => (
                <div key={i}>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                    {s}
                  </div>
                  {i < 3 && <div className="text-zinc-700 ml-5 text-xs">↓</div>}
                </div>
              ))}
              <div className="flex items-center gap-3 mt-3 p-3 rounded-lg font-semibold text-red-400" style={{ background: "rgba(220,38,38,.1)" }}>
                <TrendingUp size={16} className="rotate-180 flex-shrink-0" />
                Commandes perdues. Clients insatisfaits.
              </div>
            </div>
          </div>
          <div className="rounded-2xl p-8 border" style={{ background: "rgba(59,130,246,.05)", borderColor: "rgba(99,102,241,.25)" }}>
          <h3 className="font-bold text-green-400 mb-6 flex items-center gap-4 text-xl">
  <Image
    src="/icons/check-3d.png"
    alt="Avec Catalink"
    width={70}
    height={70}
    className="object-contain drop-shadow-[0_0_18px_rgba(34,197,94,0.55)]"
  />
  Avec Catalink
</h3>
            <div className="space-y-2 text-sm text-[var(--muted)]">
              {["Story Snapchat / TikTok / Telegram", "Lien Catalink dans ta bio", "Catalogue professionnel en ligne", "Commandes centralisées dans ton dashboard"].map((s, i) => (
                <div key={i}>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                    {s}
                  </div>
                  {i < 3 && <div className="text-zinc-700 ml-5 text-xs">↓</div>}
                </div>
              ))}
              <div className="flex items-center gap-3 mt-3 p-3 rounded-lg font-semibold text-green-400" style={{ background: "rgba(34,197,94,.08)" }}>
                <TrendingUp size={16} className="flex-shrink-0" />
                Plus de ventes. Zéro commande perdue.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── How It Works — 3 cartes reliées par flèches lumineuses ──────────────────
function HowItWorks() {
  const steps = [
    {
      num: "01",
      icon: <Share2 size={32} className="text-violet-300" />,
      iconBg: "from-violet-600/20 to-violet-800/10",
      iconBorder: "rgba(139,92,246,0.3)",
      title: "Story Snapchat",
      desc: "Tu postes ta story ou tu partages ton lien dans ta bio. Tes abonnés voient ton catalogue.",
      glow: "rgba(139,92,246,0.15)",
    },
    {
      num: "02",
      icon: <LayoutGrid size={32} className="text-blue-300" />,
      iconBg: "from-blue-600/20 to-indigo-800/10",
      iconBorder: "rgba(99,102,241,0.3)",
      title: "Catalogue Catalink",
      desc: "Ils arrivent sur ta boutique pro. Ils voient tes produits, les prix, et passent commande.",
      glow: "rgba(99,102,241,0.15)",
    },
    {
      num: "03",
      icon: <ClipboardList size={32} className="text-cyan-300" />,
      iconBg: "from-cyan-600/20 to-blue-800/10",
      iconBorder: "rgba(6,182,212,0.3)",
      title: "Commande reçue",
      desc: "La commande arrive directement dans ton dashboard. Centralisée. Traçable. Jamais perdue.",
      glow: "rgba(6,182,212,0.15)",
    },
  ];

  return (
    <section
      id="fonctionnement"
      className="py-24 border-t border-b border-[var(--surface-border)]"
      style={{ background: "rgba(255,255,255,0.012)" }}
    >
      <div className="container mx-auto px-6">
        <p className="text-xs font-bold tracking-widest uppercase text-[var(--brand-accent)] mb-3">
          Comment ça marche
        </p>
        <h2 className="text-4xl font-extrabold tracking-tight mb-4 leading-tight">
          Lancé en 3 étapes.<br />En moins de 10 minutes.
        </h2>
        <p className="text-[var(--muted)] max-w-lg mb-14 leading-relaxed">
          Aucune configuration technique. Tu crées, tu partages, tu reçois.
        </p>

        {/* Cards + arrows */}
        <div className="flex flex-col md:flex-row items-stretch gap-0">
          {steps.map((s, i) => (
            <div key={s.num} className="flex flex-col md:flex-row items-center flex-1">
              {/* Card */}
              <div
                className="relative flex-1 rounded-2xl p-8 border w-full"
                style={{
                  background: `radial-gradient(ellipse 80% 60% at 30% 20%, ${s.glow}, transparent 70%), rgba(255,255,255,0.03)`,
                  borderColor: s.iconBorder,
                  boxShadow: `0 0 40px -15px ${s.glow}`,
                }}
              >
                {/* Step num */}
                <div
                  className="text-[10px] font-black tracking-widest uppercase mb-5 inline-block px-2 py-0.5 rounded"
                  style={{ background: "rgba(99,102,241,.12)", color: "rgba(165,180,252,.7)" }}
                >
                  Étape {s.num}
                </div>
                {/* Icon */}
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${s.iconBg} flex items-center justify-center mb-5 border`}
                  style={{ borderColor: s.iconBorder }}
                >
                  {s.icon}
                </div>
                <h3 className="font-bold text-lg text-white mb-3">{s.title}</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">{s.desc}</p>
              </div>

              {/* Arrow between cards */}
              {i < steps.length - 1 && (
                <div className="flex items-center justify-center py-4 md:py-0 md:px-3 flex-shrink-0">
                  <div className="relative flex items-center">
                    {/* Glow line */}
                    <div
                      className="hidden md:block w-8 h-px"
                      style={{ background: "linear-gradient(to right, rgba(99,102,241,0.5), rgba(139,92,246,0.8))" }}
                    />
                    <div
                      className="md:hidden h-8 w-px"
                      style={{ background: "linear-gradient(to bottom, rgba(99,102,241,0.5), rgba(139,92,246,0.8))" }}
                    />
                    <ArrowRight
                      size={22}
                      className="hidden md:block text-violet-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.8)] flex-shrink-0"
                    />
                    <ArrowRight
                      size={22}
                      className="md:hidden rotate-90 text-violet-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.8)] flex-shrink-0"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────
function Features() {
  const feats = [
    { icon: <Link2 size={22} className="text-blue-300" />, title: "Lien unique personnalisé", desc: "Une URL propre à ton nom. Facile à mémoriser, facile à partager. catalink.app/tonnom" },
    { icon: <LayoutGrid size={22} className="text-violet-300" />, title: "Catalogue pro en ligne", desc: "Un vrai catalogue avec photos, prix et descriptions. Tes clients commandent en toute confiance." },
    { icon: <BarChart3 size={22} className="text-indigo-300" />, title: "Dashboard vendeur", desc: "Toutes tes commandes, clients et statistiques au même endroit. Géré depuis ton téléphone." },
    { icon: <Bell size={22} className="text-cyan-300" />, title: "Notifications en temps réel", desc: "Une commande arrive ? Tu es alerté instantanément. Jamais de commande ratée." },
    { icon: <Smartphone size={22} className="text-blue-300" />, title: "Optimisé mobile", desc: "Ton catalogue et ton dashboard fonctionnent parfaitement sur smartphone. 100% responsive." },
    { icon: <Zap size={22} className="text-violet-300" />, title: "Déploiement immédiat", desc: "Pas de dev, pas de technique. Tu crées ton catalogue en moins de 10 minutes, chrono en main." },
  ];
  return (
    <section id="fonctionnalites" className="py-24">
      <div className="container mx-auto px-6">
        <p className="text-xs font-bold tracking-widest uppercase text-[var(--brand-accent)] mb-3">
          Fonctionnalités
        </p>
        <h2 className="text-4xl font-extrabold tracking-tight mb-10 leading-tight">
          Tout ce dont tu as besoin.<br />Rien de superflu.
        </h2>
        <div className="grid md:grid-cols-3 gap-5">
          {feats.map((f) => (
            <div
              key={f.title}
              className="gradient-border rounded-2xl p-7 hover:-translate-y-1 transition-all"
              style={{ background: "var(--surface)" }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 border"
                style={{ background: "rgba(99,102,241,.12)", borderColor: "rgba(99,102,241,.2)" }}
              >
                {f.icon}
              </div>
              <h3 className="font-bold text-zinc-200 mb-2">{f.title}</h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Dashboard Mock — large, halo violet, nouveau titre ──────────────────────
function DashboardMock() {
  const orders = [
    { id: "#2401", product: "Air Jordan 1 Retro × 1", status: "Nouveau", statusStyle: { background: "rgba(99,102,241,.15)", color: "#a5b4fc" }, amount: "185€" },
    { id: "#2400", product: "Maillot PSG 2024 × 2", status: "Livré", statusStyle: { background: "rgba(34,197,94,.12)", color: "#86efac" }, amount: "178€" },
    { id: "#2399", product: "Lunettes Cartier × 1", status: "En cours", statusStyle: { background: "rgba(245,158,11,.12)", color: "#fcd34d" }, amount: "145€" },
    { id: "#2398", product: "Ensemble Nike TN × 1", status: "Livré", statusStyle: { background: "rgba(34,197,94,.12)", color: "#86efac" }, amount: "110€" },
  ];
  return (
    <section
      className="py-24 border-t border-b border-[var(--surface-border)]"
      style={{ background: "rgba(255,255,255,0.012)" }}
    >
      <div className="mx-auto px-6" style={{ maxWidth: "1280px" }}>
        <p className="text-xs font-bold tracking-widest uppercase text-[var(--brand-accent)] mb-3">
          Dashboard vendeur
        </p>
        <h2 className="text-4xl font-extrabold tracking-tight mb-4 leading-tight">
          Pilote ton business<br />en temps réel.
        </h2>
        <p className="text-[var(--muted)] max-w-lg mb-12 leading-relaxed">
          Visites, clics, commandes et produits les plus performants — tout s&apos;affiche dans un seul tableau de bord.
        </p>

        {/* Dashboard frame */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{
            background: "#0d0d1a",
            borderColor: "rgba(99,102,241,.25)",
            boxShadow: "0 0 0 1px rgba(99,102,241,.08), 0 40px 100px -20px rgba(0,0,0,.8), 0 0 80px -20px rgba(79,70,229,.35)",
          }}
        >
          {/* Topbar */}
          <div
            className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]"
            style={{ background: "#080814" }}
          >
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <span className="text-xs text-[var(--muted)] font-mono">catalink.app/dashboard</span>
            <div className="w-16" />
          </div>

          <div className="grid md:grid-cols-[220px_1fr]">
            {/* Sidebar */}
            <div
              className="hidden md:block border-r border-white/[0.06] p-4"
              style={{ background: "#09091a" }}
            >
              <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3 px-2">Navigation</p>
              {[
                { label: "Dashboard", icon: <BarChart3 size={14} />, active: true },
                { label: "Commandes", icon: <ClipboardList size={14} />, active: false },
                { label: "Produits", icon: <Package size={14} />, active: false },
                { label: "Clients", icon: <Users size={14} />, active: false },
                { label: "Revenus", icon: <TrendingUp size={14} />, active: false },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs mb-1 cursor-default"
                  style={item.active
                    ? { background: "rgba(99,102,241,.15)", color: "#a5b4fc", fontWeight: 600 }
                    : { color: "#71717a" }}
                >
                  {item.icon}
                  {item.label}
                </div>
              ))}
            </div>

            {/* Main content */}
            <div className="p-6">
              {/* Stats row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Commandes", val: "24", change: "+12% ce mois", icon: <ShoppingBag size={16} className="text-indigo-400" /> },
                  { label: "Produits actifs", val: "18", change: "En ligne", icon: <Package size={16} className="text-blue-400" /> },
                  { label: "Clients", val: "61", change: "+8 nouveaux", icon: <Users size={16} className="text-violet-400" /> },
                  { label: "Chiffre d'affaires", val: "3 240€", change: "+22% ce mois", icon: <TrendingUp size={16} className="text-cyan-400" /> },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl p-4 border border-white/[0.06]"
                    style={{ background: "rgba(255,255,255,.04)" }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-[10px] uppercase tracking-wider text-zinc-500">{s.label}</div>
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: "rgba(99,102,241,.12)" }}
                      >
                        {s.icon}
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-zinc-100 mb-1">{s.val}</div>
                    <div className="text-[10px] text-green-400">{s.change}</div>
                  </div>
                ))}
              </div>

              {/* Simulated sparkline bar */}
              <div className="mb-6 rounded-xl border border-white/[0.06] p-4" style={{ background: "rgba(255,255,255,.03)" }}>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-semibold text-zinc-300">Activité des 7 derniers jours</p>
                  <span className="text-[10px] text-zinc-500">Commandes</span>
                </div>
                <div className="flex items-end gap-1.5 h-16">
                  {[3, 5, 4, 8, 6, 11, 9].map((v, i) => (
                    <div key={i} className="flex-1 rounded-t" style={{
                      height: `${(v / 11) * 100}%`,
                      background: i === 5
                        ? "linear-gradient(to top, #4f46e5, #7c3aed)"
                        : "rgba(99,102,241,.25)"
                    }} />
                  ))}
                </div>
                <div className="flex justify-between mt-2">
                  {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
                    <span key={d} className="text-[9px] text-zinc-600 flex-1 text-center">{d}</span>
                  ))}
                </div>
              </div>

              {/* Orders */}
              <p className="text-xs font-semibold text-zinc-400 mb-3 uppercase tracking-wider">Dernières commandes</p>
              <div className="space-y-2">
                {orders.map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.05] text-xs"
                    style={{ background: "rgba(255,255,255,.03)" }}
                  >
                    <span className="text-[var(--brand-light)] font-semibold w-14 flex-shrink-0 font-mono">{o.id}</span>
                    <span className="flex-1 text-zinc-400">{o.product}</span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold flex-shrink-0" style={o.statusStyle}>
                      {o.status}
                    </span>
                    <span className="font-semibold text-zinc-200 w-14 text-right">{o.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Social Proof — compteurs ─────────────────────────────────────────────────
function SocialProof() {
  const stats = [
    { val: "+12 000", label: "Produits publiés", icon: <Package size={28} className="text-violet-300" /> },
    { val: "+1 500", label: "Commandes générées", icon: <ClipboardList size={28} className="text-blue-300" /> },
    { val: "+250", label: "Boutiques créées", icon: <Store size={28} className="text-cyan-300" /> },
  ];
  return (
    <section className="py-24">
      <div className="container mx-auto px-6">
        <div className="text-center mb-14">
          <p className="text-xs font-bold tracking-widest uppercase text-[var(--brand-accent)] mb-3">Chiffres</p>
          <h2 className="text-4xl font-extrabold tracking-tight leading-tight">
            Déjà adopté par les vendeurs<br />
            <span className="gradient-text">nouvelle génération.</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {stats.map((s) => (
            <div
              key={s.label}
              className="relative rounded-2xl border p-10 text-center overflow-hidden"
              style={{
                background: "rgba(99,102,241,.04)",
                borderColor: "rgba(99,102,241,.2)",
                boxShadow: "0 0 40px -15px rgba(79,70,229,.2)",
              }}
            >
              {/* Bg glow */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(ellipse 60% 50% at 50% 100%, rgba(99,102,241,.1), transparent 70%)" }}
              />
              <div
                className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center border"
                style={{ background: "rgba(99,102,241,.12)", borderColor: "rgba(99,102,241,.25)" }}
              >
                {s.icon}
              </div>
              <div
                className="text-5xl font-extrabold tracking-tight mb-2"
                style={{ background: "linear-gradient(135deg,#e0e7ff,#a5b4fc 50%,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
              >
                {s.val}
              </div>
              <div className="text-sm text-zinc-400 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────
function Pricing() {
  const plans = [
    {
      name: "Starter", price: "19",
      desc: "Pour démarrer et tester avec tes premiers clients.",
      features: ["1 boutique en ligne", "Jusqu'à 20 produits", "Commandes illimitées", "Lien personnalisé", "Dashboard de base"],
      popular: false, btnLabel: "Demander un accès",
    },
    {
      name: "Pro", price: "49",
      desc: "Pour les vendeurs actifs qui veulent tout automatiser.",
      features: ["3 boutiques en ligne", "Produits illimités", "Dashboard complet", "Notifications temps réel", "Statistiques avancées", "Support prioritaire"],
      popular: true, btnLabel: "Demander un accès",
    },
    {
      name: "Business", price: "99",
      desc: "Pour les revendeurs avec un volume important.",
      features: ["Boutiques illimitées", "Accès API", "Gestion multi-comptes", "Rapport hebdomadaire auto", "Onboarding dédié", "Support 24/7"],
      popular: false, btnLabel: "Demander un accès",
    },
  ];
  return (
    <section id="tarifs" className="py-24 border-t border-[var(--surface-border)]">
      <div className="container mx-auto px-6 text-center">
        <p className="text-xs font-bold tracking-widest uppercase text-[var(--brand-accent)] mb-3">Tarifs</p>
        <h2 className="text-4xl font-extrabold tracking-tight mb-4">Simple, transparent,<br />sans surprise.</h2>
        <p className="text-[var(--muted)] max-w-md mx-auto mb-14 leading-relaxed">
          Inscriptions sur liste d&apos;attente. Demande ton accès — on te recontacte rapidement.
        </p>
        <div className="grid md:grid-cols-3 gap-5 items-start max-w-4xl mx-auto">
          {plans.map((p) => (
            <div
              key={p.name}
              className="rounded-2xl p-8 relative border"
              style={p.popular
                ? { background: "rgba(99,102,241,.07)", borderColor: "rgba(99,102,241,.45)", boxShadow: "0 0 40px -10px rgba(79,70,229,.3)" }
                : { background: "var(--surface)", borderColor: "rgba(255,255,255,.08)" }}
            >
              {p.popular && (
                <div
                  className="absolute -top-px left-1/2 -translate-x-1/2 text-[11px] font-bold tracking-wide px-4 py-1 rounded-b-xl text-white whitespace-nowrap"
                  style={{ background: "linear-gradient(to right,var(--brand-accent),var(--brand-secondary))" }}
                >
                  Le plus populaire
                </div>
              )}
              <div className={`text-xs font-bold tracking-widest uppercase text-[var(--muted)] ${p.popular ? "mt-4" : ""} mb-3`}>
                {p.name}
              </div>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-5xl font-extrabold tracking-tight">{p.price}</span>
                <span className="text-[var(--muted)] text-sm">€ / mois</span>
              </div>
              <p className="text-sm text-[var(--muted)] mb-6 leading-relaxed">{p.desc}</p>
              <ul className="space-y-2.5 mb-8 text-left">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-zinc-300">
                    <CheckCircle2 size={15} className="mt-0.5 text-indigo-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="/waitlist"
                className="block w-full rounded-full py-3 text-sm font-semibold text-center transition-all"
                style={p.popular
                  ? { background: "linear-gradient(to right,var(--brand-accent),var(--brand-secondary))", boxShadow: "0 8px 24px -6px rgba(79,70,229,.45)", color: "white" }
                  : { border: "1px solid rgba(99,102,241,.3)", color: "#a1a1aa" }}
              >
                {p.btnLabel}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA Final ────────────────────────────────────────────────────────────────
function CtaFinal() {
  return (
    <section className="relative py-28 text-center overflow-hidden">
      <div className="landing-glow absolute inset-0 z-0 opacity-60" />
      <div className="container mx-auto px-6 relative z-10">
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
          Prêt à vendre<br />
          <span className="gradient-text">comme un pro ?</span>
        </h2>
        <p className="text-[var(--muted)] max-w-md mx-auto mb-10 leading-relaxed">
          Rejoins la liste d&apos;attente Catalink et ouvre ta boutique dès que ton accès est validé.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <a href="/waitlist" className="cta-primary">Demander un accès</a>
          <a href="#tarifs" className="cta-secondary">Voir les tarifs</a>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-[var(--surface-border)] pt-14 pb-8">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-[1.5fr_1fr_1fr_1fr] gap-10 mb-12">
          {/* Brand */}
          <div>
            <div className="mb-4">
              <Image
                src="/catalink-logo-v2.png"
                alt="Catalink"
                width={48}
                height={48}
                className="object-contain"
                style={{ height: "auto" }}
              />
            </div>
            <p className="text-sm text-zinc-500 max-w-[220px] leading-relaxed mb-4">
              Crée ton catalogue. Partage ton lien. Vends partout.
            </p>
            <p className="text-xs text-zinc-600">© 2026 Catalink. Tous droits réservés.</p>
          </div>

          {/* Cols */}
          {[
            {
              title: "Produit",
              links: [
                ["Comment ça marche", "#fonctionnement"],
                ["Fonctionnalités", "#fonctionnalites"],
                ["Tarifs", "#tarifs"],
              ],
            },
            {
              title: "Légal",
              links: [
                ["Mentions légales", "#"],
                ["Confidentialité", "#"],
                ["CGU", "#"],
              ],
            },
            {
              title: "Contact",
              links: [
                ["hello@catalink.app", "#"],
                ["Support", "#"],
              ],
            },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">{col.title}</h4>
              {col.links.map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  className="block text-sm text-zinc-500 mb-2 hover:text-white transition-colors"
                >
                  {label}
                </a>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="flex items-center justify-between border-t border-white/[0.06] pt-6 text-xs text-zinc-600">
          <span>Fait avec passion pour les vendeurs FR</span>
          <div className="flex items-center gap-1 text-zinc-600">
            <span>Propulsé par</span>
            <span className="gradient-text font-semibold">Catalink</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <TrustBar />
        <ProblemSolution />
        <HowItWorks />
        <Features />
        <DashboardMock />
        <SocialProof />
        <Pricing />
        <FAQ />
        <CtaFinal />
      </main>
      <Footer />
    </>
  );
}
