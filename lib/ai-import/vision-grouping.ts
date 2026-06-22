// Regroupement multimodal par lot (vision IA) — décision principale.
// Le clustering local (similarity.ts) n'est qu'un fallback.

import { clusterAnalyses, type AnalyzedFile } from "./clustering";
import type { ImageAnalysis, VisionGroupInput, VisionProductGroup, VisionGroupingResult } from "./types";

export const SINGLE_BATCH_MAX = 30;
export const DEFAULT_BATCH_SIZE = 25;

export function visionBatchSize(): number {
  const raw = Number(process.env.AI_IMPORT_BATCH_SIZE ?? DEFAULT_BATCH_SIZE);
  const n = Number.isFinite(raw) ? raw : DEFAULT_BATCH_SIZE;
  return Math.max(20, Math.min(SINGLE_BATCH_MAX, n));
}

export type VisionGroupingResponse = {
  groups: Array<{
    temporaryProductName?: string;
    fileIds?: string[];
    category?: string | null;
    brand?: string | null;
    mainColor?: string | null;
    model?: string | null;
    reason?: string;
    confidence?: number;
  }>;
};

/** Parse et normalise la réponse JSON de l'IA vision. */
export function parseVisionGroupingResponse(
  raw: unknown,
  validFileIds: Set<string>
): VisionProductGroup[] {
  const payload = raw as VisionGroupingResponse;
  if (!payload?.groups || !Array.isArray(payload.groups)) return [];

  const groups: VisionProductGroup[] = [];
  const used = new Set<string>();

  for (let i = 0; i < payload.groups.length; i++) {
    const g = payload.groups[i];
    const fileIds = (g.fileIds ?? []).filter((id) => validFileIds.has(id) && !used.has(id));
    if (fileIds.length === 0) continue;
    fileIds.forEach((id) => used.add(id));

    groups.push({
      temporaryProductName: g.temporaryProductName?.trim() || `Produit ${groups.length + 1}`,
      fileIds,
      category: g.category?.trim() || null,
      brand: g.brand?.trim() || null,
      mainColor: g.mainColor?.trim() || null,
      model: g.model?.trim() || null,
      reason: g.reason?.trim() || "vision grouping",
      confidence:
        typeof g.confidence === "number" ? Math.max(0, Math.min(1, g.confidence)) : 0.75,
    });
  }

  return groups;
}

/** Ajoute un groupe par image non assignée (sécurité). */
export function ensureAllFilesGrouped(
  files: VisionGroupInput[],
  groups: VisionProductGroup[]
): VisionProductGroup[] {
  const assigned = new Set(groups.flatMap((g) => g.fileIds));
  const result = [...groups];
  let orphanIdx = 0;

  for (const f of files) {
    if (assigned.has(f.fileId)) continue;
    orphanIdx++;
    result.push({
      temporaryProductName: f.name ?? `Produit ${result.length + 1}`,
      fileIds: [f.fileId],
      category: null,
      brand: null,
      mainColor: null,
      model: null,
      reason: "orphan file — separate group",
      confidence: 0.5,
    });
    assigned.add(f.fileId);
  }
  return result;
}

/** Découpe un lot en batches pour l'IA (20–30 images). */
export function splitIntoBatches(files: VisionGroupInput[], batchSize: number): VisionGroupInput[][] {
  if (files.length <= SINGLE_BATCH_MAX) return [files];
  const batches: VisionGroupInput[][] = [];
  for (let i = 0; i < files.length; i += batchSize) {
    batches.push(files.slice(i, i + batchSize));
  }
  return batches;
}

/** Fusionne les groupes de plusieurs batches (concaténation simple si pas de doublons évidents). */
export function concatBatchGroups(batchResults: VisionProductGroup[][]): VisionProductGroup[] {
  return batchResults.flat();
}

export function buildFileIndexMap(files: VisionGroupInput[]): Map<string, VisionGroupInput> {
  return new Map(files.map((f) => [f.fileId, f]));
}

export function coverForGroup(
  group: VisionProductGroup,
  fileMap: Map<string, VisionGroupInput>
): VisionGroupInput | null {
  for (const id of group.fileIds) {
    const f = fileMap.get(id);
    if (f) return f;
  }
  return null;
}

/** Fallback local : clustering heuristique / similarity. */
export function localFallbackGrouping(
  files: VisionGroupInput[],
  mode: "auto" | "per_image" = "auto"
): VisionGroupingResult {
  const analyzed: AnalyzedFile[] = files.map((f) => ({
    fileId: f.fileId,
    imageUrl: f.imageUrl,
    sortOrder: f.sortOrder,
    name: f.name ?? null,
    phash: f.phash ?? null,
    dhash: f.dhash ?? null,
    avgHex: f.avgHex ?? null,
    analysis: (f.analysis ?? {
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
    }) satisfies ImageAnalysis,
  }));

  const clusters = clusterAnalyses(analyzed, mode);
  const groups: VisionProductGroup[] = clusters.map((c, i) => ({
    temporaryProductName: [c.brand, c.model].filter(Boolean).join(" ") || `Produit ${i + 1}`,
    fileIds: c.fileIds,
    category: c.category,
    brand: c.brand,
    mainColor: c.colorNames[0] ?? null,
    model: c.model,
    reason: "local clustering fallback",
    confidence: c.confidence,
  }));

  return {
    groups,
    method: "local_fallback",
    provider: "local",
    batchesSent: 0,
  };
}

export function groupingPrompt(fileList: { fileId: string; label: string }[]): string {
  const mapping = fileList.map((f) => `- ${f.fileId}: ${f.label}`).join("\n");
  return `Tu es un expert e-commerce. Tu reçois plusieurs photos d'un import catalogue.

OBJECTIF : regrouper les photos qui montrent LE MÊME produit physique (pas une photo = un produit).

RÈGLES STRICTES :
- Vue de face, de côté, portée, détail, zoom logo = MÊME produit → MÊME groupe
- Deux produits même marque + même catégorie + même couleur mais design/modèle différent = groupes SÉPARÉS
- En cas de doute, crée des groupes SÉPARÉS (ne fusionne pas à tort)
- Chaque fileId doit apparaître EXACTEMENT une fois dans la réponse
- Ne crée pas de produit sans photo

Réponds UNIQUEMENT en JSON strict (pas de markdown) :
{
  "groups": [
    {
      "temporaryProductName": "Produit 1",
      "fileIds": ["uuid1", "uuid2"],
      "category": "Sneakers",
      "brand": "Louis Vuitton",
      "model": "LV Trainer",
      "mainColor": "Gris",
      "reason": "same product shown from different angles",
      "confidence": 0.92
    }
  ]
}

Correspondance des images :
${mapping}`;
}

export function mergeBatchesPrompt(
  groups: Array<{
    groupKey: string;
    temporaryProductName: string;
    brand: string | null;
    category: string | null;
    mainColor: string | null;
    model: string | null;
    fileCount: number;
  }>
): string {
  return `Tu fusionnes des groupes produits détectés dans des batches séparés du MÊME import.

OBJECTIF : fusionner les groupes qui représentent le MÊME produit physique (angles différents répartis entre batches).
Ne fusionne PAS des produits distincts même s'ils partagent marque/catégorie/couleur.

Réponds UNIQUEMENT en JSON strict :
{
  "merges": [
    { "groupKeys": ["batch0_g0", "batch1_g2"], "reason": "same LV Trainer grey sneaker" }
  ]
}

Si aucune fusion nécessaire : {"merges": []}

Groupes à analyser :
${JSON.stringify(groups, null, 2)}`;
}
