"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";

type N = { id: string; title: string; body: string; link: string | null; read: boolean; createdAt: string };

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<N[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/notifications");
      if (r.ok) setItems(await r.json());
    } finally { setLoading(false); }
  }

  useEffect(() => {
    load();
    const i = setInterval(load, 30_000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const unread = items.filter((n) => !n.read).length;

  async function markAllRead() {
    await fetch("/api/notifications", { method: "POST", body: JSON.stringify({ markAllRead: true }) });
    load();
  }
  async function markRead(id: string) {
    await fetch("/api/notifications", { method: "POST", body: JSON.stringify({ id }) });
    load();
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => { setOpen((v) => !v); if (!open) load(); }}
        className="inline-flex items-center justify-center w-9 h-9 rounded-md hover:bg-slate-100 text-slate-700 relative" aria-label="Notifications">
        <Bell className="w-5 h-5 text-slate-700" />
        {unread > 0 && <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 text-[10px] font-semibold bg-mcb-red text-white rounded-full grid place-items-center">{unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-96 max-h-[70vh] card overflow-hidden z-30 shadow-lg flex flex-col">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between">
            <div className="text-sm font-medium">Notifications</div>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-brand-700 hover:underline flex items-center gap-1">
                <CheckCheck className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>
          <div className="overflow-y-auto flex-1">
            {loading && items.length === 0 && <div className="p-4 text-sm text-slate-500">Loading…</div>}
            {!loading && items.length === 0 && <div className="p-8 text-sm text-center text-slate-500">No notifications</div>}
            <ul className="divide-y divide-slate-100">
              {items.map((n) => (
                <li key={n.id}
                  className={`p-3 hover:bg-slate-50 cursor-pointer ${!n.read ? "bg-brand-50/30" : ""}`}
                  onClick={() => markRead(n.id)}>
                  <div className="flex items-start gap-2">
                    {!n.read && <div className="w-2 h-2 rounded-full bg-brand-600 mt-1.5 shrink-0" />}
                    <div className={`min-w-0 flex-1 ${n.read ? "pl-4" : ""}`}>
                      <div className="text-sm font-medium truncate">{n.title}</div>
                      <div className="text-xs text-slate-500 line-clamp-2 mt-0.5">{n.body}</div>
                      <div className="text-[10px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString("en-IN")}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <Link href="/messages" className="block text-center text-xs text-brand-700 hover:bg-slate-50 p-2 border-t border-slate-100">
            View outbox →
          </Link>
        </div>
      )}
    </div>
  );
}
