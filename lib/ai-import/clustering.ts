// Regroupement (clustering) des images analysées en produits + variantes.
// Pur (sans I/O) pour rester testable et indépendant du fournisseur IA.
// Étape clé : groupSimilarImages() regroupe les photos d'un MÊME produit
// par similarité visuelle (empreinte perceptuelle + couleur + signature IA).

import type { ImageAnalysis } from "./types";
import {
  combinedSimilarity,
  hammingHex,
  SIMILARITY_THRESHOLD,
  type Fingerprint,
} from "./similarity";

export type AnalyzedFile = {
  fileId: string;
  imageUrl: string;
  sortOrder: number;
  name: string | null;
  phash: string | null;
  dhash: string | null;
  avgHex: string | null;
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

function toFingerprint(f: AnalyzedFile): Fingerprint {
  return {
    phash: f.phash,
    dhash: f.dhash,
    avgHex: f.avgHex,
    name: f.name,
    signature: f.analysis.signature ?? null,
    brand: f.analysis.brand ?? null,
    model: f.analysis.model ?? null,
  };
}

// Nb de membres comparés par groupe (capte les angles variés sans coût O(n²)).
const MEMBERS_TO_COMPARE = 8;

/**
 * Regroupe les images représentant le même produit.
 * Clustering glouton en un passage : chaque image rejoint le groupe le plus
 * similaire si le score ≥ seuil (80% par défaut), sinon crée un nouveau groupe.
 */
export function groupSimilarImages(
  files: AnalyzedFile[],
  threshold: number = SIMILARITY_THRESHOLD
): AnalyzedFile[][] {
  const ordered = [...files].sort((a, b) => a.sortOrder - b.sortOrder);
  const groups: { members: AnalyzedFile[]; prints: Fingerprint[] }[] = [];

  for (const f of ordered) {
    const fp = toFingerprint(f);
    let bestIdx = -1;
    let bestScore = 0;
    for (let i = 0; i < groups.length; i++) {
      const prints = groups[i].prints;
      // Compare au début + à la fin du groupe (échantillon borné).
      let localBest = 0;
      const sample =
        prints.length <= MEMBERS_TO_COMPARE
          ? prints
          : [...prints.slice(0, MEMBERS_TO_COMPARE - 2), ...prints.slice(-2)];
      for (const p of sample) {
        const s = combinedSimilarity(fp, p);
        if (s > localBest) localBest = s;
        if (localBest >= 0.99) break;
      }
      if (localBest > bestScore) {
        bestScore = localBest;
        bestIdx = i;
      }
    }
    if (bestIdx >= 0 && bestScore >= threshold) {
      groups[bestIdx].members.push(f);
      groups[bestIdx].prints.push(fp);
    } else {
      groups.push({ members: [f], prints: [fp] });
    }
  }

  // Sécurité : fusionne deux groupes dont les médoïdes dépassent le seuil.
  return mergeSimilarGroups(groups.map((g) => g.members), threshold);
}

/**
 * Fusionne les groupes trop proches (similarité des médoïdes ≥ seuil).
 * Évite qu'un même produit reste éclaté en plusieurs groupes (sécurité demandée).
 */
export function mergeSimilarGroups(
  groups: AnalyzedFile[][],
  threshold: number = SIMILARITY_THRESHOLD
): AnalyzedFile[][] {
  let current = groups.map((m) => [...m]);
  let merged = true;
  let guard = 0;
  while (merged && guard++ < 1000) {
    merged = false;
    const reps = current.map((m) => toFingerprint(pickCover(m)));
    outer: for (let i = 0; i < current.length; i++) {
      for (let j = i + 1; j < current.length; j++) {
        if (combinedSimilarity(reps[i], reps[j]) >= threshold) {
          current[i] = [...current[i], ...current[j]];
          current.splice(j, 1);
          merged = true;
          break outer;
        }
      }
    }
  }
  return current;
}

/** Type de groupe produit demandé (image → produit). */
export type ProductGroup = {
  productGroupId: string;
  images: { fileId: string; imageUrl: string }[];
  detectedProduct: {
    name: string | null;
    category: string | null;
    color: string | null;
    brand: string | null;
    description: string | null;
  };
};

/**
 * Étape explicite : regroupe les images d'un même produit AVANT toute création.
 * Renvoie la structure [{ productGroupId, images, detectedProduct }].
 * La création de produits se fait ensuite groupe par groupe (jamais par image).
 */
export function groupSimilarImagesBeforeProductCreation(
  files: AnalyzedFile[],
  threshold: number = SIMILARITY_THRESHOLD
): ProductGroup[] {
  const groups = groupSimilarImages(files, threshold);
  return groups.map((members, i) => {
    const c = buildCluster(members);
    const name = [c.brand, c.model, c.productType].filter(Boolean).join(" ") || null;
    return {
      productGroupId: `group_${i + 1}`,
      images: members.map((m) => ({ fileId: m.fileId, imageUrl: m.imageUrl })),
      detectedProduct: {
        name,
        category: c.category,
        color: c.colorNames[0] ?? null,
        brand: c.brand,
        description: null,
      },
    };
  });
}

/** Choisit la photo la plus représentative (médoïde par hash) comme image principale. */
function pickCover(members: AnalyzedFile[]): AnalyzedFile {
  const withHash = members.filter((m) => m.phash);
  if (withHash.length >= 2) {
    let best = withHash[0];
    let bestDist = Infinity;
    for (const a of withHash) {
      let dist = 0;
      for (const b of withHash) {
        if (a === b || !a.phash || !b.phash) continue;
        dist += hammingHex(a.phash, b.phash);
      }
      if (dist < bestDist) {
        bestDist = dist;
        best = a;
      }
    }
    return best;
  }
  // Sinon : meilleure confiance d'analyse, puis ordre d'upload.
  return [...members].sort(
    (a, b) => (b.analysis.confidence ?? 0) - (a.analysis.confidence ?? 0)
  )[0];
}

/** Cohésion d'un groupe = similarité moyenne des membres au médoïde (0..1). */
function cohesion(members: AnalyzedFile[], cover: AnalyzedFile): number {
  if (members.length <= 1) return 1;
  const ref = toFingerprint(cover);
  let sum = 0;
  let n = 0;
  for (const m of members) {
    if (m === cover) continue;
    sum += combinedSimilarity(ref, toFingerprint(m));
    n++;
  }
  return n === 0 ? 1 : sum / n;
}

function buildCluster(members: AnalyzedFile[]): Cluster {
  members.sort((a, b) => a.sortOrder - b.sortOrder);

  const brand = mostCommon(members.map((m) => m.analysis.brand));
  const model = mostCommon(members.map((m) => m.analysis.model));
  const productType = mostCommon(members.map((m) => m.analysis.productType));
  const category = mostCommon(members.map((m) => m.analysis.category));
  const signature =
    mostCommon(members.map((m) => m.analysis.signature)) ?? "produit";

  // Couleurs distinctes → variantes couleur
  const colorMap = new Map<string, { hex: string | null; conf: number }>();
  for (const m of members) {
    const c = m.analysis.colorName?.trim();
    if (!c) continue;
    if (!colorMap.has(c)) colorMap.set(c, { hex: m.analysis.dominantHex, conf: m.analysis.confidence });
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

  const cover = pickCover(members);
  const analysisConf =
    members.reduce((s, m) => s + (m.analysis.confidence ?? 0), 0) / Math.max(1, members.length);
  // Confiance finale = mélange confiance d'analyse + cohésion visuelle du groupe.
  const confidence = 0.5 * analysisConf + 0.5 * cohesion(members, cover);

  return {
    signature,
    brand,
    model,
    productType,
    category,
    coverImageUrl: cover.imageUrl ?? members[0]?.imageUrl ?? null,
    fileIds: members.map((m) => m.fileId),
    variantLabelByFile,
    variants,
    colorNames: [...colorMap.keys()],
    sizes: [...sizeSet],
    confidence,
  };
}

/**
 * Regroupe les fichiers analysés en produits.
 * @param mode "auto" = regroupement par similarité visuelle (défaut),
 *             "per_image" = un produit par photo (option avancée).
 */
export function clusterAnalyses(
  files: AnalyzedFile[],
  mode: "auto" | "per_image" = "auto"
): Cluster[] {
  const groups: AnalyzedFile[][] =
    mode === "per_image" ? files.map((f) => [f]) : groupSimilarImages(files);

  const clusters = groups.map(buildCluster);
  // Produits les plus "riches" d'abord.
  clusters.sort((a, b) => b.fileIds.length - a.fileIds.length);
  return clusters;
}
