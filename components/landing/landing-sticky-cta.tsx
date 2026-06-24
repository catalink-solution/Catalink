"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function LandingStickyCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 480);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#030712]/95 p-3 backdrop-blur-md sm:hidden">
      <Link href="/waitlist" className="cta-primary w-full">
        Demander un accès
      </Link>
    </div>
  );
}
