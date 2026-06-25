"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Fixed BOTTOM nav (thumb zone). A violet tile slides to the active destination
// (the one show of motion); the active slot goes white. Violet is reserved for
// the tile + the drop button only — RED stays on the kizu. dot.
// Five slots: home · pick · ＋drop(center) · queue · you. drop is an ACTION, not
// a destination, so the tile never parks under it.

// ---- custom glyphs (filled, chunky; currentColor) ----
const Home = () => (
  <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden>
    <rect x="8" y="4" width="12" height="12" rx="3" fill="none" stroke="currentColor" strokeWidth="2.3" />
    <rect x="4" y="8" width="12" height="12" rx="3" fill="currentColor" />
  </svg>
);
const Pick = () => (
  <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden>
    <rect x="8" y="5" width="9" height="12.5" rx="2" fill="none" stroke="currentColor" strokeWidth="2.2" transform="rotate(11 12 11)" />
    <rect x="7" y="7" width="9" height="12.5" rx="2" fill="currentColor" transform="rotate(-9 11 13)" />
  </svg>
);
const Queue = () => (
  <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden>
    <rect x="4" y="5.5" width="16" height="3.3" rx="1.65" fill="currentColor" />
    <rect x="4" y="10.4" width="16" height="3.3" rx="1.65" fill="currentColor" />
    <rect x="4" y="15.3" width="10" height="3.3" rx="1.65" fill="currentColor" />
  </svg>
);
const Plus = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" aria-hidden>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

// "you" — dancing figure, right hand up + motion lines (emoji-like energy),
// swapped by gender. man/neutral = "groove solid" (F); woman = "groove" (G).
function Figure({ gender }: { gender: string | null | undefined }) {
  if (gender === "female") {
    return (
      <svg width="24" height="27" viewBox="0 0 24 28" aria-hidden>
        <circle cx="13" cy="5" r="2.9" fill="currentColor" />
        <g fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12.6 8.5 19.4 3.8" />
          <path d="M11.7 10 6.6 12.2" />
          <path d="M11.4 18 13.8 23.4" />
          <path d="M11.4 18 7.6 22.4" />
        </g>
        <path d="M12.7 8 8 18.6h7.8z" fill="currentColor" />
        <g fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" opacity={0.55}>
          <path d="M20.4 5q1.3.7 1.4 2.1" />
          <path d="M5.6 20.6q-1.1.7-1.1 2" />
        </g>
      </svg>
    );
  }
  // man / neutral — fuller body, bent knee, kicked leg, motion ticks
  return (
    <svg width="24" height="27" viewBox="0 0 24 28" aria-hidden>
      <circle cx="13.6" cy="4.8" r="3.1" fill="currentColor" />
      <g fill="none" stroke="currentColor" strokeWidth={4.2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.9 8.2 9.7 15.2" />
        <path d="M12.4 9.2 19.7 3.6" />
        <path d="M11.8 10.6 6.4 12" />
        <path d="M9.7 15.2 12 18.4 14.4 23" />
        <path d="M9.7 15.2 6.2 18 7.9 22.2" />
      </g>
      <g fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" opacity={0.55}>
        <path d="M20.8 5.4q1.4.7 1.5 2.2" />
        <path d="M4.8 20.9q-1.2.7-1.2 2.1" />
      </g>
    </svg>
  );
}

export default function AppNav({ gender }: { gender?: string | null }) {
  const path = usePathname();
  const isOn = (href: string) => path === href || path.startsWith(href + "/");

  // destinations carry their slot index in the 5-wide row (drop is slot 2).
  const dests = [
    { href: "/home", slot: 0 },
    { href: "/tonight", slot: 1 },
    { href: "/queue", slot: 3 },
    { href: "/you", slot: 4 },
  ];
  const active = dests.find((d) => isOn(d.href));

  const slotClass = (on: boolean) =>
    `relative z-[1] flex h-full flex-1 flex-col items-center justify-center gap-1 active:scale-95 transition-transform ${
      on ? "text-white" : "text-muted"
    }`;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t-[2.5px] border-ink bg-surface">
      <div className="mx-auto max-w-[600px] px-2 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))]">
        <div className="relative flex h-[52px]">
          {/* sliding tile — spans the full row height so it frames each slot cleanly */}
          {active && (
            <span
              className="absolute inset-y-0 z-0 rounded-[14px] border-[2.5px] border-ink bg-vibe transition-[left] duration-200 ease-out motion-reduce:transition-none"
              style={{ left: `calc(${active.slot * 20}% + 6px)`, width: "calc(20% - 12px)" }}
            />
          )}

          <Link href="/home" className={slotClass(isOn("/home"))}>
            <Home />
            <span className="font-m text-[9.5px] font-bold">home</span>
          </Link>

          <Link href="/tonight" className={slotClass(isOn("/tonight"))}>
            <Pick />
            <span className="font-m text-[9.5px] font-bold">pick</span>
          </Link>

          {/* drop — the action: always-violet raised button, never the tile */}
          <Link href="/drop" className="relative z-[1] flex h-full flex-1 flex-col items-center justify-center gap-1 text-vibe">
            <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full border-[2.5px] border-ink bg-vibe text-white shadow-[2px_3px_0_#14110F] transition active:translate-y-[1px] active:shadow-[1px_1px_0_#14110F]">
              <Plus />
            </span>
            <span className="font-m text-[9.5px] font-bold">drop</span>
          </Link>

          <Link href="/queue" className={slotClass(isOn("/queue"))}>
            <Queue />
            <span className="font-m text-[9.5px] font-bold">queue</span>
          </Link>

          <Link href="/you" className={slotClass(isOn("/you"))}>
            <Figure gender={gender} />
            <span className="font-m text-[9.5px] font-bold">you</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
