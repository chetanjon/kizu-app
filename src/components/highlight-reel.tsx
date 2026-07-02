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
      {/* ambient backdrop — the cover blurred + darkened so the sharp art pops off it */}
      {h.cover ? (
        <div
          className="kz-hl-art absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${h.cover})`, filter: "blur(16px) brightness(0.4) saturate(1.2)" }}
        />
      ) : (
        <div className="kz-hl-art absolute inset-0" style={{ background: ART[h.type] }} />
      )}
      {/* scrim pooled lower-left so text reads; the art side stays lit */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top right, rgba(6,5,3,0.92) 6%, rgba(6,5,3,0.28) 46%, transparent 78%)" }} />
      <div className="kz-hl-sheen absolute inset-0" />

      {/* the ACTUAL cover, sharp — the hero, floating on the right like a featured record.
          NOT lazy: inside the transformed marquee, lazy images never enter the viewport
          and would never load, leaving only the blurred backdrop. */}
      {h.cover && (
        <img
          src={h.cover} alt="" decoding="async"
          className="absolute right-3 top-1/2 -translate-y-1/2 h-[86%] w-auto max-w-[50%] object-contain rounded-[11px] ring-1 ring-white/15 shadow-[0_12px_34px_rgba(0,0,0,0.65)]"
        />
      )}

      <div className="glass absolute top-3 left-3 rounded-full px-2.5 py-1 font-m text-[9px] font-bold tracking-wide text-white/90">
        {TYPEWORD[h.type]}
      </div>

      <div className={`absolute left-4 bottom-3.5 ${h.cover ? "right-[51%]" : "right-4 max-w-[80%]"}`}>
        <div className="font-m text-[9.5px] font-bold tracking-[0.1em] uppercase mb-1.5" style={{ color: h.hookCol }}>{h.hook}</div>
        <div className="font-h font-extrabold text-[20px] leading-[1.0] text-white drop-shadow-md line-clamp-2">{h.title}</div>
        <p className="font-b text-[11px] text-white/80 mt-1.5 leading-snug line-clamp-2">{h.take}</p>
        <div className="font-m text-[8.5px] text-white/45 mt-1.5 truncate">{h.who}</div>
      </div>
    </div>
  );
}

export default function HighlightReel({ items }: { items: Highlight[] }) {
  if (!items.length) return null;
  // HARD-CAP the tile count. Each tile is a blurred, composited GPU layer with
  // an EAGER cover image, so an uncapped stack (was up to 16) blew the iOS
  // web-content memory budget on /home and crashed the tab ("a problem
  // repeatedly occurred"), esp. under low battery. 4 unique tiles is plenty for
  // an ambient "best of" band; duplicated once → a deterministic 8 tiles, which
  // the marquee's translateX(-50%) loops seamlessly.
  const src = items.slice(0, 4);
  const base: Highlight[] = Array.from({ length: 4 }, (_, i) => src[i % src.length]);
  const loop = [...base, ...base];

  return (
    <section className="mb-8 -mt-1">
      <style>{`
        @keyframes kz-hl-marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        .kz-hl-track { animation: kz-hl-marquee 55s linear infinite; }
        .kz-hl-track:hover { animation-play-state: paused; }
        /* static glow (no infinite breathe): keeps large blurred shadow layers
           from staying hot in GPU memory / draining battery — see the OOM note. */
        .kz-hl-card { box-shadow: 0 14px 40px -18px color-mix(in srgb, var(--glow) 60%, transparent); }
        /* static overscan to hide the blur's edge bleed (was an infinite zoom). */
        .kz-hl-art { transform-origin: 72% 34%; transform: scale(1.12); }
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

      <div className="mb-3 font-m text-[10px] font-bold tracking-[0.2em] uppercase text-vibe-2">from your people</div>

      {/* clip the x-axis: the w-max marquee track must not expand the document's
          scroll width (that let the whole page pan sideways). y stays visible so
          the cards' glow/breathe shadows aren't cut. */}
      <div className="overflow-x-clip -mx-5 px-5">
        <div className="flex gap-5 w-max kz-hl-track py-5">
          {loop.map((h, k) => <Tile key={`${h.id}-${k}`} h={h} />)}
        </div>
      </div>
    </section>
  );
}
