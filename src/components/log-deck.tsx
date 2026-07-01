"use client";

import { useMemo, useRef, useState } from "react";
import { img, title, ratingMark, typeWord, detail, type DropType } from "@/lib/item-render";

// One card = one row from YOUR OWN log (your item + rating + note). The log is
// browsed as a deck, one card at a time — never a list. Nothing here is anyone
// else's entry.
export type DeckCard = {
  id: string;
  type: DropType;
  data: Record<string, unknown>;
  rating: string | null;
  note: string | null;
  shared: boolean;   // !private — already shared with the crew
  date: string;
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
  return cover
    ? <img src={cover} alt="" draggable={false} className="w-full h-full object-cover object-center" />
    : <div className="w-full h-full" style={{ background: grad(card.type) }} />;
}

// a dimmed neighbor peeking on one side — tap it to browse that way.
function PeekCard({ card, side, onClick }: { card: DeckCard; side: "left" | "right"; onClick: () => void }) {
  const tx = side === "left" ? "translateX(-166%)" : "translateX(66%)";
  return (
    <button onClick={onClick} aria-label={side === "left" ? "previous" : "next"}
      className="absolute left-1/2 top-0 border-[2.5px] rounded-[18px] overflow-hidden"
      style={{ width: 206, height: 326, borderColor: "#EDE3CE", transform: `${tx} scale(.84)`, opacity: .32, filter: "brightness(.6)", boxShadow: `5px 5px 0 ${TC[card.type]}` }}>
      <CardArt card={card} />
    </button>
  );
}

export default function LogDeck({ cards }: { cards: DeckCard[] }) {
  const [lens, setLens] = useState<Lens>("all");
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);
  const [shared, setShared] = useState<Record<string, boolean>>({});
  const [drag, setDrag] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [fly, setFly] = useState<"" | "up" | "left" | "right">("");
  const start = useRef<{ x: number; y: number } | null>(null);

  const list = useMemo(() => (lens === "all" ? cards : cards.filter((c) => c.type === lens)), [cards, lens]);
  const i = Math.min(idx, Math.max(0, list.length - 1));
  const cur = list[i];
  const prev = list[i - 1];
  const next = list[i + 1];

  function reset() { setDrag({ x: 0, y: 0 }); setDragging(false); setFly(""); start.current = null; }
  function pick(k: Lens) { setLens(k); setIdx(0); reset(); }
  function go(dir: 1 | -1) {
    const t = i + dir;
    if (t < 0 || t >= list.length) { reset(); return; }
    setFly(dir === 1 ? "left" : "right");
    setTimeout(() => { setIdx(t); reset(); }, 170);
  }
  async function share(c: DeckCard) {
    if (c.shared || shared[c.id]) { reset(); return; }
    setShared((s) => ({ ...s, [c.id]: true }));
    setFly("up");
    try { await fetch("/api/items", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: c.id }) }); } catch { /* optimistic */ }
    setTimeout(reset, 240);
  }

  function onDown(e: React.PointerEvent) { if (fly) return; start.current = { x: e.clientX, y: e.clientY }; setDragging(true); (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId); }
  function onMove(e: React.PointerEvent) { if (!start.current) return; setDrag({ x: e.clientX - start.current.x, y: e.clientY - start.current.y }); }
  function onUp() {
    if (!start.current || !cur) { reset(); return; }
    const { x, y } = drag; const moved = Math.hypot(x, y); start.current = null;
    if (y < -80 && Math.abs(y) > Math.abs(x)) return void share(cur);
    if (x < -70) return void go(1);
    if (x > 70) return void go(-1);
    if (moved < 8) setOpen(true);
    reset();
  }
  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") go(-1);
    else if (e.key === "ArrowRight") go(1);
    else if (e.key === "ArrowUp" && cur) share(cur);
    else if (e.key === "Enter") setOpen(true);
  }

  function transform(): string {
    if (fly === "up") return "translate(-50%, -130%) rotate(0deg)";
    if (fly === "left") return "translate(-185%, 0) rotate(-8deg)";
    if (fly === "right") return "translate(85%, 0) rotate(8deg)";
    if (dragging) return `translate(calc(-50% + ${drag.x}px), ${drag.y}px) rotate(${drag.x / 24}deg)`;
    return "translate(-50%, 0)";
  }

  const isShared = cur ? (cur.shared || !!shared[cur.id]) : false;

  return (
    <div className="mx-auto w-full max-w-[400px] px-4 pb-24">
      {/* header */}
      <div className="pt-1">
        <div className="font-m text-[9px] tracking-[0.16em] uppercase text-muted">your log</div>
        <h1 className="font-h text-[23px] font-black tracking-[-0.035em] mt-0.5 leading-none">everything you&apos;ve logged</h1>
      </div>

      {/* type picker — colored dot per type, active fills violet */}
      <div className="flex items-center gap-[7px] mt-3.5 overflow-x-auto">
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

      {list.length === 0 ? (
        <div className="text-center font-m text-[11px] text-muted py-24 leading-relaxed">
          {lens === "all"
            ? <>nothing logged yet — hit <b className="text-ink-2">＋</b> and pick <b className="text-ink-2">just me</b>.</>
            : <>no {PICKS.find((p) => p.k === lens)?.label} logged yet.</>}
        </div>
      ) : (
        <>
          {/* the deck — clip peeks at the edges so they never widen the page
              (else browsing sideways scrolls the whole layout). overflow-x:clip
              keeps the vertical hard-shadows visible while trimming the sides. */}
          <div className="relative mt-5" style={{ height: 376, overflowX: "clip", overflowY: "visible" }}>
            {prev && <PeekCard card={prev} side="left" onClick={() => go(-1)} />}
            {next && <PeekCard card={next} side="right" onClick={() => go(1)} />}

            {cur && (
              <div
                role="button" tabIndex={0}
                onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onKeyDown={onKey}
                className="absolute left-1/2 top-0 border-[2.5px] rounded-[18px] overflow-hidden select-none cursor-grab active:cursor-grabbing outline-none"
                style={{ width: 230, height: 344, borderColor: "#EDE3CE", zIndex: 5, touchAction: "none", boxShadow: `6px 7px 0 ${TC[cur.type]}, inset 0 2px 0 rgba(255,255,255,.25)`, transform: transform(), opacity: fly ? 0 : 1, transition: dragging ? undefined : "transform .18s ease, opacity .18s ease" }}>
                <CardArt card={cur} />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(8,6,12,.9), transparent 42%)" }} />
                {cur.rating && <span className="glass absolute top-3 right-3 font-h font-black text-[13px] text-white rounded-[9px] px-[11px] py-1">{ratingMark(cur.rating)}</span>}
                <div className="absolute left-0 right-0 bottom-0 p-4">
                  <div className="font-h font-black text-[28px] leading-[1.02] text-white" style={{ textShadow: "0 2px 14px rgba(0,0,0,.5)" }}>{title(cur)}</div>
                  {cur.note && <div className="text-[12.5px] italic mt-1.5" style={{ color: "rgba(244,241,234,.72)" }}>&ldquo;{cur.note}&rdquo;</div>}
                </div>
              </div>
            )}
          </div>

          {/* quiet hint instead of a counter */}
          <div className="text-center font-m text-[10px] text-muted mt-1">
            {isShared ? "swipe to browse · tap to open" : "swipe up to share · tap to open"}
          </div>
        </>
      )}

      {open && cur && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-[380px] bg-surface border-[2.5px] border-frame rounded-3xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="relative aspect-[3/4]" style={{ background: img(cur) ? undefined : grad(cur.type) }}>
              {img(cur) && <img src={img(cur)!} alt="" className="w-full h-full object-cover object-center" />}
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
              <button onClick={() => setOpen(false)} className="mt-5 w-full font-h font-bold text-sm bg-surface-2 border-[1.5px] border-hair rounded-full py-2.5">close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
