"use client";

// THROWAWAY comparison of 3 highlight-reel motions. Delete after the pick.
import { useEffect, useRef, useState } from "react";
import { TYPE, type DropType } from "@/lib/item-render";

type HL = { kind: "landed" | "fresh" | "best"; type: DropType; title: string; line: string };

const ITEMS: HL[] = [
  { kind: "landed", type: "watch", title: "Past Lives", line: "maya loved the one you sent" },
  { kind: "fresh", type: "listen", title: "Blonde", line: "sam · just dropped" },
  { kind: "best", type: "go_out", title: "Tartine Bakery", line: "♥ 4 of you are into it" },
  { kind: "fresh", type: "watch", title: "The Bear", line: "arjun · just dropped" },
  { kind: "landed", type: "listen", title: "channel ORANGE", line: "it landed with the group" },
];

function badge(h: HL) {
  if (h.kind === "landed") return { txt: "✦ it landed", col: "#A98BFF" };
  if (h.kind === "fresh") return { txt: "just dropped", col: "#A98BFF" };
  return { txt: "♥ loved by the group", col: "#5DCAA5" };
}

// one cinematic highlight tile (cover art would fill it in prod)
function Tile({ h, w }: { h: HL; w: string }) {
  const t = TYPE[h.type];
  const b = badge(h);
  return (
    <div className={`relative ${w} h-[168px] rounded-2xl overflow-hidden border-[2.5px] border-frame flex-none`} style={{ background: t.color }}>
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4">
        <div className="font-m text-[10px] font-bold tracking-wide mb-1" style={{ color: b.col }}>{b.txt}</div>
        <div className="font-h font-extrabold text-[21px] leading-tight text-white">{h.title}</div>
        <div className="font-m text-[11px] text-white/75 mt-0.5">{h.line}</div>
      </div>
    </div>
  );
}

// 1 — full-width hero that auto-advances on a timer; swipeable; dots
function Hero() {
  const [i, setI] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % ITEMS.length), 3200);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const el = ref.current;
    const child = el?.children[i] as HTMLElement | undefined;
    if (el && child) el.scrollTo({ left: child.offsetLeft, behavior: "smooth" });
  }, [i]);
  return (
    <div>
      <div ref={ref} className="flex gap-3 overflow-x-auto snap-x snap-mandatory" style={{ scrollbarWidth: "none" }}>
        {ITEMS.map((h, k) => <div key={k} className="snap-start flex-none w-full"><Tile h={h} w="w-full" /></div>)}
      </div>
      <div className="flex justify-center gap-1.5 mt-2.5">
        {ITEMS.map((_, k) => <span key={k} className={`h-1.5 rounded-full transition-all ${k === i ? "w-5 bg-vibe" : "w-1.5 bg-[#2a2520]"}`} />)}
      </div>
    </div>
  );
}

export default function ZHighlight() {
  return (
    <main className="max-w-[600px] mx-auto px-5 py-10 min-h-screen">
      <style>{`
        @keyframes kz-marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        .kz-fast { animation: kz-marquee 26s linear infinite; }
        .kz-slow { animation: kz-marquee 48s linear infinite; }
        .kz-slow:hover { animation-play-state: paused; }
      `}</style>

      <div className="font-m text-[11px] tracking-widest uppercase text-muted mb-1">option 1 · auto-advancing hero</div>
      <Hero />

      <div className="font-m text-[11px] tracking-widest uppercase text-muted mb-2 mt-12">option 2 · continuous marquee</div>
      <div className="overflow-hidden -mx-5 px-5">
        <div className="flex gap-3 w-max kz-fast">
          {[...ITEMS, ...ITEMS].map((h, k) => <Tile key={k} h={h} w="w-[280px]" />)}
        </div>
      </div>

      <div className="font-m text-[11px] tracking-widest uppercase text-muted mb-2 mt-12">option 3 · gentle auto-scroll (pauses on hover)</div>
      <div className="overflow-hidden -mx-5 px-5">
        <div className="flex gap-3 w-max kz-slow">
          {[...ITEMS, ...ITEMS].map((h, k) => <Tile key={k} h={h} w="w-[280px]" />)}
        </div>
      </div>

      <div className="h-24" />
    </main>
  );
}
