"use client";

import { useState } from "react";
import VibeCard, { type Read } from "@/components/vibe-card";

export type { Read };

const AURORA = "linear-gradient(135deg,#7C5CE6 0%,#FF6F9C 55%,#FF8A5B 100%)";

// The home hero. When a weekly read exists it renders INLINE, full-size — the one
// show-stopper (brand doc). Tapping it opens the focused view + regenerate, so
// nothing's lost. With no read yet, a hero-sized aurora prompt fills the slot.
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
      {read ? (
        // the hero: the full read, inline. tap → focused view + regenerate.
        <div
          role="button"
          tabIndex={0}
          onClick={() => setOpen(true)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(true); } }}
          className="cursor-pointer transition-transform active:scale-[0.99]"
        >
          <VibeCard read={read} />
        </div>
      ) : (
        // no weekly read yet — a hero-sized aurora prompt (not a tiny button).
        <button
          onClick={generate}
          disabled={busy}
          className="block w-full text-left rounded-[26px] overflow-hidden border-[3px] border-frame shadow-[9px_9px_0_#7C5CE6] text-white transition-transform active:scale-[0.99] disabled:opacity-80"
          style={{ background: AURORA }}
        >
          <div className="p-6" style={{ background: "linear-gradient(180deg,rgba(13,11,9,.10),rgba(13,11,9,.32))" }}>
            <div className="font-m text-[11px] font-bold tracking-[0.16em] opacity-90">✦ this week&apos;s read</div>
            <h2 className="font-h text-[26px] font-extrabold tracking-[-0.03em] leading-[1.06] mt-3" style={{ textShadow: "0 2px 16px rgba(0,0,0,.25)" }}>
              {busy ? "reading the room…" : "read the group’s vibe"}
            </h2>
            <p className="text-[14px] leading-relaxed mt-2 opacity-90">
              {busy ? "one sec — pulling the week together." : "see what your people’s taste adds up to this week."}
            </p>
          </div>
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
                <VibeCard read={read} />
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
