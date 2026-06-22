"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  UploadCloud,
  Loader2,
  CheckSquare,
  Square,
  PackagePlus,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { CustomSelect } from "@/components/ui/custom-select";
import { MAIN_CATEGORIES } from "@/lib/categories";
import { createQuickProduct, uploadProductImage } from "@/lib/quick-import/create-product";

const MAX_PHOTOS_PER_PRODUCT = 5;
const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif|bmp)$/i;

type PendingPhoto = {
  id: string;
  url: string;
  name: string;
  used: boolean;
  productName?: string;
};

export default function QuickImportPage() {
  const [shopId, setShopId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const [message, setMessage] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [mainCategory, setMainCategory] = useState("");

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

  const unusedPhotos = useMemo(() => photos.filter((p) => !p.used), [photos]);
  const usedPhotos = useMemo(() => photos.filter((p) => p.used), [photos]);
  const selectedPhotos = useMemo(
    () => photos.filter((p) => selected.has(p.id) && !p.used),
    [photos, selected]
  );

  const toggleSelect = useCallback((id: string) => {
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  async function handleFiles(fileList: FileList | File[]) {
    if (!shopId) {
      setMessage("Aucune boutique trouvée.");
      return;
    }
    const files = Array.from(fileList).filter((f) => IMAGE_EXT.test(f.name));
    if (files.length === 0) {
      setMessage("Aucune image valide (JPG, PNG, WEBP…).");
      return;
    }

    setMessage(null);
    setUploading(true);
    setUploadProgress({ done: 0, total: files.length });

    const added: PendingPhoto[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = await uploadProductImage(shopId, file);
      if (url) {
        added.push({
          id: crypto.randomUUID(),
          url,
          name: file.name,
          used: false,
        });
      }
      setUploadProgress({ done: i + 1, total: files.length });
    }

    setPhotos((cur) => [...cur, ...added]);
    setUploading(false);
    if (added.length === 0) setMessage("Échec de l'upload des photos.");
    else setMessage(`${added.length} photo(s) ajoutée(s).`);
  }

  function openProductForm() {
    if (selectedPhotos.length === 0) {
      setMessage("Sélectionne au moins une photo.");
      return;
    }
    if (selectedPhotos.length > MAX_PHOTOS_PER_PRODUCT) {
      setMessage(`Maximum ${MAX_PHOTOS_PER_PRODUCT} photos par produit. Désélectionne-en.`);
      return;
    }
    setName("");
    setPrice("");
    setDescription("");
    setMainCategory("");
    setShowForm(true);
    setMessage(null);
  }

  async function submitProduct() {
    if (!shopId) return;
    const priceNum = parseFloat(price);
    const urls = selectedPhotos.map((p) => p.url);

    setSaving(true);
    const res = await createQuickProduct({
      shopId,
      name,
      price: priceNum,
      description,
      mainCategory,
      imageUrls: urls,
    });
    setSaving(false);

    if (!res.ok) {
      setMessage(res.error);
      return;
    }

    const productName = name.trim();
    const usedIds = new Set(selectedPhotos.map((p) => p.id));
    setPhotos((cur) =>
      cur.map((p) =>
        usedIds.has(p.id) ? { ...p, used: true, productName } : p
      )
    );
    setSelected(new Set());
    setShowForm(false);
    setMessage(`Produit « ${productName} » créé avec ${urls.length} photo(s).`);
  }

  function selectAllUnused() {
    setSelected(new Set(unusedPhotos.map((p) => p.id)));
  }

  function clearSelection() {
    setSelected(new Set());
  }

  return (
    <main className="p-4 sm:p-6 md:p-10">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link
          href="/dashboard/products"
          className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white"
        >
          <ArrowLeft size={16} /> Produits
        </Link>
      </div>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Import Rapide</h1>
          <p className="mt-2 max-w-2xl text-white/60">
            Upload tes photos, sélectionne celles d&apos;un même produit, crée la fiche — répète
            jusqu&apos;à ce que toutes les photos soient utilisées. Aucune IA, aucune création
            automatique.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/50">
          <Sparkles size={14} className="text-violet-400" />
          Import IA — bientôt disponible
        </span>
      </div>

      {/* Upload zone */}
      <div
        className="mb-8 max-w-3xl rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] p-8 text-center"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files.length) void handleFiles(e.dataTransfer.files);
        }}
      >
        <UploadCloud className="mx-auto mb-3 text-white/40" size={40} />
        <p className="font-semibold">Glisse tes photos ici ou choisis un dossier</p>
        <p className="mt-1 text-sm text-white/40">JPG, PNG, WEBP — autant de photos que tu veux</p>
        <label className="btn-touch mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white hover:bg-violet-500">
          Choisir des photos
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) void handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
        {uploading && (
          <p className="mt-3 text-sm text-white/50">
            <Loader2 className="mr-1 inline animate-spin" size={14} />
            Upload {uploadProgress.done}/{uploadProgress.total}…
          </p>
        )}
      </div>

      {photos.length > 0 && (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-white/70">
              <span className="font-semibold text-white">{unusedPhotos.length}</span> photo(s) restante(s)
              {usedPhotos.length > 0 && (
                <span className="text-white/40"> · {usedPhotos.length} utilisée(s)</span>
              )}
              {selected.size > 0 && (
                <span className="text-violet-300"> · {selected.size} sélectionnée(s)</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={selectAllUnused}
                className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium hover:bg-white/5"
              >
                Tout sélectionner (restants)
              </button>
              <button
                type="button"
                onClick={clearSelection}
                disabled={selected.size === 0}
                className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium hover:bg-white/5 disabled:opacity-40"
              >
                Désélectionner
              </button>
              <button
                type="button"
                onClick={openProductForm}
                disabled={selectedPhotos.length === 0}
                className="btn-touch inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-500 disabled:opacity-40"
              >
                <PackagePlus size={16} />
                Créer un produit ({selectedPhotos.length || 0})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
            {photos.map((photo) => {
              const isSelected = selected.has(photo.id);
              return (
                <button
                  key={photo.id}
                  type="button"
                  disabled={photo.used}
                  onClick={() => !photo.used && toggleSelect(photo.id)}
                  className={`group relative aspect-square overflow-hidden rounded-xl border-2 transition-all ${
                    photo.used
                      ? "border-green-500/40 opacity-50"
                      : isSelected
                        ? "border-violet-500 ring-2 ring-violet-500/50"
                        : "border-white/10 hover:border-white/30"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                  {!photo.used && (
                    <span className="absolute left-1.5 top-1.5 rounded bg-black/70 p-0.5">
                      {isSelected ? (
                        <CheckSquare size={16} className="text-violet-400" />
                      ) : (
                        <Square size={16} className="text-white/60" />
                      )}
                    </span>
                  )}
                  {photo.used && (
                    <span className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 p-1 text-center">
                      <CheckCircle2 size={20} className="text-green-400" />
                      <span className="mt-1 line-clamp-2 text-[10px] font-medium text-white">
                        {photo.productName}
                      </span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {unusedPhotos.length === 0 && photos.length > 0 && (
            <div className="mt-8 rounded-2xl border border-green-500/30 bg-green-500/10 p-6 text-center">
              <CheckCircle2 className="mx-auto mb-2 text-green-400" size={32} />
              <p className="font-bold">Toutes les photos ont été utilisées !</p>
              <Link
                href="/dashboard/products"
                className="mt-4 inline-block rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
              >
                Voir mes produits
              </Link>
            </div>
          )}
        </>
      )}

      {message && (
        <p className="mt-6 rounded-xl bg-white/5 px-4 py-3 text-sm text-white/70">{message}</p>
      )}

      {/* Modal fiche produit */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !saving && setShowForm(false)} />
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#0f1117] p-6 shadow-2xl">
            <h2 className="mb-1 text-xl font-bold">Nouveau produit</h2>
            <p className="mb-4 text-sm text-white/50">
              {selectedPhotos.length} photo(s) sélectionnée(s) — la 1ʳᵉ sera la photo principale.
            </p>

            <div className="mb-4 flex flex-wrap gap-2">
              {selectedPhotos.map((p, i) => (
                <div key={p.id} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt="" className="h-16 w-16 rounded-lg object-cover border border-white/10" />
                  {i === 0 && (
                    <span className="absolute -left-1 -top-1 rounded bg-violet-600 px-1 text-[9px] font-bold">
                      Cover
                    </span>
                  )}
                </div>
              ))}
            </div>

            <input
              className="mb-3 w-full rounded-xl border border-white/10 bg-white/10 p-3 text-sm"
              placeholder="Nom du produit *"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="mb-3 w-full rounded-xl border border-white/10 bg-white/10 p-3 text-sm"
              placeholder="Prix (€) *"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <CustomSelect
              value={mainCategory}
              onChange={setMainCategory}
              placeholder="Catégorie *"
              options={MAIN_CATEGORIES.map((c) => ({ value: c, label: c }))}
              className="mb-3"
            />
            <textarea
              className="mb-4 w-full rounded-xl border border-white/10 bg-white/10 p-3 text-sm"
              placeholder="Description (facultatif)"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={submitProduct}
                disabled={saving}
                className="btn-touch flex-1 rounded-xl bg-violet-600 py-3 font-bold text-white hover:bg-violet-500 disabled:opacity-50"
              >
                {saving ? <Loader2 className="mx-auto animate-spin" size={18} /> : "Créer le produit"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={saving}
                className="flex-1 rounded-xl border border-white/10 py-3 font-semibold text-white/70 hover:bg-white/5"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
