"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, UploadCloud, FolderUp, Link2, Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  expandToImages,
  createUploadJob,
  createUrlJob,
  runProcessing,
  type NamedFile,
  type ProcessProgress,
} from "@/lib/ai-import/client";
import { ImportReview } from "@/components/dashboard/import-review";

type Phase = "idle" | "uploading" | "processing" | "review";

// Attributs non standard pour l'upload de dossier (supportés par les navigateurs Chromium).
const FOLDER_ATTRS = { webkitdirectory: "", directory: "" } as unknown as React.InputHTMLAttributes<HTMLInputElement>;

const STATUS_LABEL: Record<string, string> = {
  pending: "Initialisation…",
  analyzing: "Analyse visuelle en cours…",
  clustering: "Regroupement des produits…",
  generating: "Génération des fiches…",
  ready_for_review: "Analyse terminée",
  error: "Erreur",
};

async function gatherFromDrop(dt: DataTransfer): Promise<File[]> {
  const items = Array.from(dt.items);
  const entries = items.map((i) => i.webkitGetAsEntry?.()).filter(Boolean) as FileSystemEntry[];
  if (entries.length === 0) return Array.from(dt.files);

  const files: File[] = [];
  async function walk(entry: FileSystemEntry): Promise<void> {
    if (entry.isFile) {
      const file = await new Promise<File>((res, rej) =>
        (entry as FileSystemFileEntry).file(res, rej)
      );
      files.push(file);
    } else if (entry.isDirectory) {
      const reader = (entry as FileSystemDirectoryEntry).createReader();
      const batch = await new Promise<FileSystemEntry[]>((res) => reader.readEntries(res));
      for (const e of batch) await walk(e);
    }
  }
  for (const e of entries) await walk(e);
  return files;
}

export default function AiImportPage() {
  const [shopId, setShopId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const [progress, setProgress] = useState<ProcessProgress | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [urls, setUrls] = useState("");
  const [error, setError] = useState<string | null>(null);
  const stopRef = useRef(false);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: shop } = await supabase
        .from("shops")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (shop) setShopId((shop as { id: string }).id);
    })();
  }, []);

  async function start(images: NamedFile[], source: "upload" | "folder" | "zip") {
    if (!shopId || images.length === 0) {
      if (images.length === 0) setError("Aucune image détectée.");
      return;
    }
    setError(null);
    stopRef.current = false;
    setPhase("uploading");
    setUploadProgress({ done: 0, total: images.length });
    try {
      const id = await createUploadJob(shopId, images, source, (done, total) =>
        setUploadProgress({ done, total })
      );
      await beginProcessing(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur d'upload.");
      setPhase("idle");
    }
  }

  async function startUrls() {
    if (!shopId) return;
    const list = urls.split(/[\n,\s]+/).map((u) => u.trim()).filter(Boolean);
    if (list.length === 0) {
      setError("Ajoute au moins une URL d'image.");
      return;
    }
    setError(null);
    stopRef.current = false;
    setPhase("uploading");
    setUploadProgress({ done: list.length, total: list.length });
    try {
      const id = await createUrlJob(shopId, list);
      await beginProcessing(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur.");
      setPhase("idle");
    }
  }

  async function beginProcessing(id: string) {
    setJobId(id);
    setPhase("processing");
    setProgress({ status: "pending", totalFiles: 0, processedFiles: 0, detectedCount: 0, estimatedSeconds: 0, done: false });
    try {
      await runProcessing(
        id,
        (p) => {
          setProgress(p);
          if (p.status === "ready_for_review") setPhase("review");
          if (p.status === "error") {
            setError("Le traitement a échoué.");
            setPhase("idle");
          }
        },
        () => stopRef.current
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de traitement.");
      setPhase("idle");
    }
  }

  async function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (phase !== "idle") return;
    const raw = await gatherFromDrop(e.dataTransfer);
    const hasZip = raw.some((f) => /\.zip$/i.test(f.name));
    const images = await expandToImages(raw);
    start(images, hasZip ? "zip" : "upload");
  }

  async function onPick(files: FileList | null, source: "upload" | "folder") {
    if (!files) return;
    const arr = Array.from(files);
    const hasZip = arr.some((f) => /\.zip$/i.test(f.name));
    const images = await expandToImages(arr);
    start(images, hasZip ? "zip" : source);
  }

  function reset() {
    stopRef.current = true;
    setPhase("idle");
    setProgress(null);
    setJobId(null);
    setUploadProgress({ done: 0, total: 0 });
    setError(null);
  }

  return (
    <main className="p-4 sm:p-6 md:p-10">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="text-violet-400" size={26} />
        <h1 className="text-3xl font-extrabold tracking-tight">AI Import</h1>
      </div>
      <p className="mb-8 max-w-2xl text-white/50">
        Importe des centaines ou milliers de photos et laisse l'IA créer tes produits automatiquement :
        détection des produits, regroupement des variantes, nom et catégorie pré-remplis.
        Tu n'as plus qu'à fixer ton prix et publier.
      </p>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {phase === "idle" && (
        <div className="max-w-3xl space-y-6">
          {/* Zone upload */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
              dragOver ? "border-violet-500 bg-violet-500/5" : "border-white/15 bg-white/[0.02]"
            }`}
          >
            <UploadCloud className="mx-auto mb-4 text-white/40" size={42} />
            <p className="mb-1 font-semibold">Glisse-dépose tes photos, un dossier ou un ZIP</p>
            <p className="mb-5 text-sm text-white/40">JPG, PNG, WEBP, GIF — ou archive .zip</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <label className="btn-touch inline-flex cursor-pointer items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white hover:bg-violet-500">
                <UploadCloud size={17} /> Choisir des fichiers
                <input
                  type="file"
                  accept="image/*,.zip"
                  multiple
                  className="hidden"
                  onChange={(e) => onPick(e.target.files, "upload")}
                />
              </label>
              <label className="btn-touch inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white hover:bg-white/10">
                <FolderUp size={17} /> Importer un dossier
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => onPick(e.target.files, "folder")}
                  {...FOLDER_ATTRS}
                />
              </label>
            </div>
          </div>

          {/* URLs */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-white/80">
              <Link2 size={16} /> Importer depuis des URLs
            </p>
            <textarea
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              rows={3}
              placeholder="Une URL d'image par ligne…"
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm outline-none focus:border-violet-500"
            />
            <button
              type="button"
              onClick={startUrls}
              className="btn-touch mt-3 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-white/20"
            >
              Analyser les URLs
            </button>
          </div>
        </div>
      )}

      {phase === "uploading" && (
        <div className="max-w-xl rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
          <Loader2 className="mx-auto mb-4 animate-spin text-violet-400" size={36} />
          <p className="font-semibold">Upload des photos…</p>
          <p className="mt-1 text-sm text-white/50">
            {uploadProgress.done} / {uploadProgress.total}
          </p>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-violet-500 transition-all"
              style={{ width: `${pct(uploadProgress.done, uploadProgress.total)}%` }}
            />
          </div>
        </div>
      )}

      {phase === "processing" && progress && (
        <div className="max-w-xl rounded-2xl border border-white/10 bg-white/[0.02] p-8">
          <div className="flex items-center gap-3">
            <Loader2 className="animate-spin text-violet-400" size={28} />
            <p className="text-lg font-bold">{STATUS_LABEL[progress.status] ?? "Traitement…"}</p>
          </div>

          <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all"
              style={{ width: `${pct(progress.processedFiles, progress.totalFiles)}%` }}
            />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Stat label="Photos analysées" value={`${progress.processedFiles}/${progress.totalFiles}`} />
            <Stat label="Restantes" value={`${Math.max(0, progress.totalFiles - progress.processedFiles)}`} />
            <Stat label="Produits détectés" value={`${progress.detectedCount}`} />
            <Stat label="Temps estimé" value={formatEta(progress.estimatedSeconds)} />
          </div>

          <button
            type="button"
            onClick={reset}
            className="mt-6 text-sm text-white/40 underline hover:text-white/70"
          >
            Annuler
          </button>
        </div>
      )}

      {phase === "review" && jobId && (
        <ImportReview jobId={jobId} onDone={reset} />
      )}
    </main>
  );
}

function pct(a: number, b: number): number {
  if (b <= 0) return 0;
  return Math.min(100, Math.round((a / b) * 100));
}

function formatEta(seconds: number): string {
  if (seconds <= 0) return "—";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  return `${m} min`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.03] p-3">
      <p className="text-[11px] uppercase tracking-wide text-white/40">{label}</p>
      <p className="mt-1 font-bold">{value}</p>
    </div>
  );
}
