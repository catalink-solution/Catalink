// Regroupement (clustering) des images analysées en produits + variantes.
// Pur (sans I/O) pour rester testable et indépendant du fournisseur IA.

import type { ImageAnalysis } from "./types";

export type AnalyzedFile = {
  fileId: string;
  imageUrl: string;
  sortOrder: number;
  analysis: ImageAnalysis;
};

export type ClusterVariant = { attributeName: string; value: string; hex: string | null; confidence: number };

export type Cluster = {
  signature: string;
  brand: string | null;
  model: string | null;
  productType: string | null;
  category: string | null;
  coverImageUrl: string | null;
  fileIds: string[];
  /** fileId → libellé de variante (ex : "Noir / 42"). */
  variantLabelByFile: Record<string, string | null>;
  variants: ClusterVariant[];
  colorNames: string[];
  sizes: string[];
  confidence: number;
};

function mostCommon(values: (string | null)[]): string | null {
  const counts = new Map<string, number>();
  for (const v of values) {
    if (!v) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestN = 0;
  for (const [v, n] of counts) {
    if (n > bestN) {
      best = v;
      bestN = n;
    }
  }
  return best;
}

/** Regroupe les fichiers analysés par signature produit. */
export function clusterAnalyses(files: AnalyzedFile[]): Cluster[] {
  const groups = new Map<string, AnalyzedFile[]>();
  for (const f of files) {
    const sig = (f.analysis.signature || "produit").trim().toLowerCase();
    const arr = groups.get(sig) ?? [];
    arr.push(f);
    groups.set(sig, arr);
  }

  const clusters: Cluster[] = [];
  for (const [signature, members] of groups) {
    members.sort((a, b) => a.sortOrder - b.sortOrder);

    const brand = mostCommon(members.map((m) => m.analysis.brand));
    const model = mostCommon(members.map((m) => m.analysis.model));
    const productType = mostCommon(members.map((m) => m.analysis.productType));
    const category = mostCommon(members.map((m) => m.analysis.category));

    // Couleurs distinctes → variantes couleur
    const colorMap = new Map<string, { hex: string | null; conf: number }>();
    for (const m of members) {
      const c = m.analysis.colorName?.trim();
      if (!c) continue;
      const prev = colorMap.get(c);
      if (!prev) colorMap.set(c, { hex: m.analysis.dominantHex, conf: m.analysis.confidence });
    }
    // Tailles distinctes → variantes taille
    const sizeSet = new Set<string>();
    for (const m of members) if (m.analysis.size) sizeSet.add(m.analysis.size.trim());

    const variants: ClusterVariant[] = [];
    for (const [value, info] of colorMap) {
      variants.push({ attributeName: "Couleur", value, hex: info.hex, confidence: info.conf });
    }
    for (const value of sizeSet) {
      variants.push({ attributeName: "Taille", value, hex: null, confidence: 0.5 });
    }

    const variantLabelByFile: Record<string, string | null> = {};
    for (const m of members) {
      const parts = [m.analysis.colorName?.trim(), m.analysis.size?.trim()].filter(Boolean);
      variantLabelByFile[m.fileId] = parts.length ? parts.join(" / ") : null;
    }

    const confidence =
      members.reduce((s, m) => s + (m.analysis.confidence ?? 0), 0) / Math.max(1, members.length);

    clusters.push({
      signature,
      brand,
      model,
      productType,
      category,
      coverImageUrl: members[0]?.imageUrl ?? null,
      fileIds: members.map((m) => m.fileId),
      variantLabelByFile,
      variants,
      colorNames: [...colorMap.keys()],
      sizes: [...sizeSet],
      confidence,
    });
  }

  // Produits les plus "riches" d'abord.
  clusters.sort((a, b) => b.fileIds.length - a.fileIds.length);
  return clusters;
}
