"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  Trash2,
  Sparkles,
  PackageCheck,
  GitMerge,
  Split,
  CheckSquare,
  Square,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { publishDetectedProduct } from "@/lib/ai-import/publish";
import type {
  ImportDetectedProduct,
  ImportDetectedVariant,
  ImportFile,
} from "@/lib/ai-import/types";

type LocalProduct = ImportDetectedProduct & { _priceInput: string; _publishing?: boolean };

export function ImportReview({ jobId, onDone }: { jobId: string; onDone: () => void }) {
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [files, setFiles] = useState<ImportFile[]>([]);
  const [variants, setVariants] = useState<ImportDetectedVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [bulkPublishing, setBulkPublishing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: dp }, { data: f }, { data: v }] = await Promise.all([
      supabase
        .from("import_detected_products")
        .select("*")
        .eq("job_id", jobId)
        .order("confidence", { ascending: false }),
      supabase.from("import_files").select("*").eq("job_id", jobId).order("sort_order"),
      supabase.from("import_detected_variants").select("*").eq("job_id", jobId),
    ]);
    setProducts(
      ((dp ?? []) as ImportDetectedProduct[]).map((p) => ({
        ...p,
        _priceInput: p.sale_price != null ? String(p.sale_price) : "",
      }))
    );
    setFiles((f ?? []) as ImportFile[]);
    setVariants((v ?? []) as ImportDetectedVariant[]);
    setLoading(false);
  }, [jobId]);

  useEffect(() => {
    load();
  }, [load]);

  const filesByProduct = useMemo(() => {
    const map = new Map<string, ImportFile[]>();
    for (const f of files) {
      if (!f.detected_product_id) continue;
      const arr = map.get(f.detected_product_id) ?? [];
      arr.push(f);
      map.set(f.detected_product_id, arr);
    }
    return map;
  }, [files]);

  const variantsByProduct = useMemo(() => {
    const map = new Map<string, ImportDetectedVariant[]>();
    for (const v of variants) {
      const arr = map.get(v.detected_product_id) ?? [];
      arr.push(v);
      map.set(v.detected_product_id, arr);
    }
    return map;
  }, [variants]);

  const colorVariantCount = variants.filter((v) => v.attribute_name === "Couleur").length;
  const sizeVariantCount = variants.filter((v) => v.attribute_name === "Taille").length;
  const pending = products.filter((p) => p.status !== "published" && p.status !== "rejected");

  function patch(id: string, p: Partial<LocalProduct>) {
    setProducts((cur) => cur.map((x) => (x.id === id ? { ...x, ...p } : x)));
  }

  async function persistEdits(p: LocalProduct) {
    const price = parseFloat(p._priceInput);
    await supabase
      .from("import_detected_products")
      .update({
        title: p.title,
        category: p.category,
        sale_price: isNaN(price) ? null : price,
      })
      .eq("id", p.id);
  }

  async function reject(p: LocalProduct) {
    patch(p.id, { status: "rejected" });
    await supabase.from("import_detected_products").update({ status: "rejected" }).eq("id", p.id);
  }

  async function publishOne(p: LocalProduct): Promise<boolean> {
    const price = parseFloat(p._priceInput);
    if (isNaN(price) || price <= 0) {
      setMessage(`Indique un prix pour « ${p.title ?? "produit"} ».`);
      return false;
    }
    patch(p.id, { _publishing: true });
    await persistEdits(p);
    const res = await publishDetectedProduct({
      shopId: p.shop_id,
      detected: { ...p, sale_price: price },
      files: filesByProduct.get(p.id) ?? [],
      variants: variantsByProduct.get(p.id) ?? [],
    });
    if (res.ok) {
      patch(p.id, { status: "published", _publishing: false });
      return true;
    }
    patch(p.id, { _publishing: false });
    setMessage(res.error);
    return false;
  }

  function toggleSelect(id: string) {
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function publishSelection() {
    setMessage(null);
    const ready = products.filter(
      (p) => selected.has(p.id) && p.status !== "published" && p.status !== "rejected"
    );
    if (ready.length === 0) {
      setMessage("Sélectionne au moins un produit.");
      return;
    }
    setBulkPublishing(true);
    let ok = 0;
    for (const p of ready) {
      if (await publishOne(p)) ok++;
    }
    setBulkPublishing(false);
    setSelected(new Set());
    setMessage(`${ok} produit(s) publié(s).`);
  }

  // Fusionne plusieurs produits détectés en un seul (l'IA a sur-séparé).
  async function mergeSelection() {
    const ids = products
      .filter((p) => selected.has(p.id) && p.status !== "published")
      .map((p) => p.id);
    if (ids.length < 2) {
      setMessage("Sélectionne au moins 2 produits à fusionner.");
      return;
    }
    setBusy(true);
    const target = ids[0];
    const others = ids.slice(1);
    await supabase.from("import_files").update({ detected_product_id: target }).in("detected_product_id", others);
    await supabase.from("import_detected_variants").update({ detected_product_id: target }).in("detected_product_id", others);
    await supabase.from("import_detected_products").delete().in("id", others);
    // Dédoublonne les variantes du produit cible.
    const { data: tv } = await supabase
      .from("import_detected_variants")
      .select("id, attribute_name, value")
      .eq("detected_product_id", target);
    const seen = new Set<string>();
    const dup: string[] = [];
    for (const v of (tv ?? []) as { id: string; attribute_name: string; value: string }[]) {
      const k = `${v.attribute_name}::${v.value}`;
      if (seen.has(k)) dup.push(v.id);
      else seen.add(k);
    }
    if (dup.length) await supabase.from("import_detected_variants").delete().in("id", dup);
    setSelected(new Set());
    setBusy(false);
    await load();
    setMessage("Produits fusionnés.");
  }

  // Sépare un produit en un produit par couleur détectée (l'IA a regroupé à tort).
  async function splitProduct(p: LocalProduct) {
    const pVariants = variantsByProduct.get(p.id) ?? [];
    const colors = pVariants.filter((v) => v.attribute_name === "Couleur");
    if (colors.length < 2) {
      setMessage("Séparation impossible : moins de 2 couleurs détectées.");
      return;
    }
    setBusy(true);
    const pFiles = filesByProduct.get(p.id) ?? [];
    const used = new Set<string>();
    const newIds: string[] = [];

    for (const c of colors) {
      const colorFiles = pFiles.filter((f) =>
        (f.variant_label ?? "").toLowerCase().includes(c.value.toLowerCase())
      );
      colorFiles.forEach((f) => used.add(f.id));
      const { data: np } = await supabase
        .from("import_detected_products")
        .insert({
          job_id: p.job_id,
          shop_id: p.shop_id,
          title: [p.title, c.value].filter(Boolean).join(" "),
          brand: p.brand,
          model: p.model,
          category: p.category,
          description: p.description,
          main_color: c.value,
          cover_image_url: colorFiles[0]?.image_url ?? p.cover_image_url,
          confidence: p.confidence,
          status: "needs_review",
          tags: p.tags,
          sale_price: p.sale_price,
        })
        .select("id")
        .single();
      const nid = (np as { id: string }).id;
      newIds.push(nid);
      await supabase.from("import_detected_variants").insert({
        detected_product_id: nid,
        job_id: p.job_id,
        shop_id: p.shop_id,
        attribute_name: "Couleur",
        value: c.value,
        hex: c.hex,
        confidence: c.confidence,
      });
      if (colorFiles.length)
        await supabase.from("import_files").update({ detected_product_id: nid }).in("id", colorFiles.map((f) => f.id));
    }

    // Fichiers sans couleur reconnue → rattachés au premier nouveau produit.
    const leftover = pFiles.filter((f) => !used.has(f.id));
    if (leftover.length && newIds[0])
      await supabase.from("import_files").update({ detected_product_id: newIds[0] }).in("id", leftover.map((f) => f.id));

    await supabase.from("import_detected_products").delete().eq("id", p.id);
    setBusy(false);
    await load();
    setMessage("Produit séparé par couleur.");
  }

  async function publishAll() {
    setMessage(null);
    const ready = products.filter(
      (p) => p.status !== "published" && p.status !== "rejected" && parseFloat(p._priceInput) > 0
    );
    if (ready.length === 0) {
      setMessage("Aucun produit avec un prix valide à publier.");
      return;
    }
    setBulkPublishing(true);
    let ok = 0;
    for (const p of ready) {
      const done = await publishOne(p);
      if (done) ok++;
    }
    setBulkPublishing(false);
    setMessage(`${ok} produit(s) publié(s).`);
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-white/50">
        <Loader2 className="animate-spin" size={18} /> Chargement des résultats…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-500/30 bg-violet-500/5 p-5">
        <div>
          <p className="flex items-center gap-2 text-lg font-bold">
            <Sparkles className="text-violet-400" size={20} /> Nous avons détecté
          </p>
          <p className="mt-1 text-sm text-white/70">
            {products.length} produit(s) · {colorVariantCount} variante(s) couleur ·{" "}
            {sizeVariantCount} variante(s) taille
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selected.size >= 2 && (
            <button
              type="button"
              onClick={mergeSelection}
              disabled={busy}
              className="btn-touch inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 font-semibold hover:bg-white/10 disabled:opacity-40"
            >
              <GitMerge size={17} /> Fusionner ({selected.size})
            </button>
          )}
          {selected.size >= 1 && (
            <button
              type="button"
              onClick={publishSelection}
              disabled={bulkPublishing}
              className="btn-touch inline-flex items-center gap-2 rounded-xl border border-violet-500/40 bg-violet-500/10 px-4 py-3 font-semibold text-violet-100 hover:bg-violet-500/20 disabled:opacity-40"
            >
              <PackageCheck size={17} /> Publier la sélection ({selected.size})
            </button>
          )}
          <button
            type="button"
            onClick={publishAll}
            disabled={bulkPublishing || pending.length === 0}
            className="btn-touch inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white hover:bg-violet-500 disabled:opacity-40"
          >
            {bulkPublishing ? <Loader2 className="animate-spin" size={17} /> : <PackageCheck size={17} />}
            Tout publier
          </button>
          <button
            type="button"
            onClick={onDone}
            className="btn-touch rounded-xl border border-white/15 bg-white/5 px-5 py-3 font-semibold hover:bg-white/10"
          >
            Nouvel import
          </button>
        </div>
      </div>

      {message && (
        <p className="rounded-xl bg-white/5 px-4 py-2.5 text-sm text-white/70">{message}</p>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {products.map((p) => {
          const pFiles = filesByProduct.get(p.id) ?? [];
          const pVariants = variantsByProduct.get(p.id) ?? [];
          const published = p.status === "published";
          const rejected = p.status === "rejected";
          return (
            <div
              key={p.id}
              className={`flex flex-col rounded-2xl border bg-white/[0.02] p-4 ${
                rejected ? "border-white/5 opacity-50" : "border-white/10"
              }`}
            >
              <div className="relative mb-3 aspect-square overflow-hidden rounded-xl bg-white/5">
                {p.cover_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.cover_image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                )}
                <span className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-xs">
                  {pFiles.length} photo(s)
                </span>
                <span
                  className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    p.status === "auto_validated"
                      ? "bg-green-500/20 text-green-300"
                      : published
                        ? "bg-blue-500/20 text-blue-300"
                        : "bg-amber-500/20 text-amber-300"
                  }`}
                >
                  {published
                    ? "Publié"
                    : p.status === "auto_validated"
                      ? "Validé auto"
                      : "À vérifier"}{" "}
                  · {Math.round(p.confidence * 100)}%
                </span>
              </div>

              {!published && !rejected && (
                <button
                  type="button"
                  onClick={() => toggleSelect(p.id)}
                  className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-white/60 hover:text-white"
                >
                  {selected.has(p.id) ? (
                    <CheckSquare size={15} className="text-violet-400" />
                  ) : (
                    <Square size={15} />
                  )}
                  Sélectionner
                </button>
              )}

              <input
                value={p.title ?? ""}
                onChange={(e) => patch(p.id, { title: e.target.value })}
                disabled={published || rejected}
                placeholder="Nom du produit"
                className="mb-2 w-full rounded-lg border border-white/10 bg-white/10 p-2 text-sm font-semibold disabled:opacity-60"
              />
              <input
                value={p.category ?? ""}
                onChange={(e) => patch(p.id, { category: e.target.value })}
                disabled={published || rejected}
                placeholder="Catégorie"
                className="mb-2 w-full rounded-lg border border-white/10 bg-white/10 p-2 text-xs disabled:opacity-60"
              />

              {pVariants.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {pVariants.map((v) => (
                    <span
                      key={v.id}
                      className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[11px]"
                    >
                      {v.hex && (
                        <span
                          className="h-2.5 w-2.5 rounded-full border border-white/30"
                          style={{ background: v.hex }}
                        />
                      )}
                      {v.value}
                    </span>
                  ))}
                </div>
              )}

              {p.description && (
                <p className="mb-3 line-clamp-2 text-xs text-white/50">{p.description}</p>
              )}

              {!published && !rejected && (
                <div className="mt-auto flex items-center gap-2">
                  <div className="flex items-center rounded-lg border border-white/10 bg-white/10">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={p._priceInput}
                      onChange={(e) => patch(p.id, { _priceInput: e.target.value })}
                      placeholder="Prix"
                      className="w-20 bg-transparent p-2 text-sm outline-none"
                    />
                    <span className="pr-2 text-sm text-white/40">€</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => publishOne(p)}
                    disabled={p._publishing}
                    className="btn-touch flex-1 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
                  >
                    {p._publishing ? <Loader2 className="mx-auto animate-spin" size={15} /> : "Publier"}
                  </button>
                  {pVariants.filter((v) => v.attribute_name === "Couleur").length >= 2 && (
                    <button
                      type="button"
                      onClick={() => splitProduct(p)}
                      disabled={busy}
                      className="btn-icon-touch rounded-lg text-white/40 hover:bg-white/10 hover:text-white disabled:opacity-40"
                      aria-label="Séparer par couleur"
                      title="Séparer par couleur"
                    >
                      <Split size={16} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => reject(p)}
                    className="btn-icon-touch rounded-lg text-white/40 hover:bg-red-500/10 hover:text-red-400"
                    aria-label="Rejeter"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}

              {published && (
                <p className="mt-auto flex items-center gap-1.5 text-sm font-medium text-green-400">
                  <CheckCircle2 size={16} /> Publié
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
