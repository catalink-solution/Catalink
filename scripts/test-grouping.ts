// Test du regroupement visuel : 20 photos simulées (5 produits × 4 photos).
// Lancer : npx tsx scripts/test-grouping.ts
// Attendu : 5 groupes détectés, ~4 photos chacun. Les noms de fichiers sont
// génériques (IMG_xxx) → seul le signal visuel (empreinte + couleur) regroupe.

import { groupSimilarImages, type AnalyzedFile } from "../lib/ai-import/clustering";
import type { ImageAnalysis } from "../lib/ai-import/types";

// 5 empreintes de base très distinctes (16 hex = 64 bits).
const BASE_HASH = [
  "0000000000000000",
  "ffffffffffffffff",
  "0f0f0f0f0f0f0f0f",
  "f0f0f0f0f0f0f0f0",
  "aaaaaaaaaaaaaaaa",
];
const BASE_COLOR = ["#101010", "#f0f0f0", "#cc2222", "#2244cc", "#22aa55"];

// Petite perturbation déterministe (1 à 3 bits) pour simuler des angles différents.
function perturb(hash: string, k: number): string {
  const last = parseInt(hash.slice(-1), 16) ^ (k & 0xf);
  return hash.slice(0, -1) + last.toString(16);
}

function blankAnalysis(): ImageAnalysis {
  return {
    productType: null,
    brand: null,
    model: null,
    category: null,
    colorName: null,
    dominantHex: null,
    colors: [],
    signature: "produit",
    size: null,
    confidence: 0.4,
  };
}

const files: AnalyzedFile[] = [];
let order = 0;
// Interleave : on alterne les produits pour prouver que le regroupement est
// visuel et non basé sur l'ordre d'upload.
for (let photo = 0; photo < 4; photo++) {
  for (let product = 0; product < 5; product++) {
    files.push({
      fileId: `f-${product}-${photo}`,
      imageUrl: `https://example.com/IMG_${String(order).padStart(3, "0")}.jpg`,
      sortOrder: order,
      name: `IMG_${String(order).padStart(3, "0")}.jpg`,
      phash: perturb(BASE_HASH[product], photo),
      dhash: perturb(BASE_HASH[product], photo),
      avgHex: BASE_COLOR[product],
      analysis: blankAnalysis(),
    });
    order++;
  }
}

const groups = groupSimilarImages(files);

console.log(`Photos en entrée : ${files.length}`);
console.log(`Groupes détectés : ${groups.length}`);
groups.forEach((g, i) => console.log(`  Produit ${i + 1} → ${g.length} photo(s)`));

const ok = groups.length === 5 && groups.every((g) => g.length === 4);
if (!ok) {
  console.error("\n❌ ÉCHEC : attendu 5 groupes de 4 photos.");
  process.exit(1);
}
console.log("\n✅ SUCCÈS : 5 produits détectés, 4 photos chacun.");
