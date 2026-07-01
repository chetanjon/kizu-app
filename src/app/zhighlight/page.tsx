"use client";

// THROWAWAY — WIDE cinematic reel. Landscape 16:9 so it reads NOTHING like the
// portrait drop cards. Motion 3 (slow drift, pause on hover). Real backdrop/album
// art fills the frame in prod; a rich duotone stands in here.
import { type DropType } from "@/lib/item-render";

type HL = {
  type: DropType;
  hook: string;     // the editorial reason — kizu voice
  hookCol: string;
  title: string;
  take: string;     // a real take / story / consensus
  who: string;
};

const GLOW: Record<DropType, string> = { watch: "#5B8DEF", listen: "#FF6F9C", go_out: "#5DCAA5" };

// rich abstract "art" stand-in per type — looks designed, not like a flat block
const ART: Record<DropType, string> = {
  listen: "radial-gradient(90% 130% at 78% 30%, #FFB3CC 0%, transparent 55%), linear-gradient(115deg, #220B18 0%, #7A2E5B 48%, #FF6F9C 100%)",
  watch: "radial-gradient(90% 130% at 78% 30%, #B7CCFF 0%, transparent 55%), linear-gradient(115deg, #0C1426 0%, #2E3C7A 48%, #5B8DEF 100%)",
  go_out: "radial-gradient(90% 130% at 78% 30%, #ABF2D6 0%, transparent 55%), linear-gradient(115deg, #06201A 0%, #1E6B52 48%, #5DCAA5 100%)",
};

const TYPEWORD: Record<DropType, string> = { watch: "movie", listen: "music", go_out: "outside" };

const ITEMS: HL[] = [
  { type: "watch", hook: "✦ it landed", hookCol: "#C9B6FF", title: "Past Lives", take: "maya watched the one you sent — and couldn't stop thinking about it.", who: "your rec" },
  { type: "listen", hook: "on repeat all week", hookCol: "#FFC7DA", title: "Blonde", take: "“the only album i finished all month.”", who: "sam" },
  { type: "go_out", hook: "the group agrees", hookCol: "#C4F5E1", title: "Tartine Bakery", take: "sam, maya & arjun are all in. that never happens.", who: "3 of your people" },
  { type: "watch", hook: "arjun swears by it", hookCol: "#C9DBFF", title: "The Bear", take: "“rewatched s1. still perfect. don't @ me.”", who: "arjun" },
  { type: "listen", hook: "✦ it landed", hookCol: "#C9B6FF", title: "channel ORANGE", take: "sam ran with the pick you left them.", who: "your rec" },
];

function Tile({ h }: { h: HL }) {
  return (
    <div
      className="kz-card relative w-[316px] aspect-[16/9] rounded-[18px] overflow-hidden flex-none"
      style={{ ["--glow" as string]: GLOW[h.type] }}
    >
      {/* art layer — bleeds full-frame, slow ken-burns drift */}
      <div className="kz-art absolute inset-0" style={{ background: ART[h.type] }} />
      {/* cinematic scrim pooled in the lower-left, art breathes upper-right */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top right, rgba(6,5,3,0.95) 6%, rgba(6,5,3,0.35) 46%, transparent 72%)" }} />
      <div className="kz-sheen absolute inset-0" />

      {/* glass type chip */}
      <div className="glass absolute top-3 left-3 rounded-full px-2.5 py-1 font-m text-[9px] font-bold tracking-wide text-white/90">
        {TYPEWORD[h.type]}
      </div>

      {/* lower-left caption, like a title card */}
      <div className="absolute left-4 right-4 bottom-3.5 max-w-[76%]">
        <div className="font-m text-[9.5px] font-bold tracking-[0.1em] uppercase mb-1.5" style={{ color: h.hookCol }}>{h.hook}</div>
        <div className="font-h font-extrabold text-[25px] leading-[0.98] text-white drop-shadow-md">{h.title}</div>
        <p className="font-b text-[11.5px] text-white/80 mt-1.5 leading-snug line-clamp-2">{h.take}</p>
        <div className="font-m text-[8.5px] text-white/45 mt-1.5">{h.who}</div>
      </div>
    </div>
  );
}

export default function ZHighlight() {
  return (
    <main className="max-w-[600px] mx-auto px-5 py-12 min-h-screen">
      <style>{`
        @keyframes kz-marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        .kz-track { animation: kz-marquee 55s linear infinite; }
        .kz-track:hover { animation-play-state: paused; }
        /* no frame — the frame emits a soft colored glow, like a lit screen */
        .kz-card {
          box-shadow: 0 16px 54px -16px color-mix(in srgb, var(--glow) 68%, transparent);
          animation: kz-breathe 5.5s ease-in-out infinite;
        }
        @keyframes kz-breathe {
          0%, 100% { box-shadow: 0 14px 44px -18px color-mix(in srgb, var(--glow) 50%, transparent); }
          50%      { box-shadow: 0 20px 70px -12px color-mix(in srgb, var(--glow) 85%, transparent); }
        }
        .kz-art { animation: kz-zoom 14s ease-in-out infinite alternate; transform-origin: 70% 35%; }
        @keyframes kz-zoom { from { transform: scale(1) } to { transform: scale(1.1) } }
        .kz-sheen {
          background: linear-gradient(115deg, transparent 34%, rgba(255,255,255,0.09) 48%, rgba(255,255,255,0.02) 54%, transparent 66%);
          background-size: 240% 100%;
          animation: kz-shine 8s linear infinite;
        }
        @keyframes kz-shine { from { background-position: 150% 0 } to { background-position: -150% 0 } }
        @media (prefers-reduced-motion: reduce) {
          .kz-track, .kz-card, .kz-sheen, .kz-art { animation: none !important; }
        }
      `}</style>

      {/* a named, earned section — aurora headline ties it to the vibe read */}
      <div className="mb-1 font-m text-[10px] font-bold tracking-[0.2em] uppercase text-vibe-2">✦ from your people</div>
      <h2
        className="font-h font-extrabold text-[28px] tracking-[-0.03em] leading-none mb-5"
        style={{ background: "linear-gradient(110deg,#A98BFF,#FF6F9C,#FF8A5B)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}
      >
        worth losing sleep over
      </h2>

      <div className="overflow-visible -mx-5 px-5">
        <div className="flex gap-5 w-max kz-track py-6">
          {[...ITEMS, ...ITEMS].map((h, k) => <Tile key={k} h={h} />)}
        </div>
      </div>

      <div className="h-32" />
    </main>
  );
}
