"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const COLORS = ["#F0A23C", "#2F6FE0", "#E0567E", "#1B8A6B", "#6B4BD6"];

function NewGroupInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const [tab, setTab] = useState<"create" | "join">(sp.get("tab") === "join" ? "join" : "create");
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function create() {
    if (!name.trim() || busy) return;
    setBusy(true); setErr("");
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { setErr(j.error || `error ${res.status}. check server env vars`); return; }
      router.push("/home");
    } catch {
      setErr("network error. try again");
    } finally {
      setBusy(false);
    }
  }

  async function join() {
    if (!code.trim() || busy) return;
    setBusy(true); setErr("");
    try {
      const res = await fetch("/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { setErr(j.error || `error ${res.status}`); return; }
      router.push("/home");
    } catch {
      setErr("network error. try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-7">
          <h1 className="font-h text-4xl font-extrabold tracking-[-0.05em]">kizu<span className="text-red">.</span></h1>
        </div>
        <div className="bg-surface rounded-[22px] border-[2.5px] border-frame shadow-[8px_8px_0_#7C5CE6] p-7">
          <div className="flex gap-1 bg-surface-2 rounded-xl p-1 mb-5">
            {(["create", "join"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 font-h font-bold text-sm py-2.5 rounded-lg transition-colors ${tab === t ? "bg-vibe text-white" : "text-muted"}`}>
                {t}
              </button>
            ))}
          </div>

          {tab === "create" ? (
            <div className="flex flex-col gap-4">
              <div>
                <div className="font-m text-[10px] font-bold tracking-widest uppercase text-muted mb-2">group name</div>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="the usual suspects" maxLength={40}
                  className="w-full bg-surface-2 border-[2.5px] border-frame rounded-xl px-3.5 py-3 text-[15px] outline-none focus:shadow-[3px_3px_0_#7C5CE6]" />
              </div>
              <div>
                <div className="font-m text-[10px] font-bold tracking-widest uppercase text-muted mb-2.5">accent color</div>
                <div className="flex gap-3">
                  {COLORS.map((c) => (
                    <button key={c} onClick={() => setColor(c)} style={{ background: c }}
                      className={`w-9 h-9 rounded-full transition-transform ${color === c ? "ring-2 ring-ink ring-offset-2 ring-offset-surface scale-110" : ""}`} />
                  ))}
                </div>
              </div>
              <button onClick={create} disabled={busy}
                className="font-h font-extrabold text-[15px] bg-vibe text-white border-[2.5px] border-frame rounded-xl py-3 shadow-[4px_4px_0_#0D0B09] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-transform disabled:opacity-60">
                {busy ? "creating…" : "create group"}
              </button>
              <p className="font-m text-[11px] text-muted text-center">you'll get an invite link to send your friends</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <div className="font-m text-[10px] font-bold tracking-widest uppercase text-muted mb-2">invite code</div>
                <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. AB3K9P" maxLength={6}
                  className="w-full bg-surface-2 border-[2.5px] border-frame rounded-xl px-3.5 py-3 text-[15px] font-m tracking-widest outline-none focus:shadow-[3px_3px_0_#7C5CE6]" />
              </div>
              <button onClick={join} disabled={busy}
                className="font-h font-extrabold text-[15px] bg-vibe text-white border-[2.5px] border-frame rounded-xl py-3 shadow-[4px_4px_0_#0D0B09] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-transform disabled:opacity-60">
                {busy ? "joining…" : "join group"}
              </button>
            </div>
          )}

          {err && <p className="font-m text-[12px] text-red text-center mt-4">{err}</p>}
        </div>
      </div>
    </div>
  );
}

export default function NewGroup() {
  return (
    <Suspense>
      <NewGroupInner />
    </Suspense>
  );
}
