"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const STALE_MS = 12_000;

export function PwaStaleGuard() {
  const pathname = usePathname();
  const [stale, setStale] = useState(false);

  useEffect(() => {
    setStale(false);

    const timer = window.setTimeout(() => {
      const text = document.body.innerText.replace(/\s+/g, " ").trim();
      if (text.length < 80) setStale(true);
    }, STALE_MS);

    const observer = new MutationObserver(() => {
      const text = document.body.innerText.replace(/\s+/g, " ").trim();
      if (text.length >= 80) setStale(false);
    });

    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [pathname]);

  if (!stale) return null;

  return (
    <div
      className="fixed inset-x-4 bottom-4 z-[9999] mx-auto max-w-md rounded-2xl border border-violet-500/30 bg-[#0f1117]/95 p-4 shadow-xl backdrop-blur-sm"
      role="status"
    >
      <p className="text-sm text-white/80">
        La version de l&apos;application a changé. Recharge la page.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="btn-touch mt-3 w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
        style={{ background: "linear-gradient(to right,#3b82f6,#7c3aed)" }}
      >
        Recharger
      </button>
    </div>
  );
}
