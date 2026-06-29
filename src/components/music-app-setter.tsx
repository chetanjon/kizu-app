"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MUSIC_APPS } from "@/lib/music-apps";

// Pick the one app you listen in → a song drop opens straight there. Single
// choice; tap the active one again to clear it. `incoming` = an app the user
// tapped on a song's nudge chip (?music=…) → pre-select + save it on arrival.
export default function MusicAppSetter({ initial, incoming = null }: { initial: string | null; incoming?: string | null }) {
  const router = useRouter();
  const [sel, setSel] = useState<string | null>(initial);
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
    if (incoming && incoming !== sel) pick(incoming);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div id="music" className="bg-surface border-[2.5px] border-ink rounded-xl px-3.5 py-3 shadow-[3px_3px_0_#14110F] scroll-mt-6">
      <div className="font-m text-[11px] text-muted">your music app — so a song opens where you listen</div>
      <div className="flex flex-wrap gap-2 mt-2.5">
        {MUSIC_APPS.map((a) => {
          const on = sel === a.slug;
          return (
            <button key={a.slug} onClick={() => pick(a.slug)} disabled={busy}
              className={`font-m text-[11px] font-bold border-[2px] border-ink rounded-full px-3 py-1.5 transition-transform hover:-translate-y-[1px] ${on ? "bg-ink text-paper" : "bg-surface"}`}>
              {a.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
