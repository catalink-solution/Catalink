"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";

type ErrorLogRow = {
  id: string;
  user_id: string | null;
  email: string | null;
  route: string;
  action: string;
  message: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

async function getToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminErrorLogs() {
  const [logs, setLogs] = useState<ErrorLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = await getToken();
    const res = await fetch("/api/admin/error-logs?limit=80", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      setError("Impossible de charger les logs erreurs.");
      setLoading(false);
      return;
    }
    const json = (await res.json()) as { logs: ErrorLogRow[] };
    setLogs(json.logs);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <AlertTriangle size={18} className="text-amber-400" />
            Logs erreurs (bêta)
          </h2>
          <p className="mt-1 text-sm text-white/40">
            Dernières erreurs remontées par les testeurs — {logs.length} entrée
            {logs.length !== 1 ? "s" : ""}.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs hover:bg-white/5 disabled:opacity-40"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      {error && <p className="px-5 py-3 text-sm text-red-300">{error}</p>}

      {loading && logs.length === 0 ? (
        <div className="flex items-center gap-2 px-5 py-8 text-white/40">
          <Loader2 className="animate-spin" size={18} /> Chargement…
        </div>
      ) : logs.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-white/40">Aucune erreur enregistrée.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-white/40">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Route</th>
                <th className="px-4 py-3">Message</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-white/5 align-top hover:bg-white/[0.02]">
                  <td className="whitespace-nowrap px-4 py-3 text-white/50">
                    {formatDateTime(log.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-200">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/60">{log.email ?? "—"}</td>
                  <td className="max-w-[140px] truncate px-4 py-3 text-white/40" title={log.route}>
                    {log.route || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-white/80">{log.message}</p>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <pre className="mt-1 max-h-24 overflow-auto rounded bg-black/30 p-2 text-xs text-white/40">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
