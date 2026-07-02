"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Save-to-watchlist toggle. Target is a group item or a curate pick.
// - "pill" (default): "＋ save" / "✓ saved" text pill (curate river, etc.)
// - "icon": a bookmark on the card's cover — outline when unsaved, filled violet
//   when saved. This IS the watchlist save; the watchlist is the product.
// - "action": the feed drawer's 42px action-row pill, sized to sit beside
//   "where to watch" / share.
export default function QueueButton({
  itemId,
  curateDropId,
  initialQueued,
  variant = "pill",
}: {
  itemId?: string;
  curateDropId?: string;
  initialQueued: boolean;
  variant?: "pill" | "icon" | "action";
}) {
  const [queued, setQueued] = useState(initialQueued);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
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
      // bust the client router cache (staleTimes) so hopping straight to the
      // watchlist tab shows this save — never a "where did it go?" moment.
      else router.refresh();
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
        aria-label={queued ? "saved. tap to remove from your watchlist" : "save to your watchlist"}
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

  if (variant === "action") {
    return (
      <button
        onClick={toggle}
        disabled={busy}
        className={`inline-flex items-center justify-center font-h font-bold text-[13px] rounded-full px-4 h-[42px] border-[1.5px] border-frame transition-colors active:scale-95 disabled:opacity-60 ${
          queued ? "bg-vibe text-white border-vibe" : "bg-surface-2 text-ink"
        }`}
      >
        {queued ? "✓ saved" : "☆ save"}
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
      {queued ? "✓ saved" : "＋ save"}
    </button>
  );
}
