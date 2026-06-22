// Fonctions PURES de similarité visuelle (aucune dépendance navigateur).
// Utilisées par le clustering serveur ET par les tests. À garder sans I/O.

/** Empreintes + signaux d'une image, suffisants pour calculer une similarité. */
export type Fingerprint = {
  phash: string | null; // hash perceptuel moyen (hex)
  dhash: string | null; // hash perceptuel différentiel (hex)
  avgHex: string | null; // couleur dominante approx. (#RRGGBB)
  name: string | null; // nom de fichier original
  signature: string | null; // signature IA (marque + modèle + type)
  brand: string | null;
  model: string | null;
};

// Tokens de noms de fichiers génériques → aucun signal exploitable.
const GENERIC_NAME_TOKENS = new Set([
  "img", "image", "images", "dsc", "dscf", "photo", "photos", "picture", "pic",
  "produit", "product", "screenshot", "capture", "whatsapp", "wechat", "untitled",
  "scaled", "copy", "final", "export", "file", "jpg", "jpeg", "png", "webp", "gif",
]);

/** Distance de Hamming entre deux hash hexadécimaux de même longueur. */
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
  // Pénalise une différence de longueur (hash corrompu).
  dist += Math.abs(a.length - b.length) * 4;
  return dist;
}

/** Similarité 0..1 entre deux hash (64 bits = 16 hex). */
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

/** Similarité couleur 0..1 (distance euclidienne RGB normalisée). */
export function colorSimilarity(a: string | null, b: string | null): number | null {
  const ra = hexToRgb(a);
  const rb = hexToRgb(b);
  if (!ra || !rb) return null;
  const d = Math.sqrt(
    (ra[0] - rb[0]) ** 2 + (ra[1] - rb[1]) ** 2 + (ra[2] - rb[2]) ** 2
  );
  const maxD = Math.sqrt(3 * 255 * 255);
  return 1 - d / maxD;
}

function nameTokens(name: string | null): Set<string> {
  if (!name) return new Set();
  const toks = name
    .replace(/\.[a-z0-9]+$/i, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((t) => t.length > 1 && !/^\d+$/.test(t) && !GENERIC_NAME_TOKENS.has(t));
  return new Set(toks);
}

/** Similarité de noms de fichiers (Jaccard sur tokens significatifs). */
export function nameSimilarity(a: string | null, b: string | null): number | null {
  const ta = nameTokens(a);
  const tb = nameTokens(b);
  if (ta.size === 0 || tb.size === 0) return null;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  const union = ta.size + tb.size - inter;
  return union === 0 ? null : inter / union;
}

function specificSig(f: Fingerprint): string | null {
  // "Spécifique" = signature contenant une marque ou un modèle reconnu.
  if (!f.brand && !f.model) return null;
  const sig = (f.signature ?? `${f.brand ?? ""} ${f.model ?? ""}`).trim().toLowerCase();
  return sig || null;
}

/**
 * Score de similarité combiné 0..1 entre deux images.
 * Combine empreinte visuelle, couleur dominante, nom de fichier et signature IA.
 */
export function combinedSimilarity(a: Fingerprint, b: Fingerprint): number {
  const aHashSim = hashSimilarity(a.phash, b.phash);
  const dHashSim = hashSimilarity(a.dhash, b.dhash);
  const visual =
    aHashSim != null && dHashSim != null
      ? (aHashSim + dHashSim) / 2
      : (aHashSim ?? dHashSim);
  const color = colorSimilarity(a.avgHex, b.avgHex);
  const name = nameSimilarity(a.name, b.name);

  const sigA = specificSig(a);
  const sigB = specificSig(b);

  // Aucun signal visuel : repli sur signature IA (comportement historique).
  if (visual == null && color == null) {
    if (sigA && sigB) return sigA === sigB ? 0.9 : 0.2;
    return name ?? 0;
  }

  let score = 0;
  let weight = 0;
  if (visual != null) {
    score += 0.6 * visual;
    weight += 0.6;
  }
  if (color != null) {
    score += 0.25 * color;
    weight += 0.25;
  }
  if (name != null) {
    score += 0.15 * name;
    weight += 0.15;
  }
  let base = weight > 0 ? score / weight : 0;

  // La signature IA spécifique surclasse les heuristiques visuelles.
  if (sigA && sigB) {
    if (sigA === sigB) base = Math.max(base, 0.9);
    else base = Math.min(base, 0.55); // produits connus distincts
  }
  return base;
}

export const SIMILARITY_THRESHOLD = 0.8;
