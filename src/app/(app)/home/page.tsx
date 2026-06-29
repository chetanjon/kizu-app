import { createClient } from "@/lib/supabase-server";
import { getCurrentUser, getMemberships } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import VibeRead, { type Read as VibeReadData } from "@/components/vibe-read";
import Reactions from "@/components/reactions";
import DeleteDrop from "@/components/delete-drop";
import NameSetter from "@/components/name-setter";
import QueueButton from "@/components/queue-button";
import GenderSetter from "@/components/gender-setter";
import NotificationsBell from "@/components/notifications-bell";
import PushNudge from "@/components/push-nudge";
import CurateRiver, { type CDrop } from "@/components/curate-river";
import GroupSwitcher from "@/components/group-switcher";
import { TYPE, SHADOW, img, title, detail, type DropType } from "@/lib/item-render";
import { actionsFor } from "@/lib/item-actions";
import ItemActions from "@/components/item-actions";
import { fetchPositiveVerdicts, proofLine } from "@/lib/social-proof";
import { createAdminClient } from "@/lib/supabase-admin";
import { signPhotos } from "@/lib/drop-photos";
import { availabilityMap } from "@/lib/providers";
import { cleanServices } from "@/lib/services";

const RIVER_PAGE = 12;

type Item = {
  id: string;
  type: DropType;
  anon: boolean;
  rating_value: string | null;
  note: string | null;
  data: Record<string, unknown>;
  created_by: string;
  users: { name: string | null } | null;
  reactions: { emoji: string; user_id: string; users: { name: string | null } | null }[];
};

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const supabase = await createClient();

  // everything that doesn't need the active group → fire together.
  // (getMemberships is request-memoized, so this reuses the layout's call.)
  const [memberships, meRes, cRes, cqRes] = await Promise.all([
    getMemberships(user.id),
    supabase.from("users").select("name, gender, music_app, services").eq("id", user.id).maybeSingle(),
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
  const myGender = meRes.data?.gender ?? null;
  const myMusicApp = meRes.data?.music_app ?? null;
  const curate = ((cRes.data ?? []) as unknown as CDrop[]).filter((d) => d.curate_people);
  const queuedCurate = (cqRes.data ?? []).map((r) => r.curate_drop_id as string);

  // group items, then which of them I've already queued.
  const { data: iRaw } = await supabase
    .from("items")
    .select("id, type, anon, rating_value, note, data, created_by, users!items_created_by_fkey(name), reactions(emoji, user_id, users!reactions_user_id_fkey(name))")
    .eq("group_id", g.id)
    .order("created_at", { ascending: false });
  const items = (iRaw ?? []) as unknown as Item[];
  await signPhotos(createAdminClient(), items, (it) => it.data as Record<string, unknown>);
  // only the first song in the feed shows the "pick your music app" prompt.
  const firstListenId = items.find((it) => it.type === "listen")?.id ?? null;
  // "you have it" for movies/tv you can stream on a service you picked.
  const availMap = await availabilityMap(
    items.map((it) => ({ id: it.id, type: it.type, data: it.data })),
    cleanServices(meRes.data?.services),
  );

  const ids = items.map((i) => i.id);
  // who in the group is into each drop (loved/liked) — admin: verdicts are owner-scoped.
  const proofMap = await fetchPositiveVerdicts(createAdminClient(), ids);
  const { data: qRaw } = await supabase
    .from("queue_items")
    .select("item_id, source_rec_id")
    .eq("user_id", user.id)
    .in("item_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  const queued = new Set((qRaw ?? []).map((q) => q.item_id));

  // a drop is "for you" only if it reached your queue via a TARGETED rec
  // (source_rec_id is set). Group-drop "it landed" credits also write a recs row
  // with to_user = you, so reading recs.to_user here would wrongly tag those.
  const forMe = new Set((qRaw ?? []).filter((q) => q.source_rec_id).map((q) => q.item_id as string));

  // the group's latest vibe read (the weekly cron writes these) → surfaced on the
  // button so people can open the week's read without regenerating it.
  const { data: latestRead } = await createAdminClient()
    .from("vibe_reads").select("card_data")
    .eq("group_id", g.id).order("generated_at", { ascending: false }).limit(1).maybeSingle();

  return (
    <div className="min-h-screen pb-28">
      <header className="sticky top-0 z-20 flex items-center justify-between px-5 h-16 border-b border-hair bg-paper/70 backdrop-blur-md">
        <span className="font-h text-2xl font-extrabold tracking-[-0.05em]">kizu<span className="text-red">.</span></span>
        <div className="flex items-center gap-3">
          <GroupSwitcher
              groups={memberships.map((m) => ({ id: m.groups!.id, name: m.groups!.name, color: m.groups!.color }))}
              activeId={g.id}
            />
          <NotificationsBell />
        </div>
      </header>

      <main className="max-w-[600px] mx-auto px-5 py-6">
        {/* the aurora read — the one showstopper, framed in cream on the dark stage */}
        <VibeRead groupId={g.id} initial={(latestRead?.card_data as VibeReadData) ?? null} />
        <PushNudge />
        {!myName && <div className="mt-4 max-w-[420px]"><NameSetter /></div>}
        {!myGender && <div className="mt-4 max-w-[420px]"><GenderSetter /></div>}

        {items.length === 0 ? (
          <div className="mt-8 border border-dashed border-hair rounded-2xl p-14 text-center">
            <div className="font-h text-xl font-bold">nothing here yet.</div>
            <p className="text-muted text-sm mt-1">drop the first movie, song, or place you love.</p>
            <Link href="/drop" className="inline-block mt-5 font-h font-bold text-sm bg-vibe text-white border-[2.5px] border-frame rounded-full px-5 py-2.5 shadow-[3px_3px_0_#0D0B09]">＋ drop something</Link>
            <p className="text-muted text-xs mt-6 font-m">share to invite: send <b>/join/{g.invite_code}</b></p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mt-7 mb-1">
              <div className="flex items-center gap-2 font-h font-extrabold text-[17px] tracking-[-0.02em]">
                <span className="text-vibe-2">✦</span> your people
              </div>
              <span className="font-m text-[12px] font-bold text-muted">{items.length} fresh</span>
            </div>
            <div className="flex flex-col">
              {items.map((it) => {
                const t = TYPE[it.type];
                const cover = img(it);
                const mine = it.created_by === user.id;
                const forYou = forMe.has(it.id);
                const proof = proofLine(proofMap.get(it.id), [it.created_by, user.id]);
                // Reactor names only reach the client for the dropper's own drops.
                const rx = mine
                  ? it.reactions.map((r) => ({ emoji: r.emoji, user_id: r.user_id, name: r.users?.name ?? null }))
                  : it.reactions.map((r) => ({ emoji: r.emoji, user_id: r.user_id }));
                const dropperName = (it.users?.name || "someone").toLowerCase();
                const initial = (it.users?.name || "?").trim().charAt(0).toUpperCase() || "?";
                return (
                  // cinematic-brutalist row: cover art framed in cream with a hard
                  // COLORED shadow tinted to its type (the signature move). type rides
                  // a saturated bar above the title; quiet meta + actions below.
                  <article key={it.id} className="flex gap-4 py-4 border-t border-hair first:border-t-0">
                    <div className={`relative w-[80px] h-[106px] flex-none rounded-[10px] border-[2.5px] border-frame overflow-hidden ${SHADOW[it.type]}`} style={{ background: cover ? undefined : t.color }}>
                      {cover && <img src={cover} alt="" loading="lazy" decoding="async"
                          className="w-full h-full object-cover" />}
                      {it.rating_value && <span className="glass absolute top-1.5 right-1.5 font-h text-[10px] font-extrabold text-white rounded-md px-1.5 py-0.5 border border-white/40">★ {it.rating_value}</span>}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col">
                      {/* type bar — a saturated, full-width brutalist tag */}
                      <span className="font-h text-[9px] font-black tracking-[0.05em] rounded-[5px] px-2 py-1 text-[#15110D] self-stretch" style={{ background: t.color }}>
                        {t.label}{forYou && " · ✦ FOR YOU"}
                      </span>
                      <div className="font-h font-extrabold text-[18px] tracking-[-0.02em] mt-1.5 leading-[1.08]">{title(it)}</div>
                      {it.note ? (
                        <p className="text-[12.5px] text-ink-2 mt-1 leading-snug">&ldquo;{it.note}&rdquo;</p>
                      ) : detail(it) ? (
                        <div className="font-m text-[10px] text-muted mt-1 tracking-wide">{detail(it)}</div>
                      ) : null}
                      {proof && <div className="font-m text-[11px] text-go mt-1.5">♥ {proof}</div>}
                      <div className="mt-auto pt-2.5 flex items-center gap-2 min-w-0">
                        {it.anon ? (
                          <span className="font-m text-[11px] text-muted">{mine ? "you · anon" : "someone"}</span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 font-m text-[11px] text-muted min-w-0">
                            <span className="w-[18px] h-[18px] rounded-full bg-surface-2 border border-hair flex items-center justify-center text-[9px] font-bold text-ink-2 shrink-0">{initial}</span>
                            <span className="truncate">{dropperName}</span>
                          </span>
                        )}
                        <div className="ml-auto flex-none">
                          <ItemActions actions={availMap.get(it.id) ? [availMap.get(it.id)!] : actionsFor(it, myMusicApp, it.id === firstListenId)} />
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <Reactions itemId={it.id} initial={rx} userId={user.id} canSeeWho={mine} />
                        {mine ? <DeleteDrop itemId={it.id} /> : <QueueButton itemId={it.id} initialQueued={queued.has(it.id)} />}
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
              <div className="border-t border-dashed border-hair" />
              <span className="inline-block bg-paper px-3 -mt-3 relative font-m text-[11px] text-ink-2">
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
