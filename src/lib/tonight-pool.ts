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

  const { data: iRaw } = await supabase
    .from("items")
    .select("id, type, data, note, rating_value, anon, created_by, users!items_created_by_fkey(name)")
    .eq("group_id", groupId)
    .neq("created_by", userId)
    .eq("private", false)
    .order("created_at", { ascending: false })
    .limit(40);

  const { data: cRaw } = await supabase
    .from("curate_drops")
    .select("id, type, moment, their_words, data, curate_people!curate_drops_person_id_fkey(name, consent)")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(40);

  const { data: qRaw } = await supabase
    .from("queue_items").select("item_id, curate_drop_id").eq("user_id", userId);
  const queuedItems = new Set((qRaw ?? []).map((q) => q.item_id).filter(Boolean));
  const queuedCurate = new Set((qRaw ?? []).map((q) => q.curate_drop_id).filter(Boolean));

  const itemRows = (iRaw ?? []) as unknown as ItemRow[];
  await signPhotos(admin, itemRows, (it) => (it as { data?: Record<string, unknown> }).data);
  const proofMap = await fetchPositiveVerdicts(admin, itemRows.map((i) => i.id));
  const { data: me } = await supabase.from("users").select("services").eq("id", userId).maybeSingle();
  const availMap = await availabilityMap(
    itemRows.map((i) => ({ id: i.id, type: i.type, data: i.data })),
    cleanServices(me?.services),
  );

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

// The "surprise me" pool for the watchlist: EVERYTHING you could pick tonight —
// your watchlist (passed in) + others' group drops + kizu curate (buildPeoplePool)
// + your own drops AND private logs. De-duplicated by display title so the same
// thing never appears twice (e.g. saved + also a group drop, or dropped by two
// people). First occurrence wins, in priority order: watchlist → people/curate →
// your own. Untitled items are never collapsed together.
export async function buildSurprisePool(userId: string, groupId: string, watchlist: Cand[]): Promise<Cand[]> {
  const supabase = await createClient();
  const admin = createAdminClient();

  const people = await buildPeoplePool(userId, groupId);

  // your own items — public drops you made AND private log entries only you see.
  const { data: myRaw } = await supabase
    .from("items")
    .select("id, type, data, note, rating_value")
    .eq("created_by", userId)
    .order("created_at", { ascending: false })
    .limit(80);
  const myRows = (myRaw ?? []) as unknown as { id: string; type: DropType; data: Record<string, unknown> | null; note: string | null; rating_value: string | null }[];
  await signPhotos(admin, myRows, (r) => (r as { data?: Record<string, unknown> }).data);
  const { data: me } = await supabase.from("users").select("services").eq("id", userId).maybeSingle();
  const myAvail = await availabilityMap(
    myRows.map((r) => ({ id: r.id, type: r.type, data: r.data ?? {} })),
    cleanServices(me?.services),
  );
  const mine: Cand[] = myRows.map((r) => ({
    key: `i:${r.id}`, itemId: r.id, type: r.type, data: r.data ?? {}, note: r.note,
    who: null, rating: r.rating_value, availability: myAvail.get(r.id) ?? null, source: "shelf",
  }));

  const seen = new Set<string>();
  const out: Cand[] = [];
  for (const c of [...watchlist, ...people, ...mine]) {
    const k = title(c).toLowerCase().trim();
    if (!k || k === "untitled") { out.push(c); continue; } // don't merge distinct untitled things
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(c);
  }
  return out;
}
