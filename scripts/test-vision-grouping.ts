// Tests unitaires du regroupement vision (sans appel API).
// Lancer : npx tsx scripts/test-vision-grouping.ts

import {
  parseVisionGroupingResponse,
  ensureAllFilesGrouped,
  splitIntoBatches,
  localFallbackGrouping,
} from "../lib/ai-import/vision-grouping";
import type { VisionGroupInput } from "../lib/ai-import/types";

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("❌", msg);
    process.exit(1);
  }
}

// ── parseVisionGroupingResponse ───────────────────────────────────────────────
const ids = new Set(["a", "b", "c", "d"]);
const parsed = parseVisionGroupingResponse(
  {
    groups: [
      { temporaryProductName: "LV Trainer", fileIds: ["a", "b", "c"], brand: "LV", confidence: 0.9 },
      { temporaryProductName: "LV Skate", fileIds: ["d"], brand: "LV", confidence: 0.85 },
    ],
  },
  ids
);
assert(parsed.length === 2, "parse: 2 groupes");
assert(parsed[0].fileIds.length === 3, "parse: groupe 1 = 3 photos");

// ── ensureAllFilesGrouped ─────────────────────────────────────────────────────
const orphan = ensureAllFilesGrouped(
  [
    { fileId: "a", imageUrl: "", sortOrder: 0 },
    { fileId: "b", imageUrl: "", sortOrder: 1 },
  ],
  [{ temporaryProductName: "G1", fileIds: ["a"], category: null, brand: null, mainColor: null, reason: "t", confidence: 0.8 }]
);
assert(orphan.length === 2, "orphan: 2 groupes");
assert(orphan.some((g) => g.fileIds.includes("b")), "orphan: b assigné");

// ── splitIntoBatches ─────────────────────────────────────────────────────────
const many = Array.from({ length: 50 }, (_, i) => ({
  fileId: `f${i}`,
  imageUrl: `http://x/${i}.jpg`,
  sortOrder: i,
}));
const batches = splitIntoBatches(many, 25);
assert(batches.length === 2, "50 images → 2 batches de 25");
assert(batches[0].length === 25 && batches[1].length === 25, "batch sizes");

// ── localFallback Test A : 4 photos même produit ─────────────────────────────
const sameProduct = (i: number): VisionGroupInput => ({
  fileId: `lv-${i}`,
  imageUrl: `http://x/lv_${i}.jpg`,
  sortOrder: i,
  name: `lv_${i}.jpg`,
  phash: ["0000000000000000", "ffffffffffffffff", "aaaaaaaa55555555", "1234567890abcdef"][i],
  dhash: ["1111111111111111", "eeeeeeeeeeeeeeee", "cccccccc33333333", "fedcba0987654321"][i],
  avgHex: "#888888",
  analysis: {
    productType: "Sneaker",
    brand: "Louis Vuitton",
    model: "LV Trainer",
    category: "Sneakers",
    colorName: "Gris",
    dominantHex: "#888888",
    colors: ["Gris"],
    signature: "lv trainer",
    size: null,
    confidence: 0.85,
  },
});
const testA = localFallbackGrouping([0, 1, 2, 3].map(sameProduct));
assert(testA.groups.length === 1 && testA.groups[0].fileIds.length === 4, "Test A: 4 → 1 groupe");

// ── localFallback Test B : 4 produits différents ─────────────────────────────
const models = ["LV Trainer", "LV Skate", "LV Run Away", "LV Maxi"];
const testB = localFallbackGrouping(
  models.map((model, i) => ({
    fileId: `p-${i}`,
    imageUrl: `http://x/${i}.jpg`,
    sortOrder: i,
    phash: ["0000000000000000", "ffffffffffffffff", "aaaaaaaa55555555", "1234567890abcdef"][i],
    dhash: ["1111111111111111", "eeeeeeeeeeeeeeee", "cccccccc33333333", "fedcba0987654321"][i],
    analysis: {
      productType: "Sneaker",
      brand: "Louis Vuitton",
      model,
      category: "Sneakers",
      colorName: "Gris",
      dominantHex: "#888888",
      colors: ["Gris"],
      signature: model.toLowerCase(),
      size: null,
      confidence: 0.85,
    },
  }))
);
assert(testB.groups.length === 4, "Test B: 4 → 4 groupes");

// ── localFallback Test C : 20 photos, 5 produits ─────────────────────────────
const BASE = ["0000000000000000", "ffffffffffffffff", "0f0f0f0f0f0f0f0f", "f0f0f0f0f0f0f0f0", "aaaaaaaaaaaaaaaa"];
function perturb(h: string, k: number) {
  const last = parseInt(h.slice(-1), 16) ^ (k & 0xf);
  return h.slice(0, -1) + last.toString(16);
}
const testCFiles: VisionGroupInput[] = [];
for (let photo = 0; photo < 4; photo++) {
  for (let product = 0; product < 5; product++) {
    testCFiles.push({
      fileId: `f-${product}-${photo}`,
      imageUrl: `http://x/${product}_${photo}.jpg`,
      sortOrder: product * 4 + photo,
      phash: perturb(BASE[product], photo),
      dhash: perturb(BASE[product], photo + 1),
      analysis: {
        productType: "Sneaker",
        brand: "Louis Vuitton",
        model: models[product],
        category: "Sneakers",
        colorName: "Gris",
        dominantHex: "#888888",
        colors: ["Gris"],
        signature: models[product].toLowerCase(),
        size: null,
        confidence: 0.85,
      },
    });
  }
}
const testC = localFallbackGrouping(testCFiles);
assert(testC.groups.length === 5 && testC.groups.every((g) => g.fileIds.length === 4), "Test C: 20 → 5 groupes");

console.log("✅ Tous les tests vision-grouping passent.");
