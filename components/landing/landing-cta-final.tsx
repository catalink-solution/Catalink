import Link from "next/link";

export function LandingCtaFinal() {
  return (
    <section className="relative overflow-hidden py-24 text-center sm:py-28">
      <div className="landing-glow absolute inset-0 z-0 opacity-60" />
      <div className="container relative z-10 mx-auto px-4 sm:px-6">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
          Prêt à structurer
          <br />
          <span className="gradient-text">tes ventes social commerce ?</span>
        </h2>
        <p className="mx-auto mt-4 max-w-md leading-relaxed text-[var(--muted)]">
          Rejoins la liste d&apos;attente Catalink. Accès bêta sur validation — on te recontacte
          dès qu&apos;une place se libère.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/waitlist" className="cta-primary">
            Demander un accès
          </Link>
          <a href="#tarifs" className="cta-secondary">
            Voir les tarifs
          </a>
        </div>
      </div>
    </section>
  );
}
