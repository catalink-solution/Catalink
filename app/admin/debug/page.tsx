"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type DebugPayload = {
  tokenEmail: string | null;
  adminEmailConfigured: boolean;
  isAdmin: boolean;
  apiStatus: number;
  apiError: string | null;
};

export default function AdminDebugPage() {
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [debug, setDebug] = useState<DebugPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const { data } = await supabase.auth.getSession();
      const email = data.session?.user?.email ?? null;
      const token = data.session?.access_token ?? null;

      if (cancelled) return;
      setSessionEmail(email);

      try {
        const res = await fetch("/api/admin/debug", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const json = (await res.json()) as DebugPayload;
        if (cancelled) return;
        setDebug(json);
      } catch {
        if (!cancelled) setError("Impossible de charger /api/admin/debug.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const sessionMatchesToken =
    sessionEmail && debug?.tokenEmail
      ? sessionEmail.trim().toLowerCase() === debug.tokenEmail.trim().toLowerCase()
      : null;

  return (
    <div className="min-h-screen bg-[#030712] px-4 py-10 text-white">
      <div className="mx-auto max-w-lg space-y-6">
        <div>
          <p className="text-xs uppercase tracking-wide text-amber-400/80">Temporaire</p>
          <h1 className="mt-1 text-2xl font-bold">Admin debug</h1>
          <p className="mt-2 text-sm text-white/50">
            Diagnostic accès admin — ne révèle pas ADMIN_EMAIL.
          </p>
        </div>

        {loading && <p className="text-white/50">Chargement…</p>}
        {error && <p className="text-red-300">{error}</p>}

        {!loading && (
          <dl className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[0.02]">
            <Row label="sessionEmail" value={sessionEmail ?? "—"} />
            <Row
              label="adminEmailConfigured"
              value={debug ? String(debug.adminEmailConfigured) : "—"}
            />
            <Row label="isAdmin" value={debug ? String(debug.isAdmin) : "—"} />
            <Row
              label="apiStatus"
              value={
                debug
                  ? `${debug.apiStatus}${debug.apiError ? ` (${debug.apiError})` : ""}`
                  : "—"
              }
            />
            <Row label="tokenEmail (JWT)" value={debug?.tokenEmail ?? "—"} />
            <Row
              label="session === token"
              value={
                sessionMatchesToken === null ? "—" : sessionMatchesToken ? "true" : "false"
              }
            />
          </dl>
        )}

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-white/60">
          <p className="font-medium text-white/80">Interprétation</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>
              <code className="text-white/70">503 admin_not_configured</code> → ADMIN_EMAIL absent
              sur le serveur (Vercel).
            </li>
            <li>
              <code className="text-white/70">403 forbidden</code> → email JWT ≠ ADMIN_EMAIL.
            </li>
            <li>
              <code className="text-white/70">401 unauthorized</code> → pas de session / token
              invalide.
            </li>
          </ul>
        </div>

        <div className="flex gap-3">
          <Link
            href="/admin"
            className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold hover:bg-violet-500"
          >
            Réessayer /admin
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5"
          >
            Dashboard vendeur
          </Link>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-xs uppercase tracking-wide text-white/40">{label}</dt>
      <dd className="font-mono text-sm text-white/90 break-all">{value}</dd>
    </div>
  );
}
