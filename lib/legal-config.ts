/**
 * Informations légales Catalink — modifiez ces valeurs avant commercialisation.
 * Les placeholders […] doivent être remplacés par vos données réelles.
 */
export const LEGAL_CONFIG = {
  /** Raison sociale */
  companyName: "[NOM DE LA SOCIÉTÉ — ex. Catalink SAS]",
  legalForm: "[FORME JURIDIQUE — ex. SAS au capital de X €]",
  siret: "[SIRET — 14 chiffres]",
  rcs: "[RCS — Ville et numéro]",
  vatNumber: "[N° TVA intracommunautaire — le cas échéant]",

  /** Siège social */
  addressLine1: "[ADRESSE LIGNE 1 — ex. 12 rue Example]",
  addressLine2: "[CODE POSTAL VILLE — ex. 75001 Paris]",
  country: "France",

  /** Contact */
  contactEmail: "contact@catalink.app",
  supportEmail: "support@catalink.app",

  /** Publication */
  directorOfPublication: "[DIRECTEUR DE PUBLICATION — Prénom Nom, qualité]",

  /** Hébergeur */
  hostName: "Vercel Inc.",
  hostAddress: "440 N Barranca Ave #4133, Covina, CA 91723, États-Unis",
  hostWebsite: "https://vercel.com",

  /** Données & sous-traitants */
  databaseHost: "Supabase Inc. (Union européenne — région eu-west-3, Paris)",
  emailProvider: "Resend Inc. (États-Unis — transfert encadré par clauses contractuelles types)",

  /** Versions */
  lastUpdated: "23 juin 2026",
  cguVersion: "1.0",
  privacyVersion: "1.0",
} as const;

export function formatLegalAddress(): string {
  const c = LEGAL_CONFIG;
  return `${c.addressLine1}, ${c.addressLine2}, ${c.country}`;
}
