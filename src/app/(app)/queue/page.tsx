import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import QueueClient, { type QRow } from "@/components/queue-client";
import type { DropType } from "@/lib/item-render";

type Raw = {
  item_id: string;
  verdict: string | null;
  done_at: string | null;
  source: string;
  items: {
    type: DropType;
    data: Record<string, unknown>;
    note: string | null;
    rating_value: string | null;
    created_by: string;
    users: { name: string | null } | null;
  } | null;
};

export default async function Queue() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: raw } = await supabase
    .from("queue_items")
    .select(
      "item_id, verdict, done_at, source, items!queue_items_item_id_fkey(type, data, note, rating_value, created_by, users!items_created_by_fkey(name))"
    )
    .eq("user_id", user.id)
    .order("added_at", { ascending: false });

  const rows: QRow[] = ((raw ?? []) as unknown as Raw[])
    .filter((r) => r.items)
    .map((r) => ({
      itemId: r.item_id,
      type: r.items!.type,
      data: r.items!.data ?? {},
      note: r.items!.note,
      ratingValue: r.items!.rating_value,
      verdict: (r.verdict as QRow["verdict"]) ?? null,
      done: !!r.done_at,
      who: r.items!.users?.name ?? null,
      mine: r.items!.created_by === user.id,
    }));

  // recs that landed FOR you: things you dropped that someone loved/liked.
  // (Counting your OWN dropped items that others verdicted — Phase 3 makes this
  //  precise with the recs table; here it's a simple presence count.)
  const landedCount = rows.filter((r) => !r.mine && r.done && (r.verdict === "loved" || r.verdict === "liked")).length;

  return (
    <main className="max-w-[700px] mx-auto px-6 py-10">
      <div className="font-m text-[11px] tracking-widest uppercase text-muted">things you mean to get to</div>
      <h1 className="font-h text-4xl font-extrabold tracking-[-0.04em] mt-1.5">your <span className="text-vibe">queue</span></h1>

      {rows.length === 0 ? (
        <div className="mt-8 border-[2px] border-dashed border-ink rounded-2xl p-12 text-center">
          <div className="font-h text-xl font-bold">nothing queued yet.</div>
          <p className="text-muted text-sm mt-1">tap <b>＋ want</b> on anything your people drop.</p>
          <Link href="/home" className="inline-block mt-5 font-h font-bold text-sm bg-vibe text-white border-[2.5px] border-ink rounded-full px-5 py-2.5 shadow-[3px_3px_0_#14110F]">go to home</Link>
        </div>
      ) : (
        <QueueClient rows={rows} landedYou={landedCount} />
      )}
    </main>
  );
}
