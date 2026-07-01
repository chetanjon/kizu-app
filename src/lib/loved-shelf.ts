import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { signPhotos } from "@/lib/drop-photos";
import type { DropType } from "@/lib/item-render";
import type { Cand } from "@/components/tonight-dealer";

// A rating counts as "loved" (worth resurfacing) per the composer's three styles:
//   number 6–10  → >= 8
//   stars ★..★★★★★ → 4 or 5 stars
//   word          → "a vibe" / "elite" / "obsessed" (not "mid" / "fine")
// rating_style may be null on older rows, so fall back to sniffing the value.
export function isLovedRating(style: string | null, value: string | null): boolean {
  if (!value) return false;
  const v = value.trim();
  if (style === "number" || /^\d+$/.test(v)) return parseInt(v, 10) >= 8;
  if (style === "stars" || v.startsWith("★")) return (v.match(/★/g)?.length ?? 0) >= 4;
  return ["a vibe", "elite", "obsessed"].includes(v.toLowerCase());
}

type Row = {
  id: string; type: DropType; data: Record<string, unknown>;
  note: string | null; rating_value: string | null; rating_style: string | null; private: boolean;
};

// Your own loved logs dealt back to you. Private ones become "tell the crew"
// cards; already-shared ones become "save to revisit" cards (the deck branches
// on `shared`).
export async function buildLovedShelf(userId: string): Promise<Cand[]> {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: raw } = await supabase
    .from("items")
    .select("id, type, data, note, rating_value, rating_style, private")
    .eq("created_by", userId)
    .not("rating_value", "is", null)
    .order("created_at", { ascending: false })
    .limit(60);

  const rows = ((raw ?? []) as unknown as Row[]).filter((r) => isLovedRating(r.rating_style, r.rating_value));
  await signPhotos(admin, rows, (it) => it.data);

  return rows.map((r) => ({
    key: `s:${r.id}`, itemId: r.id, type: r.type, data: r.data ?? {},
    note: r.note, who: null, rating: r.rating_value,
    source: "shelf", shared: !r.private,
  }));
}
