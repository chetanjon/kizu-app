"use client";

import { useMemo, useState } from "react";
import { TYPE, SHADOW, img, title, typeWord, detail, ratingMark, type DropType } from "@/lib/item-render";
import { actionsFor, type Action } from "@/lib/item-actions";

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
  source?: "people" | "shelf";   // where the card came from (the log deck tags + branches on this)
  shared?: boolean;              // shelf cards only: is this own item already shared with the crew?
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

export default function TonightDealer({ pool, musicApp = null, initialLens = null }: { pool: Cand[]; musicApp?: string | null; initialLens?: Lens | null }) {
  // a lens passed from the Home "what's good tonight" chips skips the picker.
  const [lens, setLens] = useState<Lens | null>(initialLens);
  const [idx, setIdx] = useState(0);
  // bumped on each (re)deal so the hand actually reshuffles; kept out of render
  // so it never desyncs hydration (only changes from user taps).
  const [deal, setDeal] = useState(0);
  const [queuedKey, setQueuedKey] = useState<string | null>(null);

  const hand = useMemo(() => {
    if (!lens) return [];
    const filtered = lens === "all" ? pool : pool.filter((c) => c.type === lens);
    return dealOrder(filtered, deal).slice(0, 8); // small hand, rotated by the deal seed
  }, [lens, pool, deal]);

  function pick(l: Lens) { setLens(l); setIdx(0); setDeal((d) => d + 1); setQueuedKey(null); }
  function reshuffle() { setIdx(0); setDeal((d) => d + 1); setQueuedKey(null); }

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
            className="font-h font-extrabold text-base border-2 border-frame rounded-2xl px-4 py-5 bg-surface text-left shadow-[4px_4px_0_#7C5CE6] hover:bg-surface-2 transition-colors">
            {l.label}
          </button>
        ))}
      </div>
    );
  }

  const current = hand[idx];

  if (!current) {
    return (
      <div className="mt-8 text-center border-2 border-dashed border-hair rounded-2xl p-12">
        <div className="font-h text-xl font-bold">that&apos;s the hand.</div>
        <p className="text-muted text-sm mt-1">saved what you liked. deal again, or switch the lens.</p>
        <button onClick={reshuffle} className="mt-5 font-h font-bold text-sm bg-vibe text-white border-[2.5px] border-frame rounded-full px-5 py-2.5 shadow-[3px_3px_0_#7C5CE6]">deal again</button>
      </div>
    );
  }

  const t = TYPE[current.type];
  const cover = img(current);
  const isQueued = queuedKey === current.key;
  // one act-on-it — their subscription app for music, "you have it" / "where to
  // watch" for film, "maps" for places.
  const act = current.availability ?? actionsFor(current, musicApp, false).find((a) => a.kind !== "set") ?? null;

  return (
    <div className="mt-6">
      <div className="flex gap-2 mb-5">
        {LENSES.map((l) => (
          <button key={l.key} onClick={() => pick(l.key)}
            className={`font-m text-[11px] font-bold border-2 border-frame rounded-full px-3 py-1.5 ${lens === l.key ? "bg-vibe text-white" : "bg-surface text-ink"}`}>
            {l.label.replace(/^[^ ]+ /, "")}
          </button>
        ))}
      </div>

      {/* cinematic: the poster IS the card, with a scrim caption over the bottom */}
      <div className={`relative rounded-2xl overflow-hidden border-[2.5px] border-frame ${SHADOW[current.type]}`}>
        <div className="relative aspect-[2/3]" style={{ background: cover ? undefined : t.color }}>
          {cover
            ? <img src={cover} alt="" className="w-full h-full object-cover object-center" />
            : <div className="absolute inset-0 flex items-center justify-center p-6 text-center"><span className="font-h font-extrabold text-2xl text-[#15110D] leading-tight">{title(current)}</span></div>}

          <div className="absolute inset-x-0 bottom-0 p-4 pt-24 bg-gradient-to-t from-black/95 via-black/55 to-transparent">
            <div className="font-m text-[10px] text-white/65 mb-1">
              {current.curateDropId ? "✦ kizu curate" : "from your people"}
              {current.who ? ` · ${current.who.toLowerCase()}` : ""}
              {current.rating ? ` · ${ratingMark(current.rating)}` : ""}
              {current.moment ? ` · for ${current.moment}` : ""}
            </div>
            <h2 className="font-h font-extrabold text-2xl tracking-[-0.02em] leading-[1.05] text-white">{title(current)}</h2>
            <div className="font-m text-[11px] mt-1 text-white/80">
              <span className="font-bold" style={{ color: t.color }}>{typeWord(current)}</span>
              {detail(current) && <> · {detail(current)}</>}
              {current.proof && <span className="text-go"> · ♥ {current.proof}</span>}
            </div>
            {current.note && <p className="text-[13px] mt-2 leading-snug italic text-white/90 line-clamp-2">&ldquo;{current.note}&rdquo;</p>}
            {act && (
              <a href={act.url} {...(act.kind === "set" ? {} : { target: "_blank", rel: "noreferrer" })}
                className={`inline-flex items-center mt-3 font-h text-[11px] font-bold rounded-full px-3.5 py-1.5 transition-transform active:scale-95 ${
                  act.kind === "have" ? "bg-go text-[#15110D]"
                  : act.primary ? "bg-vibe text-white"
                  : "glass text-white border border-white/30"
                }`}>
                {act.label}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* the tonight decision */}
      <div className="grid grid-cols-[1.4fr_1fr] gap-3 mt-4">
        <button onClick={() => queueIt(current)} disabled={isQueued}
          className="font-h font-bold text-sm bg-vibe text-white border-[2.5px] border-frame rounded-full py-3.5 shadow-[3px_3px_0_#0D0B09] active:translate-y-[1px] transition-transform">
          {isQueued ? "✓ saved" : "＋ save"}
        </button>
        <button onClick={pass} className="font-h font-bold text-sm bg-surface border-[2.5px] border-frame rounded-full py-3.5">pass</button>
      </div>

      <div className="text-center font-m text-[11px] text-muted mt-4">{idx + 1} of {hand.length} tonight</div>
    </div>
  );
}
