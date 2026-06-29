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

  return (
    <>
      <button onClick={read ? () => setOpen(true) : generate} disabled={busy}
        className="inline-flex items-center gap-2 font-h font-bold text-sm text-white border-[2.5px] border-ink rounded-full px-5 py-2.5 shadow-[3px_3px_0_#14110F] disabled:opacity-70"
        style={{ background: "linear-gradient(120deg,#6B4BD6,#E0567E,#F0A23C)" }}>
        ✦ {busy ? "reading the room…" : read ? "this week's read" : "read the group's vibe"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-center justify-center p-5" onClick={() => setOpen(false)}>
          <div className="w-full max-w-[440px] max-h-[92vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            {err ? (
              <div className="bg-surface border-[3px] border-ink rounded-[24px] shadow-[8px_8px_0_#14110F] p-7 text-center">
                <div className="font-h text-xl font-extrabold">not yet<span className="text-red">.</span></div>
                <p className="text-muted mt-2 text-sm">{err}</p>
                <button onClick={() => setOpen(false)} className="mt-5 font-h font-bold text-sm bg-ink text-paper rounded-full px-5 py-2.5">close</button>
              </div>
            ) : read ? (
              <>
                <div className="rounded-[26px] overflow-hidden border-[3px] border-ink shadow-[9px_9px_0_#14110F] text-white"
                  style={{ background: "linear-gradient(135deg,#6B4BD6,#E0567E 55%,#F0A23C)" }}>
                  <div className="p-6" style={{ background: "linear-gradient(180deg,rgba(15,12,24,.10),rgba(15,12,24,.34))" }}>
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
                  <button onClick={generate} disabled={busy} className="flex-1 font-h font-bold text-sm bg-surface border-[2.5px] border-ink rounded-xl py-3 shadow-[3px_3px_0_#14110F]">↻ regenerate</button>
                  <button onClick={() => setOpen(false)} className="flex-1 font-h font-bold text-sm bg-ink text-paper border-[2.5px] border-ink rounded-xl py-3">close</button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
