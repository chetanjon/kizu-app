import { createClient } from "@/lib/supabase-server";
import { getCurrentUser, getMemberships } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import VibeRead from "@/components/vibe-read";
import Reactions from "@/components/reactions";
import DeleteDrop from "@/components/delete-drop";
import NameSetter from "@/components/name-setter";
import QueueButton from "@/components/queue-button";
import NotificationsBell from "@/components/notifications-bell";
import CurateRiver, { type CDrop } from "@/components/curate-river";
import { TYPE, img, title, sub, type DropType } from "@/lib/item-render";

const RIVER_PAGE = 12;

type Item = {
  id: string;
  type: DropType;
  rating_value: string | null;
  note: string | null;
  data: Record<string, unknown>;
  created_by: string;
  users: { name: string | null } | null;
  reactions: { emoji: string; user_id: string }[];
};

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const supabase = await createClient();

  // everything that doesn't need the active group → fire together.
  // (getMemberships is request-memoized, so this reuses the layout's call.)
  const [memberships, meRes, cRes, cqRes] = await Promise.all([
    getMemberships(user.id),
    supabase.from("users").select("name").eq("id", user.id).maybeSingle(),
    supabase
      .from("curate_drops")
      .select("id, type, moment, their_words, data, curate_people!curate_drops_person_id_fkey(name, photo_url, where_met, consent)")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .range(0, RIVER_PAGE - 1),
    supabase.from("queue_items").select("curate_drop_id").eq("user_id", user.id).not("curate_drop_id", "is", null),
  ]);

  if (memberships.length === 0) redirect("/groups/new");
  const active = memberships.find((m) => m.is_home) ?? memberships[0];
  const g = active.groups!;
  const myName = meRes.data?.name ?? null;
  const curate = ((cRes.data ?? []) as unknown as CDrop[]).filter((d) => d.curate_people);
  const queuedCurate = (cqRes.data ?? []).map((r) => r.curate_drop_id as string);

  // group items, then which of them I've already queued.
  const { data: iRaw } = await supabase
    .from("items")
    .select("id, type, rating_value, note, data, created_by, users!items_created_by_fkey(name), reactions(emoji, user_id)")
    .eq("group_id", g.id)
    .order("created_at", { ascending: false });
  const items = (iRaw ?? []) as unknown as Item[];

  const ids = items.map((i) => i.id);
  const { data: qRaw } = await supabase
    .from("queue_items")
    .select("item_id")
    .eq("user_id", user.id)
    .in("item_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  const queued = new Set((qRaw ?? []).map((q) => q.item_id));

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-20 flex items-center justify-between px-6 h-16 border-b-[2px] border-ink bg-paper/85 backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="font-h text-2xl font-extrabold tracking-[-0.05em]">kizu<span className="text-red">.</span></span>
          <span className="flex items-center gap-2 font-m text-xs font-bold border-[2px] border-ink rounded-full px-3 py-1.5 bg-surface">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: g.color }} />
            {g.name.toLowerCase()}
          </span>
        </div>
        <NotificationsBell />
      </header>

      <main className="max-w-[1100px] mx-auto px-6 py-8">
        <div className="font-m text-[11px] tracking-widest uppercase text-muted">{g.name} · invite code <span className="text-ink font-bold">{g.invite_code}</span></div>
        <h1 className="font-h text-4xl font-extrabold tracking-[-0.04em] mt-1.5">what your <span className="text-vibe">people love</span></h1>
        <div className="mt-4"><VibeRead groupId={g.id} /></div>
        {!myName && <div className="mt-4 max-w-[420px]"><NameSetter /></div>}

        {items.length === 0 ? (
          <div className="mt-8 border-[2px] border-dashed border-ink rounded-2xl p-14 text-center">
            <div className="font-h text-xl font-bold">nothing here yet.</div>
            <p className="text-muted text-sm mt-1">drop the first movie, song, or place you love.</p>
            <Link href="/drop" className="inline-block mt-5 font-h font-bold text-sm bg-vibe text-white border-[2.5px] border-ink rounded-full px-5 py-2.5 shadow-[3px_3px_0_#14110F]">＋ drop something</Link>
            <p className="text-muted text-xs mt-6 font-m">share to invite: send <b>/join/{g.invite_code}</b></p>
          </div>
        ) : (
          <>
            <div className="mt-7 grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-5">
              {items.map((it) => {
                const t = TYPE[it.type];
                const cover = img(it);
                const mine = it.created_by === user.id;
                return (
                  <article key={it.id} className="bg-surface border-[2.5px] border-ink rounded-2xl overflow-hidden shadow-[5px_5px_0_#14110F]">
                    <div className="aspect-[4/3] relative border-b-[2.5px] border-ink" style={{ background: cover ? undefined : t.color }}>
                      {cover && <img src={cover} alt="" className="w-full h-full object-cover" />}
                      {it.rating_value && <span className="absolute left-2.5 bottom-2.5 bg-ink text-white font-m text-xs font-bold rounded-md px-2 py-0.5">{it.rating_value}</span>}
                    </div>
                    <div className="p-3.5">
                      <span className="inline-block font-m text-[9px] font-bold tracking-wide border-[2px] border-ink rounded-md px-2 py-0.5" style={{ background: t.color, color: "#fff" }}>{t.label}</span>
                      <div className="font-h font-extrabold text-lg tracking-[-0.02em] mt-2 leading-tight">{title(it)}</div>
                      {sub(it) && <div className="font-m text-[10px] text-muted mt-0.5">{sub(it)}</div>}
                      {it.note && <p className="text-sm text-ink-2 mt-2 leading-snug">{it.note}</p>}
                      <div className="mt-3 pt-3 border-t-[2px] border-hair">
                        <div className="flex items-center justify-between">
                          <span className="font-m text-[11px] text-muted">{(it.users?.name || "someone").toLowerCase()}</span>
                          {mine ? <DeleteDrop itemId={it.id} /> : <QueueButton itemId={it.id} initialQueued={queued.has(it.id)} />}
                        </div>
                        <div className="mt-2"><Reactions itemId={it.id} initial={it.reactions} userId={user.id} /></div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}

        {/* the threshold: your people end here; the curated world begins. */}
        {curate.length > 0 ? (
          <>
            <div className="relative mt-12 mb-2 text-center">
              <div className="border-t-[2.5px] border-dashed border-ink" />
              <span className="inline-block bg-paper px-3 -mt-3.5 relative font-m text-[11px] text-ink-2">
                ✦ <span className="font-h font-extrabold text-ink">you&apos;re caught up.</span> here&apos;s what the world&apos;s loving
              </span>
            </div>
            <CurateRiver initial={curate} queuedIds={queuedCurate} nextOffset={RIVER_PAGE} done={curate.length < RIVER_PAGE} />
          </>
        ) : items.length > 0 ? (
          <div className="mt-10 text-center">
            <div className="font-h text-lg font-bold">that&apos;s everyone.</div>
            <div className="font-m text-[11px] text-muted mt-1">you&apos;re all caught up · <span className="font-h font-extrabold">kizu<span className="text-red">.</span></span></div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
