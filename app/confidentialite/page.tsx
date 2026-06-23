import type { Metadata } from "next";
import { LegalLayout, LegalList, LegalSection } from "@/components/legal/legal-layout";
import { LEGAL_CONFIG } from "@/lib/legal-config";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Catalink",
  description:
    "Politique de confidentialité Catalink : données vendeurs et clients, cookies, hébergement, droits RGPD.",
  robots: { index: true, follow: true },
};

export default function ConfidentialitePage() {
  const c = LEGAL_CONFIG;

  return (
    <LegalLayout
      title="Politique de confidentialité"
      subtitle={`Version ${c.privacyVersion} — ${c.lastUpdated} — Conforme RGPD`}
    >
      <LegalSection title="1. Responsable du traitement">
        <p>
          Le responsable du traitement est {c.companyName}, {c.legalForm}, dont le siège est situé
          à {c.addressLine1}, {c.addressLine2}, {c.country}.
        </p>
        <p>
          Contact DPO / données :{" "}
          <a href={`mailto:${c.contactEmail}`} className="text-violet-300 hover:text-violet-200">
            {c.contactEmail}
          </a>
        </p>
      </LegalSection>

      <LegalSection title="2. Données des vendeurs (compte Catalink)">
        <p>Données collectées lors de l&apos;inscription et de l&apos;utilisation du dashboard :</p>
        <LegalList
          items={[
            "Identité : nom, prénom, email, mot de passe (hashé).",
            "Boutique : nom, slug, description, réseaux sociaux, logo.",
            "Activité : produits, commandes, clients, statistiques d'usage.",
            "Technique : logs de connexion, adresse IP, identifiants de session.",
          ]}
        />
        <p>
          <strong className="text-zinc-200">Finalités :</strong> création et gestion du compte,
          fourniture du service, support, facturation future, sécurité et amélioration du produit.
        </p>
        <p>
          <strong className="text-zinc-200">Base légale :</strong> exécution du contrat (CGU),
          intérêt légitime (sécurité, amélioration), consentement le cas échéant (marketing
          Catalink).
        </p>
      </LegalSection>

      <LegalSection title="3. Données des clients finaux (acheteurs)">
        <p>
          Lorsqu&apos;un visiteur passe commande sur la boutique d&apos;un vendeur, Catalink
          traite les données suivantes pour le compte du vendeur :
        </p>
        <LegalList
          items={[
            "Nom, téléphone, email, adresse de livraison.",
            "Contenu du panier et historique de commande.",
            "Numéro de suivi et statut de commande.",
            "Données de navigation sur la boutique (cookies, session panier).",
          ]}
        />
        <p>
          Le vendeur est responsable de traitement vis-à-vis de ses clients. Catalink agit en
          qualité de sous-traitant pour l&apos;hébergement et le traitement technique de ces
          données, conformément à l&apos;article 28 du RGPD.
        </p>
      </LegalSection>

      <LegalSection title="4. Cookies et traceurs">
        <LegalList
          items={[
            "Cookies strictement nécessaires : session d'authentification vendeur, panier client, sécurité.",
            "Cookies de mesure d'audience (analytics) : [À PRÉCISER — ex. Vercel Analytics, Plausible] — soumis au consentement si requis.",
            "Pas de cookies publicitaires tiers par défaut.",
          ]}
        />
        <p>
          Vous pouvez configurer votre navigateur pour refuser les cookies. Certaines
          fonctionnalités pourraient ne plus être disponibles.
        </p>
      </LegalSection>

      <LegalSection title="5. Analytics">
        <p>
          Catalink peut utiliser des outils de mesure d&apos;audience agrégée pour comprendre
          l&apos;usage du service (pages vues, performances). Les données sont anonymisées ou
          pseudonymisées lorsque possible.
        </p>
        <p className="text-zinc-500">
          [LISTE DES OUTILS ANALYTICS ACTIFS — à compléter avant mise en production commerciale.]
        </p>
      </LegalSection>

      <LegalSection title="6. Hébergement et sous-traitants">
        <LegalList
          items={[
            `Application : ${c.hostName} — ${c.hostAddress}`,
            `Base de données : ${c.databaseHost}`,
            `Emails : ${c.emailProvider}`,
          ]}
        />
        <p>
          Les sous-traitants sont sélectionnés pour leur conformité RGPD. Des clauses
          contractuelles types (CCT) encadrent les transferts hors Union européenne le cas
          échéant.
        </p>
      </LegalSection>

      <LegalSection title="7. Durée de conservation">
        <LegalList
          items={[
            "Compte vendeur actif : durée de la relation contractuelle + 3 ans (prescription commerciale).",
            "Commandes clients : durée légale comptable (10 ans pour les pièces comptables) ou selon instruction du vendeur.",
            "Logs techniques : 12 mois maximum.",
            "Liste d'attente : jusqu'à inscription ou demande de suppression.",
          ]}
        />
      </LegalSection>

      <LegalSection title="8. Vos droits (RGPD)">
        <p>Conformément au RGPD, vous disposez des droits suivants :</p>
        <LegalList
          items={[
            "Accès, rectification, effacement (« droit à l'oubli »).",
            "Limitation et opposition au traitement.",
            "Portabilité des données (format structuré).",
            "Retrait du consentement à tout moment.",
            "Réclamation auprès de la CNIL (www.cnil.fr).",
          ]}
        />
        <p>
          Exercez vos droits à :{" "}
          <a href={`mailto:${c.contactEmail}`} className="text-violet-300 hover:text-violet-200">
            {c.contactEmail}
          </a>
          . Réponse sous 30 jours.
        </p>
      </LegalSection>

      <LegalSection title="9. Suppression de compte">
        <p>
          Le vendeur peut demander la suppression de son compte et de ses données en contactant{" "}
          {c.contactEmail}. Certaines données peuvent être conservées pour respecter des obligations
          légales (comptabilité, litiges). Les boutiques publiques seront désactivées.
        </p>
      </LegalSection>

      <LegalSection title="10. Modifications">
        <p>
          Cette politique peut être mise à jour. La date de dernière révision figure en en-tête.
          Les modifications substantielles seront notifiées aux vendeurs inscrits.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
