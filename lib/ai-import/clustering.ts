// Regroupement (clustering) des images analysées en produits + variantes.
// Équilibre : angles d'un même produit regroupés, produits distincts séparés
// même s'ils partagent marque / catégorie / couleur.

import type { ImageAnalysis } from "./types";
import {
  compareImages,
  hammingHex,
  SIMILARITY_THRESHOLD,
  MERGE_THRESHOLD,
  clusterDebugEnabled,
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

function extractDetectedText(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const parts = [r.brand, r.model, r.productType, r.text, r.logo].filter(
    (x) => typeof x === "string" && x.trim()
  ) as string[];
  return parts.length ? parts.join(" ") : null;
}

function fileLabel(f: AnalyzedFile): string {
  return f.name ?? f.fileId;
}

export function toFingerprint(f: AnalyzedFile): Fingerprint {
  return {
    phash: f.phash,
    dhash: f.dhash,
    avgHex: f.avgHex ?? f.analysis.dominantHex,
    name: f.name,
    signature: f.analysis.signature ?? null,
    brand: f.analysis.brand ?? null,
    model: f.analysis.model ?? null,
    category: f.analysis.category ?? null,
    productType: f.analysis.productType ?? null,
    mainColor: f.analysis.colorName ?? null,
    detectedText: extractDetectedText(f.analysis.raw),
  };
}

const MEMBERS_TO_COMPARE = 8;

function shouldDebugComparisons(fileCount: number): boolean {
  return clusterDebugEnabled() || fileCount <= 30;
}

function pairDecision(
  a: AnalyzedFile,
  b: AnalyzedFile,
  debug: boolean
): ReturnType<typeof compareImages> {
  return compareImages(toFingerprint(a), toFingerprint(b), {
    labelA: fileLabel(a),
    labelB: fileLabel(b),
    debug,
  });
}

/**
 * Regroupe les images représentant le même produit.
 * Décision via compareImages (score + signaux forts, pas de fusion brand/cat/couleur seule).
 */
export function groupSimilarImages(
  files: AnalyzedFile[],
  _threshold: number = SIMILARITY_THRESHOLD
): AnalyzedFile[][] {
  const ordered = [...files].sort((a, b) => a.sortOrder - b.sortOrder);
  const groups: AnalyzedFile[][] = [];
  const debug = shouldDebugComparisons(files.length);

  for (const f of ordered) {
    let bestIdx = -1;
    let bestScore = 0;
    let bestCmp: ReturnType<typeof compareImages> | null = null;

    for (let i = 0; i < groups.length; i++) {
      const members = groups[i];
      const sample =
        members.length <= MEMBERS_TO_COMPARE
          ? members
          : [...members.slice(0, MEMBERS_TO_COMPARE - 2), ...members.slice(-2)];

      for (const m of sample) {
        const cmp = pairDecision(f, m, debug);
        if (cmp.decision === "grouped" && cmp.finalScore > bestScore) {
          bestScore = cmp.finalScore;
          bestIdx = i;
          bestCmp = cmp;
        }
      }
    }

    if (bestIdx >= 0 && bestCmp) {
      if (debug) {
        console.info(
          "[AI Import][cluster]",
          JSON.stringify({
            action: "grouped",
            image: fileLabel(f),
            intoGroup: bestIdx,
            finalScore: bestCmp.finalScore,
            reason: bestCmp.reason,
            signalsUsed: bestCmp.signalsUsed,
          })
        );
      }
      groups[bestIdx].push(f);
    } else {
      if (debug) {
        console.info(
          "[AI Import][cluster]",
          JSON.stringify({
            action: "separated",
            image: fileLabel(f),
            reason: bestCmp?.reason ?? "aucun groupe compatible",
            finalScore: bestCmp?.finalScore ?? null,
            signalsUsed: bestCmp?.signalsUsed ?? [],
          })
        );
      }
      groups.push([f]);
    }
  }

  return mergeSimilarGroups(groups, debug);
}

/**
 * Fusionne les groupes proches (médoïdes compatibles selon compareImages).
 */
export function mergeSimilarGroups(
  groups: AnalyzedFile[][],
  debug: boolean = clusterDebugEnabled(),
  _threshold: number = MERGE_THRESHOLD
): AnalyzedFile[][] {
  let current = groups.map((m) => [...m]);
  let didMerge = true;
  let guard = 0;

  while (didMerge && guard++ < 1000) {
    didMerge = false;
    outer: for (let i = 0; i < current.length; i++) {
      for (let j = i + 1; j < current.length; j++) {
        const repA = pickCover(current[i]);
        const repB = pickCover(current[j]);
        const cmp = compareImages(toFingerprint(repA), toFingerprint(repB), {
          labelA: fileLabel(repA),
          labelB: fileLabel(repB),
          debug,
        });

        if (cmp.decision === "grouped") {
          if (debug) {
            console.info(
              "[AI Import][cluster]",
              JSON.stringify({
                action: "merge_groups",
                groupA: i,
                groupB: j,
                finalScore: cmp.finalScore,
                reason: cmp.reason,
                signalsUsed: cmp.signalsUsed,
              })
            );
          }
          current[i] = [...current[i], ...current[j]];
          current.splice(j, 1);
          didMerge = true;
          break outer;
        }
      }
    }
  }
  return current;
}

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
  return [...members].sort(
    (a, b) => (b.analysis.confidence ?? 0) - (a.analysis.confidence ?? 0)
  )[0];
}

function cohesion(members: AnalyzedFile[], cover: AnalyzedFile): number {
  if (members.length <= 1) return 1;
  let sum = 0;
  let n = 0;
  for (const m of members) {
    if (m === cover) continue;
    sum += pairDecision(cover, m, false).finalScore;
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
  const signature = mostCommon(members.map((m) => m.analysis.signature)) ?? "produit";

  const colorMap = new Map<string, { hex: string | null; conf: number }>();
  for (const m of members) {
    const c = m.analysis.colorName?.trim();
    if (!c) continue;
    if (!colorMap.has(c)) colorMap.set(c, { hex: m.analysis.dominantHex, conf: m.analysis.confidence });
  }
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

export function clusterAnalyses(
  files: AnalyzedFile[],
  mode: "auto" | "per_image" = "auto"
): Cluster[] {
  const groups: AnalyzedFile[][] =
    mode === "per_image" ? files.map((f) => [f]) : groupSimilarImages(files);

  const clusters = groups.map(buildCluster);
  clusters.sort((a, b) => b.fileIds.length - a.fileIds.length);
  return clusters;
}
