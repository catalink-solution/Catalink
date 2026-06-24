import Image from "next/image";
import Link from "next/link";

const PRODUCT_LINKS = [
  { label: "Comment ça marche", href: "#fonctionnement" },
  { label: "Fonctionnalités", href: "#fonctionnalites" },
  { label: "Tarifs", href: "#tarifs" },
  { label: "FAQ", href: "#faq" },
];

const LEGAL_LINKS = [
  { label: "Mentions légales", href: "/mentions-legales" },
  { label: "CGU", href: "/cgu" },
  { label: "Confidentialité", href: "/confidentialite" },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-[var(--surface-border)] pb-8 pt-14">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mb-12 grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
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
            <p className="max-w-[260px] text-sm leading-relaxed text-zinc-500">
              Transforme tes réseaux sociaux en boutique professionnelle. Catalogue, commandes et
              clients — centralisés.
            </p>
            <p className="mt-4 text-xs text-zinc-600">© 2026 Catalink. Tous droits réservés.</p>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-zinc-400">
              Produit
            </h4>
            {PRODUCT_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="mb-2 block text-sm text-zinc-500 transition-colors hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-zinc-400">
              Légal
            </h4>
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="mb-2 block text-sm text-zinc-500 transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            <a
              href="mailto:hello@catalink.app"
              className="mt-4 block text-sm text-zinc-500 transition-colors hover:text-white"
            >
              hello@catalink.app
            </a>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-2 border-t border-white/[0.06] pt-6 text-xs text-zinc-600 sm:flex-row">
          <span>Fait pour les vendeurs social commerce en France</span>
          <div className="flex items-center gap-1">
            <span>Propulsé par</span>
            <span className="gradient-text font-semibold">Catalink</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
