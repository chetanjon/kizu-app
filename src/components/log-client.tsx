"use client";

import { useState } from "react";
import type { DropType } from "@/lib/item-render";
import type { Cand } from "@/components/tonight-dealer";
import LogDeck from "@/components/log-deck";
import LogList, { type LogRow } from "@/components/log-list";

type Lens = "all" | DropType;
const LENSES: { k: Lens; l: string }[] = [
  { k: "all", l: "mixed" }, { k: "watch", l: "movies" },
  { k: "listen", l: "music" }, { k: "go_out", l: "outside" },
];

export default function LogClient({ deckPool, musicApp, rows }: { deckPool: Cand[]; musicApp: string | null; rows: LogRow[] }) {
  const [lens, setLens] = useState<Lens>("all");
  return (
    <>
      <div className="flex items-center justify-between mt-7">
        <div className="font-m text-[11px] tracking-widest uppercase text-muted">what still deserves a call</div>
        <div className="relative">
          <select value={lens} onChange={(e) => setLens(e.target.value as Lens)}
            className="appearance-none font-h font-bold text-[13px] bg-surface border-[1.5px] border-frame rounded-full pl-4 pr-8 py-2 text-ink cursor-pointer">
            {LENSES.map((o) => <option key={o.k} value={o.k}>{o.l}</option>)}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted text-[10px]">▾</span>
        </div>
      </div>

      {/* key={lens} remounts the deck so idx resets when the lens changes */}
      <LogDeck key={lens} pool={deckPool} musicApp={musicApp} lens={lens} />

      <div className="mt-8">
        <LogList rows={rows} filter={lens} />
      </div>
    </>
  );
}
