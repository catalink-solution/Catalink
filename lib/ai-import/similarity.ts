// Fonctions PURES de similarité (aucune dépendance navigateur).
// Équilibre : regrouper les angles d'un même produit, séparer des produits
// différents même s'ils partagent marque / catégorie / couleur.

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
  signatureSimilarity: number | null;
  detectedTextSimilarity: number | null;
  semanticScore: number;
  finalScore: number;
  decision: "grouped" | "separated";
  reason: string;
  signalsUsed: string[];
};

/** Seuil direct : finalScore >= GROUP_THRESHOLD → même produit. */
export const GROUP_THRESHOLD = 0.7;
export const SIMILARITY_THRESHOLD = GROUP_THRESHOLD;
export const MERGE_THRESHOLD = GROUP_THRESHOLD;

const SIGNATURE_STRONG = 0.65;
const VISUAL_SECONDARY = 0.5;
const TEXT_STRONG = 0.65;

const SIGNATURE_STOP_TOKENS = new Set([
  "sneaker", "sneakers", "shoe", "shoes", "chaussure", "chaussures",
  "gris", "grey", "gray", "noir", "black", "blanc", "white",
  "louis", "vuitton", "lv", "produit", "product",
]);

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

function tokens(s: string | null): Set<string> {
  if (!s) return new Set();
  return new Set(
    norm(s)
      .split(/[^a-z0-9]+/i)
      .filter((t) => t.length > 1 && !GENERIC_NAME_TOKENS.has(t))
  );
}

function jaccard(a: Set<string>, b: Set<string>): number | null {
  if (a.size === 0 || b.size === 0) return null;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? null : inter / union;
}

function isSpecificSignature(sig: string | null): boolean {
  const n = norm(sig);
  return n.length > 0 && !GENERIC_SIGNATURES.has(n);
}

/** Match flou : égalité, inclusion, alias (LV ↔ Louis Vuitton). */
function fieldMatch(a: string | null, b: string | null): boolean | null {
  const na = norm(a);
  const nb = norm(b);
  if (!na || !nb) return null;
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;
  if ((na === "lv" && nb.includes("vuitton")) || (nb === "lv" && na.includes("vuitton"))) return true;
  return false;
}

/** Match modèle strict (champ model uniquement, pas productType). */
function modelMatchStrict(a: Fingerprint, b: Fingerprint): boolean | null {
  return fieldMatch(a.model, b.model);
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
  return jaccard(ta, tb);
}

function visualScore(a: Fingerprint, b: Fingerprint): number | null {
  const ph = hashSimilarity(a.phash, b.phash);
  const dh = hashSimilarity(a.dhash, b.dhash);
  if (ph != null && dh != null) return (ph + dh) / 2;
  return ph ?? dh;
}

function distinctiveTokens(sig: string | null, fp: Fingerprint): Set<string> {
  const base = tokens(sig);
  const skip = new Set(SIGNATURE_STOP_TOKENS);
  for (const t of tokens(fp.brand)) skip.add(t);
  for (const t of tokens(fp.category)) skip.add(t);
  for (const t of tokens(fp.productType)) skip.add(t);
  for (const t of tokens(fp.mainColor)) skip.add(t);
  for (const t of tokens(fp.model)) skip.add(t);
  return new Set([...base].filter((t) => !skip.has(t)));
}

function signatureSimilarity(a: Fingerprint, b: Fingerprint): number | null {
  if (!isSpecificSignature(a.signature) || !isSpecificSignature(b.signature)) return null;
  if (norm(a.signature) === norm(b.signature)) return 1;

  const ta = distinctiveTokens(a.signature, a);
  const tb = distinctiveTokens(b.signature, b);
  const distinctive = jaccard(ta, tb);
  if (distinctive != null) return distinctive;

  return jaccard(tokens(a.signature), tokens(b.signature));
}

function detectedTextSimilarity(a: Fingerprint, b: Fingerprint): number | null {
  if (!a.detectedText || !b.detectedText) return null;
  const ta = tokens(a.detectedText);
  const tb = tokens(b.detectedText);
  const j = jaccard(ta, tb);
  if (j != null && j >= 0.5) return j;
  const na = norm(a.detectedText);
  const nb = norm(b.detectedText);
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.85;
  return j;
}

type SemanticBreakdown = {
  brandMatch: boolean | null;
  categoryMatch: boolean | null;
  colorMatch: boolean | null;
  modelMatch: boolean | null;
  score: number;
};

function semanticScore(a: Fingerprint, b: Fingerprint): SemanticBreakdown {
  const brandMatch = fieldMatch(a.brand, b.brand);
  const categoryMatch =
    fieldMatch(a.category, b.category) ?? fieldMatch(a.productType, b.productType);
  const modelMatch = modelMatchStrict(a, b);

  let colorMatch = fieldMatch(a.mainColor, b.mainColor);
  if (colorMatch !== true) {
    const hexSim = colorSimilarity(a.avgHex, b.avgHex);
    if (hexSim != null && hexSim >= 0.78) colorMatch = true;
    else if (colorMatch === null && hexSim != null && hexSim >= 0.65) colorMatch = true;
  }

  let score = 0;
  let weight = 0;
  if (brandMatch === true) {
    score += 0.22;
    weight += 0.22;
  } else if (brandMatch === false) {
    score -= 0.3;
    weight += 0.22;
  }
  if (categoryMatch === true) {
    score += 0.18;
    weight += 0.18;
  } else if (categoryMatch === false) {
    score -= 0.15;
    weight += 0.18;
  }
  if (colorMatch === true) {
    score += 0.18;
    weight += 0.18;
  } else if (colorMatch === false) {
    score -= 0.2;
    weight += 0.18;
  }
  if (modelMatch === true) {
    score += 0.28;
    weight += 0.28;
  } else if (modelMatch === false) {
    score -= 0.35;
    weight += 0.28;
  }

  const normalized = weight > 0 ? Math.max(0, Math.min(1, score / weight)) : 0;
  return { brandMatch, categoryMatch, colorMatch, modelMatch, score: normalized };
}

function bothModelsSet(a: Fingerprint, b: Fingerprint): boolean {
  return Boolean(norm(a.model) && norm(b.model));
}

function countStrongSignals(
  modelMatch: boolean | null,
  sigSim: number | null,
  visual: number | null,
  textSim: number | null
): { count: number; labels: string[] } {
  const labels: string[] = [];
  if (modelMatch === true) labels.push("modelMatch");
  if (sigSim != null && sigSim >= SIGNATURE_STRONG) labels.push(`signature>=${SIGNATURE_STRONG}`);
  if (modelMatch !== false && visual != null && visual >= VISUAL_SECONDARY) {
    labels.push(`visual>=${VISUAL_SECONDARY}`);
  }
  if (modelMatch !== false && textSim != null && textSim >= TEXT_STRONG) {
    labels.push(`detectedText>=${TEXT_STRONG}`);
  }
  return { count: labels.length, labels };
}

export function clusterDebugEnabled(): boolean {
  return process.env.AI_IMPORT_CLUSTER_DEBUG === "1" || process.env.AI_IMPORT_CLUSTER_DEBUG === "true";
}

function logComparison(result: ComparisonResult): void {
  console.info("[AI Import][cluster-debug]", JSON.stringify(result));
}

/**
 * Décision de regroupement :
 * - finalScore >= 0.70 → groupé
 * - OU brand+category+color ET au moins 1 signal fort (model/signature/visual/text)
 * brand+category+color seul ne suffit JAMAIS.
 */
function decideGrouping(
  finalScore: number,
  sem: SemanticBreakdown,
  sigSim: number | null,
  visual: number | null,
  textSim: number | null,
  a: Fingerprint,
  b: Fingerprint
): { decision: "grouped" | "separated"; reason: string; signalsUsed: string[] } {
  const bcc =
    sem.brandMatch === true && sem.categoryMatch === true && sem.colorMatch === true;
  const strong = countStrongSignals(sem.modelMatch, sigSim, visual, textSim);
  const signalsUsed = [...strong.labels];
  if (bcc) signalsUsed.unshift("brand+category+color");

  if (finalScore >= GROUP_THRESHOLD) {
    return {
      decision: "grouped",
      reason: `finalScore ${finalScore.toFixed(2)} >= ${GROUP_THRESHOLD}`,
      signalsUsed,
    };
  }

  if (visual != null && visual >= 0.85) {
    return {
      decision: "grouped",
      reason: `quasi-duplicat visuel (${visual.toFixed(2)})`,
      signalsUsed: [...signalsUsed, "visual>=0.85"],
    };
  }

  // Modèles différents explicitement détectés → séparer (sauf quasi-duplicat visuel ci-dessus).
  if (sem.modelMatch === false && bothModelsSet(a, b)) {
    return {
      decision: "separated",
      reason: `modèles différents (${norm(a.model)} vs ${norm(b.model)})`,
      signalsUsed,
    };
  }

  if (bcc && strong.count >= 1) {
    return {
      decision: "grouped",
      reason: `brand+category+color + signal fort (${strong.labels.join(", ")})`,
      signalsUsed,
    };
  }

  if (bcc && strong.count === 0) {
    return {
      decision: "separated",
      reason: "brand+category+color seul — aucun signal fort (model/signature/visual/text)",
      signalsUsed,
    };
  }

  if (
    isSpecificSignature(a.signature) &&
    isSpecificSignature(b.signature) &&
    sigSim != null &&
    sigSim < 0.35
  ) {
    return {
      decision: "separated",
      reason: `signatures IA trop différentes (${sigSim.toFixed(2)})`,
      signalsUsed,
    };
  }

  return {
    decision: "separated",
    reason: `finalScore ${finalScore.toFixed(2)} < ${GROUP_THRESHOLD}, signaux forts insuffisants`,
    signalsUsed,
  };
}

export function compareImages(
  a: Fingerprint,
  b: Fingerprint,
  opts?: { labelA?: string; labelB?: string; debug?: boolean }
): ComparisonResult {
  const labelA = opts?.labelA ?? a.name ?? "imageA";
  const labelB = opts?.labelB ?? b.name ?? "imageB";
  const debug = opts?.debug ?? clusterDebugEnabled();

  const visual = visualScore(a, b);
  const hexSim = colorSimilarity(a.avgHex, b.avgHex);
  const name = nameSimilarity(a.name, b.name);
  const sigSim = signatureSimilarity(a, b);
  const textSim = detectedTextSimilarity(a, b);
  const sem = semanticScore(a, b);

  const hasSemantic =
    sem.brandMatch !== null ||
    sem.categoryMatch !== null ||
    sem.colorMatch !== null ||
    sem.modelMatch !== null;

  let combined = 0;
  let w = 0;
  if (hasSemantic) {
    combined += 0.4 * sem.score;
    w += 0.4;
  }
  if (sigSim != null) {
    combined += 0.2 * sigSim;
    w += 0.2;
  }
  if (visual != null) {
    combined += (hasSemantic ? 0.25 : 0.55) * visual;
    w += hasSemantic ? 0.25 : 0.55;
  }
  if (textSim != null) {
    combined += 0.1 * textSim;
    w += 0.1;
  }
  if (hexSim != null) {
    combined += 0.1 * hexSim;
    w += 0.1;
  }
  if (name != null) {
    combined += 0.05 * name;
    w += 0.05;
  }

  let finalScore = w > 0 ? combined / w : 0;

  // Boost modéré si brand+category+color (ne suffit pas seul à fusionner).
  const bcc =
    sem.brandMatch === true && sem.categoryMatch === true && sem.colorMatch === true;
  if (bcc) finalScore = Math.min(0.69, finalScore + 0.12);

  // Pénalités fortes
  if (sem.brandMatch === false) finalScore -= 0.35;
  if (sem.modelMatch === false) finalScore -= 0.4;
  if (
    isSpecificSignature(a.signature) &&
    isSpecificSignature(b.signature) &&
    sigSim != null &&
    sigSim < 0.35
  ) {
    finalScore -= 0.35;
  }
  if (sem.colorMatch === false && sem.modelMatch === false) finalScore -= 0.2;

  finalScore = Math.max(0, Math.min(1, finalScore));

  const { decision, reason, signalsUsed } = decideGrouping(
    finalScore,
    sem,
    sigSim,
    visual,
    textSim,
    a,
    b
  );

  const result: ComparisonResult = {
    imageA: labelA,
    imageB: labelB,
    brandMatch: sem.brandMatch,
    categoryMatch: sem.categoryMatch,
    colorMatch: sem.colorMatch,
    modelMatch: sem.modelMatch,
    visualScore: visual,
    signatureSimilarity: sigSim,
    detectedTextSimilarity: textSim,
    semanticScore: sem.score,
    finalScore,
    decision,
    reason,
    signalsUsed,
  };

  if (debug) logComparison(result);
  return result;
}

/** Score final 0..1 (raccourci). */
export function combinedSimilarity(a: Fingerprint, b: Fingerprint): number {
  return compareImages(a, b).finalScore;
}

/** Regroupe si la décision l'indique. */
export function shouldGroupImages(a: Fingerprint, b: Fingerprint, debug?: boolean): boolean {
  return compareImages(a, b, { debug }).decision === "grouped";
}
