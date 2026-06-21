"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  dbToTemplate,
  templateToDbInsert,
  type DbStoryTemplate,
  type BackgroundStyle,
  type PricePosition,
  type LogoPosition,
} from "@/lib/story-templates";

const EMPTY_FORM = {
  name: "",
  primaryColor: "#7c3aed",
  secondaryColor: "#3b82f6",
  ctaText: "Commander →",
  pricePosition: "bottom" as PricePosition,
  logoPosition: "top-left" as LogoPosition,
  backgroundStyle: "gradient" as BackgroundStyle,
  showLogo: true,
  showPromoCode: false,
};

export default function StoryTemplatesPage() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [shopId, setShopId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<DbStoryTemplate[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

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
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!shop) {
      setMessage("Crée d'abord ta boutique.");
      setLoading(false);
      return;
    }
    setShopId(shop.id);
    const { data } = await supabase
      .from("story_templates")
      .select("*")
      .eq("shop_id", shop.id)
      .order("created_at", { ascending: false });
    setTemplates((data ?? []) as DbStoryTemplate[]);
    setLoading(false);
  }

  async function save() {
    if (!shopId || !form.name.trim()) return setMessage("Indique un nom pour le template.");
    setSaving(true);
    const { error } = await supabase.from("story_templates").insert(
      templateToDbInsert(shopId, {
        name: form.name.trim(),
        primaryColor: form.primaryColor,
        secondaryColor: form.secondaryColor,
        ctaText: form.ctaText,
        pricePosition: form.pricePosition,
        logoPosition: form.logoPosition,
        backgroundStyle: form.backgroundStyle,
        showLogo: form.showLogo,
        showPromoCode: form.showPromoCode,
      })
    );
    setSaving(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setForm(EMPTY_FORM);
    setShowForm(false);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Supprimer ce template ?")) return;
    await supabase.from("story_templates").delete().eq("id", id);
    load();
  }

  if (loading) {
    return <div className="p-6 text-white/60 md:p-10">Chargement…</div>;
  }

  return (
    <div className="min-w-0 p-4 sm:p-6 md:p-10">
      <Link
        href="/dashboard/stories"
        className="mb-5 inline-flex min-h-[44px] items-center gap-2 text-sm text-white/50 hover:text-white"
      >
        <ArrowLeft size={16} /> Retour aux stories
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Mes templates</h1>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
        >
          <Plus size={16} /> Nouveau template
        </button>
      </div>

      {message && (
        <p className="mb-5 rounded-xl bg-white/5 px-4 py-3 text-sm text-white/70">{message}</p>
      )}

      {showForm && (
        <div className="mb-6 rounded-2xl border border-violet-500/30 bg-violet-500/5 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">Créer un template</h2>
            <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white">
              <X size={18} />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Nom *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Input label="Texte CTA" value={form.ctaText} onChange={(v) => setForm({ ...form, ctaText: v })} />
            <Input label="Couleur principale" type="color" value={form.primaryColor} onChange={(v) => setForm({ ...form, primaryColor: v })} />
            <Input label="Couleur secondaire" type="color" value={form.secondaryColor} onChange={(v) => setForm({ ...form, secondaryColor: v })} />
            <Select
              label="Position du prix"
              value={form.pricePosition}
              onChange={(v) => setForm({ ...form, pricePosition: v as PricePosition })}
              options={[
                { value: "top", label: "Haut" },
                { value: "center", label: "Centre" },
                { value: "bottom", label: "Bas" },
              ]}
            />
            <Select
              label="Position du logo"
              value={form.logoPosition}
              onChange={(v) => setForm({ ...form, logoPosition: v as LogoPosition })}
              options={[
                { value: "top-left", label: "Haut gauche" },
                { value: "top-center", label: "Haut centre" },
                { value: "bottom", label: "Bas" },
              ]}
            />
            <Select
              label="Style de fond"
              value={form.backgroundStyle}
              onChange={(v) => setForm({ ...form, backgroundStyle: v as BackgroundStyle })}
              options={[
                { value: "gradient", label: "Gradient" },
                { value: "dark", label: "Sombre" },
                { value: "light", label: "Clair" },
                { value: "blurred", label: "Image produit floutée" },
              ]}
            />
            <div className="flex flex-col justify-end gap-3 sm:flex-row">
              <Toggle label="Afficher logo" checked={form.showLogo} onChange={(v) => setForm({ ...form, showLogo: v })} />
              <Toggle label="Afficher code promo" checked={form.showPromoCode} onChange={(v) => setForm({ ...form, showPromoCode: v })} />
            </div>
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="mt-4 min-h-[44px] rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      )}

      {templates.length === 0 ? (
        <p className="text-white/50">
          Aucun template personnalisé. Les 4 templates pro intégrés restent disponibles dans Stories.
        </p>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => {
            const cfg = dbToTemplate(t);
            return (
              <div
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4"
              >
                <div className="min-w-0">
                  <p className="font-semibold">{cfg.name}</p>
                  <p className="text-xs text-white/40">
                    {cfg.backgroundStyle} · prix {cfg.pricePosition} · {cfg.ctaText}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <span className="h-5 w-5 rounded-full border border-white/20" style={{ background: cfg.primaryColor }} />
                    <span className="h-5 w-5 rounded-full border border-white/20" style={{ background: cfg.secondaryColor }} />
                  </div>
                </div>
                <button
                  onClick={() => remove(t.id)}
                  className="min-h-[44px] min-w-[44px] rounded-lg border border-white/10 p-2 text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-white/60">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-violet-500"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-white/60">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-violet-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm text-white/70">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" />
      {label}
    </label>
  );
}
