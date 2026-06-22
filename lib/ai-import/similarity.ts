// Fonctions PURES de similarité (aucune dépendance navigateur).
// Score sémantique (marque, catégorie, couleur) prioritaire sur le fingerprint visuel
// pour regrouper les photos d'un même produit sous différents angles.

/** Empreintes + signaux sémantiques d'une image. */
export type Fingerprint = {
  phash: string | null;
  dhash: string | null;
  avgHex: string | null;
  name: string | null;
  signature: string | null;
  brand: string | null;
  model: string | null;
  category: string | null;
  productType: string | null;
  mainColor: string | null;
  detectedText: string | null;
};

export type ComparisonResult = {
  imageA: string;
  imageB: string;
  brandMatch: boolean | null;
  categoryMatch: boolean | null;
  colorMatch: boolean | null;
  modelMatch: boolean | null;
  visualScore: number | null;
  semanticScore: number;
  finalScore: number;
  decision: "grouped" | "separated";
  forcedGroup: boolean;
};

/** Seuil de regroupement (tolérant aux angles différents). */
export const SIMILARITY_THRESHOLD = 0.55;
export const MERGE_THRESHOLD = 0.55;

const GENERIC_SIGNATURES = new Set(["produit", "product", "unknown", "item", "article"]);

const GENERIC_NAME_TOKENS = new Set([
  "img", "image", "images", "dsc", "dscf", "photo", "photos", "picture", "pic",
  "produit", "product", "screenshot", "capture", "whatsapp", "wechat", "untitled",
  "scaled", "copy", "final", "export", "file", "jpg", "jpeg", "png", "webp", "gif",
]);

function norm(s: string | null | undefined): string {
  return (s ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isSpecificSignature(sig: string | null): boolean {
  const n = norm(sig);
  return n.length > 0 && !GENERIC_SIGNATURES.has(n);
}

/** Match flou : égalité, inclusion, ou alias courants (LV ↔ Louis Vuitton). */
function fieldMatch(a: string | null, b: string | null): boolean | null {
  const na = norm(a);
  const nb = norm(b);
  if (!na || !nb) return null;
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;
  // Alias marque
  if ((na === "lv" && nb.includes("vuitton")) || (nb === "lv" && na.includes("vuitton"))) return true;
  return false;
}

export function hammingHex(a: string, b: string): number {
  const len = Math.min(a.length, b.length);
  let dist = 0;
  for (let i = 0; i < len; i++) {
    let x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    while (x) {
      dist += x & 1;
      x >>= 1;
    }
  }
  dist += Math.abs(a.length - b.length) * 4;
  return dist;
}

export function hashSimilarity(a: string | null, b: string | null): number | null {
  if (!a || !b) return null;
  const bits = Math.max(a.length, b.length) * 4;
  if (bits === 0) return null;
  return 1 - hammingHex(a, b) / bits;
}

function hexToRgb(hex: string | null): [number, number, number] | null {
  if (!hex) return null;
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function colorSimilarity(a: string | null, b: string | null): number | null {
  const ra = hexToRgb(a);
  const rb = hexToRgb(b);
  if (!ra || !rb) return null;
  const d = Math.sqrt(
    (ra[0] - rb[0]) ** 2 + (ra[1] - rb[1]) ** 2 + (ra[2] - rb[2]) ** 2
  );
  return 1 - d / Math.sqrt(3 * 255 * 255);
}

function nameTokens(name: string | null): Set<string> {
  if (!name) return new Set();
  return new Set(
    name
      .replace(/\.[a-z0-9]+$/i, "")
      .toLowerCase()
      .split(/[^a-z0-9]+/i)
      .filter((t) => t.length > 1 && !/^\d+$/.test(t) && !GENERIC_NAME_TOKENS.has(t))
  );
}

export function nameSimilarity(a: string | null, b: string | null): number | null {
  const ta = nameTokens(a);
  const tb = nameTokens(b);
  if (ta.size === 0 || tb.size === 0) return null;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  const union = ta.size + tb.size - inter;
  return union === 0 ? null : inter / union;
}

function visualScore(a: Fingerprint, b: Fingerprint): number | null {
  const ph = hashSimilarity(a.phash, b.phash);
  const dh = hashSimilarity(a.dhash, b.dhash);
  if (ph != null && dh != null) return (ph + dh) / 2;
  return ph ?? dh;
}

type SemanticBreakdown = {
  brandMatch: boolean | null;
  categoryMatch: boolean | null;
  colorMatch: boolean | null;
  modelMatch: boolean | null;
  score: number;
};

/** Score sémantique 0..1 basé sur marque, catégorie, couleur, modèle. */
function semanticScore(a: Fingerprint, b: Fingerprint): SemanticBreakdown {
  const brandMatch = fieldMatch(a.brand, b.brand);
  const categoryMatch =
    fieldMatch(a.category, b.category) ?? fieldMatch(a.productType, b.productType);
  const modelMatch =
    fieldMatch(a.model, b.model) ??
    fieldMatch(a.productType, b.productType) ??
    (isSpecificSignature(a.signature) &&
    isSpecificSignature(b.signature) &&
    norm(a.signature) === norm(b.signature)
      ? true
      : null);

  let colorMatch = fieldMatch(a.mainColor, b.mainColor);
  if (colorMatch !== true) {
    const hexSim = colorSimilarity(a.avgHex, b.avgHex);
    if (hexSim != null && hexSim >= 0.78) colorMatch = true;
    else if (colorMatch === null && hexSim != null && hexSim >= 0.65) colorMatch = true;
  }

  // Texte détecté (logo, référence)
  if (a.detectedText && b.detectedText) {
    const ta = norm(a.detectedText);
    const tb = norm(b.detectedText);
    if (ta && tb && (ta === tb || ta.includes(tb) || tb.includes(ta))) {
      if (brandMatch === null && categoryMatch === null) {
        return { brandMatch: true, categoryMatch: null, colorMatch, modelMatch, score: 0.65 };
      }
    }
  }

  let score = 0;
  let weight = 0;
  if (brandMatch === true) {
    score += 0.32;
    weight += 0.32;
  } else if (brandMatch === false) {
    score -= 0.25;
    weight += 0.32;
  }
  if (categoryMatch === true) {
    score += 0.28;
    weight += 0.28;
  } else if (categoryMatch === false) {
    score -= 0.15;
    weight += 0.28;
  }
  if (colorMatch === true) {
    score += 0.28;
    weight += 0.28;
  } else if (colorMatch === false) {
    score -= 0.2;
    weight += 0.28;
  }
  if (modelMatch === true) {
    score += 0.12;
    weight += 0.12;
  }

  const normalized = weight > 0 ? Math.max(0, Math.min(1, score / weight)) : 0;
  return { brandMatch, categoryMatch, colorMatch, modelMatch, score: normalized };
}

function hasObviousContradiction(sem: SemanticBreakdown): boolean {
  // Marques différentes explicitement détectées → produits distincts.
  if (sem.brandMatch === false) return true;
  // Couleurs clairement différentes ET modèles différents.
  if (sem.colorMatch === false && sem.modelMatch === false) return true;
  return false;
}

export function clusterDebugEnabled(): boolean {
  return process.env.AI_IMPORT_CLUSTER_DEBUG === "1" || process.env.AI_IMPORT_CLUSTER_DEBUG === "true";
}

function logComparison(result: ComparisonResult): void {
  console.info(
    "[AI Import][cluster-debug]",
    JSON.stringify({
      imageA: result.imageA,
      imageB: result.imageB,
      brandMatch: result.brandMatch,
      categoryMatch: result.categoryMatch,
      colorMatch: result.colorMatch,
      modelMatch: result.modelMatch,
      visualScore: result.visualScore,
      semanticScore: result.semanticScore,
      finalScore: result.finalScore,
      decision: result.decision,
      forcedGroup: result.forcedGroup,
    })
  );
}

/**
 * Compare deux images et renvoie le détail complet (scores + décision).
 * @param threshold seuil pour decision grouped/separated
 */
export function compareImages(
  a: Fingerprint,
  b: Fingerprint,
  opts?: { threshold?: number; labelA?: string; labelB?: string; debug?: boolean }
): ComparisonResult {
  const threshold = opts?.threshold ?? SIMILARITY_THRESHOLD;
  const labelA = opts?.labelA ?? a.name ?? "imageA";
  const labelB = opts?.labelB ?? b.name ?? "imageB";
  const debug = opts?.debug ?? clusterDebugEnabled();

  const visual = visualScore(a, b);
  const hexSim = colorSimilarity(a.avgHex, b.avgHex);
  const name = nameSimilarity(a.name, b.name);
  const sem = semanticScore(a, b);
  const hasSemanticSignal =
    sem.brandMatch !== null ||
    sem.categoryMatch !== null ||
    sem.colorMatch !== null ||
    sem.modelMatch !== null;

  // Score combiné : sémantique prioritaire quand disponible, sinon visuel dominant.
  let combined = 0;
  let w = 0;
  if (hasSemanticSignal) {
    combined += 0.55 * sem.score;
    w += 0.55;
  }
  if (visual != null) {
    combined += (hasSemanticSignal ? 0.2 : 0.6) * visual;
    w += hasSemanticSignal ? 0.2 : 0.6;
  }
  if (hexSim != null) {
    combined += (hasSemanticSignal ? 0.15 : 0.25) * hexSim;
    w += hasSemanticSignal ? 0.15 : 0.25;
  }
  if (name != null) {
    combined += 0.1 * name;
    w += 0.1;
  }
  let finalScore = w > 0 ? combined / w : sem.score;

  let forcedGroup = false;

  // Règle 1 : même catégorie + marque + couleur → même produit (angles OK).
  if (sem.brandMatch === true && sem.categoryMatch === true && sem.colorMatch === true) {
    finalScore = Math.max(finalScore, 0.88);
    forcedGroup = true;
  }
  // Règle 2 : même marque + même couleur → regrouper même si angle différent.
  else if (sem.brandMatch === true && sem.colorMatch === true) {
    finalScore = Math.max(finalScore, 0.72);
    forcedGroup = true;
  }
  // Règle 3 : même marque + même modèle.
  else if (sem.brandMatch === true && sem.modelMatch === true) {
    finalScore = Math.max(finalScore, 0.68);
    forcedGroup = true;
  }
  // Même couleur forte + visuel modéré (1 vs 2 chaussures, détails d'angle).
  else if (sem.colorMatch === true && (visual == null || visual >= 0.35)) {
    finalScore = Math.max(finalScore, 0.62);
  }
  // Quasi-duplicat visuel.
  if (visual != null && visual >= 0.82) {
    finalScore = Math.max(finalScore, 0.85);
  }

  // Contradiction évidente → ne pas forcer le regroupement.
  if (hasObviousContradiction(sem) && !forcedGroup) {
    finalScore = Math.min(finalScore, 0.4);
  } else if (hasObviousContradiction(sem) && forcedGroup) {
    // brand+category+color matchent → on garde le force malgré modèle absent.
    if (!(sem.brandMatch === true && sem.categoryMatch === true && sem.colorMatch === true)) {
      finalScore = Math.min(finalScore, 0.5);
      forcedGroup = false;
    }
  }

  finalScore = Math.max(0, Math.min(1, finalScore));

  const result: ComparisonResult = {
    imageA: labelA,
    imageB: labelB,
    brandMatch: sem.brandMatch,
    categoryMatch: sem.categoryMatch,
    colorMatch: sem.colorMatch,
    modelMatch: sem.modelMatch,
    visualScore: visual,
    semanticScore: sem.score,
    finalScore,
    decision: finalScore >= threshold ? "grouped" : "separated",
    forcedGroup,
  };

  if (debug) logComparison(result);
  return result;
}

/** Score final 0..1 (raccourci). */
export function combinedSimilarity(a: Fingerprint, b: Fingerprint): number {
  return compareImages(a, b).finalScore;
}

/** Clé sémantique pour fusion de groupes (brand|category|color). */
export function semanticGroupKey(fp: Fingerprint): string | null {
  const b = norm(fp.brand);
  const c = norm(fp.category ?? fp.productType);
  const col = norm(fp.mainColor);
  if (b && c && col) return `${b}|${c}|${col}`;
  if (b && col) return `${b}|*|${col}`;
  return null;
}
