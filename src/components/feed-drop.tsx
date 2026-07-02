"use client";

import { useEffect, useRef, useState } from "react";
import { TYPE, SHADOW_SM, ART_FALLBACK, type DropType } from "@/lib/item-render";
import Reactions, { type Rx } from "@/components/reactions";
import QueueButton from "@/components/queue-button";
import DeleteDrop from "@/components/delete-drop";

// The feed's drop card: a full-bleed poster that unfolds in place when tapped.
// The poster half carries the PERSON (their words, their rating); the drawer
// adds the catalog layer (facts · tagline · synopsis, or a 30s song preview),
// then the friends layer (reactions · who vouched), then actions at the thumb.
// Everything is precomputed server-side and passed as plain props — opening a
// card costs zero network.

export type FeedDropProps = {
  id: string;
  type: DropType;
  title: string;
  sub: string | null;       // year / artist / subtype — the typeset poster's microline
  cover: string | null;
  fresh: boolean;           // dropped in the last 24h → "just dropped" chip
  note: string | null;
  rating: string | null;
  who: string;              // first name (or "someone" / "you · anon")
  whoFull: string | null;
  when: string;             // "5h", "2d" — computed server-side
  mine: boolean;
  forYou: boolean;
  sentTo: string | null;
  proof: string | null;
  facts: string | null;
  tagline: string | null;
  synopsis: string | null;
  preview: string | null;   // 30s audio url (plain public file, no app needed)
  act: { label: string; url: string; kind: string } | null;
  saved: boolean;
  userId: string;
  rx: Rx[];
  canSeeWho: boolean;
};

// collapsed cards keep the act pill to one short word
const shortAct = (act: NonNullable<FeedDropProps["act"]>): string =>
  act.kind === "watch" ? "watch" : act.kind === "map" ? "maps" : act.kind === "have" ? act.label : "play";
const longAct = (act: NonNullable<FeedDropProps["act"]>): string =>
  act.kind === "watch" ? "where to watch" : act.kind === "map" ? "open in maps" : act.label;

// single long words scale down instead of breaking mid-word on the typeset poster
function typesetSize(title: string): number {
  const longest = Math.max(...title.split(" ").map((s) => s.length));
  return 40 * (longest > 9 ? Math.min(1, 9 / longest) : 1);
}

function Preview({ url }: { url: string }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [dur, setDur] = useState(30);

  useEffect(() => () => { audio.current?.pause(); }, []);

  function toggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (!audio.current) {
      const a = new Audio(url);
      a.addEventListener("timeupdate", () => setT(a.currentTime));
      a.addEventListener("durationchange", () => Number.isFinite(a.duration) && a.duration > 0 && setDur(a.duration));
      a.addEventListener("ended", () => { setPlaying(false); setT(0); });
      a.addEventListener("pause", () => setPlaying(false));
      a.addEventListener("play", () => setPlaying(true));
      audio.current = a;
    }
    if (audio.current.paused) void audio.current.play().catch(() => {});
    else audio.current.pause();
  }

  const mmss = (s: number) => `0:${String(Math.floor(s)).padStart(2, "0")}`;
  return (
    <div className="mt-3 flex items-center gap-3 bg-surface-2 border border-hair rounded-2xl px-3.5 py-3" onClick={(e) => e.stopPropagation()}>
      <button onClick={toggle} aria-label={playing ? "pause preview" : "play preview"}
        className="w-[42px] h-[42px] flex-none rounded-full bg-vibe text-white flex items-center justify-center text-[15px] shadow-[2.5px_2.5px_0_#0D0B09] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-transform">
        {playing ? "❚❚" : "▶"}
      </button>
      <div className="flex-1 min-w-0">
        <div className="h-[4px] rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full bg-vibe-2 transition-[width] duration-300" style={{ width: `${Math.min(100, (t / dur) * 100)}%` }} />
        </div>
        <div className="font-m text-[10px] text-muted mt-1.5">{mmss(t)} / {mmss(dur)} · preview</div>
      </div>
    </div>
  );
}

function SharePill({ itemId, title }: { itemId: string; title: string }) {
  const [state, setState] = useState<"idle" | "busy" | "copied">("idle");

  async function share(e: React.MouseEvent) {
    e.stopPropagation();
    if (state === "busy") return;
    setState("busy");
    try {
      const res = await fetch("/api/recs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: itemId }),
      });
      if (!res.ok) { setState("idle"); return; }
      const { url } = await res.json();
      const full = `${window.location.origin}${url}`;
      const touch = typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
      if (navigator.share && touch) {
        try { await navigator.share({ title: "kizu.", text: `${title} · someone left this for you.`, url: full }); } catch { /* sheet closed */ }
        setState("idle");
      } else {
        await navigator.clipboard.writeText(full);
        setState("copied");
        setTimeout(() => setState("idle"), 2000);
      }
    } catch {
      setState("idle");
    }
  }

  return (
    <button onClick={share}
      className="inline-flex items-center justify-center font-h font-bold text-[13px] rounded-full px-4 h-[42px] bg-surface-2 border-[1.5px] border-frame text-ink active:scale-95 transition-transform">
      {state === "copied" ? "link copied" : "↗ share"}
    </button>
  );
}

export default function FeedDrop(p: FeedDropProps) {
  const [open, setOpen] = useState(false);
  const t = TYPE[p.type];
  const noart = !p.cover;

  return (
    <article
      className={`relative w-full rounded-[16px] border-[2.5px] border-frame overflow-hidden cursor-pointer select-none bg-surface mt-5 first:mt-0 ${SHADOW_SM[p.type]}`}
      onClick={() => setOpen(!open)}
    >
      {/* ——— poster: the art + the person's voice ——— */}
      <div className="relative w-full aspect-[4/3]" style={{ background: noart ? ART_FALLBACK[p.type] : undefined }}>
        {p.cover && (
          <img src={p.cover} alt="" loading="lazy" decoding="async"
            className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: "center 22%" }} />
        )}
        {noart && (
          <div className={`absolute left-5 right-16 ${p.fresh ? "top-12" : "top-5"}`}>
            <div className="font-h font-extrabold text-[#15110D] tracking-[-0.02em]" style={{ fontSize: typesetSize(p.title), lineHeight: 0.98 }}>
              {p.title}
            </div>
            {p.sub && <div className="font-m text-[11px] tracking-[0.14em] uppercase text-[#15110D]/60 mt-2">{p.sub}</div>}
          </div>
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(8,6,3,0.92) 0%, rgba(8,6,3,0.35) 45%, transparent 72%)" }} />
        {p.fresh && (
          <div className="glass absolute top-3 left-3 rounded-full px-2.5 py-1 font-m text-[10px] font-bold tracking-[0.14em] text-white/95 uppercase">just dropped</div>
        )}
        <span aria-hidden
          className={`absolute top-3 right-3 z-10 w-[34px] h-[34px] rounded-full bg-black/45 backdrop-blur-sm flex items-center justify-center text-white/90 text-[15px] transition-transform ${open ? "rotate-180" : ""}`}>⌄</span>
        <div className="absolute left-4 right-4 bottom-4">
          <div className="font-m text-[10px] font-bold tracking-[0.12em] uppercase" style={{ color: t.color }}>{t.label}</div>
          {!noart && <h3 className="font-h font-extrabold text-[28px] tracking-[-0.03em] leading-[1.02] text-white mt-1">{p.title}</h3>}
          {p.forYou && (
            <div className="mt-1.5 inline-flex w-fit items-center rounded-full bg-vibe/30 border border-vibe/50 px-2.5 py-1 font-h font-bold text-[11px] text-white"
              title={`${p.whoFull ?? p.who} dropped this only for you`}>
              just for you · from {p.who}
            </div>
          )}
          {p.note && <p className="text-[14.5px] text-white/90 mt-1.5 leading-snug line-clamp-2">&ldquo;{p.note}&rdquo;</p>}
          <div className="mt-2.5 flex items-center gap-2 min-w-0">
            <span className="font-m text-[11px] text-white/70 truncate" title={p.whoFull ?? undefined}>
              {p.who} · {p.when}{p.rating ? ` · ${p.rating}` : ""}
            </span>
            {!open && p.act && (
              <a href={p.act.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
                className={`ml-auto flex-none font-h font-bold text-[13px] rounded-full px-3.5 py-2 ${p.act.kind === "have" ? "bg-go text-[#15110D]" : "bg-vibe text-white"}`}>
                {shortAct(p.act)}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ——— drawer: catalog → friends → actions ——— */}
      <div className={`transition-all duration-300 overflow-hidden ${open ? "max-h-[640px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="px-4 pt-3.5 pb-4">
          {p.facts && <div className="font-m text-[11px] text-muted tracking-[0.06em]">{p.facts}</div>}
          {p.tagline && (
            <div className="font-m text-[10.5px] tracking-[0.18em] uppercase mt-2" style={{ color: t.color }}>&ldquo;{p.tagline}&rdquo;</div>
          )}
          {p.synopsis && (
            <p className="text-[13px] text-ink-2 leading-relaxed mt-1.5"
              style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {p.synopsis}
            </p>
          )}
          {!p.facts && p.sub && p.type !== "watch" && (
            <div className="font-m text-[11px] text-muted tracking-[0.06em]">{p.sub.toLowerCase()}</div>
          )}
          {p.preview && <Preview url={p.preview} />}
          {p.sentTo && <div className="font-m text-[11px] text-vibe-2/80 mt-3">{p.sentTo}</div>}

          <div className="mt-3.5 flex items-center gap-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
            <Reactions itemId={p.id} initial={p.rx} userId={p.userId} canSeeWho={p.canSeeWho} compact />
            {p.proof && <span className="font-m text-[11px] text-go ml-1">♥ {p.proof}</span>}
          </div>

          <div className="mt-4 flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
            {p.act && (
              <a href={p.act.url} target="_blank" rel="noreferrer"
                className={`inline-flex items-center justify-center font-h font-bold text-[13px] rounded-full px-4 h-[42px] ${p.act.kind === "have" ? "bg-go text-[#15110D]" : "bg-vibe text-white"} shadow-[3px_3px_0_#0D0B09] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-transform`}>
                {longAct(p.act)}
              </a>
            )}
            {!p.mine && <QueueButton itemId={p.id} initialQueued={p.saved} variant="action" />}
            <SharePill itemId={p.id} title={p.title} />
            {p.mine && <span className="ml-auto"><DeleteDrop itemId={p.id} /></span>}
          </div>
        </div>
      </div>
    </article>
  );
}
