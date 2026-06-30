"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// The action on a /r/<token> rec page: claim it (signed in) or sign in first.
export default function RecCard({
  token,
  signedIn,
  isSender,
}: {
  token: string;
  signedIn: boolean;
  isSender: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  if (isSender) {
    return <div className="font-m text-[12px] text-muted text-center">this is your rec — share the link.</div>;
  }

  async function claim() {
    setBusy(true);
    try {
      const res = await fetch("/api/recs/claim", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (res.ok) { setSaved(true); setTimeout(() => { router.push("/queue"); router.refresh(); }, 700); }
    } finally {
      setBusy(false);
    }
  }

  if (!signedIn) {
    return (
      <a
        href={`/login?next=${encodeURIComponent(`/r/${token}`)}`}
        className="block text-center font-h font-extrabold text-[15px] text-white bg-vibe border-[2.5px] border-frame rounded-xl py-3.5 shadow-[4px_4px_0_#0D0B09]"
      >
        sign in to save it
      </a>
    );
  }

  return (
    <button
      onClick={claim}
      disabled={busy || saved}
      className="w-full font-h font-extrabold text-[15px] text-white bg-vibe border-[2.5px] border-frame rounded-xl py-3.5 shadow-[4px_4px_0_#0D0B09] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-transform disabled:opacity-60"
    >
      {saved ? "✓ saved" : busy ? "saving…" : "＋ save this"}
    </button>
  );
}
