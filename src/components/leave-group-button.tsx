"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Two-step: tap reveals an inline confirm, so leaving is never accidental.
export default function LeaveGroupButton({ groupId, groupName }: { groupId: string; groupName: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  async function leave() {
    if (busy) return;
    setBusy(true);
    const res = await fetch("/api/groups/leave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ group_id: groupId }),
    });
    const j = await res.json().catch(() => ({}));
    if (j.noGroups) router.push("/groups/new");
    else { router.push("/home"); router.refresh(); }
  }

  if (!confirm) {
    return (
      <button onClick={() => setConfirm(true)}
        className="font-m text-[12px] font-bold text-muted border-[2px] border-frame rounded-full px-4 py-2 hover:bg-surface-2">
        leave group
      </button>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <span className="font-m text-[12px]">leave {groupName.toLowerCase()}?</span>
      <button onClick={leave} disabled={busy}
        className="font-h font-bold text-xs text-white bg-vibe border border-frame rounded-full px-3 py-1.5">{busy ? "…" : "yes, leave"}</button>
      <button onClick={() => setConfirm(false)} className="font-m text-[11px] text-muted">cancel</button>
    </div>
  );
}
