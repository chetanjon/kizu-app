"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NameSetter() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!name.trim() || busy) return;
    setBusy(true);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2 bg-surface border-[2.5px] border-frame rounded-xl px-3 py-2.5 shadow-[3px_3px_0_#0D0B09]">
      <span className="font-m text-[11px] text-muted shrink-0">set your name:</span>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="your name" maxLength={40}
        onKeyDown={(e) => e.key === "Enter" && save()}
        className="flex-1 bg-transparent outline-none text-sm min-w-0" />
      <button onClick={save} disabled={busy} className="font-h font-bold text-xs bg-ink text-paper rounded-full px-3 py-1.5 shrink-0">{busy ? "…" : "save"}</button>
    </div>
  );
}
