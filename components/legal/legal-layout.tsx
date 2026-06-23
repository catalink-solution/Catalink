import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";

const LEGAL_LINKS = [
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/cgu", label: "CGU" },
  { href: "/confidentialite", label: "Confidentialité" },
] as const;

export function LegalLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#030712] text-zinc-100">
      <header
        className="border-b border-white/[0.06] px-4 py-4 sm:px-6"
        style={{ background: "rgba(3,7,18,0.95)", backdropFilter: "blur(12px)" }}
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/catalink-logo-v4.png"
              alt="Catalink"
              width={56}
              height={20}
              className="object-contain"
              style={{ height: "auto" }}
            />
          </Link>
          <Link
            href="/"
            className="text-sm text-zinc-500 transition-colors hover:text-white"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          {title}
        </h1>
        {subtitle && <p className="mt-2 text-sm text-zinc-500">{subtitle}</p>}
        <article className="legal-prose mt-10 space-y-8 text-sm leading-relaxed text-zinc-300 sm:text-[15px]">
          {children}
        </article>
      </main>

      <footer className="border-t border-white/[0.06] px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-wrap gap-x-6 gap-y-2 text-xs text-zinc-500">
          {LEGAL_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-white transition-colors">
              {l.label}
            </Link>
          ))}
          <span className="text-zinc-600">© {new Date().getFullYear()} Catalink</span>
        </div>
      </footer>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-bold text-white">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5 text-zinc-400">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
