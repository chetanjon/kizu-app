"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import NotificationsBell from "@/components/notifications-bell";

// Sticky responsive top bar. A violet tile slides to the active destination
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

// "you" standing figure — armless filled silhouette, swapped by gender.
function Figure({ gender }: { gender: string | null | undefined }) {
  if (gender === "male") {
    return (
      <svg width="22" height="26" viewBox="0 0 24 28" aria-hidden>
        <circle cx="12" cy="5" r="3.2" fill="currentColor" />
        <path d="M7 12.5c0-2.2 2.2-3.3 5-3.3s5 1.1 5 3.3l-.5 4.2H7.5z" fill="currentColor" />
        <rect x="9.1" y="16.2" width="2.5" height="8.4" rx="1.1" fill="currentColor" />
        <rect x="12.4" y="16.2" width="2.5" height="8.4" rx="1.1" fill="currentColor" />
      </svg>
    );
  }
  if (gender === "female") {
    return (
      <svg width="22" height="26" viewBox="0 0 24 28" aria-hidden>
        <circle cx="12" cy="5" r="3.2" fill="currentColor" />
        <path d="M12 9c-1.8 0-2.9 1.1-3.3 2.6L6.4 18.2h11.2l-2.3-6.6C14.9 10.1 13.8 9 12 9z" fill="currentColor" />
        <rect x="9.4" y="18" width="2.2" height="6.5" rx="1.1" fill="currentColor" />
        <rect x="12.4" y="18" width="2.2" height="6.5" rx="1.1" fill="currentColor" />
      </svg>
    );
  }
  // neutral default (gender null / unanswered)
  return (
    <svg width="22" height="26" viewBox="0 0 24 28" aria-hidden>
      <circle cx="12" cy="5" r="3.2" fill="currentColor" />
      <rect x="8.8" y="9.2" width="6.4" height="8" rx="2.6" fill="currentColor" />
      <rect x="9.2" y="16.2" width="2.3" height="8.2" rx="1.1" fill="currentColor" />
      <rect x="12.5" y="16.2" width="2.3" height="8.2" rx="1.1" fill="currentColor" />
    </svg>
  );
}

// destinations carry their slot index in the 5-wide row (drop is slot 2).
const DESTS = [
  { key: "home", href: "/home", label: "home", slot: 0, Icon: Home },
  { key: "pick", href: "/tonight", label: "pick", slot: 1, Icon: Pick },
  { key: "queue", href: "/queue", label: "queue", slot: 3, Icon: Queue },
  { key: "you", href: "/you", label: "you", slot: 4, Icon: null as null },
] as const;

export default function AppNav({ gender }: { gender?: string | null }) {
  const path = usePathname();
  const isOn = (href: string) => path === href || path.startsWith(href + "/");
  const active = DESTS.find((d) => isOn(d.href));

  const slotClass = (on: boolean) =>
    `relative z-[1] flex-1 flex flex-col items-center gap-1 pt-2 pb-1.5 active:scale-95 transition-transform ${
      on ? "text-white" : "text-muted"
    }`;

  return (
    <header className="sticky top-0 z-40 bg-surface border-b-[2.5px] border-ink">
      <div className="mx-auto flex max-w-[760px] items-center gap-2 px-3 sm:gap-4 sm:px-5">
        <Link href="/home" className="hidden shrink-0 font-h text-2xl font-extrabold tracking-[-0.05em] sm:block">
          kizu<span className="text-red">.</span>
        </Link>

        <nav className="relative flex flex-1 items-end">
          {/* the sliding tile — only when a real destination is active */}
          {active && (
            <span
              className="absolute bottom-1 z-0 h-[42px] rounded-[13px] border-[2.5px] border-ink bg-vibe transition-[left] duration-200 ease-out motion-reduce:transition-none"
              style={{ left: `calc(${active.slot * 20}% + 7px)`, width: "calc(20% - 14px)" }}
            />
          )}

          <Link href="/home" className={slotClass(isOn("/home"))}>
            <span className="flex h-[34px] items-center justify-center"><Home /></span>
            <span className="font-m text-[9.5px] font-bold">home</span>
          </Link>

          <Link href="/tonight" className={slotClass(isOn("/tonight"))}>
            <span className="flex h-[34px] items-center justify-center"><Pick /></span>
            <span className="font-m text-[9.5px] font-bold">pick</span>
          </Link>

          {/* drop — the action: always-violet raised button, never the tile */}
          <Link href="/drop" className="relative z-[1] flex flex-1 flex-col items-center gap-1 pt-2 pb-1.5 text-vibe">
            <span className="flex h-[34px] items-center justify-center">
              <span className="flex h-[38px] w-[38px] items-center justify-center rounded-full border-[2.5px] border-ink bg-vibe text-white shadow-[2px_3px_0_#14110F] transition active:translate-y-[1px] active:shadow-[1px_1px_0_#14110F]">
                <Plus />
              </span>
            </span>
            <span className="font-m text-[9.5px] font-bold">drop</span>
          </Link>

          <Link href="/queue" className={slotClass(isOn("/queue"))}>
            <span className="flex h-[34px] items-center justify-center"><Queue /></span>
            <span className="font-m text-[9.5px] font-bold">queue</span>
          </Link>

          <Link href="/you" className={slotClass(isOn("/you"))}>
            <span className="flex h-[34px] items-center justify-center"><Figure gender={gender} /></span>
            <span className="font-m text-[9.5px] font-bold">you</span>
          </Link>
        </nav>

        <div className="shrink-0">
          <NotificationsBell />
        </div>
      </div>
    </header>
  );
}
