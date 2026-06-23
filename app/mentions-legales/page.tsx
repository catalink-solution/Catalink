import type { Metadata } from "next";
import { LegalLayout, LegalList, LegalSection } from "@/components/legal/legal-layout";
import { LEGAL_CONFIG, formatLegalAddress } from "@/lib/legal-config";

export const metadata: Metadata = {
  title: "Mentions légales — Catalink",
  description:
    "Mentions légales du service Catalink : éditeur, hébergeur, directeur de publication et contact.",
  robots: { index: true, follow: true },
};

export default function MentionsLegalesPage() {
  const c = LEGAL_CONFIG;

  return (
    <LegalLayout
      title="Mentions légales"
      subtitle={`Dernière mise à jour : ${c.lastUpdated}`}
    >
      <LegalSection title="1. Éditeur du site">
        <p>
          Le site et le service SaaS <strong className="text-white">Catalink</strong> sont édités
          par :
        </p>
        <ul className="space-y-1 rounded-xl border border-white/10 bg-white/[0.02] p-4 font-mono text-xs text-zinc-400 sm:text-sm">
          <li>
            <span className="text-zinc-500">Société : </span>
            {c.companyName}
          </li>
          <li>
            <span className="text-zinc-500">Forme : </span>
            {c.legalForm}
          </li>
          <li>
            <span className="text-zinc-500">SIRET : </span>
            {c.siret}
          </li>
          <li>
            <span className="text-zinc-500">RCS : </span>
            {c.rcs}
          </li>
          <li>
            <span className="text-zinc-500">TVA : </span>
            {c.vatNumber}
          </li>
          <li>
            <span className="text-zinc-500">Siège : </span>
            {formatLegalAddress()}
          </li>
          <li>
            <span className="text-zinc-500">Email : </span>
            <a href={`mailto:${c.contactEmail}`} className="text-violet-300 hover:text-violet-200">
              {c.contactEmail}
            </a>
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="2. Directeur de la publication">
        <p>{c.directorOfPublication}</p>
      </LegalSection>

      <LegalSection title="3. Hébergement">
        <p>Le service est hébergé par :</p>
        <ul className="space-y-1 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-zinc-400">
          <li>
            <strong className="text-zinc-300">{c.hostName}</strong>
          </li>
          <li>{c.hostAddress}</li>
          <li>
            <a
              href={c.hostWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-300 hover:text-violet-200"
            >
              {c.hostWebsite}
            </a>
          </li>
        </ul>
        <p className="text-zinc-500">
          Données applicatives : {c.databaseHost}. Emails transactionnels : {c.emailProvider}.
        </p>
      </LegalSection>

      <LegalSection title="4. Propriété intellectuelle">
        <p>
          L&apos;ensemble des éléments composant Catalink (marque, logiciel, interface, textes,
          graphismes, logo) est protégé par le droit de la propriété intellectuelle. Toute
          reproduction non autorisée est interdite.
        </p>
      </LegalSection>

      <LegalSection title="5. Contact">
        <LegalList
          items={[
            `Questions légales : ${c.contactEmail}`,
            `Support utilisateurs : ${c.supportEmail}`,
          ]}
        />
      </LegalSection>
    </LegalLayout>
  );
}
