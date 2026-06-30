"use client";

import { useEffect, useState } from "react";
import { TYPE, type DropType } from "@/lib/item-render";

type Drop = {
  id: string;
  type: DropType;
  moment: string;
  their_words: string | null;
  data: Record<string, unknown>;
  published: boolean;
  curate_people: { id: string; name: string; photo_url: string | null; where_met: string | null; consent: boolean } | null;
};

const TYPES: DropType[] = ["watch", "listen", "go_out"];

export default function CurateAdmin() {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // person
  const [name, setName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [whereMet, setWhereMet] = useState("");
  const [consent, setConsent] = useState(false);
  // pick
  const [type, setType] = useState<DropType>("watch");
  const [link, setLink] = useState("");
  const [data, setData] = useState<Record<string, unknown>>({});
  const [resolved, setResolved] = useState<string | null>(null);
  const [manualTitle, setManualTitle] = useState("");
  // meta
  const [moment, setMoment] = useState("");
  const [words, setWords] = useState("");
  const [publish, setPublish] = useState(true);

  async function load() {
    const res = await fetch("/api/curate");
    if (res.ok) setDrops((await res.json()).drops ?? []);
  }
  useEffect(() => { load(); }, []);

  async function uploadPhoto(file: File) {
    setUploading(true); setMsg(null);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/curate/upload", { method: "POST", body: fd });
    const j = await res.json();
    if (res.ok) setPhotoUrl(j.url); else setMsg(j.error || "upload failed");
    setUploading(false);
  }

  async function resolveLink() {
    if (!link.trim()) return;
    setMsg("resolving…");
    const res = await fetch("/api/resolve", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: link.trim() }),
    });
    const j = await res.json();
    if (j.resolved && j.data) {
      setData(j.data);
      if (j.type) setType(j.type);
      setResolved((j.data.title as string) || (j.data.place_name as string) || "resolved");
      setMsg(null);
    } else {
      setMsg(j.reason || "couldn't resolve — use manual title");
    }
  }

  function buildData(): Record<string, unknown> {
    if (Object.keys(data).length) return data;
    const t = manualTitle.trim();
    if (!t) return {};
    if (type === "go_out") return { place_name: t };
    return { title: t };
  }

  async function submit() {
    setBusy(true); setMsg(null);
    const d = buildData();
    if (!name.trim()) { setMsg("person name required"); setBusy(false); return; }
    if (!moment.trim()) { setMsg("moment required"); setBusy(false); return; }
    if (!Object.keys(d).length) { setMsg("paste a link or type a title"); setBusy(false); return; }
    const res = await fetch("/api/curate", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, photo_url: photoUrl || null, where_met: whereMet || null, consent,
        type, moment, their_words: words || null, data: d, published: publish,
      }),
    });
    if (res.ok) {
      setMsg("added ✓");
      setLink(""); setData({}); setResolved(null); setManualTitle(""); setMoment(""); setWords("");
      load();
    } else {
      setMsg((await res.json()).error || "failed");
    }
    setBusy(false);
  }

  async function toggleConsent(d: Drop) {
    if (!d.curate_people) return;
    await fetch("/api/curate", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ person_id: d.curate_people.id, consent: !d.curate_people.consent }),
    });
    load();
  }
  async function togglePublish(d: Drop) {
    await fetch("/api/curate", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: d.id, published: !d.published }),
    });
    load();
  }
  async function remove(id: string) {
    await fetch("/api/curate", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  const field = "w-full border-[2.5px] border-frame rounded-xl px-3 py-2 font-b text-sm bg-surface";
  const label = "font-m text-[10px] tracking-widest uppercase text-muted";

  return (
    <div className="max-w-[640px] mx-auto">
      <div className="font-m text-[11px] tracking-widest uppercase text-muted">founder only</div>
      <h1 className="font-h text-3xl font-extrabold tracking-[-0.04em] mt-1">kizu<span className="text-red">.</span> curate</h1>
      <p className="text-muted text-sm mt-1 font-b">real people, real consent. each pick is one human + one thing, tagged to a moment.</p>

      <div className="mt-6 bg-surface border-[2.5px] border-frame rounded-2xl p-5 shadow-[5px_5px_0_#0D0B09] flex flex-col gap-4">
        <div className="font-h font-extrabold text-sm">the person</div>
        <div className="grid grid-cols-2 gap-3">
          <div><div className={label}>name</div><input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Rui" /></div>
          <div><div className={label}>where you met</div><input className={field} value={whereMet} onChange={(e) => setWhereMet(e.target.value)} placeholder="a roastery in lisbon" /></div>
        </div>
        <div>
          <div className={label}>photo</div>
          <div className="flex items-center gap-3 mt-1">
            {photoUrl
              ? <img src={photoUrl} alt="" className="w-14 h-14 rounded-full border-[2.5px] border-frame object-cover" />
              : <div className="w-14 h-14 rounded-full border-[2.5px] border-dashed border-frame flex-none" />}
            <label className="font-h font-bold text-sm bg-ink text-paper border-[2.5px] border-frame rounded-xl px-4 py-2 cursor-pointer whitespace-nowrap">
              {uploading ? "uploading…" : photoUrl ? "change photo" : "upload / take photo"}
              <input type="file" accept="image/*" capture="environment" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); }} />
            </label>
            {photoUrl && <button type="button" onClick={() => setPhotoUrl("")} className="font-m text-xs text-red">remove</button>}
          </div>
          <input className={`${field} mt-2`} value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="…or paste an image url" />
        </div>
        <label className="flex items-center gap-2 text-sm font-b">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="w-4 h-4 accent-[#6B4BD6]" />
          they consented to appear in kizu (required to publish)
        </label>

        <div className="font-h font-extrabold text-sm mt-2">the pick</div>
        <div className="flex gap-2">
          {TYPES.map((t) => (
            <button key={t} onClick={() => setType(t)}
              className={`font-m text-[11px] font-bold border-[2px] border-frame rounded-full px-3 py-1.5 ${type === t ? "text-white" : "bg-surface"}`}
              style={type === t ? { background: TYPE[t].color } : {}}>{TYPE[t].label}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <input className={field} value={link} onChange={(e) => setLink(e.target.value)} placeholder="paste a link (tmdb / spotify / maps…)" />
          <button onClick={resolveLink} className="font-h font-bold text-sm bg-ink text-paper border-[2.5px] border-frame rounded-xl px-4 whitespace-nowrap">resolve</button>
        </div>
        {resolved ? (
          <div className="font-m text-xs text-go">✓ {resolved}</div>
        ) : (
          <div><div className={label}>…or type a title manually</div><input className={field} value={manualTitle} onChange={(e) => setManualTitle(e.target.value)} placeholder="In the Mood for Love" /></div>
        )}

        <div className="grid grid-cols-2 gap-3 mt-2">
          <div><div className={label}>moment</div><input className={field} value={moment} onChange={(e) => setMoment(e.target.value)} placeholder="sunday melancholy" /></div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm font-b">
              <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} className="w-4 h-4 accent-[#6B4BD6]" />
              publish now
            </label>
          </div>
        </div>
        <div><div className={label}>their words</div><textarea className={field} value={words} onChange={(e) => setWords(e.target.value)} rows={2} placeholder="the only film i rewatch every winter." /></div>

        <button onClick={submit} disabled={busy}
          className="font-h font-bold text-sm bg-vibe text-white border-[2.5px] border-frame rounded-full px-5 py-3 shadow-[3px_3px_0_#0D0B09] disabled:opacity-50">
          {busy ? "adding…" : "add to curate"}
        </button>
        {msg && <div className="font-m text-xs text-center text-ink-2">{msg}</div>}
      </div>

      <div className="mt-8 font-m text-[11px] tracking-widest uppercase text-muted">existing · {drops.length}</div>
      <div className="mt-3 flex flex-col gap-2">
        {drops.map((d) => (
          <div key={d.id} className="flex items-center gap-3 bg-surface border-[2px] border-frame rounded-xl p-2.5">
            <span className="font-m text-[8px] font-bold border-[1.5px] border-frame rounded px-1.5 py-0.5 text-white" style={{ background: TYPE[d.type].color }}>{TYPE[d.type].label}</span>
            <div className="min-w-0">
              <div className="font-h font-bold text-sm truncate">{String(d.data?.title ?? d.data?.place_name ?? "untitled")}</div>
              <div className="font-m text-[9px] text-muted truncate">{d.curate_people?.name} · {d.moment}{d.curate_people?.consent ? "" : " · ⚠ no consent"}</div>
            </div>
            <div className="ml-auto flex gap-1.5">
              <button onClick={() => toggleConsent(d)} className={`font-m text-[10px] font-bold border-[2px] border-frame rounded-full px-2.5 py-1 ${d.curate_people?.consent ? "bg-ink text-paper" : "bg-surface text-red"}`}>{d.curate_people?.consent ? "consent ✓" : "consent ✗"}</button>
              <button onClick={() => togglePublish(d)} className={`font-m text-[10px] font-bold border-[2px] border-frame rounded-full px-2.5 py-1 ${d.published ? "bg-go text-white" : "bg-surface"}`}>{d.published ? "live" : "draft"}</button>
              <button onClick={() => remove(d.id)} className="font-m text-[10px] font-bold text-red border-[2px] border-frame rounded-full px-2.5 py-1">del</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
