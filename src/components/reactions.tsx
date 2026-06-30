"use client";

import { useState } from "react";
import { REACTIONS } from "@/lib/reactions";

const PALETTE: readonly string[] = REACTIONS;

type Rx = { emoji: string; user_id: string; name?: string | null };

export default function Reactions({
  itemId,
  initial,
  userId,
  canSeeWho = false,
}: {
  itemId: string;
  initial: Rx[];
  userId: string;
  // Only the dropper (their own drop) sees who reacted; others see counts only.
  canSeeWho?: boolean;
}) {
  const [rx, setRx] = useState<Rx[]>(initial);
  const [open, setOpen] = useState(false);

  const counts: Record<string, { n: number; mine: boolean }> = {};
  for (const r of rx) {
    counts[r.emoji] ??= { n: 0, mine: false };
    counts[r.emoji].n++;
    if (r.user_id === userId) counts[r.emoji].mine = true;
  }

  // Names grouped by emoji — only built/shown when the viewer is the dropper.
  // Skip the viewer themselves: "you reacted" is noise; the dropper cares who ELSE did.
  const who: Record<string, string[]> = {};
  if (canSeeWho) {
    for (const r of rx) {
      if (r.user_id === userId) continue;
      (who[r.emoji] ??= []).push(r.name ?? "someone");
    }
  }

  async function toggle(emoji: string) {
    const mineThis = counts[emoji]?.mine;
    // one reaction per user per drop: drop my existing reaction, then add the new
    // one unless I tapped the one I already had (that's a toggle-off).
    setRx((prev) => {
      const withoutMine = prev.filter((r) => r.user_id !== userId);
      return mineThis ? withoutMine : [...withoutMine, { emoji, user_id: userId }];
    });
    setOpen(false);
    await fetch("/api/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_id: itemId, emoji }),
    });
  }

  return (
    <div>
      <div className="flex items-center gap-1.5 flex-wrap relative">
        {Object.entries(counts).map(([e, c]) => (
          <button key={e} onClick={() => toggle(e)} aria-label={`${e} reaction, ${c.n} — tap to toggle yours`} aria-pressed={c.mine}
            className={`font-m text-[11px] font-bold rounded-full px-2.5 py-1 border-[1.5px] border-frame ${c.mine ? "bg-vibe text-white" : "bg-surface-2"}`}>
            {e} {c.n}
          </button>
        ))}
        <button onClick={() => setOpen((o) => !o)} aria-label="add a reaction" aria-expanded={open}
          className="w-6 h-6 rounded-full border border-dashed border-ink/40 text-muted text-xs flex items-center justify-center">+</button>
        {open && (
          <div className="absolute z-30 bottom-8 left-0 flex flex-wrap gap-1 bg-surface border-[2px] border-frame rounded-xl p-2 shadow-[3px_3px_0_#0D0B09] w-[184px]">
            {PALETTE.map((e) => (
              <button key={e} onClick={() => toggle(e)} aria-label={`react with ${e}`} className="text-lg p-1 rounded hover:bg-surface-2">{e}</button>
            ))}
          </div>
        )}
      </div>

      {/* dropper-only: who reacted, grouped per emoji */}
      {canSeeWho && Object.keys(who).length > 0 && (
        <div className="mt-1.5 flex flex-col gap-0.5 font-m text-[11px] text-muted">
          {Object.entries(who).map(([e, names]) => {
            const shown = names.slice(0, 6);
            const extra = names.length - shown.length;
            return (
              <div key={e} className="leading-snug">
                <span className="mr-1">{e}</span>
                {shown.join(" · ")}{extra > 0 ? ` · +${extra}` : ""}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
