"use client";

// The home "highlight reel" — a WIDE, cinematic band that reads nothing like the
// portrait drop feed. A slow marquee of the group's best moments (it-landed,
// consensus, a real take), each a 16:9 frame with the cover art bled to an ambient
// wash, a lower-left title card, and the signature colored glow. Pauses on hover.
import { TYPE, type DropType } from "@/lib/item-render";

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

const GLOW: Record<DropType, string> = { watch: "#5B8DEF", listen: "#FF6F9C", go_out: "#5DCAA5" };
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
      className="kz-hl-card relative w-[316px] aspect-[16/9] rounded-[18px] overflow-hidden flex-none"
      style={{ ["--glow" as string]: GLOW[h.type] }}
    >
      {/* ambient art — the cover bled + blurred to fill the wide frame, slow ken-burns */}
      {h.cover ? (
        <div
          className="kz-hl-art absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${h.cover})`, filter: "blur(13px) brightness(0.82) saturate(1.15)" }}
        />
      ) : (
        <div className="kz-hl-art absolute inset-0" style={{ background: ART[h.type] }} />
      )}
      {/* cinematic scrim pooled lower-left; art breathes upper-right */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top right, rgba(6,5,3,0.95) 6%, rgba(6,5,3,0.35) 46%, transparent 74%)" }} />
      <div className="kz-hl-sheen absolute inset-0" />

      <div className="glass absolute top-3 left-3 rounded-full px-2.5 py-1 font-m text-[9px] font-bold tracking-wide text-white/90">
        {TYPEWORD[h.type]}
      </div>

      <div className="absolute left-4 right-4 bottom-3.5 max-w-[80%]">
        <div className="font-m text-[9.5px] font-bold tracking-[0.1em] uppercase mb-1.5" style={{ color: h.hookCol }}>{h.hook}</div>
        <div className="font-h font-extrabold text-[24px] leading-[0.98] text-white drop-shadow-md line-clamp-1">{h.title}</div>
        <p className="font-b text-[11.5px] text-white/80 mt-1.5 leading-snug line-clamp-2">{h.take}</p>
        <div className="font-m text-[8.5px] text-white/45 mt-1.5">{h.who}</div>
      </div>
    </div>
  );
}

export default function HighlightReel({ items }: { items: Highlight[] }) {
  if (!items.length) return null;
  // repeat until the base row can overflow the viewport, then double it so the
  // marquee's translateX(-50%) loops seamlessly regardless of how few highlights.
  const base: Highlight[] = [];
  while (base.length < 4) base.push(...items);
  const loop = [...base, ...base];

  return (
    <section className="mb-8 -mt-1">
      <style>{`
        @keyframes kz-hl-marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        .kz-hl-track { animation: kz-hl-marquee 55s linear infinite; }
        .kz-hl-track:hover { animation-play-state: paused; }
        .kz-hl-card {
          box-shadow: 0 16px 54px -16px color-mix(in srgb, var(--glow) 68%, transparent);
          animation: kz-hl-breathe 5.5s ease-in-out infinite;
        }
        @keyframes kz-hl-breathe {
          0%, 100% { box-shadow: 0 14px 44px -18px color-mix(in srgb, var(--glow) 50%, transparent); }
          50%      { box-shadow: 0 20px 70px -12px color-mix(in srgb, var(--glow) 85%, transparent); }
        }
        .kz-hl-art { animation: kz-hl-zoom 14s ease-in-out infinite alternate; transform-origin: 72% 34%; transform: scale(1.18); }
        @keyframes kz-hl-zoom { from { transform: scale(1.18) } to { transform: scale(1.32) } }
        .kz-hl-sheen {
          background: linear-gradient(115deg, transparent 34%, rgba(255,255,255,0.09) 48%, rgba(255,255,255,0.02) 54%, transparent 66%);
          background-size: 240% 100%;
          animation: kz-hl-shine 8s linear infinite;
        }
        @keyframes kz-hl-shine { from { background-position: 150% 0 } to { background-position: -150% 0 } }
        @media (prefers-reduced-motion: reduce) {
          .kz-hl-track, .kz-hl-card, .kz-hl-sheen, .kz-hl-art { animation: none !important; }
        }
      `}</style>

      <div className="mb-1 font-m text-[10px] font-bold tracking-[0.2em] uppercase text-vibe-2">✦ from your people</div>
      <h2
        className="font-h font-extrabold text-[26px] tracking-[-0.03em] leading-none mb-4"
        style={{ background: "linear-gradient(110deg,#A98BFF,#FF6F9C,#FF8A5B)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}
      >
        worth losing sleep over
      </h2>

      <div className="overflow-visible -mx-5 px-5">
        <div className="flex gap-5 w-max kz-hl-track py-5">
          {loop.map((h, k) => <Tile key={`${h.id}-${k}`} h={h} />)}
        </div>
      </div>
    </section>
  );
}
