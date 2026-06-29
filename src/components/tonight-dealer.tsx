"use client";

import { useMemo, useState } from "react";
import { TYPE, img, title, sub, type DropType } from "@/lib/item-render";
import { actionsFor, type Action } from "@/lib/item-actions";
import ItemActions from "@/components/item-actions";

export type Cand = {
  key: string;
  itemId?: string;
  curateDropId?: string;
  type: DropType;
  data: Record<string, unknown>;
  note: string | null;
  who: string | null;
  moment?: string;
  rating?: string | null;        // the dropper's own take
  proof?: string | null;         // who else in the group is into it
  availability?: Action | null;  // movie/tv: "you have it" / "on netflix" (server-resolved)
};

type Lens = "all" | DropType;
const LENSES: { key: Lens; label: string }[] = [
  { key: "watch", label: "🎬 watch" },
  { key: "listen", label: "🎧 listen" },
  { key: "go_out", label: "🌅 outside" },
  { key: "all", label: "🎲 surprise me" },
];

// shuffle deterministically-ish by rotating from a seed index (no Math.random
// to keep things predictable + SSR-safe across renders).
function dealOrder<T>(arr: T[], seed: number): T[] {
  if (arr.length < 2) return arr;
  const s = seed % arr.length;
  return [...arr.slice(s), ...arr.slice(0, s)];
}

export default function TonightDealer({ pool, musicApp = null }: { pool: Cand[]; musicApp?: string | null }) {
  const [lens, setLens] = useState<Lens | null>(null);
  const [idx, setIdx] = useState(0);
  const [queuedKey, setQueuedKey] = useState<string | null>(null);

  const hand = useMemo(() => {
    if (!lens) return [];
    const filtered = lens === "all" ? pool : pool.filter((c) => c.type === lens);
    return dealOrder(filtered, idx === 0 ? 0 : 0).slice(0, 8); // small hand
  }, [lens, pool, idx]);

  function pick(l: Lens) { setLens(l); setIdx(0); setQueuedKey(null); }

  async function queueIt(c: Cand) {
    setQueuedKey(c.key);
    const body = c.itemId ? { item_id: c.itemId } : { curate_drop_id: c.curateDropId };
    try {
      await fetch("/api/queue", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
    } catch { /* optimistic */ }
    setTimeout(() => { setQueuedKey(null); setIdx((i) => i + 1); }, 450);
  }
  function pass() { setIdx((i) => i + 1); }

  // lens not chosen yet → the prompt
  if (!lens) {
    return (
      <div className="mt-6 grid grid-cols-2 gap-3">
        {LENSES.map((l) => (
          <button key={l.key} onClick={() => pick(l.key)}
            className="font-h font-extrabold text-base border-[2.5px] border-ink rounded-2xl px-4 py-5 bg-surface text-left shadow-[4px_4px_0_#14110F] hover:bg-surface-2 transition-colors">
            {l.label}
          </button>
        ))}
      </div>
    );
  }

  const current = hand[idx];

  if (!current) {
    return (
      <div className="mt-8 text-center border-[2.5px] border-dashed border-ink rounded-2xl p-12">
        <div className="font-h text-xl font-bold">that&apos;s the hand for tonight.</div>
        <p className="text-muted text-sm mt-1">queued what you liked. come back tomorrow.</p>
        <button onClick={() => setLens(null)} className="mt-5 font-h font-bold text-sm bg-vibe text-white border-[2.5px] border-ink rounded-full px-5 py-2.5 shadow-[3px_3px_0_#14110F]">again</button>
      </div>
    );
  }

  const t = TYPE[current.type];
  const cover = img(current);
  const isQueued = queuedKey === current.key;

  return (
    <div className="mt-6">
      <div className="flex gap-2 mb-5">
        {LENSES.map((l) => (
          <button key={l.key} onClick={() => pick(l.key)}
            className={`font-m text-[11px] font-bold border-[2px] border-ink rounded-full px-3 py-1.5 ${lens === l.key ? "bg-ink text-paper" : "bg-surface"}`}>
            {l.label.replace(/^[^ ]+ /, "")}
          </button>
        ))}
      </div>

      <div className="bg-surface border-[2.5px] border-ink rounded-2xl overflow-hidden shadow-[6px_7px_0_#14110F]">
        <div className="aspect-[3/2] relative border-b-[2.5px] border-ink" style={{ background: cover ? undefined : t.color }}>
          {cover && <img src={cover} alt="" className="w-full h-full object-cover" />}
          <span className="absolute top-2.5 left-2.5 font-m text-[9px] font-bold border-[2px] border-white text-white rounded px-2 py-0.5">{t.label}</span>
        </div>
        <div className="p-4">
          <div className="font-h font-extrabold text-xl tracking-[-0.02em] leading-tight">{title(current)}</div>
          {sub(current) && <div className="font-m text-[10px] text-muted mt-0.5">{sub(current)}</div>}
          <div className="font-m text-[11px] text-muted mt-2">
            {current.curateDropId ? "✦ kizu curate" : "from your people"}
            {current.who ? ` · ${current.who.toLowerCase()}` : ""}
            {current.rating ? ` · rated ${current.rating}` : ""}
            {current.moment ? ` · for ${current.moment}` : ""}
          </div>
          {current.note && <p className="text-sm mt-2 leading-snug italic">&ldquo;{current.note}&rdquo;</p>}
          {current.proof && <div className="font-m text-[12px] font-bold text-go mt-2">♥ {current.proof}</div>}
          <ItemActions actions={current.availability ? [current.availability] : actionsFor(current, musicApp)} className="mt-3" />

          <div className="grid grid-cols-[1.4fr_1fr] gap-3 mt-4">
            <button onClick={() => queueIt(current)} disabled={isQueued}
              className="font-h font-bold text-sm bg-vibe text-white border-[2.5px] border-ink rounded-full py-3 shadow-[3px_3px_0_#14110F]">
              {isQueued ? "✓ queued" : "＋ queue it"}
            </button>
            <button onClick={pass} className="font-h font-bold text-sm bg-surface border-[2.5px] border-ink rounded-full py-3">pass</button>
          </div>
        </div>
      </div>

      <div className="text-center font-m text-[11px] text-muted mt-4">{idx + 1} of {hand.length} tonight</div>
    </div>
  );
}
