"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Tab = "watch" | "listen" | "go_out";
const TABS: { key: Tab; label: string; color: string }[] = [
  { key: "watch", label: "🎬 movies", color: "#2F6FE0" },
  { key: "listen", label: "🎵 music", color: "#E0567E" },
  { key: "go_out", label: "📍 outside", color: "#1B8A6B" },
];
const SUBTYPES = ["cafe", "food", "bar", "brewery", "pub"];
const RATINGS: Record<string, string[]> = {
  number: ["6", "7", "8", "9", "10"],
  stars: ["★", "★★", "★★★", "★★★★", "★★★★★"],
  word: ["a vibe", "elite", "obsessed", "mid", "fine"],
};

type Picked = { data: Record<string, any>; title: string; sub: string; img: string | null };

export default function DropComposer({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("watch");
  const [q, setQ] = useState("");
  const [subtype, setSubtype] = useState("cafe");
  const [picked, setPicked] = useState<Picked | null>(null);
  const [results, setResults] = useState<Picked[] | null>(null);
  const [ratingStyle, setRatingStyle] = useState<keyof typeof RATINGS>("stars");
  const [ratingValue, setRatingValue] = useState("");
  const [musicNote, setMusicNote] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function reset() { setQ(""); setPicked(null); setResults(null); setMsg(""); }

  // auto-resolve as soon as a URL is pasted/typed (no "look up" click needed)
  function onInput(v: string) {
    setQ(v); setPicked(null); setResults(null);
    if (timer.current) clearTimeout(timer.current);
    if (/^https?:\/\//i.test(v.trim())) {
      timer.current = setTimeout(() => lookUp(v.trim()), 350);
    }
  }

  async function lookUp(override?: string) {
    const v = (override ?? q).trim();
    if (!v || busy) return;
    setBusy(true); setMsg(""); setResults(null);
    try {
      if (/^https?:\/\//i.test(v)) {
        const r = await (await fetch("/api/resolve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: v }) })).json();
        if (r.type === "listen" && r.resolved) {
          setTab("listen");
          setPicked({ data: r.data, title: r.data.title ?? v, sub: r.data.artist ?? "", img: r.data.artwork_url ?? null });
        } else if (r.type === "watch" && r.resolved) {
          setTab("watch");
          setPicked({ data: r.data, title: r.data.title, sub: [r.data.year, r.data.media_type].filter(Boolean).join(" · "), img: r.data.poster_url });
        } else if (r.type === "watch" && r.query) {
          // streaming/unknown film link → search the guessed title, show the picker
          setTab("watch");
          const s = await (await fetch(`/api/search?type=watch&q=${encodeURIComponent(r.query)}`)).json();
          const list = (s.results ?? []) as Picked[];
          if (list.length) { setResults(list); setMsg("pick the film:"); }
          else setMsg("couldn't read that link — type the movie's name");
        } else {
          setMsg(r.reason || "couldn't resolve — type the title instead");
        }
      } else {
        // typed a title → search (movies=TMDB, music=iTunes) and show a pick-list
        const r = await (await fetch(`/api/search?type=${tab}&q=${encodeURIComponent(v)}`)).json();
        const list = (r.results ?? []) as Picked[];
        if (list.length) {
          setResults(list);
        } else {
          // nothing found → keep it manual so the drop still works
          setPicked(tab === "watch"
            ? { data: { title: v, poster_url: null, year: null, media_type: "movie" }, title: v, sub: "FILM", img: null }
            : { data: { title: v, artist: null }, title: v, sub: "", img: null });
        }
      }
    } catch { setMsg("something went wrong — try again"); }
    setBusy(false);
  }

  async function drop() {
    if (busy) return;
    let type: Tab = tab;
    let data: Record<string, any> = {};

    if (tab === "go_out") {
      const name = q.trim();
      if (!name) { setMsg("name the place first"); return; }
      data = { place_name: name, subtype, music_note: musicNote.trim() || null, photo_url: null };
    } else if (picked) {
      data = picked.data;
    } else if (q.trim()) {
      // typed but didn't look up — manual
      data = tab === "watch"
        ? { title: q.trim(), poster_url: null, year: null, media_type: "movie" }
        : { title: q.trim(), artist: null };
    } else { setMsg("paste a link or type a title"); return; }

    setBusy(true); setMsg("");
    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        group_id: groupId, type, data,
        rating_value: ratingValue || null,
        rating_style: ratingValue ? ratingStyle : null,
        note: note.trim() || null,
      }),
    });
    const j = await res.json();
    if (!res.ok) { setMsg(j.error || "couldn't drop"); setBusy(false); return; }
    router.push("/feed");
    router.refresh();
  }

  const accent = TABS.find((t) => t.key === tab)!.color;

  return (
    <div className="w-full max-w-[460px] bg-paper border-[3px] border-ink rounded-[24px] shadow-[8px_8px_0_#14110F] p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-h text-2xl font-extrabold tracking-[-0.03em]">drop something</h2>
        <button onClick={() => router.push("/feed")} className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-lg">×</button>
      </div>

      <div className="flex gap-1 bg-[#ECE4D2] rounded-xl p-1 mb-4">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => { setTab(t.key); reset(); }}
            className={`flex-1 font-b font-semibold text-[13px] py-2.5 rounded-lg ${tab === t.key ? "bg-surface text-ink shadow-sm" : "text-muted"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "go_out" ? (
        <div className="flex flex-col gap-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="place name — e.g. Cafe Mogador"
            className="w-full bg-surface border-[2.5px] border-ink rounded-xl px-3.5 py-3 text-[15px] outline-none focus:shadow-[3px_3px_0_#6B4BD6]" />
          <div className="flex gap-2 flex-wrap">
            {SUBTYPES.map((s) => (
              <button key={s} onClick={() => setSubtype(s)}
                className={`font-b font-semibold text-[12px] border-[2px] border-ink rounded-full px-3 py-1.5 ${subtype === s ? "bg-ink text-paper" : "bg-surface"}`}>{s}</button>
            ))}
          </div>
          {["bar", "brewery", "pub"].includes(subtype) && (
            <input value={musicNote} onChange={(e) => setMusicNote(e.target.value)} placeholder="music vibe (optional) — e.g. italo + funk"
              className="w-full bg-surface border-[2.5px] border-ink rounded-xl px-3.5 py-3 text-[14px] outline-none focus:shadow-[3px_3px_0_#6B4BD6]" />
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <input value={q} onChange={(e) => onInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && lookUp()}
              placeholder={tab === "listen" ? "paste a spotify / apple / youtube link" : "paste a link, or type a title"}
              className="flex-1 bg-surface border-[2.5px] border-ink rounded-xl px-3.5 py-3 text-[15px] outline-none focus:shadow-[3px_3px_0_#6B4BD6]" />
            <button onClick={() => lookUp()} disabled={busy} className="font-h font-bold text-[13px] bg-ink text-paper border-[2.5px] border-ink rounded-xl px-4 disabled:opacity-60">{busy ? "…" : "look up"}</button>
          </div>
          {picked && (
            <div className="flex gap-3 items-center bg-surface border-[2.5px] border-ink rounded-xl p-2.5">
              <div className="w-14 h-14 rounded-lg border-[2px] border-ink overflow-hidden shrink-0" style={{ background: accent }}>
                {picked.img && <img src={picked.img} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="min-w-0">
                <div className="font-h font-extrabold text-[16px] truncate">{picked.title}</div>
                {picked.sub && <div className="font-m text-[10px] text-muted truncate">{picked.sub}</div>}
              </div>
            </div>
          )}
          {!picked && results && results.length > 0 && (
            <div className="flex flex-col gap-2 max-h-[240px] overflow-auto">
              {results.map((r, i) => (
                <button key={i} onClick={() => { setPicked(r); setResults(null); }}
                  className="flex gap-3 items-center text-left bg-surface border-[2.5px] border-ink rounded-xl p-2.5 hover:shadow-[3px_3px_0_#6B4BD6] transition-shadow">
                  <div className="w-12 h-12 rounded-lg border-[2px] border-ink overflow-hidden shrink-0" style={{ background: accent }}>
                    {r.img && <img src={r.img} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="min-w-0">
                    <div className="font-h font-bold text-[15px] truncate">{r.title}</div>
                    {r.sub && <div className="font-m text-[10px] text-muted truncate">{r.sub}</div>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-5">
        <div className="font-m text-[10px] font-bold tracking-widest uppercase text-muted mb-2">rate it your way (optional)</div>
        <div className="flex gap-1 bg-[#ECE4D2] rounded-xl p-1 mb-2.5">
          {(Object.keys(RATINGS) as (keyof typeof RATINGS)[]).map((s) => (
            <button key={s} onClick={() => { setRatingStyle(s); setRatingValue(""); }}
              className={`flex-1 font-b font-semibold text-[12px] py-2 rounded-lg ${ratingStyle === s ? "bg-surface text-ink shadow-sm" : "text-muted"}`}>
              {s === "number" ? "number" : s === "stars" ? "stars" : "a word"}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {RATINGS[ratingStyle].map((v) => (
            <button key={v} onClick={() => setRatingValue(ratingValue === v ? "" : v)}
              className={`font-m font-bold text-[13px] border-[2px] border-ink rounded-lg px-3 py-1.5 ${ratingValue === v ? "bg-vibe text-white" : "bg-surface"}`}>{v}</button>
          ))}
        </div>
      </div>

      <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="one-line take (optional)…"
        className="w-full mt-4 bg-surface border-[2.5px] border-ink rounded-xl px-3.5 py-3 text-[14px] outline-none focus:shadow-[3px_3px_0_#6B4BD6]" />

      <button onClick={drop} disabled={busy}
        className="w-full mt-5 font-h font-extrabold text-[15px] text-white border-[2.5px] border-ink rounded-xl py-3.5 shadow-[4px_4px_0_#14110F] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-transform disabled:opacity-60"
        style={{ background: accent }}>
        {busy ? "dropping…" : "drop it to the group"}
      </button>
      {msg && <p className="font-m text-[12px] text-red text-center mt-3">{msg}</p>}
    </div>
  );
}
