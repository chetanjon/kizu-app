"use client";

import { useState } from "react";

export type Read = {
  title: string;
  body: string;
  person_lines: { name: string; line: string }[];
  tags: string[];
  top_picks: { type: string; title: string }[];
};

export default function VibeRead({ groupId, initial = null }: { groupId: string; initial?: Read | null }) {
  const [read, setRead] = useState<Read | null>(initial);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function generate() {
    if (busy) return;
    setBusy(true); setErr("");
    const res = await fetch("/api/vibe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ group_id: groupId }),
    });
    const j = await res.json();
    setBusy(false);
    if (!res.ok) { setErr(j.error || "couldn't read the room"); setOpen(true); return; }
    setRead(j.read); setOpen(true);
  }

  const AURORA = "linear-gradient(135deg,#7C5CE6 0%,#FF6F9C 55%,#FF8A5B 100%)";

  return (
    <>
      {read ? (
        // collapsed by default — a compact aurora button; the full read opens on tap
        <button onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border-[2px] border-frame shadow-[3px_3px_0_#7C5CE6] px-4 py-2"
          style={{ background: AURORA }}>
          <span className="font-m text-[11px] font-bold tracking-[0.12em] text-white whitespace-nowrap" style={{ textShadow: "0 1px 6px rgba(0,0,0,.35)" }}>✦ this week&apos;s read</span>
          <span className="font-h font-black text-[13px] text-white">→</span>
        </button>
      ) : (
        <button onClick={generate} disabled={busy}
          className="inline-flex items-center gap-2 font-h font-bold text-sm text-white border-[2.5px] border-frame rounded-full px-5 py-2.5 shadow-[3px_3px_0_#7C5CE6] disabled:opacity-70"
          style={{ background: AURORA }}>
          ✦ {busy ? "reading the room…" : "read the group's vibe"}
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-center justify-center p-5" onClick={() => setOpen(false)}>
          <div className="w-full max-w-[440px] max-h-[92vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            {err ? (
              <div className="bg-surface border-[3px] border-frame rounded-[24px] shadow-[8px_8px_0_#7C5CE6] p-7 text-center">
                <div className="font-h text-xl font-extrabold">not yet<span className="text-red">.</span></div>
                <p className="text-muted mt-2 text-sm">{err}</p>
                <button onClick={() => setOpen(false)} className="mt-5 font-h font-bold text-sm bg-surface-2 text-ink border border-hair rounded-full px-5 py-2.5">close</button>
              </div>
            ) : read ? (
              <>
                <div className="rounded-[26px] overflow-hidden border-[3px] border-frame shadow-[9px_9px_0_#7C5CE6] text-white"
                  style={{ background: "linear-gradient(135deg,#7C5CE6 0%,#FF6F9C 55%,#FF8A5B 100%)" }}>
                  <div className="p-6" style={{ background: "linear-gradient(180deg,rgba(13,11,9,.10),rgba(13,11,9,.32))" }}>
                    <div className="font-m text-[11px] font-bold tracking-[0.16em] opacity-90">✦ VIBE READ</div>
                    <h2 className="font-h text-[30px] font-extrabold tracking-[-0.03em] leading-[1.05] mt-3" style={{ textShadow: "0 2px 16px rgba(0,0,0,.25)" }}>{read.title}</h2>
                    <p className="text-[15px] leading-relaxed mt-4 opacity-95">{read.body}</p>

                    {read.person_lines?.length > 0 && (
                      <div className="mt-5 flex flex-col gap-2.5">
                        {read.person_lines.map((p, i) => (
                          <div key={i} className="text-[13.5px] leading-snug">
                            <b>{p.name}</b> <span className="opacity-90">— {p.line}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {read.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-5">
                        {read.tags.map((t, i) => (
                          <span key={i} className="font-m text-[11px] font-bold rounded-full px-3 py-1 border-2" style={{ background: "rgba(0,0,0,.22)", borderColor: "rgba(255,255,255,.5)" }}>{t}</span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-6 pt-4 border-t" style={{ borderColor: "rgba(255,255,255,.25)" }}>
                      <span className="font-h font-extrabold text-[17px] tracking-[-0.05em]">kizu<span style={{ color: "#FF2E4D" }}>.</span></span>
                      <span className="font-m text-[10px] opacity-70">good taste runs in the group</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2.5 mt-3">
                  <button onClick={generate} disabled={busy} className="flex-1 font-h font-bold text-sm bg-surface border-[2px] border-frame rounded-xl py-3 shadow-[3px_3px_0_#7C5CE6]">↻ regenerate</button>
                  <button onClick={() => setOpen(false)} className="flex-1 font-h font-bold text-sm bg-vibe text-white border-[2px] border-frame rounded-xl py-3">close</button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
