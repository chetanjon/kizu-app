"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Fixed BOTTOM nav (thumb zone). A violet tile slides to the active destination
// (the one show of motion); the active slot goes white. Violet is reserved for
// the tile + the drop button only — RED stays on the kizu. dot.
// Five slots: home · log · ＋drop(center) · watchlist · you. drop is an ACTION, not
// a destination, so the tile never parks under it.

// ---- custom glyphs (filled, chunky; currentColor) ----
// "home" — two overlapping rings: the group's blended taste. This tab IS the
// shared feed, so the mark reads as taste flowing together, not a house.
const Home = () => (
  <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" aria-hidden>
    <circle cx="9" cy="12" r="6" />
    <circle cx="15" cy="12" r="6" />
  </svg>
);
// "log" — a notebook/diary (your private taste shelf).
const Journal = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M6 3.5h11A1.5 1.5 0 0 1 18.5 5v14a1.5 1.5 0 0 1-1.5 1.5H6.5A1.5 1.5 0 0 1 5 19V5A1.5 1.5 0 0 1 6.5 3.5z" />
    <path d="M9 8.5h6M9 12h6M9 15.5h3.5" />
  </svg>
);
const Queue = () => (
  <svg width="27" height="27" viewBox="0 0 24 24" aria-hidden>
    <rect x="4" y="5.5" width="16" height="3.3" rx="1.65" fill="currentColor" />
    <rect x="4" y="10.4" width="16" height="3.3" rx="1.65" fill="currentColor" />
    <rect x="4" y="15.3" width="10" height="3.3" rx="1.65" fill="currentColor" />
  </svg>
);
const Plus = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" aria-hidden>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

// "profile" — a clean person mark (head + shoulders), matching the reference
// design's ic-user. Gender-neutral; chunky stroke to sit with the other glyphs.
const User = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M5.5 20.5a6.5 6.5 0 0 1 13 0" />
  </svg>
);

// a floating glass pill (thumb zone). active slot = violet icon + a violet dot
// beneath it. drop is the raised violet action, never marked active.
function Tab({ href, on, children }: { href: string; on: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`flex w-[52px] flex-col items-center gap-[6px] active:scale-95 transition-transform ${on ? "text-vibe-2" : "text-muted"}`}
    >
      {children}
      <span className={`h-[5px] w-[5px] rounded-full ${on ? "bg-vibe-2" : "bg-transparent"}`} />
    </Link>
  );
}

export default function AppNav() {
  const path = usePathname();
  const isOn = (href: string) => path === href || path.startsWith(href + "/");

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-none">
      <div className="glass pointer-events-auto flex items-center gap-2 rounded-full border-2 border-frame px-4 py-2.5 shadow-[5px_5px_0_#7C5CE6]">
        <Tab href="/home" on={isOn("/home")}><Home /></Tab>
        <Tab href="/log" on={isOn("/log")}><Journal /></Tab>

        {/* drop — the raised violet action, framed in cream */}
        <Link
          href="/drop"
          className="mx-0.5 flex h-[52px] w-[52px] items-center justify-center rounded-full border-2 border-frame bg-vibe text-white shadow-[2px_3px_0_#0D0B09] transition active:translate-y-[1px] active:shadow-[1px_1px_0_#0D0B09]"
        >
          <Plus />
        </Link>

        <Tab href="/queue" on={isOn("/queue")}><Queue /></Tab>
        <Tab href="/you" on={isOn("/you")}><User /></Tab>
      </div>
    </nav>
  );
}
