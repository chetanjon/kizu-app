"use client";

// The home "from your people" strip — a smooth, always-drifting marquee of the
// group's best moments (it-landed, consensus, a real take). Done right:
//  · seamless loop — the track is duplicated and slid exactly -50%, and each tile
//    carries its OWN trailing margin so there's no hitch at the seam.
//  · overflow-x-clip wrapper so the wide track never makes the whole PAGE pan.
//  · soft mask fade at both edges so tiles dissolve in/out (premium touch).
//  · pauses on hover; respects prefers-reduced-motion.
//  · light tiles (cover + scrim, NO blur layers) to keep iOS memory down.
import { type DropType } from "@/lib/item-render";

export type Highlight = {
  id: string;
  type: DropType;
  cover: string | null;
  title: string;
  hook: string;
  hookCol: string;
  take: string;
  who: string;
};

const TYPEWORD: Record<DropType, string> = { watch: "movie", listen: "music", go_out: "outside" };

// rich duotone stand-in when a drop has no cover art
const ART: Record<DropType, string> = {
  listen: "radial-gradient(90% 130% at 78% 30%, #FFB3CC 0%, transparent 55%), linear-gradient(115deg, #220B18 0%, #7A2E5B 48%, #FF6F9C 100%)",
  watch: "radial-gradient(90% 130% at 78% 30%, #B7CCFF 0%, transparent 55%), linear-gradient(115deg, #0C1426 0%, #2E3C7A 48%, #5B8DEF 100%)",
  go_out: "radial-gradient(90% 130% at 78% 30%, #ABF2D6 0%, transparent 55%), linear-gradient(115deg, #06201A 0%, #1E6B52 48%, #5DCAA5 100%)",
};

function Tile({ h }: { h: Highlight }) {
  return (
    // mr-3 (not a flex gap) so EVERY tile — including the last of each half —
    // carries a trailing gap; that's what makes the -50% seam perfectly smooth.
    <div
      className="relative mr-3 flex-none w-[240px] aspect-[16/9] rounded-[14px] overflow-hidden border-2 border-frame bg-surface-2"
      style={{ background: h.cover ? undefined : ART[h.type] }}
    >
      {/* eager (NOT lazy): inside the transformed track a lazy img never enters
          the viewport and would never load. */}
      {h.cover && <img src={h.cover} alt="" decoding="async" className="absolute inset-0 w-full h-full object-cover object-center" />}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top right, rgba(6,5,3,0.9) 8%, rgba(6,5,3,0.25) 50%, transparent 80%)" }} />
      <div className="glass absolute top-2 left-2 rounded-full px-2 py-0.5 font-m text-[8.5px] font-bold tracking-wide text-white/90">{TYPEWORD[h.type]}</div>
      <div className="absolute left-2.5 bottom-2 right-3">
        <div className="font-m text-[8.5px] font-bold tracking-[0.1em] uppercase" style={{ color: h.hookCol }}>{h.hook}</div>
        <div className="font-h font-extrabold text-[15px] leading-[1.05] text-white line-clamp-2 mt-0.5">{h.title}</div>
        <div className="font-m text-[8px] text-white/50 mt-1 truncate">{h.who}</div>
      </div>
    </div>
  );
}

export default function HighlightReel({ items }: { items: Highlight[] }) {
  if (!items.length) return null;
  // widen the base so the row fills the viewport, then double it for the loop.
  const base: Highlight[] = [];
  while (base.length < 4) base.push(...items);
  const loop = [...base, ...base];

  const FADE = "linear-gradient(to right, transparent 0, #000 5%, #000 95%, transparent 100%)";

  return (
    <section className="mt-8">
      <style>{`
        @keyframes kz-marq { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        .kz-marq { animation: kz-marq 42s linear infinite; will-change: transform; }
        .kz-marq:hover { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) { .kz-marq { animation: none !important; } }
      `}</style>
      <div className="mb-3 font-m text-[10px] font-bold tracking-[0.2em] uppercase text-vibe-2">from your people</div>
      <div className="overflow-x-clip -mx-5 px-5" style={{ WebkitMaskImage: FADE, maskImage: FADE }}>
        <div className="kz-marq flex w-max py-1">
          {loop.map((h, i) => <Tile key={`${h.id}-${i}`} h={h} />)}
        </div>
      </div>
    </section>
  );
}
