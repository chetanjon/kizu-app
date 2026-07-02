"use client";

import { useState } from "react";

// One-tap invite sharing for a group. The native share sheet where it exists
// (phones), clipboard copy everywhere else. The code stays visible for the
// "just read it out" case.
export async function shareInvite(code: string, groupName: string): Promise<"shared" | "copied" | "failed"> {
  const url = `${window.location.origin}/join/${code}`;
  const payload = { title: "kizu.", text: `you're invited to "${groupName.toLowerCase()}".`, url };
  // the sheet only on touch devices: desktop Chrome also has navigator.share,
  // but there it means a clunky OS popover when a copied link is what you want.
  const touch = typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
  if (navigator.share && touch) {
    try {
      await navigator.share(payload);
      return "shared";
    } catch (e) {
      // user closed the sheet: not a failure, and not a copy either.
      if ((e as Error)?.name === "AbortError") return "shared";
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    return "failed";
  }
}

export default function InviteShare({ code, groupName }: { code: string; groupName: string }) {
  const [copied, setCopied] = useState(false);

  async function onShare() {
    const r = await shareInvite(code, groupName);
    if (r === "copied") {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  // The LINK is the hero: it carries the code, opens the invite page, and
  // auto-joins after sign-in — nothing to share separately. The code stays as
  // a quiet footnote for the "just read it out across the room" case.
  return (
    <div className="bg-surface border-[2.5px] border-frame rounded-2xl p-5 shadow-[4px_4px_0_#0D0B09]">
      <div className="font-m text-[10px] tracking-widest uppercase text-muted text-center">one link, that&apos;s it</div>
      <div className="font-h font-extrabold text-[19px] tracking-[-0.02em] text-center mt-1.5 break-all">
        kizu.app<span className="text-vibe-2">/join/{code}</span>
      </div>
      <button onClick={onShare}
        className="mt-4 w-full font-h font-bold text-sm bg-vibe text-white border-[2.5px] border-frame rounded-full py-2.5 shadow-[3px_3px_0_#0D0B09] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-transform">
        {copied ? "link copied" : "share invite link"}
      </button>
      <p className="font-b text-xs text-muted text-center mt-3 leading-snug">
        the link does everything: opens the invite, signs them in, drops them into the space.
      </p>
      <p className="font-m text-[11px] text-muted text-center mt-2">
        in person? just read it out: <span className="text-ink tracking-[0.18em]">{code}</span>
      </p>
    </div>
  );
}
