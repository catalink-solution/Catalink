"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Zap, ArrowRight, Layers } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { categoryLimit, canCreateCategory, planLabel } from "@/lib/subscription";
import { MAIN_CATEGORIES, sizesForMain } from "@/lib/categories";
import {
  SINGLE_SIZE,
  stockLevel,
  STOCK_META,
  totalStock,
} from "@/lib/stock";
import type { ProductCategory, ProductImage, ProductVariant } from "@/lib/types";
import { VariantEditor } from "@/components/dashboard/variant-editor";
import { CustomSelect } from "@/components/ui/custom-select";
import {
  EMPTY_VARIANT_DRAFT,
  loadProductVariants,
  saveProductVariants,
  type VariantDraft,
} from "@/lib/variant-store";
import { ContextualTip } from "@/components/dashboard/contextual-tip";
import { APP_ERROR_ACTIONS } from "@/lib/app-error-log";
import { reportAppError } from "@/lib/report-app-error";

type Product = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  image_url: string | null;
  category: string | null;
  product_main_category: string | null;
  product_custom_category_id: string | null;
  sizes: string[] | null;
  is_active: boolean;
  track_stock: boolean;
  has_variants: boolean;
};

const NEW_CATEGORY_VALUE = "__new__";
const MAX_IMAGES = 5;

export default function ProductsPage() {
  const [shopId, setShopId] = useState<string | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [imagesByProduct, setImagesByProduct] = useState<Record<string, ProductImage[]>>({});
  const [variantsByProduct, setVariantsByProduct] = useState<Record<string, ProductVariant[]>>({});

  // ─── Formulaire ajout ────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [mainCategory, setMainCategory] = useState("");
  const [customCategoryId, setCustomCategoryId] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [trackStock, setTrackStock] = useState(false);
  const [stockBySize, setStockBySize] = useState<Record<string, string>>({});
  const [variantDraft, setVariantDraft] = useState<VariantDraft>(EMPTY_VARIANT_DRAFT);
  const [message, setMessage] = useState("");

  // ─── Suppression ─────────────────────────────────────────────────────────
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ─── Modale édition ──────────────────────────────────────────────────────
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editMainCategory, setEditMainCategory] = useState("");
  const [editCustomCategoryId, setEditCustomCategoryId] = useState("");
  const [editNewCategory, setEditNewCategory] = useState("");
  const [editSelectedSizes, setEditSelectedSizes] = useState<string[]>([]);
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editUploading, setEditUploading] = useState(false);
  const [editTrackStock, setEditTrackStock] = useState(false);
  const [editStockBySize, setEditStockBySize] = useState<Record<string, string>>({});
  const [editVariantDraft, setEditVariantDraft] = useState<VariantDraft>(EMPTY_VARIANT_DRAFT);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const limit = categoryLimit(plan);
  const limitLabel = limit === Infinity ? "illimité" : String(limit);
  const canAddCategory = canCreateCategory(plan, categories.length);

  const availableSizes = sizesForMain(mainCategory);
  const editAvailableSizes = sizesForMain(editMainCategory);

  // Sizes used for stock entry: selected sizes, or a single global entry.
  const stockSizes = selectedSizes.length > 0 ? selectedSizes : [SINGLE_SIZE];
  const editStockSizes = editSelectedSizes.length > 0 ? editSelectedSizes : [SINGLE_SIZE];

  useEffect(() => {
    loadShopAndProducts();
  }, []);

  function customName(id: string | null): string | null {
    if (!id) return null;
    return categories.find((c) => c.id === id)?.name ?? null;
  }

  // ─── Helpers tailles ─────────────────────────────────────────────────────

  function toggleSize(size: string) {
    setSelectedSizes((current) =>
      current.includes(size) ? current.filter((s) => s !== size) : [...current, size]
    );
  }

  function toggleEditSize(size: string) {
    setEditSelectedSizes((current) =>
      current.includes(size) ? current.filter((s) => s !== size) : [...current, size]
    );
  }

  // ─── Chargement ──────────────────────────────────────────────────────────

  async function loadShopAndProducts() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Tu dois être connecté.");
      return;
    }

    const { data: shop, error: shopError } = await supabase
      .from("shops")
      .select("id, plan")
      .eq("user_id", user.id)
      .maybeSingle();

    if (shopError) {
      setMessage(shopError.message);
      return;
    }
    if (!shop) {
      setMessage("Aucune boutique trouvée. Crée d'abord ta boutique.");
      return;
    }

    setShopId(shop.id);
    setPlan(shop.plan ?? "free");

    await Promise.all([loadCategories(shop.id), loadProducts(shop.id)]);
  }

  async function loadCategories(sid: string) {
    const { data } = await supabase
      .from("product_categories")
      .select("*")
      .eq("shop_id", sid)
      .order("name", { ascending: true });
    setCategories((data ?? []) as ProductCategory[]);
  }

  async function loadProducts(sid: string) {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("shop_id", sid)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }
    const list = (data ?? []) as Product[];
    setProducts(list);

    const ids = list.map((p) => p.id);
    if (ids.length > 0) {
      const [{ data: imgs }, { data: variants }] = await Promise.all([
        supabase.from("product_images").select("*").in("product_id", ids).order("position", { ascending: true }),
        supabase.from("product_variants").select("*").in("product_id", ids),
      ]);
      const imgMap: Record<string, ProductImage[]> = {};
      for (const im of (imgs ?? []) as ProductImage[]) (imgMap[im.product_id] ??= []).push(im);
      setImagesByProduct(imgMap);
      const varMap: Record<string, ProductVariant[]> = {};
      for (const v of (variants ?? []) as ProductVariant[]) (varMap[v.product_id] ??= []).push(v);
      setVariantsByProduct(varMap);
    } else {
      setImagesByProduct({});
      setVariantsByProduct({});
    }
  }

  // ─── Persistance images & variants ─────────────────────────────────────────

  async function saveImages(productId: string, urls: string[]) {
    await supabase.from("product_images").delete().eq("product_id", productId);
    if (urls.length > 0) {
      const rows = urls.map((url, i) => ({ product_id: productId, image_url: url, position: i }));
      await supabase.from("product_images").insert(rows);
    }
  }

  async function saveVariants(
    productId: string,
    track: boolean,
    sizes: string[],
    stockMap: Record<string, string>
  ) {
    await supabase.from("product_variants").delete().eq("product_id", productId);
    if (!track) return;
    const keys = sizes.length > 0 ? sizes : [SINGLE_SIZE];
    const rows = keys.map((s) => ({
      product_id: productId,
      size: s,
      stock: Math.max(0, parseInt(stockMap[s] ?? "0", 10) || 0),
    }));
    await supabase.from("product_variants").insert(rows);
  }

  // ─── Création de catégorie ─────────────────────────────────────────────────

  async function createCategory(rawName: string): Promise<ProductCategory | null> {
    const clean = rawName.trim();
    if (!clean || !shopId) return null;

    if (!canCreateCategory(plan, categories.length)) {
      setMessage(
        `Limite de catégories atteinte (${limitLabel} pour le plan ${planLabel(plan)}).`
      );
      return null;
    }

    const { data, error } = await supabase
      .from("product_categories")
      .insert({ shop_id: shopId, name: clean })
      .select()
      .single();

    if (error) {
      setMessage(
        error.code === "23505"
          ? "Cette catégorie existe déjà."
          : "Erreur catégorie : " + error.message
      );
      return null;
    }

    const created = data as ProductCategory;
    setCategories((cur) =>
      [...cur, created].sort((a, b) => a.name.localeCompare(b.name))
    );
    return created;
  }

  // ─── Upload image ─────────────────────────────────────────────────────────

  async function uploadOne(file: File): Promise<string | null> {
    const fileExt = file.name.split(".").pop();
    const fileName = Date.now() + "-" + Math.random().toString(36).slice(2, 8) + "." + fileExt;
    const filePath = (shopId || "temp") + "/" + fileName;
    const { error } = await supabase.storage.from("product-images").upload(filePath, file);
    if (error) {
      void reportAppError({
        action: APP_ERROR_ACTIONS.PRODUCT_UPLOAD_IMAGE,
        message: error.message,
        metadata: { shopId, code: error.name },
      });
      setMessage("Erreur lors de l'envoi de l'image.");
      return null;
    }
    const { data } = supabase.storage.from("product-images").getPublicUrl(filePath);
    return data.publicUrl;
  }

  async function handleUpload(
    files: FileList,
    current: string[],
    setter: (urls: string[]) => void,
    setBusy: (b: boolean) => void
  ) {
    setMessage("");
    const room = MAX_IMAGES - current.length;
    if (room <= 0) {
      setMessage(`Maximum ${MAX_IMAGES} photos par produit.`);
      return;
    }
    const toUpload = Array.from(files).slice(0, room);
    if (files.length > room) {
      setMessage(`Maximum ${MAX_IMAGES} photos : seules les ${room} premières ont été ajoutées.`);
    }
    setBusy(true);
    const urls = [...current];
    for (const file of toUpload) {
      const url = await uploadOne(file);
      if (url) urls.push(url);
    }
    setter(urls);
    setBusy(false);
  }

  // ─── Ajout produit ────────────────────────────────────────────────────────

  async function addProduct() {
    setMessage("");
    if (!shopId) {
      setMessage("Aucune boutique trouvée.");
      return;
    }
    if (!name.trim()) {
      setMessage("Le nom est obligatoire.");
      return;
    }
    if (!mainCategory) {
      setMessage("La catégorie principale est obligatoire.");
      return;
    }
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      setMessage("Prix invalide.");
      return;
    }

    let customId: string | null = null;
    let customLabel: string | null = null;

    if (customCategoryId === NEW_CATEGORY_VALUE) {
      const created = await createCategory(newCategory);
      if (!created) return;
      customId = created.id;
      customLabel = created.name;
    } else if (customCategoryId) {
      customId = customCategoryId;
      customLabel = customName(customCategoryId);
    }

    const { data: inserted, error } = await supabase
      .from("products")
      .insert({
        shop_id: shopId,
        name: name.trim(),
        price: priceNum,
        description,
        image_url: images[0] ?? null,
        category: customLabel ?? mainCategory,
        product_main_category: mainCategory,
        product_custom_category_id: customId,
        sizes: selectedSizes,
        is_active: true,
        track_stock: trackStock,
      })
      .select("id")
      .single();

    if (error || !inserted) {
      void reportAppError({
        action: APP_ERROR_ACTIONS.PRODUCT_CREATE,
        message: error?.message ?? "insert_failed",
        metadata: { shopId, code: error?.code },
      });
      setMessage("Erreur lors de l'ajout du produit.");
      return;
    }

    const newId = (inserted as { id: string }).id;
    await saveImages(newId, images);
    await saveVariants(newId, trackStock, selectedSizes, stockBySize);
    await saveProductVariants(newId, variantDraft);

    setName("");
    setPrice("");
    setDescription("");
    setImages([]);
    setMainCategory("");
    setCustomCategoryId("");
    setNewCategory("");
    setSelectedSizes([]);
    setTrackStock(false);
    setStockBySize({});
    setVariantDraft(EMPTY_VARIANT_DRAFT);
    setMessage("Produit ajouté avec succès.");

    await loadProducts(shopId);
  }

  // ─── Toggle actif/inactif ─────────────────────────────────────────────────

  async function toggleActive(product: Product) {
    const newValue = !product.is_active;
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, is_active: newValue } : p))
    );

    const { error } = await supabase
      .from("products")
      .update({ is_active: newValue })
      .eq("id", product.id);

    if (error) {
      void reportAppError({
        action: APP_ERROR_ACTIONS.PRODUCT_UPDATE,
        message: error.message,
        metadata: { productId: product.id, code: error.code },
      });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_active: product.is_active } : p))
      );
      setMessage("Erreur lors de la mise à jour.");
    }
  }

  // ─── Suppression ──────────────────────────────────────────────────────────

  async function deleteProduct(id: string) {
    setDeletingId(id);
    const { error } = await supabase.from("products").delete().eq("id", id);
    setDeletingId(null);
    setDeleteConfirmId(null);

    if (error) {
      setMessage("Erreur suppression : " + error.message);
      return;
    }

    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  // ─── Édition ──────────────────────────────────────────────────────────────

  function openEdit(product: Product) {
    setEditingProduct(product);
    setEditName(product.name);
    setEditDescription(product.description ?? "");
    setEditPrice(String(product.price));
    setEditMainCategory(product.product_main_category ?? "");
    setEditCustomCategoryId(product.product_custom_category_id ?? "");
    setEditNewCategory("");
    setEditSelectedSizes(product.sizes ?? []);

    const imgs = imagesByProduct[product.id] ?? [];
    const imgUrls = imgs.length > 0 ? imgs.map((i) => i.image_url) : product.image_url ? [product.image_url] : [];
    setEditImages(imgUrls);

    setEditTrackStock(product.track_stock);
    const vmap: Record<string, string> = {};
    for (const v of variantsByProduct[product.id] ?? []) vmap[v.size] = String(v.stock);
    setEditStockBySize(vmap);

    setEditVariantDraft(EMPTY_VARIANT_DRAFT);
    if (product.has_variants) {
      loadProductVariants(product.id).then(setEditVariantDraft);
    }

    setEditError(null);
  }

  function closeEdit() {
    setEditingProduct(null);
    setEditError(null);
  }

  async function saveEdit() {
    if (!editingProduct) return;

    const priceNum = parseFloat(editPrice);
    if (!editName.trim()) {
      setEditError("Le nom est obligatoire.");
      return;
    }
    if (isNaN(priceNum) || priceNum < 0) {
      setEditError("Prix invalide.");
      return;
    }
    if (!editMainCategory) {
      setEditError("La catégorie principale est obligatoire.");
      return;
    }

    setEditSaving(true);
    setEditError(null);

    let customId: string | null = null;
    let customLabel: string | null = null;

    if (editCustomCategoryId === NEW_CATEGORY_VALUE) {
      const created = await createCategory(editNewCategory);
      if (!created) {
        setEditSaving(false);
        setEditError("Catégorie invalide ou limite atteinte.");
        return;
      }
      customId = created.id;
      customLabel = created.name;
    } else if (editCustomCategoryId) {
      customId = editCustomCategoryId;
      customLabel = customName(editCustomCategoryId);
    }

    const { error } = await supabase
      .from("products")
      .update({
        name: editName.trim(),
        description: editDescription.trim() || null,
        price: priceNum,
        image_url: editImages[0] ?? null,
        category: customLabel ?? editMainCategory,
        product_main_category: editMainCategory,
        product_custom_category_id: customId,
        sizes: editSelectedSizes,
        track_stock: editTrackStock,
      })
      .eq("id", editingProduct.id);

    if (error) {
      void reportAppError({
        action: APP_ERROR_ACTIONS.PRODUCT_UPDATE,
        message: error.message,
        metadata: { productId: editingProduct.id, code: error.code },
      });
      setEditSaving(false);
      setEditError("Erreur lors de la mise à jour.");
      return;
    }

    await saveImages(editingProduct.id, editImages);
    await saveVariants(editingProduct.id, editTrackStock, editSelectedSizes, editStockBySize);
    await saveProductVariants(editingProduct.id, editVariantDraft);

    setEditSaving(false);

    const sid = shopId;
    closeEdit();
    if (sid) await loadProducts(sid);
  }

  // ─── Rendu ────────────────────────────────────────────────────────────────

  return (
    <main className="p-4 sm:p-6 md:p-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-extrabold tracking-tight">Produits</h1>
        <span className="text-sm text-white/40">
          Catégories : {categories.length}/{limitLabel}{" "}
          <span className="text-white/30">· Plan {planLabel(plan)}</span>
        </span>
      </div>

      <ContextualTip page="products" />

      {/* ── Import Rapide ── */}
      <div
        className="relative mb-8 max-w-3xl overflow-hidden rounded-2xl border border-emerald-500/30 p-6"
        style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(59,130,246,0.08))" }}
      >
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg">
              <Zap size={24} />
            </span>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">Import Rapide</h2>
              <p className="mt-1 max-w-md text-sm text-white/70">
                Upload plusieurs photos, sélectionne celles d&apos;un produit, crée la fiche — répète
                jusqu&apos;à tout importer. Sans IA.
              </p>
              <span className="mt-2 inline-block rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-medium text-violet-200">
                Import IA — bientôt disponible
              </span>
            </div>
          </div>
          <Link
            href="/dashboard/products/quick-import"
            className="btn-touch inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-base font-bold text-white shadow-lg transition-all hover:bg-emerald-500"
          >
            Import Rapide <ArrowRight size={18} />
          </Link>
        </div>
      </div>

      {/* ── Formulaire ajout manuel ── */}
      <h2 className="mb-4 text-lg font-bold text-white/90">Ajouter un produit manuellement</h2>
      <div id="manual-form" className="max-w-2xl border border-white/10 rounded-2xl p-6 mb-10">
        <input
          className="w-full mb-3 p-3 rounded-xl bg-white/10 border border-white/10"
          placeholder="Nom du produit"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="w-full mb-3 p-3 rounded-xl bg-white/10 border border-white/10"
          placeholder="Prix"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />

        <textarea
          className="w-full mb-3 p-3 rounded-xl bg-white/10 border border-white/10"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="mb-3">
          <label className="mb-1 block text-sm text-white/60">
            Photos ({images.length}/{MAX_IMAGES}) — la 1ʳᵉ est la principale
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={images.length >= MAX_IMAGES}
            className="w-full p-3 rounded-xl bg-white/10 border border-white/10 disabled:opacity-50"
            onChange={(e) => {
              if (e.target.files?.length) handleUpload(e.target.files, images, setImages, setUploading);
              e.target.value = "";
            }}
          />
          {uploading && <p className="text-sm text-white/60 mt-2">Upload en cours...</p>}
          {images.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-3">
              {images.map((url, i) => (
                <div key={url} className="relative">
                  <img
                    src={url}
                    alt={`Aperçu ${i + 1}`}
                    className="w-24 h-24 object-cover rounded-xl border border-white/10"
                  />
                  {i === 0 && (
                    <span className="absolute left-1 top-1 rounded bg-violet-600 px-1.5 py-0.5 text-[10px] font-semibold">
                      Principale
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setImages((cur) => cur.filter((u) => u !== url))}
                    className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-red-600 text-xs font-bold text-white hover:bg-red-700"
                    aria-label="Supprimer la photo"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Catégorie principale (obligatoire) */}
        <CustomSelect
          label="Catégorie principale *"
          value={mainCategory}
          onChange={(v) => {
            setMainCategory(v);
            setSelectedSizes([]);
          }}
          placeholder="— Choisir —"
          options={MAIN_CATEGORIES.map((cat) => ({ value: cat, label: cat }))}
          className="mb-3"
        />

        <CustomSelect
          label="Catégorie personnalisée"
          value={customCategoryId}
          onChange={setCustomCategoryId}
          placeholder="— Aucune —"
          options={[
            { value: "", label: "— Aucune —" },
            ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
            { value: NEW_CATEGORY_VALUE, label: "+ Créer une nouvelle catégorie" },
          ]}
          className="mb-2"
        />

        {categories.length === 0 && customCategoryId !== NEW_CATEGORY_VALUE && (
          <p className="mb-3 text-xs text-white/40">
            Aucune catégorie personnalisée créée.{" "}
            <button
              type="button"
              onClick={() => setCustomCategoryId(NEW_CATEGORY_VALUE)}
              className="text-violet-400 hover:text-violet-300 underline"
            >
              Créer une catégorie
            </button>
          </p>
        )}

        {customCategoryId === NEW_CATEGORY_VALUE && (
          <div className="mb-3">
            <input
              className="w-full p-3 rounded-xl bg-white/10 border border-white/10"
              placeholder="Nom de la nouvelle catégorie (ex : Homme, Sneakers...)"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
            {!canAddCategory && (
              <p className="mt-2 text-xs text-amber-300">
                Limite atteinte ({limitLabel} catégories — plan {planLabel(plan)}).
                Passe à un plan supérieur pour en créer davantage.
              </p>
            )}
          </div>
        )}

        {/* Tailles (selon catégorie principale) */}
        {!variantDraft.enabled && availableSizes.length > 0 && (
          <div className="mb-4">
            <p className="text-white/70 mb-2">Tailles disponibles</p>
            <div className="flex flex-wrap gap-2">
              {availableSizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSize(size)}
                  className={
                    selectedSizes.includes(size)
                      ? "px-4 py-2 rounded-xl border bg-violet-600 border-violet-500"
                      : "px-4 py-2 rounded-xl border bg-white/10 border-white/10"
                  }
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Gestion du stock (système simple, masqué si variantes activées) */}
        {!variantDraft.enabled && (
          <div className="mb-4 rounded-xl border border-white/10 p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={trackStock}
                onChange={(e) => setTrackStock(e.target.checked)}
                className="h-4 w-4 accent-violet-600"
              />
              <span className="text-sm text-white/80">Gérer le stock de ce produit</span>
            </label>
            {trackStock && (
              <div className="mt-3">
                <p className="mb-2 text-xs text-white/50">
                  {selectedSizes.length > 0
                    ? "Stock par taille :"
                    : "Stock global (aucune taille sélectionnée) :"}
                </p>
                <div className="flex flex-wrap gap-3">
                  {stockSizes.map((s) => (
                    <label key={s} className="flex items-center gap-2">
                      <span className="text-sm text-white/60 w-20">
                        {s === SINGLE_SIZE ? "Quantité" : s}
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={stockBySize[s] ?? ""}
                        onChange={(e) =>
                          setStockBySize((cur) => ({ ...cur, [s]: e.target.value }))
                        }
                        placeholder="0"
                        className="w-20 p-2 rounded-lg bg-white/10 border border-white/10 text-sm"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Variantes du produit (couleurs, tailles, matières…) */}
        <div className="mb-4">
          <h3 className="mb-2 flex items-center gap-2 text-base font-bold text-white/90">
            <Layers size={18} className="text-violet-400" /> Variantes du produit
          </h3>
          <p className="mb-3 text-sm text-white/50">
            Crée un produit simple, ou active les variantes pour gérer plusieurs couleurs,
            tailles, photos et stocks.
          </p>
          <VariantEditor draft={variantDraft} onChange={setVariantDraft} uploadImage={uploadOne} />
        </div>

        <button
          onClick={addProduct}
          className="bg-violet-600 px-6 py-3 rounded-xl font-bold hover:bg-violet-700 transition-colors"
        >
          Ajouter le produit
        </button>

        {message && <p className="mt-4 text-white/70">{message}</p>}
      </div>

      {/* ── Liste produits ── */}
      <div className="grid md:grid-cols-3 gap-6">
        {products.map((product) => {
          const imgCount = imagesByProduct[product.id]?.length ?? (product.image_url ? 1 : 0);
          const variants = variantsByProduct[product.id] ?? [];
          const total = totalStock(variants);
          const level = stockLevel(total);
          return (
          <div key={product.id} className="border border-white/10 rounded-2xl p-5 flex flex-col">
            {product.image_url && (
              <div className="relative mb-4">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-xl border border-white/10"
                />
                {imgCount > 1 && (
                  <span className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-xs font-medium text-white">
                    {imgCount} photos
                  </span>
                )}
              </div>
            )}

            <h2 className="text-xl font-bold">{product.name}</h2>
            <p className="text-violet-400 font-bold mt-2">{product.price}€</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {product.product_main_category && (
                <span className="text-xs bg-white/10 px-2.5 py-1 rounded-full">
                  {product.product_main_category}
                </span>
              )}
              {customName(product.product_custom_category_id) && (
                <span className="text-xs bg-violet-600/20 text-violet-200 px-2.5 py-1 rounded-full">
                  {customName(product.product_custom_category_id)}
                </span>
              )}
              {product.track_stock && !product.has_variants && (
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STOCK_META[level].cls}`}>
                  {STOCK_META[level].label} · {total}
                </span>
              )}
              {product.has_variants && (
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-violet-500/15 text-violet-200">
                  Variantes
                </span>
              )}
            </div>
            <p className="text-white/60 mt-3">{product.description}</p>

            {product.sizes && product.sizes.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {product.sizes.map((size) => (
                  <span key={size} className="text-xs bg-white/10 px-3 py-1 rounded-full">
                    {size}
                  </span>
                ))}
              </div>
            )}

            {/* ── Actions ── */}
            <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between gap-2">

              {/* Toggle actif */}
              <button
                onClick={() => toggleActive(product)}
                title={product.is_active ? "Désactiver" : "Activer"}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  product.is_active ? "bg-violet-600" : "bg-white/20"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    product.is_active ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span className="text-xs text-white/40 flex-1">
                {product.is_active ? "Actif" : "Inactif"}
              </span>

              {/* Modifier */}
              <button
                onClick={() => openEdit(product)}
                className="text-xs text-violet-400 hover:text-violet-300 font-medium px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                Modifier
              </button>

              {/* Supprimer */}
              {deleteConfirmId === product.id ? (
                <span className="flex items-center gap-1">
                  <button
                    onClick={() => deleteProduct(product.id)}
                    disabled={deletingId === product.id}
                    className="text-xs text-white bg-red-600 hover:bg-red-700 px-2 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {deletingId === product.id ? "…" : "Confirmer"}
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="text-xs text-white/50 hover:text-white/80 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    Annuler
                  </button>
                </span>
              ) : (
                <button
                  onClick={() => setDeleteConfirmId(product.id)}
                  className="text-xs text-red-400 hover:text-red-300 font-medium px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  Supprimer
                </button>
              )}
            </div>
          </div>
          );
        })}
      </div>

      {/* ── Modale édition ── */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeEdit}
          />

          <div className="relative bg-[#0f1117] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white">Modifier le produit</h2>

            {editError && (
              <p className="text-sm text-red-400 bg-red-400/10 px-3 py-2 rounded-xl">
                {editError}
              </p>
            )}

            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Nom du produit"
              className="w-full p-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500"
            />

            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Description"
              rows={3}
              className="w-full p-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500 resize-none"
            />

            <input
              type="number"
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
              placeholder="Prix"
              min="0"
              step="0.01"
              className="w-full p-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500"
            />

            {/* Photos */}
            <div>
              <label className="mb-1 block text-sm text-white/60">
                Photos ({editImages.length}/{MAX_IMAGES})
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={editImages.length >= MAX_IMAGES}
                className="w-full p-3 rounded-xl bg-white/10 border border-white/10 text-sm disabled:opacity-50"
                onChange={(e) => {
                  if (e.target.files?.length)
                    handleUpload(e.target.files, editImages, setEditImages, setEditUploading);
                  e.target.value = "";
                }}
              />
              {editUploading && <p className="mt-2 text-sm text-white/60">Upload en cours…</p>}
              {editImages.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-3">
                  {editImages.map((url, i) => (
                    <div key={url} className="relative">
                      <img
                        src={url}
                        alt={`Photo ${i + 1}`}
                        className="w-20 h-20 object-cover rounded-lg border border-white/10"
                      />
                      {i === 0 && (
                        <span className="absolute left-1 top-1 rounded bg-violet-600 px-1.5 py-0.5 text-[10px] font-semibold">
                          Principale
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setEditImages((cur) => cur.filter((u) => u !== url))}
                        className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-red-600 text-xs font-bold text-white hover:bg-red-700"
                        aria-label="Supprimer la photo"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <CustomSelect
                label="Catégorie principale *"
                value={editMainCategory}
                onChange={(v) => {
                  setEditMainCategory(v);
                  setEditSelectedSizes([]);
                }}
                placeholder="— Choisir —"
                options={MAIN_CATEGORIES.map((cat) => ({ value: cat, label: cat }))}
              />
            </div>

            <div>
              <CustomSelect
                label="Catégorie personnalisée"
                value={editCustomCategoryId}
                onChange={setEditCustomCategoryId}
                placeholder="— Aucune —"
                options={[
                  { value: "", label: "— Aucune —" },
                  ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
                  { value: NEW_CATEGORY_VALUE, label: "+ Créer une nouvelle catégorie" },
                ]}
              />
              {categories.length === 0 && (
                <p className="mt-1 text-xs text-white/40">Aucune catégorie personnalisée créée.</p>
              )}
            </div>

            {editCustomCategoryId === NEW_CATEGORY_VALUE && (
              <div>
                <input
                  className="w-full p-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500"
                  placeholder="Nom de la nouvelle catégorie"
                  value={editNewCategory}
                  onChange={(e) => setEditNewCategory(e.target.value)}
                />
                {!canAddCategory && (
                  <p className="mt-2 text-xs text-amber-300">
                    Limite atteinte ({limitLabel} — plan {planLabel(plan)}).
                  </p>
                )}
              </div>
            )}

            {!editVariantDraft.enabled && editAvailableSizes.length > 0 && (
              <div>
                <p className="text-white/70 mb-2 text-sm">Tailles disponibles</p>
                <div className="flex flex-wrap gap-2">
                  {editAvailableSizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleEditSize(size)}
                      className={
                        editSelectedSizes.includes(size)
                          ? "px-3 py-1.5 rounded-xl border text-sm bg-violet-600 border-violet-500"
                          : "px-3 py-1.5 rounded-xl border text-sm bg-white/10 border-white/10"
                      }
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Gestion du stock (système simple, masqué si variantes activées) */}
            {!editVariantDraft.enabled && (
              <div className="rounded-xl border border-white/10 p-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editTrackStock}
                    onChange={(e) => setEditTrackStock(e.target.checked)}
                    className="h-4 w-4 accent-violet-600"
                  />
                  <span className="text-sm text-white/80">Gérer le stock</span>
                </label>
                {editTrackStock && (
                  <div className="mt-3">
                    <p className="mb-2 text-xs text-white/50">
                      {editSelectedSizes.length > 0 ? "Stock par taille :" : "Stock global :"}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {editStockSizes.map((s) => (
                        <label key={s} className="flex items-center gap-2">
                          <span className="text-sm text-white/60 w-20">
                            {s === SINGLE_SIZE ? "Quantité" : s}
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={editStockBySize[s] ?? ""}
                            onChange={(e) =>
                              setEditStockBySize((cur) => ({ ...cur, [s]: e.target.value }))
                            }
                            placeholder="0"
                            className="w-20 p-2 rounded-lg bg-white/10 border border-white/10 text-sm"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Variantes V3 */}
            <VariantEditor
              draft={editVariantDraft}
              onChange={setEditVariantDraft}
              uploadImage={uploadOne}
            />

            <div className="flex gap-3 pt-2">
              <button
                onClick={saveEdit}
                disabled={editSaving}
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
              >
                {editSaving ? "Enregistrement…" : "Enregistrer"}
              </button>
              <button
                onClick={closeEdit}
                disabled={editSaving}
                className="flex-1 border border-white/10 text-white/70 hover:bg-white/5 font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
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
