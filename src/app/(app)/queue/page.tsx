import { createClient } from "@/lib/supabase-server";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import QueueClient, { type QRow } from "@/components/queue-client";
import type { DropType } from "@/lib/item-render";

type Raw = {
  item_id: string | null;
  curate_drop_id: string | null;
  verdict: string | null;
  done_at: string | null;
  items: {
    type: DropType;
    data: Record<string, unknown>;
    note: string | null;
    rating_value: string | null;
    created_by: string;
    users: { name: string | null } | null;
  } | null;
  curate_drops: {
    type: DropType;
    data: Record<string, unknown>;
    their_words: string | null;
    curate_people: { name: string | null } | null;
  } | null;
};

export default async function Queue() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const supabase = await createClient();

  const { data: raw } = await supabase
    .from("queue_items")
    .select(
      "item_id, curate_drop_id, verdict, done_at, " +
      "items!queue_items_item_id_fkey(type, data, note, rating_value, created_by, users!items_created_by_fkey(name)), " +
      "curate_drops!queue_items_curate_drop_id_fkey(type, data, their_words, curate_people!curate_drops_person_id_fkey(name))"
    )
    .eq("user_id", user.id)
    .order("added_at", { ascending: false });

  const rows: QRow[] = ((raw ?? []) as unknown as Raw[])
    .map((r): QRow | null => {
      if (r.items) {
        return {
          key: `i:${r.item_id}`,
          itemId: r.item_id!,
          type: r.items.type,
          data: r.items.data ?? {},
          note: r.items.note,
          ratingValue: r.items.rating_value,
          verdict: (r.verdict as QRow["verdict"]) ?? null,
          done: !!r.done_at,
          who: r.items.users?.name ?? null,
          mine: r.items.created_by === user.id,
        };
      }
      if (r.curate_drops) {
        return {
          key: `c:${r.curate_drop_id}`,
          curateDropId: r.curate_drop_id!,
          type: r.curate_drops.type,
          data: r.curate_drops.data ?? {},
          note: r.curate_drops.their_words,
          ratingValue: null,
          verdict: (r.verdict as QRow["verdict"]) ?? null,
          done: !!r.done_at,
          who: r.curate_drops.curate_people?.name ?? null,
          mine: false,
        };
      }
      return null;
    })
    .filter((r): r is QRow => r !== null);

  // things you queued from OTHER people that you loved/liked (north-star seed).
  const landedCount = rows.filter((r) => !r.mine && r.done && (r.verdict === "loved" || r.verdict === "liked")).length;

  return (
    <main className="max-w-[700px] mx-auto px-6 py-10">
      <div className="font-m text-[11px] tracking-widest uppercase text-muted">things you mean to get to</div>
      <h1 className="font-h text-4xl font-extrabold tracking-[-0.04em] mt-1.5">your <span className="text-vibe">queue</span></h1>

      {rows.length === 0 ? (
        <div className="mt-8 border-[2px] border-dashed border-ink rounded-2xl p-12 text-center">
          <div className="font-h text-xl font-bold">nothing queued yet.</div>
          <p className="text-muted text-sm mt-1">tap <b>＋ want</b> on anything your people — or kizu — drop.</p>
          <Link href="/home" className="inline-block mt-5 font-h font-bold text-sm bg-vibe text-white border-[2.5px] border-ink rounded-full px-5 py-2.5 shadow-[3px_3px_0_#14110F]">go to home</Link>
        </div>
      ) : (
        <QueueClient rows={rows} landedYou={landedCount} />
      )}
    </main>
  );
}
