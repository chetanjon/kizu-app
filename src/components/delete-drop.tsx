"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteDrop({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function del() {
    if (busy) return;
    if (!confirm("delete this drop?")) return;
    setBusy(true);
    await fetch("/api/items", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: itemId }),
    });
    router.refresh();
  }

  return (
    <button onClick={del} disabled={busy} className="font-m text-[10px] text-muted hover:text-listen hover:underline transition-colors">
      {busy ? "…" : "delete"}
    </button>
  );
}
