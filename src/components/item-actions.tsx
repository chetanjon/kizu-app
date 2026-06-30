// Small "act on it" pills (play on spotify / open in maps / where to watch).
// Hook-free + no server-only imports → renders in both server and client trees.
import type { Action } from "@/lib/item-actions";

const GLYPH: Record<Action["kind"], string> = { play: "▶", watch: "▷", map: "↗", have: "✓", set: "+" };

export default function ItemActions({ actions, className = "" }: { actions: Action[]; className?: string }) {
  if (!actions.length) return null;
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {actions.map((a, i) =>
        // "set" = the in-app nudge to pick your music app: a ghost chip, internal
        // nav (no new tab), visually distinct from the solid play/watch buttons.
        a.kind === "set" ? (
          <a
            key={i}
            href={a.url}
            className="inline-flex items-center gap-1 font-m text-[10px] font-bold border-[2px] border-dashed border-hair text-muted rounded-full px-2.5 py-1 hover:border-ink hover:text-ink transition-colors"
          >
            <span aria-hidden className="text-[9px] leading-none">♪</span>
            {a.label}
          </a>
        ) : (
          <a
            key={i}
            href={a.url}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex items-center gap-1 font-m text-[10px] font-bold rounded-full px-2.5 py-1 transition-all hover:-translate-y-[1px] ${
              // airy outlined pills, tinted to meaning: their music app → violet,
              // "have" (you own it) → green, everything else → neutral cream.
              a.primary
                ? "text-vibe-2 border-[1.5px] border-vibe/50"
                : a.kind === "have"
                ? "text-go border-[1.5px] border-go/40"
                : "text-ink border-[1.5px] border-frame"
            }`}
          >
            <span aria-hidden className="text-[9px] leading-none">{GLYPH[a.kind]}</span>
            {a.label}
          </a>
        ),
      )}
    </div>
  );
}
