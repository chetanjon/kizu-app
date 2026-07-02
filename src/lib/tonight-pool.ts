import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { signPhotos } from "@/lib/drop-photos";
import { fetchPositiveVerdicts, proofLine } from "@/lib/social-proof";
import { availabilityMap } from "@/lib/providers";
import { cleanServices } from "@/lib/services";
import { title, type DropType } from "@/lib/item-render";
import type { Cand } from "@/components/tonight-dealer";

type ItemRow = {
  id: string; type: DropType; data: Record<string, unknown>; note: string | null;
  rating_value: string | null; anon: boolean; created_by: string; users: { name: string | null } | null;
};
type CurateRow = {
  id: string; type: DropType; moment: string; their_words: string | null;
  data: Record<string, unknown>; curate_people: { name: string | null } | null;
};

// The "from your people" pool: group drops by OTHERS + the curated world, minus
// anything already in your queue. Shared verbatim by /tonight and /log.
export async function buildPeoplePool(userId: string, groupId: string): Promise<Cand[]> {
  const supabase = await createClient();
  const admin = createAdminClient();

  // the four base reads are independent → one round-trip's latency, not four.
  const [iRes, cRes, qRes, meRes] = await Promise.all([
    supabase
      .from("items")
      .select("id, type, data, note, rating_value, anon, created_by, users!items_created_by_fkey(name)")
      .eq("group_id", groupId)
      .neq("created_by", userId)
      .eq("private", false)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("curate_drops")
      .select("id, type, moment, their_words, data, curate_people!curate_drops_person_id_fkey(name, consent)")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase.from("queue_items").select("item_id, curate_drop_id").eq("user_id", userId),
    supabase.from("users").select("services").eq("id", userId).maybeSingle(),
  ]);
  const cRaw = cRes.data;
  const queuedItems = new Set((qRes.data ?? []).map((q) => q.item_id).filter(Boolean));
  const queuedCurate = new Set((qRes.data ?? []).map((q) => q.curate_drop_id).filter(Boolean));

  const itemRows = (iRes.data ?? []) as unknown as ItemRow[];
  // the three enrichments all derive from itemRows → run together too.
  const [, proofMap, availMap] = await Promise.all([
    signPhotos(admin, itemRows, (it) => (it as { data?: Record<string, unknown> }).data),
    fetchPositiveVerdicts(admin, itemRows.map((i) => i.id)),
    availabilityMap(
      itemRows.map((i) => ({ id: i.id, type: i.type, data: i.data })),
      cleanServices(meRes.data?.services),
    ),
  ]);

  const fromItems: Cand[] = itemRows
    .filter((i) => !queuedItems.has(i.id))
    .map((i) => ({
      key: `i:${i.id}`, itemId: i.id, type: i.type, data: i.data ?? {},
      note: i.note, who: i.anon ? null : (i.users?.name ?? null),
      rating: i.rating_value, proof: proofLine(proofMap.get(i.id), [i.created_by, userId]),
      availability: availMap.get(i.id) ?? null, source: "people",
    }));

  const fromCurate: Cand[] = ((cRaw ?? []) as unknown as CurateRow[])
    .filter((c) => c.curate_people && !queuedCurate.has(c.id))
    .map((c) => ({
      key: `c:${c.id}`, curateDropId: c.id, type: c.type, data: c.data ?? {},
      note: c.their_words, who: c.curate_people?.name ?? null, moment: c.moment, source: "people",
    }));

  return [...fromItems, ...fromCurate];
}

// The "surprise me" pool for the watchlist: everything you could pick tonight
// that you HAVEN'T acted on yet — your watchlist's want-to pile (passed in) +
// others' group drops + kizu curate (buildPeoplePool). Your OWN drops and private
// logs are deliberately excluded: your drops are things you already know, and the
// log is a diary, not a to-do list. "Watched" lives in exactly one place — the
// watchlist's seen it? → rating, which moves a thing to done so it leaves this
// pool. De-duped by display title so nothing appears twice (saved-and-also-a-
// group-drop, or one film dropped by two people). First occurrence wins:
// watchlist → people/curate. Untitled items are never collapsed together.
// Sync merge — the caller fetches the people pool itself (in parallel with its
// own queries) and hands it in, so the two never serialize behind each other.
export function buildSurprisePool(watchlist: Cand[], people: Cand[]): Cand[] {
  const seen = new Set<string>();
  const out: Cand[] = [];
  for (const c of [...watchlist, ...people]) {
    const k = title(c).toLowerCase().trim();
    if (!k || k === "untitled") { out.push(c); continue; } // don't merge distinct untitled things
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(c);
  }
  return out;
}
