"use client";

// The home "from your people" strip — a calm, SWIPEABLE rail of the group's best
// moments (it-landed, consensus, a real take). It's the supporting act beneath the
// hero vibe read now, so: smaller 16:9 tiles, no auto-scroll marquee, and no heavy
// blur backdrops (which also keeps iOS memory down — see the /home OOM fix).
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
    <div
      className="relative flex-none w-[210px] aspect-[16/9] rounded-[14px] overflow-hidden border-2 border-frame bg-surface-2"
      style={{ background: h.cover ? undefined : ART[h.type] }}
    >
      {h.cover && (
        <img src={h.cover} alt="" loading="lazy" decoding="async"
          className="absolute inset-0 w-full h-full object-cover object-center" />
      )}
      {/* scrim pooled lower-left so the text reads over any art */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top right, rgba(6,5,3,0.9) 8%, rgba(6,5,3,0.25) 50%, transparent 80%)" }} />
      <div className="glass absolute top-2 left-2 rounded-full px-2 py-0.5 font-m text-[8.5px] font-bold tracking-wide text-white/90">{TYPEWORD[h.type]}</div>
      <div className="absolute left-2.5 bottom-2 right-3">
        <div className="font-m text-[8.5px] font-bold tracking-[0.1em] uppercase" style={{ color: h.hookCol }}>{h.hook}</div>
        <div className="font-h font-extrabold text-[14px] leading-[1.05] text-white line-clamp-2 mt-0.5">{h.title}</div>
        <div className="font-m text-[8px] text-white/50 mt-1 truncate">{h.who}</div>
      </div>
    </div>
  );
}

export default function HighlightReel({ items }: { items: Highlight[] }) {
  if (!items.length) return null;
  return (
    <section className="mt-8">
      <style>{`.kz-rail::-webkit-scrollbar{display:none}`}</style>
      <div className="mb-3 font-m text-[10px] font-bold tracking-[0.2em] uppercase text-vibe-2">from your people</div>
      <div className="kz-rail flex gap-3 overflow-x-auto -mx-5 px-5 pb-1 [scrollbar-width:none]">
        {items.map((h) => <Tile key={h.id} h={h} />)}
      </div>
    </section>
  );
}
