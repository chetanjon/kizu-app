"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type G = { id: string; name: string; color: string };

// The group pill IS the button: tap to switch, create, join, or manage.
export default function GroupSwitcher({ groups, activeId }: { groups: G[]; activeId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const active = groups.find((g) => g.id === activeId) ?? groups[0];

  async function switchTo(id: string) {
    if (id === activeId || busy) return;
    setBusy(true);
    await fetch("/api/groups/active", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ group_id: id }),
    });
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 font-m text-xs font-bold border-[2px] border-ink rounded-full px-3 py-1.5 bg-surface">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: active?.color }} />
        {active?.name.toLowerCase()}
        <span className="text-[9px] opacity-70">▾</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 mt-2 w-[230px] z-40 bg-surface border-[2.5px] border-ink rounded-2xl shadow-[5px_5px_0_#14110F] overflow-hidden">
            <div className="px-4 py-2.5 border-b-[2px] border-hair font-m text-[10px] tracking-widest uppercase text-muted">your groups</div>
            {groups.map((g) => (
              <button key={g.id} onClick={() => switchTo(g.id)}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold hover:bg-surface-2 text-left">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: g.color }} />
                {g.name.toLowerCase()}
                {g.id === activeId && <span className="ml-auto text-vibe font-bold">✓</span>}
              </button>
            ))}
            <div className="border-t-[2px] border-hair">
              <Link href="/groups/new" onClick={() => setOpen(false)}
                className="block px-4 py-2.5 font-m text-[12px] font-bold text-vibe hover:bg-surface-2">＋ create new group</Link>
              <Link href="/groups/new?tab=join" onClick={() => setOpen(false)}
                className="block px-4 py-2.5 font-m text-[12px] font-bold hover:bg-surface-2">→ join with code</Link>
              <Link href="/groups/manage" onClick={() => setOpen(false)}
                className="block px-4 py-2.5 font-m text-[12px] font-bold hover:bg-surface-2 border-t-[1.5px] border-hair">⚙ manage group</Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
