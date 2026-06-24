"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// 5-destination shell: Home · Tonight · ＋Drop (center) · Queue · You.
// Each tab = one job. RED stays reserved for the kizu. dot — never used here.
// Icons are simple inline strokes (no emoji, per the brand voice).

type Tab = { href: string; label: string; icon: React.ReactNode };

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const HOME = (
  <svg width="22" height="22" viewBox="0 0 24 24" {...stroke}><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></svg>
);
const TONIGHT = (
  <svg width="22" height="22" viewBox="0 0 24 24" {...stroke}><path d="M20 13a8 8 0 1 1-8.5-8 6 6 0 0 0 8.5 8z" /></svg>
);
const QUEUE = (
  <svg width="22" height="22" viewBox="0 0 24 24" {...stroke}><path d="M4 6h11M4 12h11M4 18h7" /><path d="M19 5l1.6 1.6L19 9" /></svg>
);
const YOU = (
  <svg width="22" height="22" viewBox="0 0 24 24" {...stroke}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>
);

const LEFT: Tab[] = [
  { href: "/home", label: "home", icon: HOME },
  { href: "/tonight", label: "tonight", icon: TONIGHT },
];
const RIGHT: Tab[] = [
  { href: "/queue", label: "queue", icon: QUEUE },
  { href: "/you", label: "you", icon: YOU },
];

export default function BottomNav() {
  const path = usePathname();
  const isOn = (href: string) => path === href || path.startsWith(href + "/");

  const Item = ({ t }: { t: Tab }) => (
    <Link
      href={t.href}
      className={`relative flex w-16 flex-col items-center gap-1 pt-1.5 ${
        isOn(t.href) ? "text-ink" : "text-muted"
      }`}
    >
      {isOn(t.href) && (
        <span className="absolute -top-[9px] h-1 w-5 rounded-sm bg-vibe" />
      )}
      {t.icon}
      <span className="font-m text-[9px] font-bold">{t.label}</span>
    </Link>
  );

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-end justify-around border-t-[2.5px] border-ink bg-surface px-2 pb-5 pt-2">
      {LEFT.map((t) => <Item key={t.href} t={t} />)}
      <Link
        href="/drop"
        aria-label="drop"
        className="-mt-7 flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-ink bg-vibe text-white shadow-[3px_4px_0_var(--color-shadow)]"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
      </Link>
      {RIGHT.map((t) => <Item key={t.href} t={t} />)}
    </nav>
  );
}
