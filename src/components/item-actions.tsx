// Small "act on it" pills (play on spotify / open in maps / where to watch).
// Hook-free + no server-only imports → renders in both server and client trees.
import type { Action } from "@/lib/item-actions";

// Play pills carry no glyph — the brand-colored border IS the affordance.
const GLYPH: Record<Action["kind"], string> = { play: "", watch: "▷", map: "↗", have: "✓", set: "+" };

// Music services get their own brand-colored border so you recognise them at a
// glance: spotify green, youtube/yt-music red. Kept dim (~45% alpha) so they sit
// on the dark stage like the other pills instead of glaring. Others → neutral.
function serviceBorder(label: string): string | null {
  const l = label.toLowerCase();
  if (l.includes("spotify")) return "rgba(29,185,84,0.45)";
  if (l.includes("yt") || l.includes("youtube")) return "rgba(255,45,45,0.45)";
  return null;
}

export default function ItemActions({ actions, className = "" }: { actions: Action[]; className?: string }) {
  if (!actions.length) return null;
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {actions.map((a, i) => {
        // "set" = the in-app nudge to pick your music app: a ghost chip, internal
        // nav (no new tab), visually distinct from the solid play/watch buttons.
        if (a.kind === "set") {
          return (
            <a
              key={i}
              href={a.url}
              className="inline-flex items-center gap-1 font-h text-[10px] font-bold border-[2px] border-dashed border-hair text-muted rounded-full px-2.5 py-1 hover:border-frame hover:text-ink transition-colors"
            >
              <span aria-hidden className="text-[9px] leading-none">♪</span>
              {a.label}
            </a>
          );
        }
        const sb = a.kind === "play" ? serviceBorder(a.label) : null;
        const glyph = GLYPH[a.kind];
        return (
          <a
            key={i}
            href={a.url}
            target="_blank"
            rel="noreferrer"
            style={sb ? { borderColor: sb } : undefined}
            className={`inline-flex items-center gap-1 font-h text-[10px] font-bold rounded-full px-2.5 py-1 border-[1.5px] transition-all hover:-translate-y-[1px] ${
              // airy outlined pills, tinted to meaning: brand-colored music borders,
              // their music app → violet, "have" (you own it) → green, else neutral.
              sb
                ? "text-ink"
                : a.primary
                ? "text-vibe-2 border-vibe/50"
                : a.kind === "have"
                ? "text-go border-go/40"
                : "text-ink border-frame"
            }`}
          >
            {glyph && <span aria-hidden className="text-[9px] leading-none">{glyph}</span>}
            {a.label}
          </a>
        );
      })}
    </div>
  );
}
