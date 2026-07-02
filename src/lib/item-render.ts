// Shared render helpers for a "drop" (a watch/listen/go_out item or curate pick).
// Extracted from the old feed page so Home, Queue, Tonight, the Curate river,
// and /r/<token> all render cards the same way. Accepts the minimal shape
// { type, data } — works for both `items` rows and `curate_drops` rows
// (they share the same `data` jsonb shape).

export type DropType = "watch" | "listen" | "go_out";

// dark-tuned type colors (brighter so they read + glow on the black stage)
export const TYPE: Record<DropType, { label: string; color: string }> = {
  watch: { label: "MOVIE", color: "#5B8DEF" },
  listen: { label: "MUSIC", color: "#FF6F9C" },
  go_out: { label: "OUTSIDE", color: "#5DCAA5" },
};

// the signature colored hard-shadow class for a cover of this type (see globals.css)
export const SHADOW: Record<DropType, string> = {
  watch: "shadow-watch",
  listen: "shadow-listen",
  go_out: "shadow-go",
};
export const SHADOW_SM: Record<DropType, string> = {
  watch: "shadow-watch-sm",
  listen: "shadow-listen-sm",
  go_out: "shadow-go-sm",
};

type RenderItem = { type: DropType; data: Record<string, unknown> | null | undefined };

const s = (v: unknown): string | null => (typeof v === "string" && v ? v : null);

export function img(it: RenderItem): string | null {
  const d = it.data ?? {};
  return s(d["poster_url"]) || s(d["artwork_url"]) || s(d["photo_url"]) || null;
}

// Small-cover variant for LIST surfaces (feed cards, reel tiles, watchlist
// thumbs, profile picks) where covers draw at ≤240 CSS px: stored TMDB urls
// carry w500 (750px files) — w342 is still ≥2× there and cuts bytes ~45%.
// One shared size across surfaces means the phone downloads each poster once.
// Single-card/detail surfaces (log deck, tonight, curate river) keep img().
export function imgSm(it: RenderItem): string | null {
  const u = img(it);
  return u ? u.replace("https://image.tmdb.org/t/p/w500/", "https://image.tmdb.org/t/p/w342/") : null;
}

export function title(it: RenderItem): string {
  const d = it.data ?? {};
  return s(d["title"]) || s(d["place_name"]) || "untitled";
}

export function sub(it: RenderItem): string {
  const d = it.data ?? {};
  if (it.type === "watch") {
    return [s(d["year"]), s(d["media_type"])].filter(Boolean).join(" · ").toUpperCase();
  }
  if (it.type === "listen") {
    return (s(d["artist"]) ?? "").toUpperCase();
  }
  return [s(d["subtype"]), s(d["music_note"])].filter(Boolean).join(" · ");
}

// editorial type treatment: a lowercase type word (shown colored) + the
// remaining detail WITHOUT the type, so the meta reads "movie · 2023" /
// "music · joji" / "outside · cafe". Separate from sub() so surfaces not yet
// migrated keep their existing label.
export function typeWord(it: RenderItem): string {
  if (it.type === "listen") return "music";
  if (it.type === "go_out") return "outside";
  return (s(it.data?.["media_type"])?.toLowerCase() === "tv") ? "tv" : "movie";
}

// a rating ready to render: prepend a ★ UNLESS the value is already stars
// (so star ratings read "★★★★★", not "★ ★★★★★"; number/word read "★ 8" / "★ obsessed").
export function ratingMark(v: string): string {
  const t = v.trim();
  return t.startsWith("★") ? t : `★ ${t}`;
}

export function detail(it: RenderItem): string {
  const d = it.data ?? {};
  if (it.type === "watch") return s(d["year"]) ?? "";
  if (it.type === "listen") return s(d["artist"]) ?? "";
  return [s(d["subtype"]), s(d["music_note"])].filter(Boolean).join(" · ");
}
