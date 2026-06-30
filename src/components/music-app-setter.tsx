"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MUSIC_APPS } from "@/lib/music-apps";

// A clean settings row: shows your current app ("Spotify") and expands to the
// picker on tap. Pick the one app you listen in → a song drop opens straight
// there. Single choice; tap the active one again to clear it. `incoming` = an
// app tapped on a song's nudge chip (?music=…) → pre-select + save on arrival.
export default function MusicAppSetter({ initial, incoming = null }: { initial: string | null; incoming?: string | null }) {
  const router = useRouter();
  const [sel, setSel] = useState<string | null>(initial);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function pick(slug: string) {
    if (busy) return;
    const next = sel === slug ? null : slug;
    setSel(next);
    setBusy(true);
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ music_app: next }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  // honor a ?music=<app> arrival once: set it as their pick if it's not already.
  const applied = useRef(false);
  useEffect(() => {
    if (applied.current) return;
    applied.current = true;
    if (incoming && incoming !== sel) { pick(incoming); setOpen(true); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = MUSIC_APPS.find((a) => a.slug === sel)?.name ?? "none yet";

  return (
    <div id="music" className="border border-hair rounded-2xl bg-surface overflow-hidden scroll-mt-6">
      <button onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left">
        <span className="font-b font-semibold text-[14px]">your music app</span>
        <span className="flex items-center gap-1.5 font-m text-[12px] font-bold text-vibe-2 shrink-0">
          {summary}<span className={`transition-transform ${open ? "rotate-90" : ""}`}>›</span>
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 flex flex-wrap gap-2">
          {MUSIC_APPS.map((a) => {
            const on = sel === a.slug;
            return (
              <button key={a.slug} onClick={() => pick(a.slug)} disabled={busy}
                className={`font-m text-[11px] font-bold border-[1.5px] rounded-full px-3 py-1.5 transition-colors ${on ? "bg-vibe text-white border-vibe" : "bg-surface-2 border-hair text-ink"}`}>
                {a.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
