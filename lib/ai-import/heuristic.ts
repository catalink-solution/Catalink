// Fournisseur par défaut SANS clé API : analyse heuristique basée sur le nom de
// fichier + dictionnaire de couleurs. Garantit un pipeline fonctionnel et gratuit
// même sans OpenAI configuré. Sert aussi de repli si l'appel IA échoue.

import { COLOR_PALETTE } from "@/lib/variants";
import type {
  ImageAnalyzer,
  ContentGenerator,
  ImageAnalysis,
  ProductContent,
  ProductSummary,
} from "./types";

const COLOR_LOOKUP = new Map(COLOR_PALETTE.map((c) => [c.name.toLowerCase(), c.hex]));
// Variantes orthographiques / anglais → nom normalisé de la palette.
const COLOR_ALIASES: Record<string, string> = {
  black: "Noir",
  noir: "Noir",
  white: "Blanc",
  blanc: "Blanc",
  grey: "Gris",
  gray: "Gris",
  gris: "Gris",
  red: "Rouge",
  rouge: "Rouge",
  blue: "Bleu",
  bleu: "Bleu",
  navy: "Bleu marine",
  green: "Vert",
  vert: "Vert",
  yellow: "Jaune",
  jaune: "Jaune",
  orange: "Orange",
  purple: "Violet",
  violet: "Violet",
  pink: "Rose",
  rose: "Rose",
  beige: "Beige",
  brown: "Marron",
  marron: "Marron",
  gold: "Or",
  silver: "Argent",
  khaki: "Kaki",
  kaki: "Kaki",
  olive: "Kaki",
  multicolor: "Multicolore",
  multicolour: "Multicolore",
  multicolore: "Multicolore",
  multi: "Multicolore",
};

const SIZE_RE = /^(xs|s|m|l|xl|xxl|3xl|3[4-9]|4[0-9]|5[0-9])$/i;

function cleanTokens(name: string): string[] {
  return name
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[_\-.]+/g, " ")
    .replace(/[^a-zA-Z0-9 ]+/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function detectColor(tokens: string[]): { name: string | null; hex: string | null } {
  for (const t of tokens) {
    const low = t.toLowerCase();
    const alias = COLOR_ALIASES[low];
    if (alias) return { name: alias, hex: COLOR_LOOKUP.get(alias.toLowerCase()) ?? null };
    if (COLOR_LOOKUP.has(low)) return { name: t, hex: COLOR_LOOKUP.get(low) ?? null };
  }
  return { name: null, hex: null };
}

function detectSize(tokens: string[]): string | null {
  for (const t of tokens) if (SIZE_RE.test(t)) return t.toUpperCase();
  return null;
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

export class HeuristicAnalyzer implements ImageAnalyzer {
  readonly name = "heuristic";

  async analyze(images: { url: string; name?: string | null }[]): Promise<ImageAnalysis[]> {
    return images.map((img) => {
      const tokens = cleanTokens(img.name ?? "produit");
      const color = detectColor(tokens);
      const size = detectSize(tokens);
      const base = tokens.filter((t) => {
        const low = t.toLowerCase();
        return (
          !COLOR_ALIASES[low] &&
          !COLOR_LOOKUP.has(low) &&
          !SIZE_RE.test(t) &&
          t.length > 1
        );
      });
      const signature = base.join(" ").toLowerCase() || "produit";
      const brand = base[0] ? titleCase(base[0]) : null;
      const model = base.length > 1 ? titleCase(base.slice(1).join(" ")) : null;
      return {
        productType: null,
        brand,
        model,
        category: null,
        colorName: color.name,
        dominantHex: color.hex,
        colors: color.name ? [color.name] : [],
        signature,
        size,
        // Confiance volontairement modérée → passe en « à vérifier ».
        confidence: base.length > 0 ? 0.45 : 0.2,
        raw: { tokens },
      } satisfies ImageAnalysis;
    });
  }
}

export class HeuristicContentGenerator implements ContentGenerator {
  readonly name = "heuristic";

  async generate(summary: ProductSummary): Promise<ProductContent> {
    const titleParts = [summary.brand, summary.model, summary.productType].filter(Boolean);
    const title = titleParts.length > 0 ? titleParts.join(" ") : "Produit importé";
    const category = summary.category ?? summary.productType ?? "Divers";
    const tags = [
      ...new Set(
        [summary.brand, summary.productType, ...summary.colorNames]
          .filter(Boolean)
          .map((t) => (t as string).toLowerCase())
      ),
    ];
    const colorTxt = summary.colorNames.length ? ` Disponible en ${summary.colorNames.join(", ")}.` : "";
    return {
      title,
      description: `${title}.${colorTxt} Fiche générée automatiquement — à compléter.`,
      category,
      tags,
      seoTitle: title,
      seoDescription: `${title} — ${category}.`.slice(0, 160),
    };
  }
}
