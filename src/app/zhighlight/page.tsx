"use client";

// THROWAWAY — motion 3 with RICHER, editorial content (not "who dropped what").
import { TYPE, type DropType } from "@/lib/item-render";

type HL = {
  type: DropType;
  reason: string;   // the editorial hook — WHY it's a highlight (kizu voice)
  col: string;      // hook color
  title: string;
  body: string;     // the substance: a take, a story, or social proof
};

const ITEMS: HL[] = [
  { type: "listen", reason: "what sam can't stop playing", col: "#A98BFF", title: "Blonde", body: "“the only album i finished all month.”" },
  { type: "watch", reason: "✦ it landed", col: "#A98BFF", title: "Past Lives", body: "maya watched the one you sent — and loved it." },
  { type: "go_out", reason: "the group agrees", col: "#5DCAA5", title: "Tartine Bakery", body: "♥ sam · maya · arjun are into it" },
  { type: "watch", reason: "arjun swears by it", col: "#A98BFF", title: "The Bear", body: "“rewatched s1. still perfect.”" },
  { type: "listen", reason: "✦ it landed", col: "#A98BFF", title: "channel ORANGE", body: "sam ran with your pick" },
];

function Tile({ h }: { h: HL }) {
  const t = TYPE[h.type];
  return (
    <div className="relative w-[290px] h-[190px] rounded-2xl overflow-hidden border-[2.5px] border-frame flex-none" style={{ background: t.color }}>
      <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/45 to-black/10" />
      <div className="absolute inset-x-0 bottom-0 p-4">
        <div className="font-m text-[10px] font-bold tracking-wide mb-1.5" style={{ color: h.col }}>{h.reason}</div>
        <div className="font-h font-extrabold text-[22px] leading-[1.05] text-white">{h.title}</div>
        <p className="font-b text-[13px] text-white/85 mt-1.5 leading-snug line-clamp-2">{h.body}</p>
      </div>
    </div>
  );
}

export default function ZHighlight() {
  return (
    <main className="max-w-[600px] mx-auto px-5 py-10 min-h-screen">
      <style>{`
        @keyframes kz-marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        .kz-slow { animation: kz-marquee 46s linear infinite; }
        .kz-slow:hover { animation-play-state: paused; }
      `}</style>

      {/* a small section header — gives the reel a name, not a generic strip */}
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-h font-extrabold text-[17px] tracking-[-0.02em]">worth your while</h2>
        <span className="font-m text-[10px] text-muted">from your people</span>
      </div>

      <div className="overflow-hidden -mx-5 px-5">
        <div className="flex gap-3 w-max kz-slow">
          {[...ITEMS, ...ITEMS].map((h, k) => <Tile key={k} h={h} />)}
        </div>
      </div>

      <div className="h-24" />
    </main>
  );
}
