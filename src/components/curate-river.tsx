"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QueueButton from "@/components/queue-button";
import { TYPE, img, title, sub, type DropType } from "@/lib/item-render";

export type CDrop = {
  id: string;
  type: DropType;
  moment: string;
  their_words: string | null;
  data: Record<string, unknown>;
  curate_people: { name: string; photo_url: string | null; where_met: string | null } | null;
};

// The Curate river: the ONLY infinite scroll in kizu — but every item is a real
// person's pick, hand-curated, so it's never slop. Lives below Home's threshold.
export default function CurateRiver({
  initial,
  queuedIds,
  nextOffset,
  done,
}: {
  initial: CDrop[];
  queuedIds: string[];
  nextOffset: number;
  done: boolean;
}) {
  const [drops, setDrops] = useState<CDrop[]>(initial);
  const [offset, setOffset] = useState(nextOffset);
  const [finished, setFinished] = useState(done);
  const [loading, setLoading] = useState(false);
  const queued = new Set(queuedIds);
  const sentinel = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || finished) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/curate/feed?offset=${offset}`);
      if (res.ok) {
        const j = await res.json();
        setDrops((d) => [...d, ...(j.drops ?? [])]);
        setOffset(j.nextOffset);
        if (j.done) setFinished(true);
      }
    } finally {
      setLoading(false);
    }
  }, [loading, finished, offset]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) loadMore(); }, { rootMargin: "400px" });
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);

  if (drops.length === 0) return null;

  return (
    <div className="mt-8 max-w-[560px] mx-auto">
      <div className="flex flex-col gap-5">
        {drops.map((d) => {
          const p = d.curate_people;
          const cover = img(d);
          const t = TYPE[d.type];
          const initials = (p?.name ?? "?").slice(0, 1).toUpperCase();
          return (
            <article key={d.id} className="bg-surface border-[2.5px] border-ink rounded-2xl overflow-hidden shadow-[5px_6px_0_#14110F]">
              <div className="flex items-center gap-3 p-3.5">
                <div className="w-12 h-12 flex-none rounded-full border-[2.5px] border-ink overflow-hidden flex items-center justify-center font-h font-extrabold text-white" style={{ background: t.color }}>
                  {p?.photo_url ? <img src={p.photo_url} alt="" className="w-full h-full object-cover" /> : initials}
                </div>
                <div className="min-w-0">
                  <div className="font-h font-extrabold text-[15px] leading-none">{p?.name ?? "someone"}</div>
                  {p?.where_met && <div className="font-m text-[9px] text-muted mt-1">{p.where_met}</div>}
                </div>
                <div className="ml-auto font-m text-[9px] font-bold text-vibe text-right leading-tight max-w-[100px]">for:<br />{d.moment}</div>
              </div>

              {d.their_words && <p className="px-4 pb-3 text-[15px] italic leading-snug">&ldquo;{d.their_words}&rdquo;</p>}

              <div className="mx-3.5 mb-3 flex items-center gap-3 bg-surface-2 border-[2px] border-ink rounded-xl p-2.5">
                <div className="w-11 h-14 flex-none border-[2px] border-ink rounded-md overflow-hidden" style={{ background: cover ? undefined : t.color }}>
                  {cover && <img src={cover} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="min-w-0">
                  <span className="inline-block font-m text-[8px] font-bold border-[1.5px] border-ink rounded px-1.5 py-0.5 text-white" style={{ background: t.color }}>{t.label}</span>
                  <div className="font-h font-extrabold text-sm leading-tight truncate">{title(d)}</div>
                  {sub(d) && <div className="font-m text-[9px] text-muted truncate">{sub(d)}</div>}
                </div>
                <div className="ml-auto flex-none"><QueueButton curateDropId={d.id} initialQueued={queued.has(d.id)} /></div>
              </div>

              <div className="px-4 pb-3 font-m text-[8px] tracking-wide uppercase text-muted">✦ kizu curate · real person · with consent</div>
            </article>
          );
        })}
      </div>

      <div ref={sentinel} />
      <div className="text-center font-m text-[10px] text-muted mt-6 opacity-70">
        {finished ? "that's the river, for now." : loading ? "loading…" : "↓ keeps going · curated, never random"}
      </div>
    </div>
  );
}
