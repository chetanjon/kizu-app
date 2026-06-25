"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// One-time, in-app (not a signup wall). Sets the "you" figure. Changeable later.
export default function GenderSetter() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function pick(gender: "male" | "female") {
    if (busy) return;
    setBusy(true);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gender }),
    });
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2 bg-surface border-[2.5px] border-ink rounded-xl px-3 py-2.5 shadow-[3px_3px_0_#14110F]">
      <span className="font-m text-[11px] text-muted shrink-0">your figure:</span>
      <button onClick={() => pick("male")} disabled={busy}
        className="font-h font-bold text-xs border-[2px] border-ink rounded-full px-3 py-1.5 bg-surface hover:-translate-y-[1px] transition-transform">man</button>
      <button onClick={() => pick("female")} disabled={busy}
        className="font-h font-bold text-xs border-[2px] border-ink rounded-full px-3 py-1.5 bg-surface hover:-translate-y-[1px] transition-transform">woman</button>
    </div>
  );
}
