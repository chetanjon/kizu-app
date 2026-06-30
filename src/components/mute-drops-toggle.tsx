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

  const on = !muted; // switch ON = pings enabled
  return (
    <div>
      <div className="flex items-center gap-3 bg-surface border border-hair rounded-2xl px-4 py-3.5">
        <span className="font-b font-semibold text-[14px] flex-1">ping me when someone drops</span>
        <button
          onClick={() => set(on)}
          disabled={busy}
          aria-pressed={on}
          className={`relative h-[26px] w-[46px] rounded-full transition-colors shrink-0 disabled:opacity-60 ${on ? "bg-vibe" : "bg-surface-2 border border-hair"}`}
        >
          <span className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white transition-all ${on ? "left-[24px]" : "left-[3px]"}`} />
        </button>
      </div>
      <p className="font-m text-[11px] text-muted mt-1.5 px-1">
        only the drop pings — you&apos;ll still hear when something lands.
      </p>
    </div>
  );
}
