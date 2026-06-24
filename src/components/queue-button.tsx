"use client";

import { useState } from "react";

// "＋ want" / "✓ queued" toggle. Target is a group item or a curate pick.
export default function QueueButton({
  itemId,
  curateDropId,
  initialQueued,
}: {
  itemId?: string;
  curateDropId?: string;
  initialQueued: boolean;
}) {
  const [queued, setQueued] = useState(initialQueued);
  const [busy, setBusy] = useState(false);
  const body = itemId ? { item_id: itemId } : { curate_drop_id: curateDropId };

  async function toggle() {
    if (busy) return;
    const next = !queued;
    setQueued(next);
    setBusy(true);
    try {
      const res = await fetch("/api/queue", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) setQueued(!next);
    } catch {
      setQueued(!next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`font-h text-[11px] font-bold border-[2px] border-ink rounded-full px-3 py-1.5 transition-colors ${
        queued ? "bg-vibe text-white" : "bg-surface text-ink hover:bg-surface-2"
      }`}
    >
      {queued ? "✓ queued" : "＋ want"}
    </button>
  );
}
