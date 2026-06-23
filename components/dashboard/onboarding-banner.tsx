"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Rocket } from "lucide-react";
import { useVendorOnboarding } from "@/components/dashboard/use-vendor-onboarding";

export function OnboardingBanner() {
  const pathname = usePathname();
  const { loading, progress, complete } = useVendorOnboarding();

  if (loading || complete || pathname === "/dashboard/welcome") return null;

  return (
    <div className="border-b border-violet-500/20 bg-violet-500/10 px-4 py-3 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Rocket className="mt-0.5 shrink-0 text-violet-300" size={18} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-violet-100">
              Complétez votre configuration
            </p>
            <div className="mt-2 flex items-center gap-3">
              <div className="h-1.5 flex-1 min-w-[120px] max-w-xs overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-violet-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs font-bold text-violet-200">{progress}%</span>
            </div>
          </div>
        </div>
        <Link
          href="/dashboard/welcome"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
        >
          Continuer <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}
