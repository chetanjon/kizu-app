// Small "act on it" pills (play on spotify / open in maps / where to watch).
// Hook-free + no server-only imports → renders in both server and client trees.
import type { Action } from "@/lib/item-actions";

const GLYPH: Record<Action["kind"], string> = { play: "▶", watch: "▷", map: "↗", have: "✓" };

export default function ItemActions({ actions, className = "" }: { actions: Action[]; className?: string }) {
  if (!actions.length) return null;
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {actions.map((a, i) => (
        <a
          key={i}
          href={a.url}
          target="_blank"
          rel="noreferrer"
          className={`inline-flex items-center gap-1 font-m text-[10px] font-bold border-[2px] border-ink rounded-full px-2.5 py-1 hover:-translate-y-[1px] transition-transform ${
            a.kind === "have" ? "bg-go text-white" : "bg-surface"
          }`}
        >
          <span aria-hidden className="text-[9px] leading-none">{GLYPH[a.kind]}</span>
          {a.label}
        </a>
      ))}
    </div>
  );
}
