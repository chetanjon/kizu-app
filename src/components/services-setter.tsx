"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SERVICES } from "@/lib/services";

// Pick the streaming services you have → movie drops can say "you have it".
export default function ServicesSetter({ initial }: { initial: string[] }) {
  const router = useRouter();
  const [sel, setSel] = useState<Set<string>>(new Set(initial));
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

  return (
    <div className="bg-surface border-[2.5px] border-ink rounded-xl px-3.5 py-3 shadow-[3px_3px_0_#14110F]">
      <div className="font-m text-[11px] text-muted">what you have — so kizu can say &ldquo;you have it&rdquo;</div>
      <div className="flex flex-wrap gap-2 mt-2.5">
        {SERVICES.map((s) => {
          const on = sel.has(s.slug);
          return (
            <button key={s.slug} onClick={() => toggle(s.slug)} disabled={busy}
              className={`font-m text-[11px] font-bold border-[2px] border-ink rounded-full px-3 py-1.5 transition-transform hover:-translate-y-[1px] ${on ? "bg-ink text-paper" : "bg-surface"}`}>
              {s.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
