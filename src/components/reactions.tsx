"use client";

import { useState } from "react";

const PALETTE = ["🔥", "😭", "😍", "🎧", "🕺", "📍", "😂", "🤝"];

export default function Reactions({
  itemId,
  initial,
  userId,
}: {
  itemId: string;
  initial: { emoji: string; user_id: string }[];
  userId: string;
}) {
  const [rx, setRx] = useState(initial);
  const [open, setOpen] = useState(false);

  const counts: Record<string, { n: number; mine: boolean }> = {};
  for (const r of rx) {
    counts[r.emoji] ??= { n: 0, mine: false };
    counts[r.emoji].n++;
    if (r.user_id === userId) counts[r.emoji].mine = true;
  }

  async function toggle(emoji: string) {
    const mine = counts[emoji]?.mine;
    setRx((prev) =>
      mine ? prev.filter((r) => !(r.emoji === emoji && r.user_id === userId))
           : [...prev, { emoji, user_id: userId }]
    );
    setOpen(false);
    await fetch("/api/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_id: itemId, emoji }),
    });
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap relative">
      {Object.entries(counts).map(([e, c]) => (
        <button key={e} onClick={() => toggle(e)}
          className={`font-m text-[11px] font-bold rounded-full px-2.5 py-1 border-[1.5px] border-ink ${c.mine ? "bg-vibe text-white" : "bg-surface-2"}`}>
          {e} {c.n}
        </button>
      ))}
      <button onClick={() => setOpen((o) => !o)}
        className="w-6 h-6 rounded-full border border-dashed border-ink/40 text-muted text-xs flex items-center justify-center">+</button>
      {open && (
        <div className="absolute z-30 bottom-8 left-0 flex flex-wrap gap-1 bg-surface border-[2px] border-ink rounded-xl p-2 shadow-[3px_3px_0_#14110F] w-[184px]">
          {PALETTE.map((e) => (
            <button key={e} onClick={() => toggle(e)} className="text-lg p-1 rounded hover:bg-surface-2">{e}</button>
          ))}
        </div>
      )}
    </div>
  );
}
