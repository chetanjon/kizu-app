"use client";

import { useState } from "react";

type TabId = "people" | "curate";

// Segmented toggle at the top of Home: "your people" | "kizu curate". A violet
// tile SLIDES between the two — the same one-motion-violet-tile language as the
// bottom nav, so it reads as kizu, not a generic underline. Both feeds are
// rendered server-side and passed in as slots; this only switches which mounts.
// your-people is the default (the trust circle stays the hero).
export default function FeedTabs({
  fresh,
  people,
  curate,
}: {
  fresh: number;
  people: React.ReactNode;
  curate: React.ReactNode;
}) {
  const [tab, setTab] = useState<TabId>("people");

  return (
    <div className="mt-7">
      <div className="flex items-center gap-3">
        <div className="relative flex w-[244px] rounded-full border border-hair bg-surface overflow-hidden select-none">
          {/* the sliding violet tile — fills the active half */}
          <span aria-hidden
            className={`absolute inset-y-0 left-0 w-1/2 bg-vibe transition-transform duration-300 ease-out ${tab === "curate" ? "translate-x-full" : ""}`} />
          <button onClick={() => setTab("people")}
            className={`relative z-10 flex-1 py-2 font-h font-extrabold text-[13px] tracking-[-0.02em] transition-colors ${tab === "people" ? "text-white" : "text-muted"}`}>
            your people
          </button>
          <button onClick={() => setTab("curate")}
            className={`relative z-10 flex-1 py-2 font-h font-extrabold text-[12.5px] tracking-[-0.02em] transition-colors ${tab === "curate" ? "text-white" : "text-muted"}`}>
            kizu curate
          </button>
        </div>
        {tab === "people" && fresh > 0 && (
          <span className="ml-auto font-m text-[11px] font-bold text-vibe-2">{fresh} fresh</span>
        )}
      </div>
      <div className="mt-2">{tab === "people" ? people : curate}</div>
    </div>
  );
}
