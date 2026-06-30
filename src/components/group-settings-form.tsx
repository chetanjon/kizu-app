"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const COLORS = ["#F0A23C", "#2F6FE0", "#E0567E", "#1B8A6B", "#6B4BD6"];

// Creator sees an editable name + color; everyone else sees it read-only.
export default function GroupSettingsForm(
  { groupId, name: initName, color: initColor, isCreator }:
  { groupId: string; name: string; color: string; isCreator: boolean }
) {
  const router = useRouter();
  const [name, setName] = useState(initName);
  const [color, setColor] = useState(initColor);
  const [busy, setBusy] = useState(false);

  if (!isCreator) {
    return (
      <div className="flex items-center gap-2.5">
        <span className="w-4 h-4 rounded-full border-[2px] border-frame" style={{ background: initColor }} />
        <span className="font-h font-extrabold text-xl">{initName}</span>
      </div>
    );
  }

  async function save() {
    if (!name.trim() || busy) return;
    setBusy(true);
    await fetch("/api/groups", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ group_id: groupId, name, color }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40}
        className="w-full bg-paper border-[2.5px] border-frame rounded-xl px-3.5 py-3 text-[15px] outline-none focus:shadow-[3px_3px_0_#6B4BD6]" />
      <div className="flex gap-3">
        {COLORS.map((c) => (
          <button key={c} onClick={() => setColor(c)} aria-label={c}
            className={`w-8 h-8 rounded-full border-[2.5px] ${color === c ? "border-frame scale-110" : "border-transparent"}`}
            style={{ background: c }} />
        ))}
      </div>
      <button onClick={save} disabled={busy}
        className="self-start font-h font-bold text-sm bg-vibe text-white border-[2.5px] border-frame rounded-full px-5 py-2.5 shadow-[3px_3px_0_#0D0B09]">
        {busy ? "saving…" : "save"}
      </button>
    </div>
  );
}
