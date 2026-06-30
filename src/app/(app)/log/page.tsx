import { createClient } from "@/lib/supabase-server";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase-admin";
import { signPhotos } from "@/lib/drop-photos";
import type { DropType } from "@/lib/item-render";
import LogList, { type LogRow } from "@/components/log-list";

type Raw = {
  id: string; type: DropType; data: Record<string, unknown>;
  rating_value: string | null; note: string | null; private: boolean; created_at: string;
};

// Your personal shelf: everything you've recorded — private logs + your own
// shared drops — newest first. The investment artifact that visibly grows.
export default async function Log() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const supabase = await createClient();

  // RLS lets you read all your own items (created_by = auth.uid()), private or not.
  const { data: raw } = await supabase
    .from("items")
    .select("id, type, data, rating_value, note, private, created_at")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false })
    .limit(200);

  const items = (raw ?? []) as unknown as Raw[];
  await signPhotos(createAdminClient(), items, (it) => it.data);

  const rows: LogRow[] = items.map((it) => ({
    id: it.id, type: it.type, data: it.data ?? {}, rating: it.rating_value,
    note: it.note, shared: !it.private, date: it.created_at,
  }));

  return (
    <main className="max-w-[600px] mx-auto px-5 py-10 pb-28">
      <div className="font-m text-[11px] tracking-widest uppercase text-muted">your log</div>
      <h1 className="font-h text-4xl font-extrabold tracking-[-0.04em] mt-1 leading-[1.02]">everything you&apos;ve <span className="text-vibe">logged</span></h1>

      {rows.length === 0 ? (
        <div className="mt-8 border border-dashed border-hair rounded-2xl p-12 text-center">
          <div className="font-h text-lg font-bold">nothing logged yet.</div>
          <p className="text-muted text-sm mt-1">hit ＋ and pick <b>just me</b> to log something only you see.</p>
          <Link href="/drop" className="inline-block mt-5 font-h font-bold text-sm bg-vibe text-white border-[2.5px] border-frame rounded-full px-5 py-2.5 shadow-[3px_3px_0_#0D0B09]">＋ log something</Link>
        </div>
      ) : (
        <LogList rows={rows} />
      )}
    </main>
  );
}
