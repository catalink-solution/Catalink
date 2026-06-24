type ProductThumbProps = {
  product: "maillot" | "sneakers" | "lunettes" | "sacoche";
  className?: string;
};

export function DemoProductThumb({ product, className = "" }: ProductThumbProps) {
  const base = `relative aspect-square w-full overflow-hidden rounded-md border border-white/10 sm:rounded-lg ${className}`;

  if (product === "maillot") {
    return (
      <div className={base} style={{ background: "#0a1633" }}>
        <div className="absolute inset-0 flex">
          <div className="w-[22%] bg-[#004170]" />
          <div className="flex-1 bg-white" />
          <div className="w-[22%] bg-[#004170]" />
        </div>
        <div className="absolute left-[38%] top-[18%] h-[28%] w-[24%] rounded-sm bg-[#004170]/90" />
        <div className="absolute bottom-[12%] left-[30%] right-[30%] h-[8%] rounded-full bg-white/30" />
        <div className="absolute inset-x-0 bottom-0 h-[18%] bg-gradient-to-t from-black/35 to-transparent" />
      </div>
    );
  }

  if (product === "sneakers") {
    return (
      <div className={base} style={{ background: "linear-gradient(145deg,#1e293b,#0f172a)" }}>
        <div className="absolute bottom-[22%] left-[8%] right-[8%] h-[38%] rounded-[40%] bg-gradient-to-br from-zinc-100 to-zinc-300 shadow-inner" />
        <div className="absolute bottom-[14%] left-[6%] right-[6%] h-[18%] rounded-full bg-gradient-to-r from-orange-400 to-red-500" />
        <div className="absolute bottom-[30%] left-[18%] h-[6%] w-[28%] rounded-full bg-zinc-400/50" />
        <div className="absolute bottom-[34%] right-[20%] h-[5%] w-[22%] rounded-full bg-zinc-400/40" />
        <div className="absolute inset-x-0 bottom-0 h-[20%] bg-gradient-to-t from-black/40 to-transparent" />
      </div>
    );
  }

  if (product === "lunettes") {
    return (
      <div className={base} style={{ background: "linear-gradient(160deg,#27272a,#18181b)" }}>
        <div className="absolute left-[14%] top-[38%] h-[22%] w-[30%] rounded-lg border-2 border-zinc-500 bg-gradient-to-br from-zinc-700/80 to-black" />
        <div className="absolute right-[14%] top-[38%] h-[22%] w-[30%] rounded-lg border-2 border-zinc-500 bg-gradient-to-br from-zinc-700/80 to-black" />
        <div className="absolute left-[44%] top-[46%] h-[3%] w-[12%] rounded-full bg-zinc-500" />
        <div className="absolute left-[8%] top-[48%] h-[2%] w-[18%] rotate-[8deg] rounded-full bg-zinc-600" />
        <div className="absolute right-[8%] top-[48%] h-[2%] w-[18%] -rotate-[8deg] rounded-full bg-zinc-600" />
        <div className="absolute inset-x-0 bottom-0 h-[22%] bg-gradient-to-t from-amber-900/20 to-transparent" />
      </div>
    );
  }

  return (
    <div className={base} style={{ background: "linear-gradient(155deg,#3f2e22,#1c1410)" }}>
      <div className="absolute left-[22%] top-[24%] h-[52%] w-[56%] rounded-2xl bg-gradient-to-br from-amber-700 to-amber-900 shadow-lg" />
      <div className="absolute left-[28%] top-[18%] h-[18%] w-[44%] rounded-t-xl border-2 border-amber-800/80 bg-amber-800/60" />
      <div className="absolute left-[46%] top-[28%] h-[10%] w-[8%] rounded-sm bg-amber-950/50" />
      <div className="absolute bottom-[18%] left-[30%] right-[30%] h-[8%] rounded-full bg-amber-950/40" />
      <div className="absolute inset-x-0 bottom-0 h-[20%] bg-gradient-to-t from-black/35 to-transparent" />
    </div>
  );
}
