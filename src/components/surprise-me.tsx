"use client";

import { useState, useRef, useEffect } from "react";
import { TYPE, SHADOW, img, title, typeWord, detail } from "@/lib/item-render";
import { actionsFor } from "@/lib/item-actions";
import ItemActions from "@/components/item-actions";
import type { Cand } from "@/components/tonight-dealer";

// "can't decide?" — deal one thing from EVERYTHING you could do tonight (group
// drops + kizu curate + your watchlist; pool assembled server-side, filtered to
// the active chip). A slot-machine of covers that riffles, then slams onto a
// single random pick with its type-colored hard-shadow. Pure client theatre.
const LINES = [
  "tonight, it's this.",
  "the pile has spoken.",
  "don't overthink it.",
  "this one. trust.",
  "go on then.",
  "the dice say yes.",
];

export default function SurpriseMe({ pool, musicApp, label }: { pool: Cand[]; musicApp: string | null; label: string }) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<"shuffle" | "reveal">("shuffle");
  const [faceIdx, setFaceIdx] = useState(0);
  const [pick, setPick] = useState<Cand | null>(null);
  const [rolls, setRolls] = useState(0);
  const spin = useRef<ReturnType<typeof setInterval> | null>(null);
  const stop = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = () => {
    if (spin.current) clearInterval(spin.current);
    if (stop.current) clearTimeout(stop.current);
    spin.current = stop.current = null;
  };
  useEffect(() => clear, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function roll() {
    clear();
    if (!pool.length) return;
    setPhase("shuffle"); setPick(null);
    // riffle the covers fast, then land on a random one with a satisfying slam.
    spin.current = setInterval(() => setFaceIdx((i) => (i + 1) % pool.length), 62);
    stop.current = setTimeout(() => {
      clear();
      const chosen = Math.floor(Math.random() * pool.length);
      setFaceIdx(chosen);
      setPick(pool[chosen]);
      setPhase("reveal");
      setRolls((n) => n + 1);
    }, 1150);
  }
  function launch() { setOpen(true); roll(); }
  function close() { clear(); setOpen(false); }

  if (!pool.length) return null;
  const shown = pick ?? pool[faceIdx] ?? pool[0];
  const cover = img(shown);
  const t = TYPE[shown.type];
  const act = pick ? (pick.availability ?? actionsFor(pick, musicApp, false).find((a) => a.kind !== "set") ?? null) : null;

  return (
    <>
      <button onClick={launch}
        className="w-full mb-6 rounded-2xl border-[2.5px] border-frame bg-vibe text-white px-5 py-3.5 shadow-[4px_5px_0_#7C5CE6] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-transform flex items-center justify-center gap-2.5 font-h font-extrabold text-[15px]">
        <span className="text-[18px]" aria-hidden>🎲</span> can&apos;t decide? — surprise me
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6" onClick={close}>
          <div className="w-full max-w-[340px] text-center" onClick={(e) => e.stopPropagation()}>
            <div className="font-m text-[10px] tracking-[0.22em] uppercase text-vibe-2 mb-4 h-4">
              {phase === "shuffle" ? "shuffling your pile…" : LINES[(rolls - 1 + LINES.length * 99) % LINES.length]}
            </div>

            {/* the hero card — riffles covers, then lands with the colored shadow */}
            <div className="mx-auto" style={{ width: 214 }}>
              <div
                className={`relative rounded-[16px] border-[3px] border-frame overflow-hidden bg-surface-2 ${pick ? SHADOW[shown.type] : ""}`}
                style={{
                  aspectRatio: "214 / 318",
                  transform: phase === "shuffle" ? "scale(1.03) rotate(-1.2deg)" : "scale(1) rotate(0deg)",
                  transition: "transform .5s cubic-bezier(.2,1.35,.35,1)",
                  filter: phase === "shuffle" ? "brightness(.78) saturate(.85)" : "none",
                  background: cover ? undefined : t.color,
                }}
              >
                {cover
                  ? <img src={cover} alt="" draggable={false} className="w-full h-full object-cover object-center" />
                  : <div className="w-full h-full" style={{ background: t.color }} />}

                {phase === "shuffle" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                    <span className="text-[46px] animate-spin" style={{ animationDuration: ".7s" }} aria-hidden>🎲</span>
                  </div>
                )}

                {pick && (
                  <div className="absolute inset-x-0 bottom-0 p-3 text-left" style={{ background: "linear-gradient(to top, rgba(8,6,12,.96) 8%, transparent)" }}>
                    <div className="font-m text-[9px] font-bold tracking-wide uppercase" style={{ color: t.color }}>
                      {typeWord(shown)}{detail(shown) && <span className="text-white/60"> · {detail(shown)}</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {pick ? (
              <div className="mt-4">
                <h3 className="font-h font-black text-[22px] leading-tight tracking-[-0.02em]">{title(shown)}</h3>
                {shown.who && <div className="font-m text-[11px] text-muted mt-0.5">from {shown.who.toLowerCase()}</div>}
                {act && <div className="flex justify-center mt-3"><ItemActions actions={[act]} /></div>}
                <div className="flex items-center justify-center gap-2 mt-5">
                  <button onClick={roll} className="font-h font-bold text-sm bg-surface border-[2px] border-frame rounded-full px-4 py-2.5">🎲 again</button>
                  <button onClick={close} className="font-h font-bold text-sm bg-vibe text-white border-[2px] border-frame rounded-full px-5 py-2.5">that one</button>
                </div>
                <div className="font-m text-[10px] text-muted mt-3">{label === "everything" ? "from your group · curate · watchlist" : `${label} · from everywhere`} · {pool.length}</div>
              </div>
            ) : (
              <div className="mt-5 font-m text-[11px] text-muted">tap anywhere to skip</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
