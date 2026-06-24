type SectionHeadingProps = {
  label: string;
  title: React.ReactNode;
  description?: string;
  align?: "left" | "center";
};

export function SectionHeading({
  label,
  title,
  description,
  align = "left",
}: SectionHeadingProps) {
  const centered = align === "center";
  return (
    <div className={centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--brand-accent)]">
        {label}
      </p>
      <h2 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 leading-relaxed text-[var(--muted)]">{description}</p>
      )}
    </div>
  );
}
