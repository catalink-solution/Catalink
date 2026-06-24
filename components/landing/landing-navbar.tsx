"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "#fonctionnalites", label: "Fonctionnalités" },
  { href: "#fonctionnement", label: "Comment ça marche" },
  { href: "#tarifs", label: "Tarifs" },
  { href: "#faq", label: "FAQ" },
];

export function LandingNavbar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <nav className="relative z-50 border-none bg-transparent shadow-none">
        <div className="mx-auto flex h-[58px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center">
            <Image
              src="/catalink-logo-v4.png"
              alt="Catalink"
              width={240}
              height={64}
              className="h-16 w-auto object-contain"
              priority
            />
          </Link>

          <div className="hidden items-center gap-8 lg:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-zinc-300 transition-colors hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden text-sm text-zinc-300 transition-colors hover:text-white sm:block"
            >
              Connexion
            </Link>
            <Link href="/waitlist" className="cta-primary hidden text-sm sm:inline-flex">
              Demander un accès
            </Link>
            <button
              type="button"
              className="btn-touch inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-zinc-300 lg:hidden"
              aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-[min(100%,320px)] flex-col border-l border-white/10 bg-[#03030A] transition-transform duration-300 lg:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-[58px] items-center justify-between border-b border-white/[0.06] px-4">
          <span className="text-sm font-semibold text-white">Menu</span>
          <button
            type="button"
            className="btn-touch inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10"
            aria-label="Fermer le menu"
            onClick={() => setOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-xl px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-white/5 hover:text-white"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/login"
            className="rounded-xl px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-white/5 hover:text-white"
            onClick={() => setOpen(false)}
          >
            Connexion
          </Link>
        </div>
        <div className="border-t border-white/[0.06] p-4">
          <Link href="/waitlist" className="cta-primary w-full" onClick={() => setOpen(false)}>
            Demander un accès
          </Link>
        </div>
      </div>
    </>
  );
}
