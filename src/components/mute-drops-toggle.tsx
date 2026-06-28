"use client";

import { useState } from "react";

// Per-user opt-out for "someone dropped something." pings (You tab). Independent
// of the master push toggle and of earned-event pushes — this only silences drops.
// Optimistic: flip immediately, revert if the PATCH fails.
export default function MuteDropsToggle({ initialMuted }: { initialMuted: boolean }) {
  const [muted, setMuted] = useState(initialMuted);
  const [busy, setBusy] = useState(false);

  async function set(next: boolean) {
    setBusy(true);
    setMuted(next);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mute_drop_pings: next }),
      });
      if (!res.ok) throw new Error("failed");
    } catch {
      setMuted(!next); // revert
    } finally {
      setBusy(false);
    }
  }

  const shell =
    "flex items-center gap-2 bg-surface border-[2.5px] border-ink rounded-xl px-3 py-2.5 shadow-[3px_3px_0_#14110F]";

  return (
    <div className={shell}>
      <span className="font-m text-[12px] font-bold flex-1">ping me when someone drops</span>
      {muted ? (
        <button
          onClick={() => set(false)}
          disabled={busy}
          className="font-h font-bold text-xs bg-vibe text-white border-[2px] border-ink rounded-full px-3.5 py-1.5"
        >
          {busy ? "…" : "turn on"}
        </button>
      ) : (
        <button
          onClick={() => set(true)}
          disabled={busy}
          className="font-h font-bold text-xs border-[2px] border-ink rounded-full px-3 py-1.5 bg-surface"
        >
          {busy ? "…" : "on · turn off"}
        </button>
      )}
    </div>
  );
}
