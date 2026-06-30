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
  // a sub-row of "push notifications" above it: the inset border + lighter
  // weight read it as "and within push, ping me on every drop".
  return (
    <div className="ml-4 flex items-center gap-3 border-l-2 border-hair pl-3 pr-4 py-2.5">
      <div className="flex-1 min-w-0">
        <span className="font-b font-medium text-[13px] text-ink-2">ping me on every drop</span>
        <p className="font-m text-[10.5px] text-muted mt-0.5">off = you&apos;re only pinged when a rec you sent lands.</p>
      </div>
      <button
        onClick={() => set(on)}
        disabled={busy}
        aria-pressed={on}
        className={`relative h-[24px] w-[42px] rounded-full transition-colors shrink-0 disabled:opacity-60 ${on ? "bg-vibe" : "bg-surface-2 border border-hair"}`}
      >
        <span className={`absolute top-[3px] h-[16px] w-[16px] rounded-full bg-white transition-all ${on ? "left-[22px]" : "left-[3px]"}`} />
      </button>
    </div>
  );
}
