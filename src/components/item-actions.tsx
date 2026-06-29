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
            className={`inline-flex items-center gap-1 font-m text-[10px] font-bold border-[2px] border-ink rounded-full px-2.5 py-1 transition-all hover:-translate-y-[1px] ${
              // their picked music app → filled violet + brutalist shadow, so it
              // reads as "this one's yours". "have" (movie you-own) → green. Every
              // other action → flat neutral, so the highlighted pill leads the eye.
              a.primary
                ? "bg-vibe text-white shadow-[2px_2px_0_#14110F] hover:shadow-[3px_3px_0_#14110F]"
                : a.kind === "have"
                ? "bg-go text-white shadow-[2px_2px_0_#14110F] hover:shadow-[3px_3px_0_#14110F]"
                : "bg-surface text-ink"
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
