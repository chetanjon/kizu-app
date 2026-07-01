"use client";

import { useMemo, useRef, useState } from "react";
import { TYPE, SHADOW, img, title, typeWord, detail, ratingMark, type DropType } from "@/lib/item-render";
import { actionsFor, type Action } from "@/lib/item-actions";
import type { Cand } from "@/components/tonight-dealer";

type Lens = "all" | DropType;

// rotate-from-seed deal (no Math.random → SSR/hydration stable)
function dealOrder<T>(arr: T[], seed: number): T[] {
  if (arr.length < 2) return arr;
  const s = seed % arr.length;
  return [...arr.slice(s), ...arr.slice(0, s)];
}

function actFor(c: Cand, musicApp: string | null): Action | null {
  return c.availability ?? actionsFor(c, musicApp, false).find((a) => a.kind !== "set") ?? null;
}

export default function LogDeck({ pool, musicApp, lens }: { pool: Cand[]; musicApp: string | null; lens: Lens }) {
  const [idx, setIdx] = useState(0);
  const [deal, setDeal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const [fly, setFly] = useState<"" | "up" | "away">("");
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);

  const hand = useMemo(() => {
    const filtered = lens === "all" ? pool : pool.filter((c) => c.type === lens);
    return dealOrder(filtered, deal).slice(0, 8);
  }, [pool, lens, deal]);

  const current = hand[idx];
  const next = hand[idx + 1];

  function reset() { setDrag({ dx: 0, dy: 0 }); setFly(""); setDragging(false); start.current = null; }
  function advance() { reset(); setBusy(false); setIdx((i) => i + 1); }
  function reshuffle() { reset(); setBusy(false); setIdx(0); setDeal((d) => d + 1); }

  async function save(c: Cand) {
    setBusy(true); setFly("up");
    try {
      if (c.source === "shelf" && !c.shared) {
        await fetch("/api/items", {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: c.itemId }),
        });
      } else {
        const body = c.itemId ? { item_id: c.itemId } : { curate_drop_id: c.curateDropId };
        await fetch("/api/queue", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
    } catch { /* optimistic */ }
    setTimeout(advance, 220);
  }
  function skip() { setBusy(true); setFly("away"); setTimeout(advance, 220); }

  function onDown(e: React.PointerEvent) {
    if (busy) return;
    start.current = { x: e.clientX, y: e.clientY };
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }
  function onMove(e: React.PointerEvent) {
    if (!start.current) return;
    setDrag({ dx: e.clientX - start.current.x, dy: e.clientY - start.current.y });
  }
  function onUp() {
    if (!start.current || !current || busy) { start.current = null; setDragging(false); return; }
    const { dx, dy } = drag;
    const moved = Math.hypot(dx, dy);
    start.current = null;
    setDragging(false);
    if (dy < -90) return void save(current);
    if (Math.abs(dx) > 110) return void skip();
    if (moved < 8) {
      const act = actFor(current, musicApp);
      if (act) window.open(act.url, act.kind === "set" ? "_self" : "_blank");
    }
    setDrag({ dx: 0, dy: 0 });
  }

  // nothing to deal for this lens → render nothing (the shelf below still shows)
  if (hand.length === 0) return null;

  // swiped through the whole hand
  if (!current) {
    return (
      <div className="mt-6 text-center border-2 border-dashed border-hair rounded-2xl p-10">
        <div className="font-h text-lg font-bold">that&apos;s the hand.</div>
        <p className="text-muted text-sm mt-1">you called it on all of them.</p>
        <button onClick={reshuffle} className="mt-4 font-h font-bold text-sm bg-vibe text-white border-[2.5px] border-frame rounded-full px-5 py-2.5 shadow-[3px_3px_0_#0D0B09]">deal again</button>
      </div>
    );
  }

  const t = TYPE[current.type];
  const act = actFor(current, musicApp);
  const mine = current.source === "shelf";
  const saveVerb = mine ? (current.shared ? "revisit" : "share") : "save";

  const topStyle: React.CSSProperties =
    fly === "up" ? { transform: "translateY(-130%) rotate(-4deg)", opacity: 0, transition: "transform .22s ease, opacity .22s ease" }
    : fly === "away" ? { transform: `translateX(${drag.dx >= 0 ? 130 : -130}%) rotate(${drag.dx >= 0 ? 12 : -12}deg)`, opacity: 0, transition: "transform .22s ease, opacity .22s ease" }
    : dragging ? { transform: `translate(${drag.dx}px, ${drag.dy}px) rotate(${drag.dx / 22}deg)` }
    : { transform: "none", transition: "transform .2s ease" };

  return (
    <div className="mt-5">
      <div className="text-center font-m text-[11px] tracking-widest uppercase text-vibe-2 mb-2">↑ swipe up to {saveVerb}</div>

      <div className="relative" style={{ perspective: 1000 }}>
        {/* peek: the next card, behind */}
        {next && (
          <div className="absolute inset-0 scale-[0.95] translate-y-3 opacity-60 pointer-events-none">
            <CardFace c={next} />
          </div>
        )}
        {/* top card — draggable */}
        <div
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
          style={{ ...topStyle, touchAction: "none" }}
          className="relative cursor-grab active:cursor-grabbing select-none"
        >
          <CardFace c={current}>
            <div className="font-m text-[10px] mb-1" style={{ color: t.color }}>
              {mine ? "↺ from your shelf" : "✦ from your people"}
              {current.who ? ` · ${current.who.toLowerCase()}` : ""}
              {current.moment ? ` · for ${current.moment}` : ""}
            </div>
            <h2 className="font-h font-extrabold text-2xl tracking-[-0.02em] leading-[1.05] text-white">{title(current)}</h2>
            <div className="font-m text-[11px] mt-1 text-white/80">
              <span className="font-bold" style={{ color: t.color }}>{typeWord(current)}</span>
              {detail(current) && <> · {detail(current)}</>}
              {current.rating && <> · {ratingMark(current.rating)}</>}
              {current.proof && <span className="text-go"> · ♥ {current.proof}</span>}
            </div>
            {current.note && <p className="text-[13px] mt-2 leading-snug italic text-white/90 line-clamp-2">&ldquo;{current.note}&rdquo;</p>}
            {act && (
              <span className={`inline-flex items-center mt-3 font-h text-[11px] font-bold rounded-full px-3.5 py-1.5 ${
                act.kind === "have" ? "bg-go text-[#15110D]" : act.primary ? "bg-vibe text-white" : "glass text-white border border-white/30"
              }`}>
                {act.kind === "have" ? `✓ ${act.label}` : act.label}
              </span>
            )}
          </CardFace>
        </div>
      </div>

      {/* the two explicit buttons back up the gestures (a11y + desktop) */}
      <div className="grid grid-cols-[1.4fr_1fr] gap-3 mt-4">
        <button onClick={() => save(current)} disabled={busy}
          className="font-h font-bold text-sm bg-vibe text-white border-[2.5px] border-frame rounded-full py-3 shadow-[3px_3px_0_#0D0B09] active:translate-y-[1px] transition-transform">
          {saveVerb === "share" ? "＋ tell the crew" : saveVerb === "revisit" ? "↺ revisit" : "＋ save"}
        </button>
        <button onClick={skip} disabled={busy} className="font-h font-bold text-sm bg-surface border-[2.5px] border-frame rounded-full py-3">skip</button>
      </div>

      <div className="flex items-center justify-center gap-1.5 mt-4">
        {hand.map((_, i) => (
          <span key={i} className={`h-1 rounded-full transition-all ${i === idx ? "w-5 bg-vibe-2" : "w-1 bg-hair"}`} />
        ))}
      </div>
      <div className="text-center font-m text-[10px] text-muted mt-2">flick away to skip · tap to open</div>
    </div>
  );
}

// the poster card body — art + bottom scrim; children render the caption block.
function CardFace({ c, children }: { c: Cand; children?: React.ReactNode }) {
  const t = TYPE[c.type];
  const cover = img(c);
  return (
    <div className={`relative rounded-2xl overflow-hidden border-[2.5px] border-frame ${SHADOW[c.type]}`}>
      <div className="relative aspect-[2/3]" style={{ background: cover ? undefined : t.color }}>
        {cover
          ? <img src={cover} alt="" draggable={false} className="w-full h-full object-cover object-center" />
          : <div className="absolute inset-0 flex items-center justify-center p-6 text-center"><span className="font-h font-extrabold text-2xl text-[#15110D] leading-tight">{title(c)}</span></div>}
        {children && (
          <div className="absolute inset-x-0 bottom-0 p-4 pt-24 bg-gradient-to-t from-black/95 via-black/55 to-transparent">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
