// Test B : 4 produits différents, même marque / catégorie / couleur.
// Attendu : 4 images → 4 groupes.
//
// Lancer : npx tsx scripts/test-grouping-b.ts

import { groupSimilarImages, clusterAnalyses, type AnalyzedFile } from "../lib/ai-import/clustering";
import type { ImageAnalysis } from "../lib/ai-import/types";

const PRODUCTS = [
  {
    model: "LV Trainer",
    signature: "louis vuitton lv trainer sneaker gris",
    raw: { brand: "Louis Vuitton", model: "LV Trainer", logo: "LV Trainer" },
    phash: "0000000000000000",
    dhash: "1111111111111111",
  },
  {
    model: "LV Skate",
    signature: "louis vuitton lv skate sneaker gris",
    raw: { brand: "Louis Vuitton", model: "LV Skate", logo: "LV Skate" },
    phash: "ffffffffffffffff",
    dhash: "eeeeeeeeeeeeeeee",
  },
  {
    model: "LV Run Away",
    signature: "louis vuitton run away sneaker gris",
    raw: { brand: "Louis Vuitton", model: "LV Run Away", logo: "LV" },
    phash: "aaaaaaaa55555555",
    dhash: "cccccccc33333333",
  },
  {
    model: "LV Maxi",
    signature: "louis vuitton maxi sneaker gris",
    raw: { brand: "Louis Vuitton", model: "LV Maxi", logo: "LV" },
    phash: "1234567890abcdef",
    dhash: "fedcba0987654321",
  },
];

function analysis(p: (typeof PRODUCTS)[0]): ImageAnalysis {
  return {
    productType: "Sneaker",
    brand: "Louis Vuitton",
    model: p.model,
    category: "Sneakers",
    colorName: "Gris",
    dominantHex: "#9a9a9a",
    colors: ["Gris"],
    signature: p.signature,
    size: null,
    confidence: 0.85,
    raw: p.raw,
  };
}

const files: AnalyzedFile[] = PRODUCTS.map((p, i) => ({
  fileId: `lv-${i}`,
  imageUrl: `https://example.com/${p.model.replace(/\s+/g, "_").toLowerCase()}.jpg`,
  sortOrder: i,
  name: `${p.model.replace(/\s+/g, "_").toLowerCase()}.jpg`,
  phash: p.phash,
  dhash: p.dhash,
  avgHex: "#9a9a9a",
  analysis: analysis(p),
}));

const groups = groupSimilarImages(files);
const clusters = clusterAnalyses(files);

console.log(`Images : ${files.length}`);
console.log(`Groupes : ${groups.length}`);
groups.forEach((g, i) =>
  console.log(`  Groupe ${i + 1} : ${g.length} photo(s) — ${g.map((f) => f.analysis.model).join(", ")}`)
);
console.log(`Produits détectés (clusters) : ${clusters.length}`);

const ok = groups.length === 4 && groups.every((g) => g.length === 1) && clusters.length === 4;
if (!ok) {
  console.error("\n❌ ÉCHEC : attendu 4 images → 4 groupes → 4 produits.");
  process.exit(1);
}
console.log("\n✅ SUCCÈS : 4 produits LV distincts (même marque/cat/couleur) → 4 groupes.");
