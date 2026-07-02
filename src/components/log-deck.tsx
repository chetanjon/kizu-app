"use client";

import { useMemo, useRef, useState } from "react";
import { img, title, ratingMark, typeWord, detail, type DropType } from "@/lib/item-render";
import ItemActions from "@/components/item-actions";
import type { Action } from "@/lib/item-actions";

// One card = one row from YOUR OWN log (your item + rating + note). The log is
// browsed as a coverflow carousel — a main card in the middle, one neighbour
// peeking on each side. Nothing here is anyone else's entry.
export type DeckCard = {
  id: string;
  type: DropType;
  data: Record<string, unknown>;
  rating: string | null;
  note: string | null;
  shared: boolean;   // !private — already shared with the crew
  date: string;
  actions: Action[]; // where-to-watch / play / maps / "you have it" — computed server-side
};

type Lens = "all" | DropType;

// Softer type colors matched to the approved mockup (movie / music / place).
const TC: Record<DropType, string> = { watch: "#6E8FE8", listen: "#F58BB0", go_out: "#5FD0A8" };
const PICKS: { k: Lens; label: string; type?: DropType }[] = [
  { k: "all", label: "all" },
  { k: "watch", label: "movies", type: "watch" },
  { k: "listen", label: "music", type: "listen" },
  { k: "go_out", label: "places", type: "go_out" },
];

// carousel geometry. CARD_W drives everything; side cards sit ±SPREAD·CARD_W
// away, scaled/dimmed. Responsive via min() so one card fills a phone and the
// trio fills a desktop column, always centered.
const CARD_W = "min(62vw, 300px)";
const SPREAD = 0.76;   // neighbour centre offset, in card-widths
const SIDE_SCALE = 0.82;

// a calm placeholder gradient when there's no real cover, tinted to type.
function grad(type: DropType): string {
  return `linear-gradient(150deg, ${TC[type]}, rgba(0,0,0,.5) 60%, #12101a)`;
}

function fmtDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }).toLowerCase(); }
  catch { return ""; }
}

function CardArt({ card }: { card: DeckCard }) {
  const cover = img(card);
  if (!cover) return <div className="w-full h-full" style={{ background: grad(card.type) }} />;
  // music art is square — zoom-cropping it into the tall poster frame slices
  // the cover. Show it whole, anchored top; the type gradient fills the rest
  // (exactly where the text overlay sits). Posters already fit the frame.
  if (card.type === "listen") {
    return (
      <div className="w-full h-full" style={{ background: grad(card.type) }}>
        <img src={cover} alt="" draggable={false} className="w-full aspect-square object-cover" />
      </div>
    );
  }
  return <img src={cover} alt="" draggable={false} className="w-full h-full object-cover object-center" />;
}

export default function LogDeck({ cards }: { cards: DeckCard[] }) {
  const [lens, setLens] = useState<Lens>("all");
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);
  const [shared, setShared] = useState<Record<string, boolean>>({});
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ x: number; y: number; el: HTMLElement | null } | null>(null);

  const list = useMemo(() => (lens === "all" ? cards : cards.filter((c) => c.type === lens)), [cards, lens]);
  const n = list.length;
  const i = n ? Math.min(Math.max(idx, 0), n - 1) : 0;
  const cur = list[i];

  function pick(k: Lens) { setLens(k); setIdx(0); setDx(0); setDragging(false); start.current = null; }
  // clamp — the carousel stops at the first / last card, no wrap.
  function goTo(target: number) { if (n) setIdx(Math.min(Math.max(target, 0), n - 1)); }

  // signed distance from the centred card to card j (no wrap).
  function delta(j: number): number { return j - i; }

  function onDown(e: React.PointerEvent) {
    start.current = { x: e.clientX, y: e.clientY, el: e.target as HTMLElement };
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }
  function onMove(e: React.PointerEvent) {
    if (!start.current) return;
    setDx(e.clientX - start.current.x);
  }
  function onUp(e: React.PointerEvent) {
    const s = start.current; start.current = null;
    setDragging(false); setDx(0);
    if (!s) return;
    const moved = e.clientX - s.x;   // read from the event, not async state
    if (Math.abs(moved) > 60) { goTo(i + (moved < 0 ? 1 : -1)); return; }   // slide
    // a tap: open the card it landed on, or slide to a side card.
    const hit = s.el?.closest?.("[data-j]") as HTMLElement | null;
    if (!hit) return;
    const j = Number(hit.dataset.j);
    if (j === i) setOpen(true); else goTo(j);
  }
  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") goTo(i - 1);
    else if (e.key === "ArrowRight") goTo(i + 1);
    else if (e.key === "Enter") setOpen(true);
  }

  async function share(c: DeckCard) {
    if (c.shared || shared[c.id]) return;
    setShared((s) => ({ ...s, [c.id]: true }));
    try { await fetch("/api/items", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: c.id }) }); } catch { /* optimistic */ }
  }

  const isShared = cur ? (cur.shared || !!shared[cur.id]) : false;

  return (
    <div className="mx-auto w-full max-w-[680px] px-4 pt-5 pb-28 text-center flex flex-col min-h-[100dvh]">
      {/* header — centred so it shares the carousel's axis */}
      <div>
        <div className="font-m text-[9px] tracking-[0.16em] uppercase text-muted">your log</div>
        <h1 className="font-h text-[23px] font-black tracking-[-0.035em] mt-0.5 leading-none">everything you&apos;ve logged</h1>
      </div>

      {/* type picker — colored dot per type, active fills violet */}
      <div className="flex items-center justify-center gap-[7px] mt-3.5 flex-wrap">
        {PICKS.map((p) => {
          const on = lens === p.k;
          return (
            <button key={p.k} onClick={() => pick(p.k)}
              className="font-m text-[10px] font-bold rounded-full px-3 py-[5px] whitespace-nowrap flex items-center gap-1.5 border-[1.5px] shrink-0"
              style={on ? { background: "#9D7CFF", borderColor: "#9D7CFF", color: "#15110D" } : { borderColor: "#EDE3CE", color: "#F4F1EA" }}>
              {p.type && <span className="w-[7px] h-[7px] rounded-full" style={{ background: TC[p.type] }} />}
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 flex flex-col justify-center min-h-0">
      {n === 0 ? (
        <div className="font-m text-[11px] text-muted py-24 leading-relaxed">
          {lens === "all"
            ? <>nothing logged yet. hit <b className="text-ink-2">＋</b> and pick <b className="text-ink-2">just me</b>.</>
            : <>no {PICKS.find((p) => p.k === lens)?.label} logged yet.</>}
        </div>
      ) : (
        <>
          {/* the carousel. overflow-x clip trims the side cards at the column
              edge so they never widen the page; the drag lives on the track. */}
          <div
            role="group" tabIndex={0} aria-label="your log, slide to browse"
            onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onKeyDown={onKey}
            className="relative select-none outline-none cursor-grab active:cursor-grabbing"
            style={{ height: "min(92vw, 446px)", overflowX: "clip", overflowY: "visible", touchAction: "pan-y" }}>
            {list.map((c, j) => {
              const d = delta(j);
              if (Math.abs(d) > 2) return null;         // only render the visible window
              const center = d === 0;
              const near = Math.abs(d) === 1;
              const scale = center ? 1 : SIDE_SCALE;
              const off = `${(d * SPREAD).toFixed(4)} * ${CARD_W}`;
              return (
                <div key={c.id} data-j={j}
                  className="absolute left-1/2 top-0 border-[2.5px] rounded-[18px] overflow-hidden"
                  style={{
                    width: CARD_W, aspectRatio: "230 / 344", borderColor: "#EDE3CE",
                    transform: `translateX(calc(-50% + ${off} + ${dragging ? dx : 0}px)) scale(${scale})`,
                    transformOrigin: "center center",
                    opacity: center ? 1 : near ? 0.86 : 0,
                    filter: center ? "none" : "brightness(.9)",
                    zIndex: 10 - Math.abs(d),
                    pointerEvents: Math.abs(d) <= 1 ? "auto" : "none",
                    boxShadow: center
                      ? `6px 7px 0 ${TC[c.type]}, inset 0 2px 0 rgba(255,255,255,.25)`
                      : `5px 5px 0 ${TC[c.type]}`,
                    transition: dragging ? undefined : "transform .28s cubic-bezier(.22,.61,.36,1), opacity .28s ease, filter .28s ease",
                  }}>
                  <CardArt card={c} />
                  {center && (
                    <>
                      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(8,6,12,.97) 3%, rgba(8,6,12,.72) 27%, transparent 62%)" }} />
                      {c.rating && <span className="glass absolute top-3 right-3 font-h font-black text-[13px] text-white rounded-[9px] px-[11px] py-1">{ratingMark(c.rating)}</span>}
                      <div className="absolute left-0 right-0 bottom-0 p-4 text-left">
                        <div className="font-m text-[10.5px] tracking-wide mb-1.5 uppercase" style={{ color: TC[c.type] }}>
                          {typeWord(c)}{detail(c) && <span className="normal-case text-white/60"> · {detail(c)}</span>}
                        </div>
                        <div className="font-h font-black text-[23px] leading-[1.06] text-white line-clamp-2" style={{ textShadow: "0 2px 14px rgba(0,0,0,.55)" }}>{title(c)}</div>
                        {c.note && <div className="text-[12px] italic mt-1.5 line-clamp-1" style={{ color: "rgba(244,241,234,.7)" }}>&ldquo;{c.note}&rdquo;</div>}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* quiet hint instead of a counter */}
          <div className="font-m text-[10px] mt-6 flex items-center justify-center gap-2.5" style={{ color: "rgba(199,190,176,.55)" }}>
            <span className="text-[13px] leading-none" style={{ color: "rgba(199,190,176,.85)" }}>‹</span>
            slide to browse · tap to open
            <span className="text-[13px] leading-none" style={{ color: "rgba(199,190,176,.85)" }}>›</span>
          </div>
        </>
      )}
      </div>

      {open && cur && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4 text-left" onClick={() => setOpen(false)}>
          <div className="w-full max-w-[380px] bg-surface border-[2.5px] border-frame rounded-3xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="relative aspect-[3/4]" style={{ background: img(cur) && cur.type !== "listen" ? undefined : grad(cur.type) }}>
              {img(cur) && (cur.type === "listen"
                ? <img src={img(cur)!} alt="" className="w-full aspect-square object-cover" />
                : <img src={img(cur)!} alt="" className="w-full h-full object-cover object-center" />)}
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(8,6,12,.92), transparent 45%)" }} />
              <div className="absolute left-0 right-0 bottom-0 p-5">
                <div className="font-h font-black text-2xl text-white leading-tight">{title(cur)}</div>
                <div className="font-m text-[11px] mt-1" style={{ color: TC[cur.type] }}>
                  {typeWord(cur)}{detail(cur) && <span className="text-white/70"> · {detail(cur)}</span>}{cur.rating && <span className="text-white/70"> · {ratingMark(cur.rating)}</span>}
                </div>
              </div>
            </div>
            <div className="p-5">
              {cur.note && <p className="text-[14px] text-ink-2 leading-snug">&ldquo;{cur.note}&rdquo;</p>}
              <div className="font-m text-[10px] text-muted mt-3">
                logged {fmtDate(cur.date)} · {isShared ? <span className="text-go">shared with the crew</span> : "only you"}
              </div>
              {cur.actions.length > 0 && (
                <div className="mt-4">
                  <div className="font-m text-[10px] tracking-[0.14em] uppercase text-muted mb-2">act on it</div>
                  <ItemActions actions={cur.actions} />
                </div>
              )}
              {isShared ? (
                <div className="mt-5 w-full text-center font-h font-bold text-sm text-go border-[1.5px] border-hair rounded-full py-2.5">✓ shared with the crew</div>
              ) : (
                <button onClick={() => share(cur)} className="mt-5 w-full font-h font-bold text-sm bg-vibe text-white border-[2.5px] border-frame rounded-full py-2.5 shadow-[3px_3px_0_#0D0B09]">share with the crew</button>
              )}
              <button onClick={() => setOpen(false)} className="mt-2.5 w-full font-h font-bold text-sm bg-surface-2 border-[1.5px] border-hair rounded-full py-2.5">close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
