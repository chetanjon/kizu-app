"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SERVICES } from "@/lib/services";

// A clean settings row: shows a one-line summary ("Netflix +2") and expands to
// the chip picker on tap. Pick the streaming services you have → movie drops can
// say "you have it".
export default function ServicesSetter({ initial }: { initial: string[] }) {
  const router = useRouter();
  const [sel, setSel] = useState<Set<string>>(new Set(initial));
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function toggle(slug: string) {
    if (busy) return;
    const next = new Set(sel);
    if (next.has(slug)) next.delete(slug); else next.add(slug);
    setSel(next);
    setBusy(true);
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ services: [...next] }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const chosen = SERVICES.filter((s) => sel.has(s.slug));
  const summary =
    chosen.length === 0 ? "none yet"
    : chosen.length === 1 ? chosen[0].name
    : `${chosen[0].name} +${chosen.length - 1}`;

  return (
    <div className="border border-hair rounded-2xl bg-surface overflow-hidden">
      <button onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left">
        <span className="font-b font-semibold text-[14px]">your streaming services</span>
        <span className="flex items-center gap-1.5 font-m text-[12px] font-bold text-vibe-2 shrink-0">
          {summary}<span className={`transition-transform ${open ? "rotate-90" : ""}`}>›</span>
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 flex flex-wrap gap-2">
          {SERVICES.map((s) => {
            const on = sel.has(s.slug);
            return (
              <button key={s.slug} onClick={() => toggle(s.slug)} disabled={busy}
                className={`font-m text-[11px] font-bold border-[1.5px] rounded-full px-3 py-1.5 transition-colors ${on ? "bg-vibe text-white border-vibe" : "bg-surface-2 border-hair text-ink"}`}>
                {s.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
