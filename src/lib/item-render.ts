// Shared render helpers for a "drop" (a watch/listen/go_out item or curate pick).
// Extracted from the old feed page so Home, Queue, Tonight, the Curate river,
// and /r/<token> all render cards the same way. Accepts the minimal shape
// { type, data } — works for both `items` rows and `curate_drops` rows
// (they share the same `data` jsonb shape).

export type DropType = "watch" | "listen" | "go_out";

export const TYPE: Record<DropType, { label: string; color: string }> = {
  watch: { label: "MOVIES", color: "#2F6FE0" },
  listen: { label: "MUSIC", color: "#E0567E" },
  go_out: { label: "OUTSIDE", color: "#1B8A6B" },
};

type RenderItem = { type: DropType; data: Record<string, unknown> | null | undefined };

const s = (v: unknown): string | null => (typeof v === "string" && v ? v : null);

export function img(it: RenderItem): string | null {
  const d = it.data ?? {};
  return s(d["poster_url"]) || s(d["artwork_url"]) || s(d["photo_url"]) || null;
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
