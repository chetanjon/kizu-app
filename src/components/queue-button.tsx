"use client";

import { useState } from "react";

// Save-to-queue toggle. Target is a group item or a curate pick.
// - "pill" (default): "＋ want" / "✓ queued" text pill (curate river, etc.)
// - "icon": a bookmark in the card's top-right corner — outline when unsaved,
//   filled violet when queued. This IS the watchlist save; the queue is the
//   product, so on the feed it's the always-visible corner affordance.
export default function QueueButton({
  itemId,
  curateDropId,
  initialQueued,
  variant = "pill",
}: {
  itemId?: string;
  curateDropId?: string;
  initialQueued: boolean;
  variant?: "pill" | "icon";
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

  if (variant === "icon") {
    return (
      <button
        onClick={toggle}
        disabled={busy}
        aria-pressed={queued}
        aria-label={queued ? "queued — tap to remove from your queue" : "add to your queue"}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 disabled:opacity-60 ${
          queued ? "text-vibe-2" : "text-ink-2 hover:text-vibe-2"
        }`}
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill={queued ? "currentColor" : "none"}
          stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M6 4.5h12a1 1 0 0 1 1 1V20l-7-4-7 4V5.5a1 1 0 0 1 1-1z" />
        </svg>
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`font-h text-[11px] font-bold border-[2px] border-frame rounded-full px-3 py-1.5 transition-colors ${
        queued ? "bg-vibe text-white" : "bg-surface text-ink hover:bg-surface-2"
      }`}
    >
      {queued ? "✓ queued" : "＋ queue"}
    </button>
  );
}
