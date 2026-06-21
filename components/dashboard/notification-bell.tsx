"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, Package } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/format";
import type { Notification } from "@/lib/types";

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [canNotify, setCanNotify] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const unread = items.filter((n) => !n.is_read).length;

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user || cancelled) return;
      setUserId(user.id);

      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);
      if (cancelled) return;
      setItems((data ?? []) as Notification[]);

      // Unique channel name per mount avoids reusing an already-subscribed
      // channel (React StrictMode double-invokes effects in dev).
      channel = supabase
        .channel(`notifications:${user.id}:${Math.random().toString(36).slice(2)}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const n = payload.new as Notification;
            setItems((prev) => [n, ...prev].slice(0, 30));
            showBrowserNotification(n);
          }
        )
        .subscribe();
    });

    if (typeof window !== "undefined" && "Notification" in window) {
      setCanNotify(Notification.permission === "granted");
    }

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function showBrowserNotification(n: Notification) {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    try {
      new Notification(n.title, { body: n.message ?? undefined });
    } catch {
      /* ignore */
    }
  }

  async function enableNotifications() {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const res = await Notification.requestPermission();
    setCanNotify(res === "granted");
  }

  async function markAllRead() {
    if (!userId || unread === 0) return;
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
  }

  async function openNotification(n: Notification) {
    if (!n.is_read) {
      setItems((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x))
      );
      await supabase.from("notifications").update({ is_read: true }).eq("id", n.id);
    }
    setOpen(false);
    if (n.type === "review") {
      router.push("/dashboard/reviews");
      return;
    }
    const orderId = (n.data as { order_id?: string } | null)?.order_id;
    router.push(orderId ? `/dashboard/orders?focus=${orderId}` : "/dashboard/orders");
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-white/70 transition-colors hover:bg-white/5 hover:text-white"
      >
        <Bell size={19} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-violet-600 px-1 text-[11px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-12 z-50 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-white/10 bg-[#0a0e1a] shadow-2xl md:left-auto md:right-0">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <span className="font-semibold">Notifications</span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-violet-300 hover:text-violet-200"
              >
                <Check size={13} /> Tout marquer comme lu
              </button>
            )}
          </div>

          {!canNotify && "Notification" in (globalThis as object) && (
            <button
              onClick={enableNotifications}
              className="w-full border-b border-white/[0.06] bg-violet-600/10 px-4 py-2.5 text-left text-xs text-violet-200 hover:bg-violet-600/20"
            >
              Activer les notifications du navigateur
            </button>
          )}

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-white/40">
                Aucune notification.
              </p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => openNotification(n)}
                  className={`flex w-full items-start gap-3 border-b border-white/[0.04] px-4 py-3 text-left transition-colors hover:bg-white/5 ${
                    n.is_read ? "opacity-60" : "bg-violet-500/[0.06]"
                  }`}
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300">
                    <Package size={15} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{n.title}</span>
                    {n.message && (
                      <span className="block truncate text-xs text-white/50">
                        {n.message}
                      </span>
                    )}
                    <span className="mt-0.5 block text-[11px] text-white/30">
                      {formatDate(n.created_at)}
                    </span>
                  </span>
                  {!n.is_read && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-violet-500" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
