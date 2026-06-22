"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare, Plus, Copy, Check, Trash2, Sparkles, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  QUICK_REPLY_CATEGORIES,
  QUICK_REPLY_VARIABLES,
  DEFAULT_QUICK_REPLIES,
  categoryLabel,
  interpolateReply,
  type QuickReply,
  type QuickReplyVars,
} from "@/lib/quick-replies";
import { CustomSelect } from "@/components/ui/custom-select";

export default function QuickRepliesPage() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [shopId, setShopId] = useState<string | null>(null);
  const [replies, setReplies] = useState<QuickReply[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("availability");
  const [content, setContent] = useState("");
  const [previewVars, setPreviewVars] = useState<QuickReplyVars>({
    customer_name: "Marie",
    product_name: "Hoodie Nike",
    price: "89 €",
    size: "M",
    tracking_number: "FR123456789",
  });

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
      .from("quick_replies")
      .select("*")
      .eq("shop_id", shop.id)
      .order("created_at", { ascending: false });
    setReplies((data ?? []) as QuickReply[]);
    setLoading(false);
  }

  async function seedDefaults() {
    if (!shopId) return;
    const rows = DEFAULT_QUICK_REPLIES.map((r) => ({
      shop_id: shopId,
      title: r.title,
      category: r.category,
      content: r.content,
    }));
    const { error } = await supabase.from("quick_replies").insert(rows);
    if (error) setMessage(error.message);
    else load();
  }

  async function save() {
    if (!shopId || !title.trim() || !content.trim()) {
      setMessage("Titre et contenu requis.");
      return;
    }
    const { error } = await supabase.from("quick_replies").insert({
      shop_id: shopId,
      title: title.trim(),
      category,
      content: content.trim(),
    });
    if (error) setMessage(error.message);
    else {
      setTitle("");
      setContent("");
      setShowForm(false);
      load();
    }
  }

  async function remove(id: string) {
    if (!confirm("Supprimer cette réponse ?")) return;
    await supabase.from("quick_replies").delete().eq("id", id);
    load();
  }

  async function copyReply(r: QuickReply) {
    const text = interpolateReply(r.content, previewVars);
    await navigator.clipboard.writeText(text);
    setCopiedId(r.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function insertToken(token: string) {
    setContent((c) => c + token);
  }

  const visible =
    filter === "all" ? replies : replies.filter((r) => r.category === filter);

  if (loading) {
    return <div className="p-6 text-white/60 md:p-10">Chargement…</div>;
  }

  return (
    <div className="min-w-0 p-4 sm:p-6 md:p-10">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Réponses rapides</h1>
          <p className="mt-1 text-sm text-white/50">
            Réponds plus vite sur Snapchat, WhatsApp et Telegram. Intégration IA à venir.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {replies.length === 0 && (
            <button
              onClick={seedDefaults}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-white/70 hover:bg-white/5"
            >
              <Sparkles size={16} /> Modèles par défaut
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
          >
            <Plus size={16} /> Nouvelle réponse
          </button>
        </div>
      </div>

      {message && (
        <p className="mb-5 rounded-xl bg-white/5 px-4 py-3 text-sm text-white/70">{message}</p>
      )}

      {/* Preview variables */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/40">
          Variables de prévisualisation (pour tester avant copie)
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_REPLY_VARIABLES.map((v) => (
            <label key={v.key} className="block text-xs text-white/50">
              {v.label}
              <input
                value={previewVars[v.key as keyof QuickReplyVars] ?? ""}
                onChange={(e) =>
                  setPreviewVars({ ...previewVars, [v.key]: e.target.value })
                }
                className="mt-1 w-full min-h-[40px] rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white outline-none focus:border-violet-500"
              />
            </label>
          ))}
        </div>
      </div>

      {showForm && (
        <div className="mb-6 rounded-2xl border border-violet-500/30 bg-violet-500/5 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">Créer une réponse</h2>
            <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white">
              <X size={18} />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs text-white/60">Titre</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-violet-500"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-white/60">Catégorie</span>
              <CustomSelect
                value={category}
                onChange={setCategory}
                options={QUICK_REPLY_CATEGORIES.map((c) => ({
                  value: c.key,
                  label: c.label,
                }))}
              />
            </label>
            <div className="flex flex-wrap items-end gap-1">
              {QUICK_REPLY_VARIABLES.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => insertToken(v.token)}
                  className="rounded-lg border border-white/10 px-2 py-1 text-[11px] text-violet-300 hover:bg-white/5"
                >
                  {v.token}
                </button>
              ))}
            </div>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs text-white/60">Message</span>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-violet-500"
              />
            </label>
          </div>
          <button
            onClick={save}
            className="mt-4 min-h-[44px] rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
          >
            Enregistrer
          </button>
        </div>
      )}

      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl border border-white/10 bg-white/[0.02] p-1">
        <FilterBtn active={filter === "all"} onClick={() => setFilter("all")} label="Toutes" />
        {QUICK_REPLY_CATEGORIES.map((c) => (
          <FilterBtn
            key={c.key}
            active={filter === c.key}
            onClick={() => setFilter(c.key)}
            label={c.label}
          />
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-white/10 py-16 text-center">
          <MessageSquare size={40} className="text-white/20" />
          <p className="mt-4 text-white/50">Aucune réponse pour cette catégorie.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((r) => {
            const preview = interpolateReply(r.content, previewVars);
            return (
              <div
                key={r.id}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{r.title}</p>
                    <span className="mt-1 inline-block rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-white/50">
                      {categoryLabel(r.category)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyReply(r)}
                      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-violet-600/20 px-4 py-2 text-sm font-semibold text-violet-200 hover:bg-violet-600/30"
                    >
                      {copiedId === r.id ? <Check size={15} /> : <Copy size={15} />}
                      {copiedId === r.id ? "Copié !" : "Copier"}
                    </button>
                    <button
                      onClick={() => remove(r.id)}
                      className="min-h-[44px] min-w-[44px] rounded-xl border border-white/10 p-2 text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-wrap rounded-xl bg-black/20 p-3 text-sm text-white/75">
                  {preview}
                </p>
              </div>
            );
          })}
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

function FilterBtn({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium ${
        active ? "bg-violet-600 text-white" : "text-white/50 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}
