"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { FAQ_ITEMS } from "@/lib/faq-data";

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 border-t border-[var(--surface-border)]">
      <div className="container mx-auto px-6 max-w-3xl">
        <p className="text-xs font-bold tracking-widest uppercase text-[var(--brand-accent)] mb-3 text-center">
          FAQ
        </p>
        <h2 className="text-4xl font-extrabold tracking-tight mb-4 leading-tight text-center">
          Questions fréquentes
        </h2>
        <p className="text-[var(--muted)] text-center mb-12 leading-relaxed">
          Tout ce que tu dois savoir avant de lancer ta boutique Catalink.
        </p>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={item.question}
                className="rounded-2xl border overflow-hidden transition-colors"
                style={{
                  background: isOpen ? "rgba(99,102,241,.06)" : "var(--surface)",
                  borderColor: isOpen ? "rgba(99,102,241,.3)" : "rgba(255,255,255,.08)",
                }}
              >
                <button
                  type="button"
                  className="btn-touch flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                >
                  <span className="font-semibold text-zinc-100">{item.question}</span>
                  <ChevronDown
                    size={20}
                    className="flex-shrink-0 text-[var(--brand-light)] transition-transform duration-200"
                    style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                  />
                </button>
                <div
                  className="grid transition-[grid-template-rows] duration-200 ease-out"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-5 text-sm text-[var(--muted)] leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
