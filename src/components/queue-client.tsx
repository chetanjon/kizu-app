"use client";

import { useState } from "react";
import { TYPE, SHADOW_SM, img, title, typeWord, detail, type DropType } from "@/lib/item-render";
import { actionsFor, type Action } from "@/lib/item-actions";
import ItemActions from "@/components/item-actions";

export type QRow = {
  key: string;                 // stable row key
  itemId?: string;             // group item target
  curateDropId?: string;       // curate pick target
  type: DropType;
  data: Record<string, unknown>;
  note: string | null;
  ratingValue: string | null;
  verdict: "loved" | "liked" | "meh" | null;
  done: boolean;
  who: string | null;          // who dropped / curated it
  mine: boolean;
  availability?: Action | null; // movie/tv: "you have it" / "on netflix" (server-resolved)
  told?: string | null;         // set after a verdict: dropper who'll hear "it landed"
};

// "easiest win" = least friction to act on right now: a song plays instantly; a
// movie you already have is one tap; one you don't takes hunting; going out is
// the most effort. The single highest scorer in "want to" gets an ↑ up next tag.
function easeScore(r: QRow): number {
  let s = r.type === "listen" ? 3 : r.type === "watch" ? 2 : 1;
  if (r.type === "watch" && r.availability) s += 1.5; // you have it → easy win
  return s;
}

type Filter = "all" | DropType;
const CHIPS: { key: Filter; label: string }[] = [
  { key: "all", label: "all" },
  { key: "watch", label: "movies" },
  { key: "listen", label: "music" },
  { key: "go_out", label: "outside" },
];
const VERDICTS: { key: "loved" | "liked" | "meh"; label: string }[] = [
  { key: "loved", label: "♥ loved" },
  { key: "liked", label: "liked" },
  { key: "meh", label: "meh" },
];

export default function QueueClient({ rows, landedYou, musicApp = null }: { rows: QRow[]; landedYou: number; musicApp?: string | null }) {
  const [state, setState] = useState<QRow[]>(rows);
  const [filter, setFilter] = useState<Filter>("all");

  async function setVerdict(row: QRow, verdict: "loved" | "liked" | "meh") {
    const prev = state;
    setState((s) => s.map((r) => (r.key === row.key ? { ...r, verdict, done: true } : r)));
    try {
      const target = row.itemId ? { item_id: row.itemId } : { curate_drop_id: row.curateDropId };
      const res = await fetch("/api/queue/verdict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...target, verdict }),
      });
      if (!res.ok) { setState(prev); return; }
      // if loving a group drop credited the dropper, show "they'll know it landed".
      const { told } = await res.json().catch(() => ({ told: null }));
      if (told) setState((s) => s.map((r) => (r.key === row.key ? { ...r, told } : r)));
    } catch {
      setState(prev);
    }
  }

  const shown = state.filter((r) => filter === "all" || r.type === filter);
  const want = shown.filter((r) => !r.done);
  const done = shown.filter((r) => r.done);
  // only the first song shown carries the "pick your music app" prompt.
  const firstListenKey = [...want, ...done].find((r) => r.type === "listen")?.key;
  // the single easiest win among things you still want to get to.
  const upNextKey = want.length
    ? want.reduce((best, r) => (easeScore(r) > easeScore(best) ? r : best)).key
    : null;

  const Row = ({ r }: { r: QRow }) => {
    const t = TYPE[r.type];
    const cover = img(r);
    return (
      <div className="flex gap-3.5 items-center bg-surface border border-hair rounded-xl p-2.5">
        <div className={`w-[52px] h-[68px] flex-none rounded-lg border-2 border-frame overflow-hidden ${SHADOW_SM[r.type]}`} style={{ background: cover ? undefined : t.color }}>
          {cover && <img src={cover} alt="" className="w-full h-full object-cover" />}
        </div>
        <div className="min-w-0">
          {/* "up next" stays loud — a reserved kizu signal, not chrome */}
          {r.key === upNextKey && <span className="inline-block font-m text-[8px] font-bold border-[1.5px] border-vibe text-vibe rounded px-1.5 py-0.5 mb-1">↑ up next</span>}
          <div className="font-h font-extrabold text-[15px] leading-tight truncate">{title(r)}</div>
          <div className="font-m text-[9px] text-muted truncate">
            <span className="font-bold" style={{ color: t.color }}>{typeWord(r)}</span>{detail(r) && <> · {detail(r)}</>}{r.who ? ` · ${r.who.toLowerCase()}` : ""}
          </div>
          <ItemActions actions={r.availability ? [r.availability] : actionsFor(r, musicApp, r.key === firstListenKey)} className="mt-1.5" />
          {r.told && <div className="font-m text-[10px] text-vibe mt-1.5">✦ {r.told.toLowerCase()} will know it landed</div>}
        </div>
        <div className="ml-auto flex-none">
          {r.done ? (
            <span className="font-m text-[11px] font-bold text-go">{r.verdict === "loved" ? "♥ loved" : r.verdict}</span>
          ) : (
            <div className="flex gap-1.5">
              {VERDICTS.map((v) => (
                <button
                  key={v.key}
                  onClick={() => setVerdict(r, v.key)}
                  className="font-h text-[10px] font-bold border-2 border-frame rounded-full px-2.5 py-1 bg-surface hover:bg-vibe hover:text-white transition-colors"
                >
                  {v.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="mt-6">
      {landedYou > 0 && (
        <div className="border-[2.5px] border-frame rounded-2xl p-4 mb-6 shadow-[4px_5px_0_#7C5CE6]" style={{ background: "rgba(124,92,230,0.14)" }}>
          <div className="font-m text-[10px] tracking-widest uppercase text-[#C2D24A]">✦ it landed</div>
          <div className="font-h font-bold text-base mt-1">{landedYou} {landedYou === 1 ? "thing you queued from your people hit" : "things you queued from your people hit"}.</div>
        </div>
      )}

      <div className="flex gap-2 mb-6">
        {CHIPS.map((c) => (
          <button
            key={c.key}
            onClick={() => setFilter(c.key)}
            className={`font-m text-[11px] font-bold border-2 border-frame rounded-full px-3 py-1.5 transition-colors ${
              filter === c.key ? "bg-vibe text-white" : "bg-surface text-ink"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {want.length > 0 && (
        <>
          <div className="font-m text-[10px] tracking-widest uppercase text-muted mb-3">want to · {want.length}</div>
          <div className="flex flex-col gap-2.5">{want.map((r) => <Row key={r.key} r={r} />)}</div>
        </>
      )}

      {done.length > 0 && (
        <>
          <div className="font-m text-[10px] tracking-widest uppercase text-muted mb-3 mt-8">done</div>
          <div className="flex flex-col gap-2.5">{done.map((r) => <Row key={r.key} r={r} />)}</div>
        </>
      )}

      {shown.length === 0 && (
        <div className="text-center text-muted font-m text-xs py-10">nothing here in this filter.</div>
      )}
    </div>
  );
}
