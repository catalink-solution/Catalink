// Orchestration côté client : upload multi-sources → job → boucle de traitement.
// Le navigateur ne fait que l'upload + le polling ; toute l'analyse IA est serveur.

"use client";

import { unzip } from "fflate";
import { supabase } from "@/lib/supabase";
import type { ImportSourceType } from "./types";

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif|bmp)$/i;
const UPLOAD_CONCURRENCY = 4;

export type NamedFile = { file: File; name: string };

async function mapLimited<I, O>(items: I[], limit: number, fn: (i: I, idx: number) => Promise<O>) {
  const out: O[] = new Array(items.length);
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const cur = idx++;
      out[cur] = await fn(items[cur], cur);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

/** Décompresse les ZIP et ne garde que les images. */
export async function expandToImages(files: File[]): Promise<NamedFile[]> {
  const out: NamedFile[] = [];
  for (const f of files) {
    if (/\.zip$/i.test(f.name)) {
      const buf = new Uint8Array(await f.arrayBuffer());
      const entries = await new Promise<Record<string, Uint8Array>>((resolve, reject) =>
        unzip(buf, (err, data) => (err ? reject(err) : resolve(data)))
      );
      for (const [path, bytes] of Object.entries(entries)) {
        if (!IMAGE_EXT.test(path) || path.endsWith("/")) continue;
        const base = path.split("/").pop() || path;
        out.push({ file: new File([bytes as BlobPart], base, { type: guessType(base) }), name: base });
      }
    } else if (IMAGE_EXT.test(f.name)) {
      out.push({ file: f, name: f.name });
    }
  }
  return out;
}

function guessType(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  if (ext === "avif") return "image/avif";
  return "image/jpeg";
}

export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function createJob(shopId: string, sourceType: ImportSourceType, total: number) {
  const { data, error } = await supabase
    .from("import_jobs")
    .insert({ shop_id: shopId, source_type: sourceType, status: "pending", total_files: total })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "job_create_failed");
  return (data as { id: string }).id;
}

/** Upload d'images vers le bucket + enregistrement des import_files. */
export async function createUploadJob(
  shopId: string,
  images: NamedFile[],
  sourceType: ImportSourceType,
  onProgress?: (uploaded: number, total: number) => void
): Promise<string> {
  const jobId = await createJob(shopId, sourceType, images.length);

  let uploaded = 0;
  const rows = await mapLimited(images, UPLOAD_CONCURRENCY, async (img, i) => {
    const safe = img.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `${shopId}/imports/${jobId}/${i}-${safe}`;
    const { error } = await supabase.storage.from("product-images").upload(path, img.file, {
      upsert: true,
      contentType: img.file.type || "image/jpeg",
    });
    let url = "";
    if (!error) {
      url = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
    }
    uploaded++;
    onProgress?.(uploaded, images.length);
    return {
      job_id: jobId,
      shop_id: shopId,
      storage_path: error ? null : path,
      image_url: url,
      original_name: img.name,
      sort_order: i,
      status: error ? "error" : "pending",
      error: error?.message ?? null,
    };
  });

  const valid = rows.filter((r) => r.image_url);
  // Insert par lots de 200.
  for (let i = 0; i < valid.length; i += 200) {
    await supabase.from("import_files").insert(valid.slice(i, i + 200));
  }
  await supabase.from("import_jobs").update({ total_files: valid.length }).eq("id", jobId);
  return jobId;
}

/** Crée un job à partir d'URLs distantes (pas d'upload). */
export async function createUrlJob(shopId: string, urls: string[]): Promise<string> {
  const clean = urls.map((u) => u.trim()).filter((u) => /^https?:\/\//i.test(u));
  if (clean.length === 0) throw new Error("Aucune URL valide.");
  const jobId = await createJob(shopId, "url", clean.length);
  const rows = clean.map((url, i) => ({
    job_id: jobId,
    shop_id: shopId,
    storage_path: null,
    image_url: url,
    original_name: url.split("/").pop() ?? `image-${i}`,
    sort_order: i,
    status: "pending" as const,
  }));
  for (let i = 0; i < rows.length; i += 200) {
    await supabase.from("import_files").insert(rows.slice(i, i + 200));
  }
  return jobId;
}

export type ProcessProgress = {
  status: string;
  totalFiles: number;
  processedFiles: number;
  detectedCount: number;
  estimatedSeconds: number;
  done: boolean;
};

/** Boucle de traitement : appelle /process jusqu'à l'état final. */
export async function runProcessing(
  jobId: string,
  onProgress: (p: ProcessProgress) => void,
  shouldStop?: () => boolean
): Promise<void> {
  const token = await getAccessToken();
  let guard = 0;
  const maxIterations = 200000; // borne de sécurité
  while (guard++ < maxIterations) {
    if (shouldStop?.()) return;
    const res = await fetch("/api/ai-import/process", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ jobId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error ?? `process_${res.status}`);
    }
    const p = (await res.json()) as ProcessProgress;
    onProgress(p);
    if (p.done) return;
    await new Promise((r) => setTimeout(r, 250));
  }
}
