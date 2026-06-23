"use client";

import { Check, Circle } from "lucide-react";
import {
  CUSTOMER_ORDER_STEPS,
  customerTimelineIndex,
  customerStatusLabel,
} from "@/lib/customer-order-status";

export function OrderTimeline({ status }: { status: string }) {
  const activeIdx = customerTimelineIndex(status);
  const isCancelled = activeIdx === -1;

  if (isCancelled) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
        {customerStatusLabel(status)}
      </div>
    );
  }

  return (
    <ol className="space-y-0">
      {CUSTOMER_ORDER_STEPS.map((step, idx) => {
        const done = idx < activeIdx;
        const current = idx === activeIdx;
        const pending = idx > activeIdx;

        return (
          <li key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                  done
                    ? "border-green-500 bg-green-500/20 text-green-400"
                    : current
                      ? "border-violet-500 bg-violet-500/20 text-violet-300"
                      : "border-white/15 bg-white/5 text-white/30"
                }`}
              >
                {done ? <Check size={16} /> : <Circle size={10} fill="currentColor" />}
              </div>
              {idx < CUSTOMER_ORDER_STEPS.length - 1 && (
                <div
                  className={`my-1 w-0.5 flex-1 min-h-[24px] ${
                    done ? "bg-green-500/40" : "bg-white/10"
                  }`}
                />
              )}
            </div>
            <div className={`pb-6 ${pending ? "opacity-45" : ""}`}>
              <p
                className={`text-sm font-semibold ${
                  current ? "text-white" : done ? "text-white/80" : "text-white/50"
                }`}
              >
                {step.label}
              </p>
              {current && (
                <p className="mt-0.5 text-xs text-violet-300/80">Statut actuel</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
