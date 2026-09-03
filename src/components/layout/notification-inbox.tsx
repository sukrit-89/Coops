"use client";

import { Bell, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Notification = { id: string; title: string; body: string; booking_id: string | null; read_at: string | null; created_at: string };

export function NotificationInbox() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let channel: ReturnType<NonNullable<ReturnType<typeof getSupabaseBrowserClient>>["channel"]> | undefined;
    let cancelled = false;

    async function load() {
      const response = await fetch("/api/notifications");
      if (!response.ok || cancelled) return;
      const result = await response.json() as { userId: string; notifications: Notification[] };
      setNotifications(result.notifications);
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      channel = supabase.channel(`notifications:${result.userId}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_id=eq.${result.userId}` }, (payload) => {
        setNotifications((current) => [payload.new as Notification, ...current].slice(0, 20));
      }).subscribe();
    }

    void load();
    return () => { cancelled = true; if (channel) void channel.unsubscribe(); };
  }, []);

  const unread = notifications.filter((notification) => !notification.read_at).length;

  async function markRead(notification: Notification) {
    if (notification.read_at) return;
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notificationId: notification.id }) });
    setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, read_at: new Date().toISOString() } : item));
  }

  if (!notifications.length && !open) return null;

  return <div className="relative"><button type="button" onClick={() => setOpen((value) => !value)} aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} className="relative flex h-8 w-8 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100"><Bell size={16} />{unread ? <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#ef4d23]" /> : null}</button>{open ? <div className="absolute right-0 top-full z-40 mt-2 w-80 rounded-2xl border border-neutral-200 bg-white p-3 shadow-lg"><div className="flex items-center justify-between px-2 pb-2"><span className="text-sm font-medium">Notifications</span>{unread ? <span className="text-xs text-neutral-400">{unread} unread</span> : null}</div>{notifications.length ? <div className="max-h-72 overflow-auto">{notifications.map((notification) => <button type="button" key={notification.id} onClick={() => void markRead(notification)} className={`flex w-full gap-2 rounded-xl p-2 text-left hover:bg-neutral-50 ${notification.read_at ? "" : "bg-[#f5f2ee]"}`}><span className="mt-0.5 text-[#ef4d23]">{notification.read_at ? <Check size={14} /> : <Bell size={14} />}</span><span><span className="block text-xs font-medium text-neutral-800">{notification.title}</span><span className="mt-0.5 block text-xs leading-5 text-neutral-500">{notification.body}</span></span></button>)}</div> : <p className="px-2 py-5 text-center text-xs text-neutral-500">No notifications yet.</p>}</div> : null}</div>;
}
