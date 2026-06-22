// Regroupement vision OpenAI — analyse multimodale par lot.

import type { ImageGrouper, VisionGroupInput, VisionGroupingResult, VisionProductGroup } from "./types";
import {
  SINGLE_BATCH_MAX,
  buildFileIndexMap,
  concatBatchGroups,
  coverForGroup,
  ensureAllFilesGrouped,
  groupingPrompt,
  localFallbackGrouping,
  mergeBatchesPrompt,
  parseVisionGroupingResponse,
  splitIntoBatches,
  visionBatchSize,
} from "./vision-grouping";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

function apiKey(): string {
  return process.env.OPENAI_API_KEY || "";
}

function visionModel(): string {
  return (
    process.env.OPENAI_VISION_GROUP_MODEL ||
    process.env.OPENAI_VISION_MODEL ||
    "gpt-4o"
  );
}

function parseJson<T>(content: string): T | null {
  try {
    const cleaned = content.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}

async function chatVision(
  prompt: string,
  images: { url: string; detail?: "low" | "high" | "auto" }[],
  meta?: { batchIndex?: number; phase?: string }
): Promise<string> {
  const requestBody = {
    model: visionModel(),
    temperature: 0,
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          ...images.map((img) => ({
            type: "image_url" as const,
            image_url: { url: img.url, detail: img.detail ?? "low" },
          })),
        ],
      },
    ],
  };

  console.info(
    "VISION_GROUPING_ACTIVE",
    JSON.stringify({
      provider: "openai",
      model: requestBody.model,
      phase: meta?.phase ?? "grouping",
      batchIndex: meta?.batchIndex ?? null,
      imageCount: images.length,
      imageUrls: images.map((i) => i.url),
      prompt,
      requestBody,
    })
  );

  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey()}`,
    },
    body: JSON.stringify(requestBody),
    cache: "no-store",
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`openai_group_${res.status}:${txt.slice(0, 300)}`);
  }

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = json.choices?.[0]?.message?.content ?? "";

  console.info(
    "VISION_GROUPING_ACTIVE",
    JSON.stringify({
      action: "openai_raw_response",
      phase: meta?.phase ?? "grouping",
      batchIndex: meta?.batchIndex ?? null,
      contentLength: content.length,
      rawResponse: content,
    })
  );

  return content;
}

export class OpenAIVisionGrouper implements ImageGrouper {
  readonly name = "openai";

  async groupImages(files: VisionGroupInput[]): Promise<VisionGroupingResult> {
    if (files.length === 0) {
      return { groups: [], method: "vision", provider: this.name, batchesSent: 0 };
    }

    const batchSize = visionBatchSize();
    const batches = splitIntoBatches(files, batchSize);
    const validIds = new Set(files.map((f) => f.fileId));
    const batchResults: VisionProductGroup[][] = [];
    const rawResponses: unknown[] = [];

    console.info(
      "[AI Import][vision-group]",
      JSON.stringify({
        imagesReceived: files.length,
        batches: batches.length,
        batchSize,
      })
    );

    for (let bi = 0; bi < batches.length; bi++) {
      const batch = batches[bi];
      const fileList = batch.map((f) => ({
        fileId: f.fileId,
        label: f.name ?? `image_${f.sortOrder}`,
      }));

      console.info(
        "[AI Import][vision-group]",
        JSON.stringify({ action: "batch_sent", batchIndex: bi, imageCount: batch.length, fileIds: batch.map((f) => f.fileId) })
      );

      const content = await chatVision(
        groupingPrompt(fileList),
        batch.map((f) => ({ url: f.imageUrl, detail: "low" })),
        { batchIndex: bi, phase: "grouping" }
      );

      const parsed = parseJson<unknown>(content);
      rawResponses.push(parsed ?? content);

      let groups = parseVisionGroupingResponse(parsed ?? {}, validIds);
      groups = ensureAllFilesGrouped(batch, groups);
      batchResults.push(groups);

      console.info(
        "VISION_GROUPING_ACTIVE",
        JSON.stringify({
          action: "groups_generated",
          batchIndex: bi,
          groupsDetected: groups.length,
          groups: groups.map((g) => ({
            temporaryProductName: g.temporaryProductName,
            fileIds: g.fileIds,
            brand: g.brand,
            category: g.category,
            mainColor: g.mainColor,
            model: g.model,
            reason: g.reason,
            confidence: g.confidence,
          })),
        })
      );
    }

    let finalGroups = await this.mergeBatchResults(files, batchResults, batches.length);
    finalGroups = ensureAllFilesGrouped(files, finalGroups);

    console.info(
      "[AI Import][vision-group]",
      JSON.stringify({
        action: "final_groups",
        imagesReceived: files.length,
        batchesSent: batches.length,
        groupsDetected: finalGroups.length,
        productsProposed: finalGroups.length,
        groups: finalGroups.map((g) => ({ name: g.temporaryProductName, files: g.fileIds.length, confidence: g.confidence })),
      })
    );

    return {
      groups: finalGroups,
      method: "vision",
      provider: this.name,
      batchesSent: batches.length,
      rawResponse: rawResponses,
    };
  }

  private async mergeBatchResults(
    allFiles: VisionGroupInput[],
    batchResults: VisionProductGroup[][],
    batchCount: number
  ): Promise<VisionProductGroup[]> {
    if (batchCount <= 1) return batchResults[0] ?? [];

    const fileMap = buildFileIndexMap(allFiles);
    const tagged: Array<VisionProductGroup & { groupKey: string; batchIndex: number }> = [];

    batchResults.forEach((groups, batchIndex) => {
      groups.forEach((g, gi) => {
        tagged.push({ ...g, groupKey: `batch${batchIndex}_g${gi}`, batchIndex });
      });
    });

    if (tagged.length <= 1) return tagged;

    const mergeInput = tagged.map((g) => ({
      groupKey: g.groupKey,
      temporaryProductName: g.temporaryProductName,
      brand: g.brand,
      category: g.category,
      mainColor: g.mainColor,
      model: g.model ?? null,
      fileCount: g.fileIds.length,
    }));

    const coverImages = tagged
      .map((g) => coverForGroup(g, fileMap))
      .filter(Boolean)
      .slice(0, SINGLE_BATCH_MAX) as VisionGroupInput[];

    try {
      const content = await chatVision(
        mergeBatchesPrompt(mergeInput),
        coverImages.map((f) => ({ url: f.imageUrl, detail: "low" })),
        { phase: "merge_batches" }
      );
      console.info("[AI Import][vision-group]", JSON.stringify({ action: "merge_raw_response", contentLength: content.length }));

      const parsed = parseJson<{ merges?: { groupKeys?: string[]; reason?: string }[] }>(content);
      const merges = parsed?.merges ?? [];
      if (merges.length === 0) return concatBatchGroups(batchResults);

      const keyToGroup = new Map(tagged.map((g) => [g.groupKey, g]));
      const mergedInto = new Map<string, string>();
      const final: VisionProductGroup[] = [];

      function resolveKey(k: string): string {
        while (mergedInto.has(k)) k = mergedInto.get(k)!;
        return k;
      }

      for (const m of merges) {
        const keys = (m.groupKeys ?? []).filter((k) => keyToGroup.has(k));
        if (keys.length < 2) continue;
        const root = resolveKey(keys[0]);
        for (let i = 1; i < keys.length; i++) {
          const k = resolveKey(keys[i]);
          if (k === root) continue;
          mergedInto.set(k, root);
        }
      }

      const buckets = new Map<string, VisionProductGroup>();
      for (const g of tagged) {
        const root = resolveKey(g.groupKey);
        const existing = buckets.get(root);
        if (!existing) {
          buckets.set(root, {
            temporaryProductName: g.temporaryProductName,
            fileIds: [...g.fileIds],
            category: g.category,
            brand: g.brand,
            mainColor: g.mainColor,
            model: g.model,
            reason: g.reason,
            confidence: g.confidence,
          });
        } else {
          existing.fileIds.push(...g.fileIds);
          existing.confidence = Math.min(existing.confidence, g.confidence);
        }
      }

      return [...buckets.values()];
    } catch (e) {
      console.warn("[AI Import][vision-group] merge step failed, concatenating batches", e);
      return concatBatchGroups(batchResults);
    }
  }
}

/** Regroupe via vision IA, fallback local si échec. */
export async function groupImagesWithFallback(
  grouper: ImageGrouper | null,
  files: VisionGroupInput[],
  mode: "auto" | "per_image"
): Promise<VisionGroupingResult> {
  if (mode === "per_image") {
    return {
      groups: files.map((f, i) => ({
        temporaryProductName: f.name ?? `Produit ${i + 1}`,
        fileIds: [f.fileId],
        category: f.analysis?.category ?? null,
        brand: f.analysis?.brand ?? null,
        mainColor: f.analysis?.colorName ?? null,
        model: f.analysis?.model ?? null,
        reason: "per_image mode",
        confidence: 0.9,
      })),
      method: "local_fallback",
      provider: "per_image",
      batchesSent: 0,
    };
  }

  if (grouper && files.length > 0) {
    try {
      console.info(
        "VISION_GROUPING_ACTIVE",
        JSON.stringify({ action: "start", provider: grouper.name, imageCount: files.length })
      );
      const result = await grouper.groupImages(files);
      console.info(
        "VISION_GROUPING_ACTIVE",
        JSON.stringify({
          action: "complete",
          method: result.method,
          provider: result.provider,
          groupsDetected: result.groups.length,
        })
      );
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "vision_group_failed";
      console.info(
        "VISION_GROUPING_FALLBACK",
        JSON.stringify({ reason: msg, imageCount: files.length, provider: grouper.name })
      );
      const fb = localFallbackGrouping(files, mode);
      return { ...fb, fallbackReason: msg };
    }
  }

  console.info(
    "VISION_GROUPING_FALLBACK",
    JSON.stringify({ reason: "no_vision_grouper", imageCount: files.length })
  );
  return localFallbackGrouping(files, mode);
}
