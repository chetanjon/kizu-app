"use client";

import { useState } from "react";
import { TYPE, SHADOW_SM, img, title, typeWord, detail, ratingMark, type DropType } from "@/lib/item-render";

export type LogRow = {
  id: string;
  type: DropType;
  data: Record<string, unknown>;
  rating: string | null;
  note: string | null;
  shared: boolean;
  date: string;
};

const CHIPS: { k: "all" | DropType; l: string }[] = [
  { k: "all", l: "all" },
  { k: "watch", l: "movies" },
  { k: "listen", l: "music" },
  { k: "go_out", l: "outside" },
];

function fmtDay(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" }).toLowerCase();
  } catch {
    return "";
  }
}

// "june 2026" — the month bucket a log entry falls in.
function monthKey(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "long", year: "numeric" }).toLowerCase();
  } catch {
    return "earlier";
  }
}

export default function LogList({ rows }: { rows: LogRow[] }) {
  const [filter, setFilter] = useState<"all" | DropType>("all");
  const shown = rows.filter((r) => filter === "all" || r.type === filter);

  // group the filtered rows into month buckets, preserving newest-first order.
  const months: { key: string; rows: LogRow[] }[] = [];
  for (const r of shown) {
    const k = monthKey(r.date);
    const last = months[months.length - 1];
    if (last && last.key === k) last.rows.push(r);
    else months.push({ key: k, rows: [r] });
  }

  return (
    <div className="mt-5">
      {/* the shelf grows — a quiet count of what you've kept */}
      <div className="font-m text-[11px] text-muted mb-5">
        <span className="text-ink-2 font-bold">{rows.length}</span> {rows.length === 1 ? "thing" : "things"} logged · only you see these
      </div>

      <div className="flex gap-2 mb-6">
        {CHIPS.map((c) => (
          <button key={c.k} onClick={() => setFilter(c.k)}
            className={`font-m text-[11px] font-bold border-2 border-frame rounded-full px-3 py-1.5 transition-colors ${filter === c.k ? "bg-vibe text-white" : "bg-surface text-ink"}`}>
            {c.l}
          </button>
        ))}
      </div>

      {months.map((m) => (
        <section key={m.key} className="mb-8">
          {/* month header — the spine of the shelf */}
          <div className="flex items-baseline justify-between border-b border-hair pb-2 mb-3">
            <h2 className="font-h font-extrabold text-[14px] tracking-[-0.01em] lowercase">{m.key}</h2>
            <span className="font-m text-[10px] text-muted">{m.rows.length} {m.rows.length === 1 ? "entry" : "entries"}</span>
          </div>
          <div className="flex flex-col">
            {m.rows.map((r) => {
              const t = TYPE[r.type];
              const cover = img(r);
              return (
                <div key={r.id} className="flex gap-4 py-4 border-t border-hair first:border-t-0">
                  <div className={`w-[56px] h-[84px] flex-none rounded-lg border-2 border-frame overflow-hidden bg-surface-2 ${SHADOW_SM[r.type]}`} style={{ background: cover ? undefined : t.color }}>
                    {cover && <img src={cover} alt="" className="w-full h-full object-cover object-center" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <h3 className="font-h font-bold text-[16px] truncate">{title(r)}</h3>
                      <span className="font-m text-[10px] text-muted flex-none ml-auto">{fmtDay(r.date)}</span>
                    </div>
                    <div className="text-[12px] text-muted truncate mt-0.5">
                      <span className="font-semibold" style={{ color: t.color }}>{typeWord(r)}</span>{detail(r) && <> · {detail(r)}</>}
                    </div>
                    {/* your own take — this is what makes it a log, not a list */}
                    {r.note && <p className="text-[13px] text-ink-2 mt-1.5 leading-snug line-clamp-2">&ldquo;{r.note}&rdquo;</p>}
                    {(r.rating || r.shared) && (
                      <div className="font-m text-[10px] mt-1.5 flex items-center gap-2.5">
                        {r.rating && <span className="text-vibe-2">{ratingMark(r.rating)}</span>}
                        {r.shared && <span className="text-go">shared with the crew</span>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
      {shown.length === 0 && <div className="text-center text-muted font-m text-xs py-10">nothing here in this filter.</div>}
    </div>
  );
}
