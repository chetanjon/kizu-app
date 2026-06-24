"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Notif = { id: string; kind: string; body: string; href: string | null; read_at: string | null; created_at: string };

// In-app, cryptic, earned-only. A quiet bell; a violet dot when something's new.
export default function NotificationsBell() {
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  async function load() {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) { const j = await res.json(); setItems(j.items ?? []); setUnread(j.unread ?? 0); }
    } catch { /* quiet */ }
  }
  useEffect(() => { load(); }, []);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      setUnread(0);
      fetch("/api/notifications/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }).catch(() => {});
    }
  }

  return (
    <div className="relative">
      <button onClick={toggle} aria-label="notifications" className="relative w-9 h-9 flex items-center justify-center rounded-full border-[2px] border-ink bg-surface">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {unread > 0 && <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-vibe text-white font-m text-[10px] font-bold flex items-center justify-center border-[1.5px] border-ink">{unread}</span>}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-[280px] z-40 bg-surface border-[2.5px] border-ink rounded-2xl shadow-[5px_5px_0_var(--color-shadow)] overflow-hidden">
            <div className="px-4 py-3 border-b-[2px] border-hair font-m text-[10px] tracking-widest uppercase text-muted">kizu<span className="text-red">.</span> noticed</div>
            {items.length === 0 ? (
              <div className="px-4 py-6 text-center font-m text-[11px] text-muted">nothing yet. it stays quiet.</div>
            ) : (
              <div className="max-h-[320px] overflow-auto">
                {items.map((n) => {
                  const inner = (
                    <div className={`px-4 py-3 border-b-[1.5px] border-hair ${!n.read_at ? "bg-surface-2" : ""}`}>
                      <div className="font-h font-bold text-sm leading-snug">{n.body}</div>
                    </div>
                  );
                  return n.href
                    ? <Link key={n.id} href={n.href} onClick={() => setOpen(false)} className="block hover:bg-surface-2">{inner}</Link>
                    : <div key={n.id}>{inner}</div>;
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
