"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Download, ImageIcon, Sparkles, Settings2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/format";
import { renderStoryCanvas, downloadCanvas, STORY_PREVIEW_RATIO } from "@/lib/story-canvas";
import {
  BUILTIN_TEMPLATES,
  dbToTemplate,
  type StoryTemplateConfig,
  type DbStoryTemplate,
} from "@/lib/story-templates";

type Product = {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  is_active: boolean;
};

export default function StoriesPage() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [shopId, setShopId] = useState<string | null>(null);
  const [shopName, setShopName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [templates, setTemplates] = useState<StoryTemplateConfig[]>(BUILTIN_TEMPLATES);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState(BUILTIN_TEMPLATES[0].id);
  const [promoCode, setPromoCode] = useState("");
  const [generating, setGenerating] = useState(false);
  const previewRef = useRef<HTMLCanvasElement>(null);

  const selected = products.find((p) => p.id === selectedId) ?? null;
  const template = templates.find((t) => t.id === templateId) ?? BUILTIN_TEMPLATES[0];

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!selected || !previewRef.current) return;
    let cancelled = false;
    renderStoryCanvas({
      productName: selected.name,
      price: formatPrice(selected.price),
      imageUrl: selected.image_url,
      shopName,
      logoUrl,
      promoCode: template.showPromoCode ? promoCode.trim() || null : null,
      template,
    }).then((canvas) => {
      if (cancelled || !previewRef.current) return;
      const ctx = previewRef.current.getContext("2d");
      if (!ctx) return;
      previewRef.current.width = canvas.width;
      previewRef.current.height = canvas.height;
      ctx.drawImage(canvas, 0, 0);
    });
    return () => {
      cancelled = true;
    };
  }, [selected, shopName, logoUrl, promoCode, template]);

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setMessage("Tu dois être connecté.");
      setLoading(false);
      return;
    }
    const { data: shop } = await supabase
      .from("shops")
      .select("id, name, logo_url")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!shop) {
      setMessage("Crée d'abord ta boutique.");
      setLoading(false);
      return;
    }
    setShopId(shop.id);
    setShopName(shop.name);
    setLogoUrl(shop.logo_url);

    const [{ data: prods }, { data: customTpl }] = await Promise.all([
      supabase
        .from("products")
        .select("id, name, price, image_url, is_active")
        .eq("shop_id", shop.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false }),
      supabase
        .from("story_templates")
        .select("*")
        .eq("shop_id", shop.id)
        .order("created_at", { ascending: false }),
    ]);

    const list = (prods ?? []) as Product[];
    setProducts(list);
    if (list.length > 0) setSelectedId(list[0].id);

    const custom = ((customTpl ?? []) as DbStoryTemplate[]).map(dbToTemplate);
    setTemplates([...BUILTIN_TEMPLATES, ...custom]);
    setLoading(false);
  }

  async function download() {
    if (!selected || !shopId) return;
    setGenerating(true);
    try {
      const canvas = await renderStoryCanvas({
        productName: selected.name,
        price: formatPrice(selected.price),
        imageUrl: selected.image_url,
        shopName,
        logoUrl,
        promoCode: template.showPromoCode ? promoCode.trim() || null : null,
        template,
      });
      const safeName = selected.name.replace(/[^a-z0-9]+/gi, "-").slice(0, 40);
      downloadCanvas(canvas, `story-${safeName}.png`);

      await supabase.from("story_exports").insert({
        shop_id: shopId,
        product_id: selected.id,
        template_id: template.isBuiltin ? null : template.id,
      });
    } catch {
      setMessage("Erreur lors de la génération. Réessaie.");
    }
    setGenerating(false);
  }

  if (loading) {
    return <div className="p-6 text-white/60 md:p-10">Chargement…</div>;
  }

  return (
    <div className="min-w-0 p-4 sm:p-6 md:p-10">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Stories</h1>
          <p className="mt-1 text-sm text-white/50">
            Génère des visuels 9:16 pour Snapchat, TikTok et Instagram.
          </p>
        </div>
        <Link
          href="/dashboard/stories/templates"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-white/70 hover:bg-white/5"
        >
          <Settings2 size={16} /> Mes templates
        </Link>
      </div>

      {message && (
        <p className="mb-5 rounded-xl bg-white/5 px-4 py-3 text-sm text-white/70">{message}</p>
      )}

      {products.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-white/10 py-16 text-center">
          <ImageIcon size={40} className="text-white/20" />
          <p className="mt-4 text-white/50">Ajoute d'abord un produit actif.</p>
          <Link href="/dashboard/products" className="mt-4 text-sm text-violet-300 hover:text-violet-200">
            Aller aux produits →
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="flex flex-col items-center">
            <div
              className="relative w-full max-w-[320px] overflow-hidden rounded-3xl border border-white/10 shadow-2xl"
              style={{ aspectRatio: STORY_PREVIEW_RATIO }}
            >
              <canvas ref={previewRef} className="h-full w-full object-contain" />
            </div>
            <button
              onClick={download}
              disabled={generating || !selected}
              className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-xl px-6 py-3 font-bold text-white disabled:opacity-50"
              style={{ background: "linear-gradient(to right,#3b82f6,#7c3aed)" }}
            >
              <Download size={18} />
              {generating ? "Génération…" : "Télécharger en PNG"}
            </button>
          </div>

          <div className="min-w-0 space-y-4">
            <Field label="Produit">
              <select
                value={selectedId ?? ""}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-violet-500"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {formatPrice(p.price)}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Template">
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-violet-500"
              >
                <optgroup label="Templates par défaut">
                  {BUILTIN_TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </optgroup>
                {templates.filter((t) => !t.isBuiltin).length > 0 && (
                  <optgroup label="Mes templates">
                    {templates
                      .filter((t) => !t.isBuiltin)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                  </optgroup>
                )}
              </select>
            </Field>

            {template.showPromoCode && (
              <Field label="Code promo (optionnel)">
                <input
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="PROMO10"
                  className="w-full min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-violet-500"
                />
              </Field>
            )}

            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4">
              <div className="flex items-start gap-2">
                <Sparkles size={16} className="mt-0.5 shrink-0 text-violet-300" />
                <div className="text-xs text-white/60">
                  <p className="font-medium text-violet-200">Poster sur Snapchat</p>
                  <ol className="mt-2 list-decimal space-y-1 pl-4">
                    <li>Télécharge le PNG</li>
                    <li>Importe dans Snapchat / TikTok / Instagram</li>
                    <li>Ajoute le lien de ta boutique en sticker</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8">
        <Link href="/dashboard/hub" className="text-sm text-white/40 hover:text-white">
          ← Retour au Hub Social
        </Link>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-white/70">{label}</span>
      {children}
    </label>
  );
}
