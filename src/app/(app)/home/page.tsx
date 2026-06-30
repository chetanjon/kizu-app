import { createClient } from "@/lib/supabase-server";
import { getCurrentUser, getMemberships } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import VibeRead, { type Read as VibeReadData } from "@/components/vibe-read";
import Reactions from "@/components/reactions";
import DeleteDrop from "@/components/delete-drop";
import NameSetter from "@/components/name-setter";
import QueueButton from "@/components/queue-button";
import NotificationsBell from "@/components/notifications-bell";
import PushNudge from "@/components/push-nudge";
import CurateRiver, { type CDrop } from "@/components/curate-river";
import FeedTabs from "@/components/feed-tabs";
import GroupSwitcher from "@/components/group-switcher";
import { TYPE, SHADOW, img, title, detail, typeWord, ratingMark, type DropType } from "@/lib/item-render";
import { actionsFor } from "@/lib/item-actions";
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
    supabase.from("users").select("name, music_app, services").eq("id", user.id).maybeSingle(),
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
  const myMusicApp = meRes.data?.music_app ?? null;
  const curate = ((cRes.data ?? []) as unknown as CDrop[]).filter((d) => d.curate_people);
  const queuedCurate = (cqRes.data ?? []).map((r) => r.curate_drop_id as string);

  // group items, then which of them I've already queued.
  const { data: iRaw } = await supabase
    .from("items")
    .select("id, type, anon, rating_value, note, data, created_by, users!items_created_by_fkey(name), reactions(emoji, user_id, users!reactions_user_id_fkey(name))")
    .eq("group_id", g.id)
    .eq("private", false)
    .order("created_at", { ascending: false });
  const items = (iRaw ?? []) as unknown as Item[];
  await signPhotos(createAdminClient(), items, (it) => it.data as Record<string, unknown>);
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

        {/* quick decide — jump straight into tonight's shuffle, pre-lensed */}
        <div className="mt-6">
          <div className="font-m text-[11px] tracking-widest uppercase text-muted mb-2.5">what&apos;s good tonight?</div>
          <div className="flex gap-2">
            <Link href="/tonight?lens=watch" className="flex-1 text-center font-h font-bold text-[13px] border-[1.5px] border-frame rounded-full py-2.5 bg-surface active:scale-95 transition-transform">🎬 watch</Link>
            <Link href="/tonight?lens=listen" className="flex-1 text-center font-h font-bold text-[13px] border-[1.5px] border-frame rounded-full py-2.5 bg-surface active:scale-95 transition-transform">🎧 listen</Link>
            <Link href="/tonight?lens=go_out" className="flex-1 text-center font-h font-bold text-[13px] border-[1.5px] border-frame rounded-full py-2.5 bg-surface active:scale-95 transition-transform">🌅 outside</Link>
          </div>
        </div>

        {items.length === 0 && curate.length === 0 ? (
          <div className="mt-8 border border-dashed border-hair rounded-2xl p-14 text-center">
            <div className="font-h text-xl font-bold">nothing here yet.</div>
            <p className="text-muted text-sm mt-1">drop the first movie, song, or place you love.</p>
            <Link href="/drop" className="inline-block mt-5 font-h font-bold text-sm bg-vibe text-white border-[2.5px] border-frame rounded-full px-5 py-2.5 shadow-[3px_3px_0_#0D0B09]">＋ drop something</Link>
            <p className="text-muted text-xs mt-6 font-m">share to invite: send <b>/join/{g.invite_code}</b></p>
          </div>
        ) : (
          <FeedTabs
            fresh={items.length}
            people={
              items.length === 0 ? (
                <div className="mt-10 text-center">
                  <div className="font-h text-lg font-bold">nothing from your people yet.</div>
                  <p className="text-muted text-sm mt-1">drop something, or peek at <span className="text-vibe-2">curate</span>.</p>
                </div>
              ) : (
                <>
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
                // the single "act on it" — for music this resolves to THEIR picked
                // subscription app (actionsFor returns it as the primary); for film
                // "where to watch" / "you have it", for places "open in maps".
                const acts = availMap.get(it.id) ? [availMap.get(it.id)!] : actionsFor(it, myMusicApp, false);
                const act = acts.find((a) => a.kind !== "set") ?? null;
                return (
                  // minimal row: cover (cream frame + signature colored glow — that
                  // glow IS the type signal) · title hero · one quiet meta line ·
                  // one act-on-it pill · quiet engage strip. No type banner, no
                  // double pills, no floating badge.
                  <article key={it.id} className="relative flex gap-5 py-6 border-t border-hair first:border-t-0">
                    {/* top-right corner = this card's one affordance:
                        ⋯ (delete) on your own drops · bookmark (save→queue) on others' */}
                    <div className="absolute top-6 right-0 z-10">
                      {mine
                        ? <DeleteDrop itemId={it.id} />
                        : <QueueButton itemId={it.id} initialQueued={queued.has(it.id)} variant="icon" />}
                    </div>
                    <div className={`w-[96px] h-[144px] flex-none rounded-[12px] border-[2.5px] border-frame overflow-hidden bg-surface-2 ${SHADOW[it.type]}`} style={{ background: cover ? undefined : t.color }}>
                      {cover && <img src={cover} alt="" loading="lazy" decoding="async"
                          className="w-full h-full object-cover object-center" />}
                    </div>
                    <div className="flex-1 min-w-0 pr-9">
                      <h3 className="font-h font-bold text-[20px] tracking-[-0.02em] leading-[1.1] truncate">{title(it)}</h3>
                      {/* one quiet meta line — type as a small colored word, then detail */}
                      <div className="text-[13px] text-muted mt-0.5 truncate">
                        <span className="font-semibold" style={{ color: t.color }}>{typeWord(it)}</span>
                        {detail(it) && <span> · {detail(it)}</span>}
                        {forYou && <span className="text-vibe-2" title="someone sent this to you directly"> · ✦ for you</span>}
                      </div>
                      {it.note && <p className="text-[12.5px] text-ink-2 mt-1.5 leading-snug line-clamp-1">&ldquo;{it.note}&rdquo;</p>}
                      {proof && <div className="font-m text-[11px] text-go mt-1.5">♥ {proof}</div>}

                      {/* rating · dropper ........ open in their app */}
                      <div className="mt-2.5 flex items-center gap-2.5 min-w-0">
                        <span className="font-m text-[11px] text-muted truncate min-w-0 flex items-center gap-2">
                          {it.rating_value && <span className="text-vibe-2 flex-none">{ratingMark(it.rating_value)}</span>}
                          <span className="truncate">{it.anon ? (mine ? "you · anon" : "someone") : dropperName}</span>
                        </span>
                        {act && (
                          <a href={act.url} {...(act.kind === "set" ? {} : { target: "_blank", rel: "noreferrer" })}
                            className={`ml-auto flex-none font-m text-[11px] font-bold rounded-full px-3 py-1.5 transition-all active:scale-95 ${
                              act.primary ? "text-vibe-2 border-[1.5px] border-vibe/50"
                              : act.kind === "have" ? "text-go border-[1.5px] border-go/40"
                              : "text-ink border-[1.5px] border-frame"
                            }`}>
                            {act.label}
                          </a>
                        )}
                      </div>

                      {/* quiet engage strip — just the acknowledgment layer now
                          (save/delete live in the card's top-right corner) */}
                      <div className="mt-2">
                        <Reactions itemId={it.id} initial={rx} userId={user.id} canSeeWho={mine} />
                      </div>
                    </div>
                  </article>
                );
              })}
                  </div>
                  {/* the closer — your people end here */}
                  <div className="mt-10 text-center">
                    <div className="font-h text-lg font-bold">that&apos;s everyone.</div>
                    <div className="font-m text-[11px] text-muted mt-1">you&apos;re all caught up · <span className="font-h font-extrabold">kizu<span className="text-red">.</span></span></div>
                  </div>
                </>
              )
            }
            curate={
              curate.length > 0 ? (
                <>
                  <div className="mt-5 mb-1">
                    <div className="font-h font-extrabold text-[15px] tracking-[-0.02em]">kizu curate</div>
                    <div className="font-m text-[11px] text-muted mt-0.5">picks from real people, beyond your crew</div>
                  </div>
                  <CurateRiver initial={curate} queuedIds={queuedCurate} nextOffset={RIVER_PAGE} done={curate.length < RIVER_PAGE} />
                </>
              ) : (
                <div className="mt-10 text-center font-m text-[12px] text-muted">nothing here yet — kizu curate is still picking.</div>
              )
            }
          />
        )}
      </main>
    </div>
  );
}
