"use client";

import { useState } from "react";

type TabId = "people" | "curate";

function Tab({ label, active, onSelect }: { label: string; active: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={`relative pb-2.5 font-h font-extrabold text-[17px] tracking-[-0.02em] transition-colors ${
        active ? "text-ink" : "text-muted"
      }`}
    >
      <span className="text-vibe-2">✦</span> {label}
      {active && <span className="absolute left-0 -bottom-px h-[2px] w-full bg-vibe-2 rounded-full" />}
    </button>
  );
}

// Segmented toggle at the top of Home: "✦ your people" | "✦ curate".
// Both feeds are rendered server-side and passed in as slots; this only
// switches which one is mounted. your-people is the default (the trust circle
// stays the hero); curate is one tap away.
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
      <div className="flex items-center gap-5 border-b border-hair">
        <Tab label="your people" active={tab === "people"} onSelect={() => setTab("people")} />
        <Tab label="curate" active={tab === "curate"} onSelect={() => setTab("curate")} />
        {tab === "people" && <span className="ml-auto font-m text-[12px] font-bold text-muted">{fresh} fresh</span>}
      </div>
      <div className="mt-1">{tab === "people" ? people : curate}</div>
    </div>
  );
}
