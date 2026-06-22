// Test C : 20 photos simulées (5 produits × 4 photos).
// Même marque / catégorie / couleur, modèles et empreintes visuelles distincts.
// Lancer : npx tsx scripts/test-grouping.ts
// Attendu : 5 groupes détectés, 4 photos chacun.

import { groupSimilarImages, type AnalyzedFile } from "../lib/ai-import/clustering";
import type { ImageAnalysis } from "../lib/ai-import/types";

const MODELS = ["LV Trainer", "LV Skate", "LV Run Away", "LV Maxi", "LV Beaubourg"];
const BASE_HASH = [
  "0000000000000000",
  "ffffffffffffffff",
  "0f0f0f0f0f0f0f0f",
  "f0f0f0f0f0f0f0f0",
  "aaaaaaaaaaaaaaaa",
];
const BASE_COLOR = ["#888888", "#888888", "#888888", "#888888", "#888888"];

function perturb(hash: string, k: number): string {
  const last = parseInt(hash.slice(-1), 16) ^ (k & 0xf);
  return hash.slice(0, -1) + last.toString(16);
}

function productAnalysis(productIdx: number): ImageAnalysis {
  const model = MODELS[productIdx];
  return {
    productType: "Sneaker",
    brand: "Louis Vuitton",
    model,
    category: "Sneakers",
    colorName: "Gris",
    dominantHex: BASE_COLOR[productIdx],
    colors: ["Gris"],
    signature: `louis vuitton ${model.toLowerCase()} sneaker gris`,
    size: null,
    confidence: 0.85,
    raw: { brand: "Louis Vuitton", model, logo: "LV" },
  };
}

const files: AnalyzedFile[] = [];
let order = 0;
for (let photo = 0; photo < 4; photo++) {
  for (let product = 0; product < 5; product++) {
    files.push({
      fileId: `f-${product}-${photo}`,
      imageUrl: `https://example.com/IMG_${String(order).padStart(3, "0")}.jpg`,
      sortOrder: order,
      name: `IMG_${String(order).padStart(3, "0")}.jpg`,
      phash: perturb(BASE_HASH[product], photo),
      dhash: perturb(BASE_HASH[product], photo + 1),
      avgHex: BASE_COLOR[product],
      analysis: productAnalysis(product),
    });
    order++;
  }
}

const groups = groupSimilarImages(files);

console.log(`Photos en entrée : ${files.length}`);
console.log(`Groupes détectés : ${groups.length}`);
groups.forEach((g, i) => {
  const model = g[0]?.analysis.model ?? "?";
  console.log(`  Produit ${i + 1} (${model}) → ${g.length} photo(s)`);
});

const ok = groups.length === 5 && groups.every((g) => g.length === 4);
if (!ok) {
  console.error("\n❌ ÉCHEC : attendu 5 groupes de 4 photos.");
  process.exit(1);
}
console.log("\n✅ SUCCÈS : 20 images → 5 groupes (4 photos par produit).");
