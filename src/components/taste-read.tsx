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
          className="inline-flex items-center gap-2 font-h font-bold text-sm bg-vibe text-white border-[2.5px] border-frame rounded-full px-5 py-2.5 shadow-[3px_3px_0_#7C5CE6] hover:-translate-y-[1px] transition-transform disabled:opacity-70">
          ✦ {busy ? "reading…" : "name my taste"}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="rounded-[22px] overflow-hidden border-[2.5px] border-frame shadow-[5px_5px_0_#7C5CE6]" style={{ background: "linear-gradient(130deg,#7C5CE6,#3A2C6E)" }}>
        <div className="p-5">
          <div className="font-m text-[10px] font-extrabold tracking-[0.13em] uppercase text-white/80">✦ your taste signature</div>
          <p className="font-h text-[19px] font-extrabold leading-[1.3] mt-2 text-white">{read.signature}</p>

          {read.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {read.tags.map((t, i) => (
                <span key={i} className="glass font-m text-[10.5px] font-bold text-white rounded-full px-3 py-1 border border-white/40">{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      <button onClick={generate} disabled={busy}
        className="mt-3 font-h font-bold text-xs bg-surface border-2 border-frame rounded-full px-4 py-2 shadow-[2px_2px_0_#7C5CE6] disabled:opacity-70">
        ↻ {busy ? "reading…" : "again"}
      </button>
    </div>
  );
}
