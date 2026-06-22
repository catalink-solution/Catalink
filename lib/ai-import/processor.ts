// Step-runner : avance un job d'import d'UNE étape bornée par appel.
// Regroupement principal : vision IA par lot. Fallback : clustering local.

import type { SupabaseClient } from "@supabase/supabase-js";
import { getImportEngine } from "./engine";
import { clusterAnalyses, type AnalyzedFile } from "./clustering";
import { groupImagesWithFallback } from "./openai-grouper";
import type { VisionGroupInput, VisionProductGroup } from "./types";
import { AUTO_VALIDATE_CONFIDENCE, type ImageAnalysis } from "./types";

const ANALYZE_BATCH = 6;
const CONTENT_BATCH = 4;

export type StepResult = {
  status: string;
  totalFiles: number;
  processedFiles: number;
  detectedCount: number;
  estimatedSeconds: number;
  done: boolean;
  imagesReceived?: number;
  groupsDetected?: number;
  imagesPerGroup?: { group: string; images: number }[];
  groupingMethod?: string;
};

async function log(
  admin: SupabaseClient,
  jobId: string,
  shopId: string,
  level: string,
  stage: string,
  message: string,
  data?: unknown
) {
  await admin.from("import_processing_logs").insert({
    job_id: jobId,
    shop_id: shopId,
    level,
    stage,
    message,
    data: data ?? null,
  });
}

function estimate(remaining: number, live: boolean): number {
  return Math.ceil(remaining * (live ? 2.2 : 0.2));
}

function coverUrlForGroup(group: VisionProductGroup, fileById: Map<string, { image_url: string }>): string | null {
  for (const id of group.fileIds) {
    const f = fileById.get(id);
    if (f?.image_url) return f.image_url;
  }
  return null;
}

async function persistVisionGroups(
  admin: SupabaseClient,
  jobId: string,
  shopId: string,
  groups: VisionProductGroup[],
  fileById: Map<string, { id: string; image_url: string }>
): Promise<number> {
  let count = 0;
  for (const g of groups) {
    const cover = coverUrlForGroup(g, fileById);
    const { data: dp } = await admin
      .from("import_detected_products")
      .insert({
        job_id: jobId,
        shop_id: shopId,
        title: null,
        brand: g.brand,
        model: g.model ?? null,
        category: g.category,
        main_color: g.mainColor,
        cover_image_url: cover,
        confidence: g.confidence,
        status: "needs_review",
        tags: [],
      })
      .select("id")
      .single();
    const detectedId = (dp as { id: string }).id;
    count++;

    if (g.mainColor) {
      await admin.from("import_detected_variants").insert({
        detected_product_id: detectedId,
        job_id: jobId,
        shop_id: shopId,
        attribute_name: "Couleur",
        value: g.mainColor,
        hex: null,
        confidence: g.confidence,
      });
    }

    for (const fileId of g.fileIds) {
      await admin
        .from("import_files")
        .update({
          detected_product_id: detectedId,
          variant_label: g.mainColor,
          status: "grouped",
        })
        .eq("id", fileId);
    }
  }
  return count;
}

function toVisionInputs(
  files: {
    id: string;
    image_url: string;
    sort_order: number;
    original_name: string | null;
    phash: string | null;
    dhash: string | null;
    avg_hex: string | null;
  }[],
  analysisByFile?: Map<string, ImageAnalysis>
): VisionGroupInput[] {
  return files.map((f) => ({
    fileId: f.id,
    imageUrl: f.image_url,
    name: f.original_name,
    sortOrder: f.sort_order,
    phash: f.phash,
    dhash: f.dhash,
    avgHex: f.avg_hex,
    analysis: analysisByFile?.get(f.id),
  }));
}

export async function stepJob(admin: SupabaseClient, jobId: string): Promise<StepResult> {
  const engine = getImportEngine();

  const { data: jobRow } = await admin.from("import_jobs").select("*").eq("id", jobId).maybeSingle();
  if (!jobRow) throw new Error("job_not_found");
  const shopId = jobRow.shop_id as string;

  const result = (status: string, extra?: Partial<StepResult>): StepResult => ({
    status,
    totalFiles: jobRow.total_files,
    processedFiles: jobRow.processed_files,
    detectedCount: jobRow.detected_count,
    estimatedSeconds: jobRow.estimated_seconds ?? 0,
    done: ["ready_for_group_review", "ready_for_review", "done", "error"].includes(status),
    ...extra,
  });

  const status = jobRow.status as string;
  let effectiveStatus = status;

  if (["ready_for_group_review", "ready_for_review", "done", "error", "publishing"].includes(status)) {
    return result(status);
  }

  try {
    const mode = (jobRow.group_mode as "auto" | "per_image") ?? "auto";
    const useVisionPath = engine.visionGrouping && mode === "auto";

    // Vision : pending → clustering immédiat (sans analyse image par image)
    if (useVisionPath && status === "pending") {
      await admin
        .from("import_jobs")
        .update({ status: "clustering", started_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", jobId);
      await log(admin, jobId, shopId, "info", "clustering", "Regroupement vision IA par lot…");
      effectiveStatus = "clustering";
    }

    // ── Fallback path : analyse visuelle par lots ────────────────────────────
    if (!useVisionPath && (effectiveStatus === "pending" || effectiveStatus === "analyzing")) {
      if (effectiveStatus === "pending") {
        await admin
          .from("import_jobs")
          .update({ status: "analyzing", started_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq("id", jobId);
      }

      const { data: pending } = await admin
        .from("import_files")
        .select("id, image_url, original_name, sort_order")
        .eq("job_id", jobId)
        .eq("status", "pending")
        .order("sort_order", { ascending: true })
        .limit(ANALYZE_BATCH);

      const batch = (pending ?? []) as {
        id: string;
        image_url: string;
        original_name: string | null;
        sort_order: number;
      }[];

      if (batch.length > 0) {
        const analyses = await engine.analyzer.analyze(
          batch.map((f) => ({ url: f.image_url, name: f.original_name }))
        );
        const resultRows = batch.map((f, i) => ({
          file_id: f.id,
          job_id: jobId,
          shop_id: shopId,
          provider: engine.providerName,
          product_signature: analyses[i].signature,
          brand: analyses[i].brand,
          product_type: analyses[i].productType,
          model: analyses[i].model,
          category: analyses[i].category,
          dominant_hex: analyses[i].dominantHex,
          color_name: analyses[i].colorName,
          colors: analyses[i].colors,
          confidence: analyses[i].confidence,
          raw: analyses[i].raw ?? null,
        }));
        await admin.from("import_ai_results").insert(resultRows);
        await admin.from("import_files").update({ status: "analyzed" }).in("id", batch.map((f) => f.id));

        const processed = jobRow.processed_files + batch.length;
        const remaining = Math.max(0, jobRow.total_files - processed);
        await admin
          .from("import_jobs")
          .update({
            processed_files: processed,
            estimated_seconds: estimate(remaining, engine.live),
            updated_at: new Date().toISOString(),
          })
          .eq("id", jobId);
        return result("analyzing", { processedFiles: processed, estimatedSeconds: estimate(remaining, engine.live) });
      }

      await admin.from("import_jobs").update({ status: "clustering", updated_at: new Date().toISOString() }).eq("id", jobId);
      await log(admin, jobId, shopId, "info", "analyzing", "Analyse terminée, regroupement local…");
      return result("clustering");
    }

    // ── Phase regroupement (vision IA ou fallback local) ─────────────────────
    if (effectiveStatus === "clustering") {
      const { data: files } = await admin
        .from("import_files")
        .select("id, image_url, sort_order, original_name, phash, dhash, avg_hex, status")
        .eq("job_id", jobId)
        .order("sort_order", { ascending: true });

      const fileRows = (files ?? []) as {
        id: string;
        image_url: string;
        sort_order: number;
        original_name: string | null;
        phash: string | null;
        dhash: string | null;
        avg_hex: string | null;
        status: string;
      }[];

      const fileById = new Map(fileRows.map((f) => [f.id, f]));
      console.info("[AI Import] Regroupement", JSON.stringify({ imagesReceived: fileRows.length, visionPath: useVisionPath }));

      let groupingResult;
      const analysisByFile = new Map<string, ImageAnalysis>();

      if (useVisionPath) {
        console.info(
          "VISION_GROUPING_ACTIVE",
          JSON.stringify({ jobId, imagesReceived: fileRows.length, provider: engine.providerName })
        );
        const inputs = toVisionInputs(fileRows);
        groupingResult = await groupImagesWithFallback(engine.grouper, inputs, mode);
        if (groupingResult.method === "local_fallback") {
          console.info(
            "VISION_GROUPING_FALLBACK",
            JSON.stringify({
              jobId,
              reason: groupingResult.fallbackReason ?? "vision_failed",
              groupsDetected: groupingResult.groups.length,
            })
          );
        }
      } else {
        console.info(
          "VISION_GROUPING_FALLBACK",
          JSON.stringify({
            jobId,
            reason: "no_openai_key_or_not_auto_mode",
            visionGrouping: engine.visionGrouping,
            mode,
          })
        );
        const { data: results } = await admin.from("import_ai_results").select("*").eq("job_id", jobId);
        const resultByFile = new Map((results ?? []).map((r) => [r.file_id as string, r]));

        const analyzed: AnalyzedFile[] = fileRows
          .filter((f) => resultByFile.has(f.id))
          .map((f) => {
            const r = resultByFile.get(f.id)!;
            const analysis: ImageAnalysis = {
              productType: r.product_type ?? null,
              brand: r.brand ?? null,
              model: r.model ?? null,
              category: r.category ?? null,
              colorName: r.color_name ?? null,
              dominantHex: r.dominant_hex ?? null,
              colors: (r.colors as string[]) ?? [],
              signature: r.product_signature ?? "produit",
              size: null,
              confidence: Number(r.confidence ?? 0),
            };
            const raw = r.raw as { size?: string | null } | null;
            if (raw?.size) analysis.size = raw.size;
            analysisByFile.set(f.id, analysis);
            return {
              fileId: f.id,
              imageUrl: f.image_url,
              sortOrder: f.sort_order,
              name: f.original_name,
              phash: f.phash,
              dhash: f.dhash,
              avgHex: f.avg_hex,
              analysis,
            };
          });

        groupingResult = await groupImagesWithFallback(null, toVisionInputs(fileRows, analysisByFile), mode);
        // Enrichir avec analyses existantes pour fallback local
        if (groupingResult.method === "local_fallback" && analyzed.length > 0) {
          const clusters = clusterAnalyses(analyzed, mode);
          groupingResult = {
            groups: clusters.map((c, i) => ({
              temporaryProductName: [c.brand, c.model].filter(Boolean).join(" ") || `Produit ${i + 1}`,
              fileIds: c.fileIds,
              category: c.category,
              brand: c.brand,
              mainColor: c.colorNames[0] ?? null,
              model: c.model,
              reason: "local clustering fallback",
              confidence: c.confidence,
            })),
            method: "local_fallback",
            provider: engine.providerName,
            batchesSent: 0,
          };
        }
      }

      const perGroup = groupingResult.groups.map((g, i) => ({
        group: g.temporaryProductName || `group_${i + 1}`,
        images: g.fileIds.length,
        reason: g.reason,
      }));

      const clusterStats = {
        jobId,
        imagesReceived: fileRows.length,
        batchesSent: groupingResult.batchesSent,
        groupingMethod: groupingResult.method,
        provider: groupingResult.provider,
        groupsDetected: groupingResult.groups.length,
        productsProposed: groupingResult.groups.length,
        imagesPerGroup: perGroup,
        fallbackReason: groupingResult.fallbackReason ?? null,
      };

      console.info("[AI Import] Regroupement", JSON.stringify(clusterStats));
      await log(
        admin,
        jobId,
        shopId,
        "info",
        "clustering",
        `${fileRows.length} image(s) → ${groupingResult.groups.length} groupe(s) (${groupingResult.method}).`,
        clusterStats
      );

      if (groupingResult.rawResponse) {
        await log(admin, jobId, shopId, "debug", "clustering", "Réponse IA brute", {
          raw: groupingResult.rawResponse,
        });
      }

      const detectedCount = await persistVisionGroups(
        admin,
        jobId,
        shopId,
        groupingResult.groups,
        fileById
      );

      await admin
        .from("import_jobs")
        .update({
          status: "ready_for_group_review",
          detected_count: detectedCount,
          processed_files: fileRows.length,
          estimated_seconds: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId);

      await log(
        admin,
        jobId,
        shopId,
        "info",
        "clustering",
        `${detectedCount} groupe(s) proposé(s) — validation utilisateur requise.`
      );

      return result("ready_for_group_review", {
        detectedCount,
        processedFiles: fileRows.length,
        imagesReceived: fileRows.length,
        groupsDetected: groupingResult.groups.length,
        imagesPerGroup: perGroup.map((g) => ({ group: g.group, images: g.images })),
        groupingMethod: groupingResult.method,
      });
    }

    // ── Phase génération contenu (après validation groupes) ──────────────────
    if (status === "generating") {
      const { data: pendingProducts } = await admin
        .from("import_detected_products")
        .select("*")
        .eq("job_id", jobId)
        .is("title", null)
        .limit(CONTENT_BATCH);

      const products = (pendingProducts ?? []) as {
        id: string;
        brand: string | null;
        model: string | null;
        category: string | null;
        confidence: number;
      }[];

      if (products.length > 0) {
        for (const p of products) {
          const { data: variants } = await admin
            .from("import_detected_variants")
            .select("attribute_name, value")
            .eq("detected_product_id", p.id);
          const vs = (variants ?? []) as { attribute_name: string; value: string }[];
          const colorNames = vs.filter((v) => v.attribute_name === "Couleur").map((v) => v.value);
          const sizes = vs.filter((v) => v.attribute_name === "Taille").map((v) => v.value);

          const content = await engine.content.generate({
            brand: p.brand,
            model: p.model,
            productType: p.category,
            category: p.category,
            colorNames,
            sizes,
          });

          const autoValidated = Number(p.confidence) >= AUTO_VALIDATE_CONFIDENCE;
          await admin
            .from("import_detected_products")
            .update({
              title: content.title,
              description: content.description,
              category: content.category,
              tags: content.tags,
              status: autoValidated ? "auto_validated" : "needs_review",
              updated_at: new Date().toISOString(),
            })
            .eq("id", p.id);
        }
        return result("generating");
      }

      await admin
        .from("import_jobs")
        .update({
          status: "ready_for_review",
          estimated_seconds: 0,
          finished_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId);
      await log(admin, jobId, shopId, "info", "generating", "Fiches générées, prêt pour publication.");
      return result("ready_for_review");
    }

    return result(status);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown_error";
    await admin
      .from("import_jobs")
      .update({ status: "error", error: msg, updated_at: new Date().toISOString() })
      .eq("id", jobId);
    await log(admin, jobId, shopId, "error", status, msg);
    return result("error");
  }
}

/** Lance la génération de contenu après validation des groupes par l'utilisateur. */
export async function confirmGroupsAndGenerate(
  admin: SupabaseClient,
  jobId: string
): Promise<{ ok: boolean; error?: string }> {
  const { data: job } = await admin.from("import_jobs").select("status, shop_id").eq("id", jobId).maybeSingle();
  if (!job) return { ok: false, error: "job_not_found" };
  if (job.status !== "ready_for_group_review") {
    return { ok: false, error: "invalid_status" };
  }

  await admin
    .from("import_jobs")
    .update({ status: "generating", updated_at: new Date().toISOString() })
    .eq("id", jobId);

  await log(
    admin,
    jobId,
    job.shop_id as string,
    "info",
    "group_review",
    "Groupes validés par l'utilisateur — génération des fiches produit."
  );

  return { ok: true };
}
