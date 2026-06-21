// Step-runner : avance un job d'import d'UNE étape bornée par appel.
// Conçu pour être invoqué en boucle (polling client) et/ou par cron Vercel.
// Aucune étape ne traite tout le volume d'un coup → le navigateur ne bloque jamais
// et la fonction serverless reste dans ses limites de temps.

import type { SupabaseClient } from "@supabase/supabase-js";
import { getImportEngine } from "./engine";
import { clusterAnalyses, type AnalyzedFile } from "./clustering";
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
    done: ["ready_for_review", "done", "error"].includes(status),
    ...extra,
  });

  const status = jobRow.status as string;

  // États terminaux ou gérés ailleurs (publishing) : rien à faire.
  if (["ready_for_review", "done", "error", "publishing"].includes(status)) {
    return result(status);
  }

  try {
    // ── Phase 1 : analyse visuelle par lots ──────────────────────────────────
    if (status === "pending" || status === "analyzing") {
      if (status === "pending") {
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
        jobRow.processed_files = processed;
        return result("analyzing", { processedFiles: processed, estimatedSeconds: estimate(remaining, engine.live) });
      }

      // Plus de fichiers à analyser → clustering.
      await admin.from("import_jobs").update({ status: "clustering", updated_at: new Date().toISOString() }).eq("id", jobId);
      await log(admin, jobId, shopId, "info", "analyzing", "Analyse terminée, regroupement…");
      return result("clustering");
    }

    // ── Phase 2 : clustering → produits + variantes ──────────────────────────
    if (status === "clustering") {
      const { data: files } = await admin
        .from("import_files")
        .select("id, image_url, sort_order")
        .eq("job_id", jobId)
        .order("sort_order", { ascending: true });
      const { data: results } = await admin
        .from("import_ai_results")
        .select("*")
        .eq("job_id", jobId);

      const resultByFile = new Map((results ?? []).map((r) => [r.file_id as string, r]));
      const analyzed: AnalyzedFile[] = ((files ?? []) as { id: string; image_url: string; sort_order: number }[])
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
          // Re-extraire la taille depuis raw si présente.
          const raw = r.raw as { size?: string | null } | null;
          if (raw?.size) analysis.size = raw.size;
          return { fileId: f.id, imageUrl: f.image_url, sortOrder: f.sort_order, analysis };
        });

      const clusters = clusterAnalyses(analyzed);

      for (const c of clusters) {
        const { data: dp } = await admin
          .from("import_detected_products")
          .insert({
            job_id: jobId,
            shop_id: shopId,
            brand: c.brand,
            model: c.model,
            category: c.category,
            main_color: c.colorNames[0] ?? null,
            cover_image_url: c.coverImageUrl,
            confidence: c.confidence,
            status: "needs_review",
            tags: [],
          })
          .select("id")
          .single();
        const detectedId = (dp as { id: string }).id;

        if (c.variants.length > 0) {
          await admin.from("import_detected_variants").insert(
            c.variants.map((v) => ({
              detected_product_id: detectedId,
              job_id: jobId,
              shop_id: shopId,
              attribute_name: v.attributeName,
              value: v.value,
              hex: v.hex,
              confidence: v.confidence,
            }))
          );
        }

        // Lier les fichiers du cluster + libellé de variante.
        for (const fileId of c.fileIds) {
          await admin
            .from("import_files")
            .update({
              detected_product_id: detectedId,
              variant_label: c.variantLabelByFile[fileId] ?? null,
              status: "grouped",
            })
            .eq("id", fileId);
        }
      }

      await admin
        .from("import_jobs")
        .update({ status: "generating", detected_count: clusters.length, updated_at: new Date().toISOString() })
        .eq("id", jobId);
      await log(admin, jobId, shopId, "info", "clustering", `${clusters.length} produit(s) détecté(s).`);
      return result("generating", { detectedCount: clusters.length });
    }

    // ── Phase 3 : génération du contenu (titre/desc/SEO) par lots ─────────────
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

      // Tout est généré → prêt pour validation.
      await admin
        .from("import_jobs")
        .update({
          status: "ready_for_review",
          estimated_seconds: 0,
          finished_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId);
      await log(admin, jobId, shopId, "info", "generating", "Fiches générées, prêt pour validation.");
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
