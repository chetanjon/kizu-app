"use client";

import { useState } from "react";

type Read = { signature: string; tags: string[] };

// The taste signature, inline on the You page. One flattering line naming the
// aesthetic of your taste — quiet, owned, never a diagnosis.
export default function TasteRead({ initial }: { initial: Read | null }) {
  const [read, setRead] = useState<Read | null>(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function generate() {
    if (busy) return;
    setBusy(true); setErr("");
    const res = await fetch("/api/read", { method: "POST" });
    const j = await res.json();
    setBusy(false);
    if (!res.ok) { setErr(j.error || "couldn't read your taste"); return; }
    setRead(j.read); setErr("");
  }

  if (!read) {
    return (
      <div className="mt-6">
        {err ? <p className="text-muted text-sm mb-3 font-b">{err}</p> : null}
        <button onClick={generate} disabled={busy}
          className="inline-flex items-center gap-2 font-h font-bold text-sm bg-vibe text-white border-[2.5px] border-ink rounded-full px-5 py-2.5 shadow-[3px_3px_0_#14110F] hover:-translate-y-[1px] transition-transform disabled:opacity-70">
          ✦ {busy ? "reading…" : "name my taste"}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="bg-surface border-[3px] border-ink rounded-[24px] shadow-[6px_6px_0_#14110F] p-6">
        <div className="font-m text-[11px] font-bold tracking-[0.16em] text-vibe">✦ TASTE SIGNATURE</div>
        <p className="font-h text-[24px] font-extrabold tracking-[-0.03em] leading-[1.12] mt-3">{read.signature}</p>

        {read.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-5">
            {read.tags.map((t, i) => (
              <span key={i} className="font-m text-[11px] font-bold rounded-full px-3 py-1 border-2 border-ink bg-surface-2">{t}</span>
            ))}
          </div>
        )}
      </div>
      <button onClick={generate} disabled={busy}
        className="mt-3 font-h font-bold text-xs bg-surface border-[2px] border-ink rounded-full px-4 py-2 shadow-[2px_2px_0_#14110F] disabled:opacity-70">
        ↻ {busy ? "reading…" : "again"}
      </button>
    </div>
  );
}
