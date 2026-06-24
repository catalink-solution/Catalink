/** Fond hero — référence #03030A, glow violet, grain, particules */
export function LandingHeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 68% 38%, rgba(99,102,241,0.28) 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 15% 20%, rgba(139,92,246,0.08) 0%, transparent 50%), #03030A",
        }}
      />
      <div className="landing-grid absolute inset-0 opacity-60" />

      <div
        className="absolute left-[62%] top-[40%] h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl lg:h-[680px] lg:w-[680px]"
        style={{ background: "rgba(99,102,241,0.2)" }}
      />
      <div
        className="absolute left-[78%] top-[18%] h-[380px] w-[380px] rounded-full blur-3xl"
        style={{ background: "rgba(139,92,246,0.12)" }}
      />

      {[
        { top: "20%", left: "58%", size: 3, opacity: 0.35 },
        { top: "34%", left: "70%", size: 2, opacity: 0.28 },
        { top: "48%", left: "52%", size: 2, opacity: 0.3 },
        { top: "62%", left: "66%", size: 3, opacity: 0.22 },
        { top: "28%", left: "82%", size: 2, opacity: 0.2 },
      ].map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-violet-200/50"
          style={{
            top: p.top,
            left: p.left,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            boxShadow: "0 0 10px rgba(167,139,250,0.5)",
          }}
        />
      ))}
    </div>
  );
}
