export type StorefrontAvailabilityStatus = "available" | "out_of_stock";

const STATUS_META: Record<
  StorefrontAvailabilityStatus,
  { label: string; badgeClass: string }
> = {
  available: {
    label: "Disponible",
    badgeClass: "bg-green-500/15 text-green-300 ring-green-500/25",
  },
  out_of_stock: {
    label: "Rupture de stock",
    badgeClass: "bg-red-500/15 text-red-300 ring-red-500/25",
  },
};

/** Statut commercial affiché au client — jamais la quantité exacte. */
export function storefrontAvailabilityStatus(
  trackStock: boolean,
  quantity: number
): StorefrontAvailabilityStatus {
  if (!trackStock) return "available";
  return quantity > 0 ? "available" : "out_of_stock";
}

export function AvailabilityBadge({
  status,
  className = "",
}: {
  status: StorefrontAvailabilityStatus;
  className?: string;
}) {
  const meta = STATUS_META[status];
  return (
    <p className={`text-sm text-white/60 ${className}`.trim()}>
      Disponibilité :{" "}
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${meta.badgeClass}`}
      >
        {meta.label}
      </span>
    </p>
  );
}
