"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Check, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/format";
import {
  buildVendorWhatsAppPreview,
  subscriptionPlanLabel,
  subscriptionStatusLabel,
  WHATSAPP_ORDER_PREVIEW_MESSAGE,
} from "@/lib/vendor-settings";

type ShopRow = {
  id: string;
  name: string;
  slug: string;
  whatsapp: string | null;
  plan: string | null;
  created_at: string | null;
  subscription_status: string | null;
  subscription_started_at: string | null;
  subscription_expires_at: string | null;
  owner_first_name: string | null;
  owner_last_name: string | null;
  notify_order_email: boolean;
  notify_status_email: boolean;
  notify_catalink_marketing: boolean;
};

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [shopName, setShopName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [lastSignIn, setLastSignIn] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [notifyOrder, setNotifyOrder] = useState(true);
  const [notifyStatus, setNotifyStatus] = useState(true);
  const [notifyMarketing, setNotifyMarketing] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);

  const [whatsapp, setWhatsapp] = useState("");
  const [shopSlug, setShopSlug] = useState("");
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);

  const [plan, setPlan] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [subscriptionStarted, setSubscriptionStarted] = useState<string | null>(null);
  const [subscriptionExpires, setSubscriptionExpires] = useState<string | null>(null);
  const [shopCreatedAt, setShopCreatedAt] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Tu dois être connecté.");
      setLoading(false);
      return;
    }

    setEmail(user.email ?? "");
    setLastSignIn(user.last_sign_in_at ?? null);

    const { data, error: shopError } = await supabase
      .from("shops")
      .select(
        "id, name, slug, whatsapp, plan, created_at, subscription_status, subscription_started_at, subscription_expires_at, owner_first_name, owner_last_name, notify_order_email, notify_status_email, notify_catalink_marketing"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (shopError) {
      setError(shopError.message);
      setLoading(false);
      return;
    }

    if (data) {
      const row = data as ShopRow;
      setShopId(row.id);
      setShopName(row.name ?? "");
      setFirstName(row.owner_first_name ?? "");
      setLastName(row.owner_last_name ?? "");
      setWhatsapp(row.whatsapp ?? "");
      setShopSlug(row.slug ?? "");
      setPlan(row.plan);
      setSubscriptionStatus(row.subscription_status);
      setSubscriptionStarted(row.subscription_started_at);
      setSubscriptionExpires(row.subscription_expires_at);
      setShopCreatedAt(row.created_at);
      setNotifyOrder(row.notify_order_email ?? true);
      setNotifyStatus(row.notify_status_email ?? true);
      setNotifyMarketing(row.notify_catalink_marketing ?? false);
    }

    setLoading(false);
  }

  async function saveProfile(e?: FormEvent) {
    e?.preventDefault();
    if (!shopId) return setError("Crée d'abord ta boutique.");
    if (!shopName.trim()) return setError("Le nom de la boutique est obligatoire.");

    setSavingProfile(true);
    setError("");
    setMessage("");

    const { error: updateError } = await supabase
      .from("shops")
      .update({
        name: shopName.trim(),
        owner_first_name: firstName.trim() || null,
        owner_last_name: lastName.trim() || null,
      })
      .eq("id", shopId);

    setSavingProfile(false);
    if (updateError) {
      setError("Erreur profil : " + updateError.message);
      return;
    }
    setMessage("Profil enregistré.");
  }

  async function savePassword(e?: FormEvent) {
    e?.preventDefault();
    setError("");
    setMessage("");

    if (!newPassword) return setError("Indique un nouveau mot de passe.");
    if (newPassword.length < 8) return setError("Le mot de passe doit faire au moins 8 caractères.");
    if (newPassword !== confirmPassword) return setError("Les mots de passe ne correspondent pas.");

    setSavingPassword(true);
    const { error: pwError } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);

    if (pwError) {
      setError("Erreur mot de passe : " + pwError.message);
      return;
    }

    setNewPassword("");
    setConfirmPassword("");
    setMessage("Mot de passe mis à jour.");
  }

  async function saveNotifications() {
    if (!shopId) return setError("Crée d'abord ta boutique.");

    setSavingNotifications(true);
    setError("");
    setMessage("");

    const { error: updateError } = await supabase
      .from("shops")
      .update({
        notify_order_email: notifyOrder,
        notify_status_email: notifyStatus,
        notify_catalink_marketing: notifyMarketing,
      })
      .eq("id", shopId);

    setSavingNotifications(false);
    if (updateError) {
      setError("Erreur notifications : " + updateError.message);
      return;
    }
    setMessage("Préférences de notification enregistrées.");
  }

  async function saveWhatsapp(e?: FormEvent) {
    e?.preventDefault();
    if (!shopId) return setError("Crée d'abord ta boutique.");

    setSavingWhatsapp(true);
    setError("");
    setMessage("");

    const { error: updateError } = await supabase
      .from("shops")
      .update({ whatsapp: whatsapp.trim() || null })
      .eq("id", shopId);

    setSavingWhatsapp(false);
    if (updateError) {
      setError("Erreur WhatsApp : " + updateError.message);
      return;
    }
    setMessage("Numéro WhatsApp enregistré.");
  }

  const waPreview = buildVendorWhatsAppPreview(whatsapp);
  const waFullPreview = waPreview
    ? `${waPreview}?text=${encodeURIComponent(WHATSAPP_ORDER_PREVIEW_MESSAGE)}`
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10 text-white/60">
        <Loader2 className="mr-2 animate-spin" size={20} />
        Chargement…
      </div>
    );
  }

  return (
    <main className="p-4 sm:p-6 md:p-10">
      <h1 className="mb-2 text-2xl font-extrabold tracking-tight sm:text-3xl">Paramètres</h1>
      <p className="mb-6 text-sm text-white/50 sm:mb-8">
        Gère ton compte vendeur et tes préférences.
      </p>

      {(message || error) && (
        <p
          className={`mb-6 rounded-xl px-4 py-3 text-sm ${
            error ? "bg-red-500/10 text-red-400" : "bg-white/5 text-white/70"
          }`}
          role="alert"
        >
          {error || message}
        </p>
      )}

      <div className="space-y-6">
        {/* 1. Profil */}
        <Section title="Profil" description="Informations de ta boutique et de ton compte.">
          <form onSubmit={saveProfile} className="space-y-3">
            <Field label="Nom de la boutique">
              <input
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className={inputCls}
                required
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Prénom">
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={inputCls}
                  autoComplete="given-name"
                />
              </Field>
              <Field label="Nom">
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={inputCls}
                  autoComplete="family-name"
                />
              </Field>
            </div>
            <Field label="Email">
              <input value={email} readOnly className={`${inputCls} cursor-not-allowed opacity-60`} />
              <p className="mt-1 text-xs text-white/40">
                L&apos;email de connexion ne peut pas être modifié ici.
              </p>
            </Field>
            <SaveButton loading={savingProfile} label="Enregistrer le profil" />
          </form>
        </Section>

        {/* 2. Sécurité */}
        <Section title="Sécurité" description="Mot de passe et activité du compte.">
          <p className="mb-4 text-sm text-white/60">
            Dernière connexion :{" "}
            <span className="font-medium text-white/80">
              {lastSignIn ? formatDate(lastSignIn) : "—"}
            </span>
          </p>
          <form onSubmit={savePassword} className="space-y-3">
            <Field label="Nouveau mot de passe">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputCls}
                autoComplete="new-password"
                minLength={8}
              />
            </Field>
            <Field label="Confirmer le mot de passe">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputCls}
                autoComplete="new-password"
              />
            </Field>
            <SaveButton loading={savingPassword} label="Mettre à jour le mot de passe" />
          </form>
        </Section>

        {/* 3. Notifications */}
        <Section title="Notifications" description="Choisis les emails que tu souhaites recevoir.">
          <div className="space-y-3">
            <Toggle
              label="Email à chaque nouvelle commande"
              checked={notifyOrder}
              onChange={setNotifyOrder}
            />
            <Toggle
              label="Email lors d'un changement de statut commande"
              checked={notifyStatus}
              onChange={setNotifyStatus}
            />
            <Toggle
              label="Emails marketing Catalink"
              checked={notifyMarketing}
              onChange={setNotifyMarketing}
            />
          </div>
          <div className="mt-4">
            <SaveButton
              loading={savingNotifications}
              label="Enregistrer les notifications"
              onClick={saveNotifications}
            />
          </div>
        </Section>

        {/* 4. WhatsApp */}
        <Section
          title="WhatsApp"
          description="Numéro utilisé pour recevoir les commandes clients après checkout."
        >
          <form onSubmit={saveWhatsapp} className="space-y-3">
            <Field label="Numéro WhatsApp">
              <input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+33 6 12 34 56 78"
                className={inputCls}
                type="tel"
                autoComplete="tel"
              />
            </Field>
            {waPreview ? (
              <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">
                  Aperçu du lien généré
                </p>
                <p className="break-all font-mono text-xs text-green-300/90">{waFullPreview}</p>
                <p className="mt-3 text-xs text-white/45">
                  Les clients sont redirigés vers ce lien avec un message prérempli contenant leur
                  commande{shopSlug ? ` (boutique /${shopSlug})` : ""}.
                </p>
              </div>
            ) : (
              <p className="text-xs text-white/40">
                Saisis un numéro pour voir l&apos;aperçu du lien WhatsApp.
              </p>
            )}
            <SaveButton loading={savingWhatsapp} label="Enregistrer WhatsApp" />
          </form>
        </Section>

        {/* 5. Abonnement */}
        <Section title="Abonnement" description="Ton plan Catalink et statut de compte.">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <Row label="Plan actuel" value={subscriptionPlanLabel(plan)} />
            <Row label="Statut abonnement" value={subscriptionStatusLabel(subscriptionStatus)} />
            <Row label="Boutique créée le" value={shopCreatedAt ? formatDate(shopCreatedAt) : "—"} />
            <Row
              label="Abonnement depuis"
              value={subscriptionStarted ? formatDate(subscriptionStarted) : "—"}
            />
            <Row
              label="Expire le"
              value={subscriptionExpires ? formatDate(subscriptionExpires) : "—"}
            />
          </dl>
          <div className="mt-5 rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-4 text-sm text-white/50">
            <p className="font-medium text-white/70">Upgrade bientôt disponible</p>
            <p className="mt-1 text-xs">
              Les formules payantes et le paiement en ligne seront activés prochainement. Aucun
              prélèvement pour le moment.
            </p>
          </div>
        </Section>
      </div>
    </main>
  );
}

const inputCls =
  "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-violet-500";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-6">
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-1 mb-4 text-sm text-white/50">{description}</p>
      {children}
    </section>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.03] px-3 py-2.5">
      <dt className="text-xs text-white/40">{label}</dt>
      <dd className="mt-0.5 font-medium text-white/90">{value}</dd>
    </div>
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
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <span className="text-sm text-white/80">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 rounded border-white/20 accent-violet-600"
      />
    </label>
  );
}

function SaveButton({
  loading,
  label,
  onClick,
}: {
  loading: boolean;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type={onClick ? "button" : "submit"}
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
      {loading ? "Enregistrement…" : label}
    </button>
  );
}
