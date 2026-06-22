"use client";

import { useEffect, useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ShopPage() {
  const [shopId, setShopId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [telegram, setTelegram] = useState("");
  const [snapchat, setSnapchat] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    loadShop();
  }, []);

  async function loadShop() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Tu dois être connecté.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("shops")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (data) {
      setShopId(data.id);
      setName(data.name || "");
      setSlug(data.slug || "");
      setDescription(data.description || "");
      setWhatsapp(data.whatsapp || "");
      setTelegram(data.telegram || "");
      setSnapchat(data.snapchat || "");
      setInstagram(data.instagram || "");
      setTiktok(data.tiktok || "");
      setLogoUrl(data.logo_url || "");
    }

    setLoading(false);
  }

  async function uploadLogo(file: File) {
    setLogoUploading(true);
    setMessage("");

    const ext = file.name.split(".").pop();
    const path = `${shopId || "logos"}/logo-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("product-images")
      .upload(path, file);

    if (error) {
      setMessage("Erreur upload logo : " + error.message);
      setLogoUploading(false);
      return;
    }

    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    setLogoUrl(data.publicUrl);
    setLogoUploading(false);
  }

  function cleanSlug(value: string) {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async function saveShop() {
    setMessage("");

    if (!name.trim()) return setMessage("Le nom de la boutique est obligatoire.");
    const finalSlug = cleanSlug(slug);
    if (!finalSlug) return setMessage("Le lien (slug) est obligatoire.");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return setMessage("Tu dois être connecté.");

    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session?.access_token) {
      const ctxRes = await fetch("/api/auth/context", {
        headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
      });
      if (ctxRes.ok) {
        const ctx = (await ctxRes.json()) as { isPlatformAdmin: boolean };
        if (ctx.isPlatformAdmin) {
          setMessage("Ce compte est réservé à l'administration plateforme. Accède à /admin.");
          return;
        }
      }
    }

    setSaving(true);

    const payload = {
      user_id: user.id,
      name: name.trim(),
      slug: finalSlug,
      description,
      whatsapp,
      telegram,
      snapchat,
      instagram,
      tiktok,
      logo_url: logoUrl || null,
    };

    const { error } = shopId
      ? await supabase.from("shops").update(payload).eq("id", shopId)
      : await supabase.from("shops").insert(payload);

    setSaving(false);

    if (error) {
      setMessage(
        error.code === "23505"
          ? "Ce lien est déjà pris, choisis-en un autre."
          : error.message
      );
      return;
    }

    setSlug(finalSlug);
    setMessage(shopId ? "Boutique mise à jour." : "Boutique créée avec succès.");
    loadShop();
  }

  function copyLink() {
    navigator.clipboard.writeText(`${origin}/${slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return <div className="p-6 text-white/60 md:p-10">Chargement…</div>;
  }

  return (
    <main className="p-4 sm:p-6 md:p-10">
      <h1 className="mb-2 text-3xl font-extrabold tracking-tight">Ma boutique</h1>
      <p className="mb-8 text-white/50">Configure ton catalogue public.</p>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="max-w-2xl space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <Field label="Logo / photo de profil">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-xl font-bold text-white/50">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt="Logo de la boutique"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{(name.trim().charAt(0) || "?").toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadLogo(file);
                  }}
                  className="block w-full text-sm text-white/60 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-white hover:file:bg-white/20"
                />
                {logoUploading && (
                  <p className="mt-1 text-xs text-white/50">Upload en cours…</p>
                )}
                <p className="mt-1 text-xs text-white/30">Optionnel · PNG ou JPG carré conseillé.</p>
              </div>
            </div>
          </Field>

          <Field label="Nom de la boutique *">
            <input
              className="input"
              placeholder="Ma boutique"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>

          <Field label="Lien public *">
            <div className="flex items-center overflow-hidden rounded-xl border border-white/10 bg-white/5 focus-within:border-violet-500">
              <span className="pl-3 text-sm text-white/30">/</span>
              <input
                className="w-full bg-transparent p-3 outline-none"
                placeholder="ma-boutique"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                onBlur={() => setSlug(cleanSlug(slug))}
              />
            </div>
          </Field>

          <Field label="Description">
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="Présente ta boutique en quelques mots"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="WhatsApp">
              <input
                className="input"
                placeholder="+33 6 12 34 56 78"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
              />
            </Field>
            <Field label="Telegram">
              <input
                className="input"
                placeholder="@pseudo ou lien"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
              />
            </Field>
            <Field label="Snapchat">
              <input
                className="input"
                placeholder="pseudo"
                value={snapchat}
                onChange={(e) => setSnapchat(e.target.value)}
              />
            </Field>
            <Field label="Instagram">
              <input
                className="input"
                placeholder="pseudo"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
              />
            </Field>
            <Field label="TikTok">
              <input
                className="input"
                placeholder="pseudo"
                value={tiktok}
                onChange={(e) => setTiktok(e.target.value)}
              />
            </Field>
          </div>

          <button
            onClick={saveShop}
            disabled={saving}
            className="mt-2 rounded-xl px-6 py-3 font-bold text-white transition-all disabled:opacity-50"
            style={{ background: "linear-gradient(to right,#3b82f6,#7c3aed)" }}
          >
            {saving
              ? "Enregistrement…"
              : shopId
              ? "Mettre à jour ma boutique"
              : "Créer ma boutique"}
          </button>

          {message && <p className="text-sm text-white/70">{message}</p>}
        </div>

        {/* Public URL panel */}
        {shopId && slug && (
          <div className="h-fit rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <h2 className="font-bold">Ton lien public</h2>
            <p className="mt-1 text-sm text-white/50">
              Partage-le dans ta bio, tes stories, partout.
            </p>
            <div className="mt-4 break-all rounded-xl border border-white/10 bg-black/30 p-3 font-mono text-sm text-violet-300">
              {origin}/{slug}
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={copyLink}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold hover:bg-white/10"
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
                {copied ? "Copié" : "Copier"}
              </button>
              <a
                href={`/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold hover:bg-violet-700"
              >
                <ExternalLink size={15} /> Ouvrir
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-white/70">{label}</span>
      {children}
    </label>
  );
}
