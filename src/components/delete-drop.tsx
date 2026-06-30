"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// A quiet ⋯ overflow on your own drops. Tapping reveals the one destructive
// action (delete) — no always-on red word, no blocking confirm() dialog.
export default function DeleteDrop({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function del() {
    if (busy) return;
    setBusy(true);
    await fetch("/api/items", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: itemId }),
    });
    router.refresh();
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-label="more"
        className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-ink transition-colors text-lg leading-none">⋯</button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-20 min-w-[124px] bg-surface border border-hair rounded-xl shadow-[3px_3px_0_#0D0B09] overflow-hidden">
            <button onClick={del} disabled={busy}
              className="block w-full text-left font-m text-[12px] text-listen px-3.5 py-2.5 hover:bg-surface-2 disabled:opacity-60">
              {busy ? "deleting…" : "delete drop"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
