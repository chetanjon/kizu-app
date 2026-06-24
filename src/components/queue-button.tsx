"use client";

import { useState } from "react";

// "＋ want" / "✓ queued" toggle on a feed card. Optimistic, like reactions.tsx.
export default function QueueButton({
  itemId,
  initialQueued,
}: {
  itemId: string;
  initialQueued: boolean;
}) {
  const [queued, setQueued] = useState(initialQueued);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    const next = !queued;
    setQueued(next);
    setBusy(true);
    try {
      const res = await fetch("/api/queue", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: itemId }),
      });
      if (!res.ok) setQueued(!next); // revert on failure
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
