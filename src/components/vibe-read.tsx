"use client";

import { useEffect, useRef, useState } from "react";
import VibeCard, { type Read } from "@/components/vibe-card";

export type { Read };

const AURORA = "linear-gradient(135deg,#7C5CE6 0%,#FF6F9C 55%,#FF8A5B 100%)";

// The week's read lives as a compact aurora BUTTON by default. Tap it and the full
// read unfolds inline; scroll down past it and it collapses back to the button.
// (No modal — the inline unfold is the reveal.)
export default function VibeRead({ groupId, initial = null }: { groupId: string; initial?: Read | null }) {
  const [read, setRead] = useState<Read | null>(initial);
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const baseY = useRef(0);

  // once open, collapse back to the button as soon as the user scrolls down past it.
  useEffect(() => {
    if (!expanded) return;
    baseY.current = window.scrollY;
    const onScroll = () => { if (window.scrollY > baseY.current + 24) setExpanded(false); };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [expanded]);

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
    if (!res.ok) { setErr(j.error || "couldn't read the room"); return; }
    setRead(j.read); setExpanded(true);
  }

  // the collapsed aurora button
  function Pill({ label, onClick }: { label: string; onClick: () => void }) {
    return (
      <button
        onClick={onClick}
        disabled={busy}
        className="inline-flex items-center rounded-full border-[2px] border-frame shadow-[3px_3px_0_#7C5CE6] px-4 py-2 transition-transform active:scale-95 disabled:opacity-70"
        style={{ background: AURORA }}
      >
        <span className="font-h text-[13px] font-bold tracking-[-0.01em] text-white whitespace-nowrap" style={{ textShadow: "0 1px 6px rgba(0,0,0,.35)" }}>{label}</span>
      </button>
    );
  }

  // read exists + opened → the full read, inline
  if (read && expanded) {
    return (
      <div>
        <VibeCard read={read} />
        <div className="mt-2 flex items-center gap-4 px-1">
          <button onClick={generate} disabled={busy} className="font-m text-[11px] font-bold text-vibe-2 disabled:opacity-60">{busy ? "reading…" : "↻ regenerate"}</button>
          <button onClick={() => setExpanded(false)} className="font-m text-[11px] text-muted">close</button>
        </div>
      </div>
    );
  }

  // default: a button (this week's read → unfold; or generate one)
  return (
    <div>
      {read
        ? <Pill label="this week’s read" onClick={() => setExpanded(true)} />
        : <Pill label={busy ? "reading the room…" : "read the group’s vibe"} onClick={generate} />}
      {err && <p className="mt-2 font-m text-[11px] text-red">{err}</p>}
    </div>
  );
}
