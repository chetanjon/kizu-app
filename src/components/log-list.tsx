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

function fmt(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export default function LogList({ rows }: { rows: LogRow[] }) {
  const [filter, setFilter] = useState<"all" | DropType>("all");
  const shown = rows.filter((r) => filter === "all" || r.type === filter);

  return (
    <div className="mt-6">
      <div className="flex gap-2 mb-5">
        {CHIPS.map((c) => (
          <button key={c.k} onClick={() => setFilter(c.k)}
            className={`font-m text-[11px] font-bold border-2 border-frame rounded-full px-3 py-1.5 transition-colors ${filter === c.k ? "bg-vibe text-white" : "bg-surface text-ink"}`}>
            {c.l}
          </button>
        ))}
      </div>

      <div className="flex flex-col">
        {shown.map((r) => {
          const t = TYPE[r.type];
          const cover = img(r);
          return (
            <div key={r.id} className="flex gap-4 items-center py-3.5 border-t border-hair first:border-t-0">
              <div className={`w-[48px] h-[68px] flex-none rounded-lg border-2 border-frame overflow-hidden bg-surface-2 ${SHADOW_SM[r.type]}`} style={{ background: cover ? undefined : t.color }}>
                {cover && <img src={cover} alt="" className="w-full h-full object-cover object-center" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-h font-bold text-[16px] truncate">{title(r)}</div>
                <div className="text-[12px] text-muted truncate mt-0.5">
                  <span className="font-semibold" style={{ color: t.color }}>{typeWord(r)}</span>{detail(r) && <> · {detail(r)}</>}
                </div>
                <div className="font-m text-[10px] text-muted mt-1 flex items-center gap-2">
                  {r.rating && <span className="text-vibe-2">{ratingMark(r.rating)}</span>}
                  <span>{fmt(r.date)}</span>
                  {r.shared && <span className="text-go">· shared</span>}
                </div>
              </div>
            </div>
          );
        })}
        {shown.length === 0 && <div className="text-center text-muted font-m text-xs py-10">nothing here in this filter.</div>}
      </div>
    </div>
  );
}
