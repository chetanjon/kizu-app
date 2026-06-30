import { createClient } from "@/lib/supabase-server";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import TonightDealer, { type Cand } from "@/components/tonight-dealer";
import type { DropType } from "@/lib/item-render";
import { createAdminClient } from "@/lib/supabase-admin";
import { signPhotos } from "@/lib/drop-photos";
import { fetchPositiveVerdicts, proofLine } from "@/lib/social-proof";
import { availabilityMap } from "@/lib/providers";
import { cleanServices } from "@/lib/services";

type ItemRow = {
  id: string; type: DropType; data: Record<string, unknown>; note: string | null;
  rating_value: string | null; anon: boolean; created_by: string; users: { name: string | null } | null;
};
type CurateRow = {
  id: string; type: DropType; moment: string; their_words: string | null;
  data: Record<string, unknown>; curate_people: { name: string | null } | null;
};

const LENSES = ["watch", "listen", "go_out", "all"] as const;
type Lens = (typeof LENSES)[number];

export default async function Tonight({ searchParams }: { searchParams: Promise<{ lens?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const lensParam = (await searchParams)?.lens;
  const initialLens = (LENSES as readonly string[]).includes(lensParam ?? "") ? (lensParam as Lens) : null;
  const supabase = await createClient();

  const { data: mRaw } = await supabase
    .from("group_members").select("group_id, is_home").eq("user_id", user.id);
  const memberships = (mRaw ?? []) as { group_id: string; is_home: boolean }[];
  if (memberships.length === 0) redirect("/groups/new");
  const active = memberships.find((m) => m.is_home) ?? memberships[0];

  // pool = your people's drops (not your own) + the curated world.
  const { data: iRaw } = await supabase
    .from("items")
    .select("id, type, data, note, rating_value, anon, created_by, users!items_created_by_fkey(name)")
    .eq("group_id", active.group_id)
    .neq("created_by", user.id)
    .eq("private", false)
    .order("created_at", { ascending: false })
    .limit(40);

  const { data: cRaw } = await supabase
    .from("curate_drops")
    .select("id, type, moment, their_words, data, curate_people!curate_drops_person_id_fkey(name, consent)")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(40);

  // exclude things already in your queue.
  const { data: qRaw } = await supabase
    .from("queue_items").select("item_id, curate_drop_id").eq("user_id", user.id);
  const queuedItems = new Set((qRaw ?? []).map((q) => q.item_id).filter(Boolean));
  const queuedCurate = new Set((qRaw ?? []).map((q) => q.curate_drop_id).filter(Boolean));

  const itemRows = (iRaw ?? []) as unknown as ItemRow[];
  await signPhotos(createAdminClient(), itemRows, (it) => (it as { data?: Record<string, unknown> }).data);
  const proofMap = await fetchPositiveVerdicts(createAdminClient(), itemRows.map((i) => i.id));
  const { data: me } = await supabase.from("users").select("services, music_app").eq("id", user.id).maybeSingle();
  const availMap = await availabilityMap(
    itemRows.map((i) => ({ id: i.id, type: i.type, data: i.data })),
    cleanServices(me?.services),
  );

  const fromItems: Cand[] = itemRows
    .filter((i) => !queuedItems.has(i.id))
    .map((i) => ({
      key: `i:${i.id}`, itemId: i.id, type: i.type, data: i.data ?? {},
      note: i.note, who: i.anon ? null : (i.users?.name ?? null),
      rating: i.rating_value, proof: proofLine(proofMap.get(i.id), [i.created_by, user.id]),
      availability: availMap.get(i.id) ?? null,
    }));

  const fromCurate: Cand[] = ((cRaw ?? []) as unknown as CurateRow[])
    .filter((c) => c.curate_people && !queuedCurate.has(c.id))
    .map((c) => ({
      key: `c:${c.id}`, curateDropId: c.id, type: c.type, data: c.data ?? {},
      note: c.their_words, who: c.curate_people?.name ?? null, moment: c.moment,
    }));

  const pool = [...fromItems, ...fromCurate];

  return (
    <main className="max-w-[480px] mx-auto px-6 py-10">
      <div className="font-m text-[11px] tracking-widest uppercase text-muted">{new Date().toLocaleDateString(undefined, { weekday: "long" })}</div>
      <h1 className="font-h text-4xl font-extrabold tracking-[-0.04em] mt-1 leading-[1.02]">what are you<br />up for <span className="text-vibe">tonight?</span></h1>
      <TonightDealer pool={pool} musicApp={me?.music_app ?? null} initialLens={initialLens} />
    </main>
  );
}
