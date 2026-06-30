"use client";

import { useState } from "react";

// Keeps the "your people" feed bounded (anti-doomscroll): render only the most
// recent `initial` cards, tuck the rest behind one quiet "show earlier" tap.
// The cards are server-rendered and passed in as children (client islands like
// Reactions/QueueButton ride along untouched).
export default function FeedReveal({
  children,
  initial = 8,
}: {
  children: React.ReactNode;
  initial?: number;
}) {
  const [open, setOpen] = useState(false);
  const kids = Array.isArray(children) ? children : [children];
  const head = kids.slice(0, initial);
  const rest = kids.slice(initial);

  return (
    <>
      <div className="flex flex-col">{head}</div>
      {open && <div className="flex flex-col">{rest}</div>}
      {rest.length > 0 && !open && (
        <button
          onClick={() => setOpen(true)}
          className="mt-6 w-full font-h font-bold text-[13px] text-ink-2 border border-hair rounded-full py-3 hover:bg-surface transition-colors"
        >
          show earlier · {rest.length}
        </button>
      )}
    </>
  );
}
