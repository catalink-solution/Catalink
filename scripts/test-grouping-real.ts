// Test réel : 4 photos du même produit (LV Trainer grise) sous angles différents.
// Empreintes visuelles très différentes, mais marque + catégorie + couleur identiques.
// Attendu : 4 images → 1 groupe.
//
// Lancer : npx tsx scripts/test-grouping-real.ts

import { groupSimilarImages, clusterAnalyses, type AnalyzedFile } from "../lib/ai-import/clustering";
import type { ImageAnalysis } from "../lib/ai-import/types";

function lvAnalysis(angle: string): ImageAnalysis {
  return {
    productType: "Sneaker",
    brand: "Louis Vuitton",
    model: "LV Trainer",
    category: "Sneakers",
    colorName: "Gris",
    dominantHex: "#9a9a9a",
    colors: ["Gris"],
    signature: "louis vuitton lv trainer sneaker",
    size: null,
    confidence: 0.85,
    raw: { brand: "Louis Vuitton", model: "LV Trainer", logo: "LV" },
  };
}

// Empreintes volontairement très différentes (angles / 1 vs 2 chaussures).
const VISUAL_HASHES = [
  { phash: "0000000000000000", dhash: "1111111111111111", avgHex: "#888888" },
  { phash: "ffffffffffffffff", dhash: "eeeeeeeeeeeeeeee", avgHex: "#aaaaaa" },
  { phash: "aaaaaaaa55555555", dhash: "cccccccc33333333", avgHex: "#999999" },
  { phash: "1234567890abcdef", dhash: "fedcba0987654321", avgHex: "#b0b0b0" },
];

const angles = ["vue_avant", "vue_cote", "vue_detail", "vue_portee"];

const files: AnalyzedFile[] = angles.map((angle, i) => ({
  fileId: `lv-${i}`,
  imageUrl: `https://example.com/lv_trainer_grise_${angle}.jpg`,
  sortOrder: i,
  name: `lv_trainer_grise_${angle}.jpg`,
  phash: VISUAL_HASHES[i].phash,
  dhash: VISUAL_HASHES[i].dhash,
  avgHex: VISUAL_HASHES[i].avgHex,
  analysis: lvAnalysis(angle),
}));

const groups = groupSimilarImages(files);
const clusters = clusterAnalyses(files);

console.log(`Images : ${files.length}`);
console.log(`Groupes : ${groups.length}`);
groups.forEach((g, i) =>
  console.log(`  Groupe ${i + 1} : ${g.length} photo(s) — ${g.map((f) => f.name).join(", ")}`)
);
console.log(`Produits détectés (clusters) : ${clusters.length}`);

const ok = groups.length === 1 && groups[0].length === 4 && clusters.length === 1;
if (!ok) {
  console.error("\n❌ ÉCHEC : attendu 4 images → 1 groupe → 1 produit.");
  process.exit(1);
}
console.log("\n✅ SUCCÈS : 4 photos LV grise → 1 groupe → 1 produit détecté.");
