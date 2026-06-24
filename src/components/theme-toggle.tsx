"use client";

import { useEffect, useState } from "react";

type Mode = "system" | "light" | "dark";
const MODES: { key: Mode; label: string }[] = [
  { key: "system", label: "auto" },
  { key: "light", label: "light" },
  { key: "dark", label: "dark" },
];

// Theme switch. "auto" follows the phone's setting; light/dark force it.
// The no-flash script in layout.tsx reads the same localStorage key on load.
export default function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("system");

  useEffect(() => {
    const saved = (localStorage.getItem("kizu-theme") as Mode | null) ?? "system";
    setMode(saved);
  }, []);

  function apply(m: Mode) {
    setMode(m);
    const el = document.documentElement;
    el.classList.remove("dark", "light");
    if (m === "dark") el.classList.add("dark");
    else if (m === "light") el.classList.add("light");
    localStorage.setItem("kizu-theme", m);
  }

  return (
    <div>
      <div className="font-m text-[10px] tracking-widest uppercase text-muted mb-2">appearance</div>
      <div className="inline-flex gap-1 bg-surface-2 border-[2.5px] border-ink rounded-full p-1">
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => apply(m.key)}
            className={`font-h font-bold text-[13px] rounded-full px-4 py-1.5 transition-colors ${
              mode === m.key ? "bg-vibe text-white" : "text-ink"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}
