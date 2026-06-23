import type { Metadata } from "next";
import { LegalLayout, LegalList, LegalSection } from "@/components/legal/legal-layout";
import { LEGAL_CONFIG } from "@/lib/legal-config";

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation — Catalink",
  description:
    "CGU Catalink : conditions d'utilisation du service SaaS de création de boutique en ligne pour vendeurs.",
  robots: { index: true, follow: true },
};

export default function CguPage() {
  const c = LEGAL_CONFIG;

  return (
    <LegalLayout
      title="Conditions générales d'utilisation"
      subtitle={`Version ${c.cguVersion} — ${c.lastUpdated}`}
    >
      <LegalSection title="1. Objet du service">
        <p>
          Catalink est une plateforme SaaS permettant aux vendeurs de créer une boutique en ligne
          (catalogue, commandes, gestion clients) et de centraliser leurs canaux de vente (WhatsApp,
          réseaux sociaux). Catalink n&apos;est pas une marketplace ouverte au public : chaque
          vendeur dispose de sa propre boutique identifiable par un lien dédié.
        </p>
        <p>
          Catalink ne traite pas les paiements entre vendeurs et clients finaux. Les transactions
          financières sont conclues directement entre le vendeur et l&apos;acheteur, hors plateforme
          Catalink.
        </p>
      </LegalSection>

      <LegalSection title="2. Création de compte et boutique">
        <LegalList
          items={[
            "L'inscription est réservée aux professionnels ou vendeurs majeurs agissant en nom propre.",
            "Le vendeur fournit des informations exactes (identité, contact, boutique).",
            "Le vendeur choisit un identifiant public (slug) pour sa boutique.",
            "Catalink se réserve le droit de refuser ou supprimer un compte en cas de non-conformité.",
          ]}
        />
      </LegalSection>

      <LegalSection title="3. Responsabilité du vendeur">
        <p>Le vendeur est seul responsable :</p>
        <LegalList
          items={[
            "Du contenu publié (produits, prix, descriptions, images).",
            "De la conformité légale de ses ventes (droit de la consommation, TVA, mentions obligatoires).",
            "Du traitement des commandes, livraisons, remboursements et SAV.",
            "Des échanges avec ses clients (WhatsApp, email, etc.).",
            "De la licéité des produits vendus.",
          ]}
        />
      </LegalSection>

      <LegalSection title="4. Responsabilité de Catalink">
        <p>
          Catalink fournit un outil technique « en l&apos;état ». Sous réserve des dispositions
          légales impératives, Catalink ne saurait être tenue responsable :
        </p>
        <LegalList
          items={[
            "Des litiges entre vendeurs et clients finaux.",
            "Des pertes financières liées aux ventes ou aux impayés.",
            "Des interruptions temporaires du service (maintenance, force majeure).",
            "Du contenu publié par les vendeurs sur leurs boutiques.",
          ]}
        />
        <p>
          Catalink s&apos;engage à mettre en œuvre des moyens raisonnables pour assurer la
          disponibilité et la sécurité du service.
        </p>
      </LegalSection>

      <LegalSection title="5. Disponibilité du service">
        <p>
          Catalink vise une disponibilité continue du service, sans garantie de disponibilité à
          100 %. Des opérations de maintenance peuvent entraîner une indisponibilité temporaire,
          notifiée lorsque possible.
        </p>
      </LegalSection>

      <LegalSection title="6. Suspension et résiliation">
        <p>Catalink peut suspendre ou résilier un compte vendeur en cas de :</p>
        <LegalList
          items={[
            "Violation des présentes CGU.",
            "Activité frauduleuse, illégale ou portant atteinte à des tiers.",
            "Non-paiement d'un abonnement futur (lorsque applicable).",
            "Demande des autorités compétentes.",
          ]}
        />
        <p>
          Le vendeur peut cesser d&apos;utiliser le service à tout moment. Les données pourront
          être conservées conformément à la politique de confidentialité et aux obligations légales.
        </p>
      </LegalSection>

      <LegalSection title="7. Abonnement et tarification">
        <p>
          Certaines fonctionnalités pourront être proposées sous forme d&apos;abonnement payant.
          Les tarifs, durées et modalités de facturation seront communiqués avant toute souscription.
          Aucun prélèvement n&apos;est effectué sans consentement explicite du vendeur.
        </p>
        <p className="text-zinc-500">
          [MODALITÉS D&apos;ABONNEMENT FUTURES — durée, renouvellement, résiliation, remboursement
          — à compléter avant lancement commercial payant.]
        </p>
      </LegalSection>

      <LegalSection title="8. Propriété intellectuelle">
        <p>
          Catalink conserve l&apos;ensemble des droits sur la plateforme. Le vendeur conserve ses
          droits sur son contenu (produits, marque, visuels) et accorde à Catalink une licence
          limitée d&apos;hébergement et d&apos;affichage aux seules fins de fourniture du service.
        </p>
      </LegalSection>

      <LegalSection title="9. Données personnelles">
        <p>
          Le traitement des données est décrit dans la{" "}
          <a href="/confidentialite" className="text-violet-300 hover:text-violet-200">
            politique de confidentialité
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="10. Droit applicable">
        <p>
          Les présentes CGU sont soumises au droit français. En cas de litige, les tribunaux
          compétents du ressort du siège social de {c.companyName} seront seuls compétents, sauf
          disposition légale impérative contraire.
        </p>
        <p>
          Contact :{" "}
          <a href={`mailto:${c.contactEmail}`} className="text-violet-300 hover:text-violet-200">
            {c.contactEmail}
          </a>
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
