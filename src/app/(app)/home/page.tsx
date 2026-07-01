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
import FeedReveal from "@/components/feed-reveal";
import GroupSwitcher from "@/components/group-switcher";
import HighlightReel, { type Highlight } from "@/components/highlight-reel";
import { TYPE, SHADOW, img, title, type DropType } from "@/lib/item-render";
import { actionsFor } from "@/lib/item-actions";
import { fetchPositiveVerdicts, proofLine, type Voter } from "@/lib/social-proof";
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

// hook color = a light tint of the drop's type color (landed uses violet).
const HOOK_TINT: Record<DropType, string> = { watch: "#C9DBFF", listen: "#FFC7DA", go_out: "#C4F5E1" };

// positive-verdict voter names for a drop, excluding some ids, lowercased & deduped.
function voterNames(voters: Voter[] | undefined, excludeIds: string[]): string[] {
  if (!voters?.length) return [];
  const ex = new Set(excludeIds);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of voters) {
    if (ex.has(v.userId) || seen.has(v.userId)) continue;
    seen.add(v.userId);
    out.push((v.name || "someone").toLowerCase());
  }
  return out;
}
function nameList(ns: string[]): string {
  if (ns.length === 1) return ns[0];
  if (ns.length === 2) return `${ns[0]} & ${ns[1]}`;
  return `${ns[0]}, ${ns[1]} +${ns.length - 2}`;
}

// varied phrasings for a landed rec, so consecutive "it landed" tiles never read
// the same. `idx` rotates the template; type picks the verb.
function landedTake(ns: string[], type: DropType, idx: number): string {
  if (ns.length > 1) {
    const alt = [`${nameList(ns)} are loving what you dropped.`, `your drop landed with ${ns.length} of them.`];
    return alt[idx % alt.length];
  }
  const n = ns[0];
  const verb = type === "listen" ? "had it on repeat" : type === "watch" ? "couldn't stop thinking about it" : "went, and loved it";
  const opts = [`${n} loved the one you dropped.`, `${n} ${verb} — your pick.`, `landed with ${n}. your drop.`];
  return opts[idx % opts.length];
}

// Build the highlight reel from what home already loaded — no extra queries. Each
// drop is sorted into ONE bucket (its strongest angle), then we round-robin the
// rich buckets so the reel always reads as a MIX — never three of a kind in a row.
function buildHighlights(items: Item[], proof: Map<string, Voter[]>, meId: string): Highlight[] {
  const dropper = (it: Item) => (it.anon ? "someone" : (it.users?.name || "someone").toLowerCase());
  const mk = (it: Item, x: { hook: string; hookCol: string; take: string; who: string }): Highlight =>
    ({ id: it.id, type: it.type, cover: img(it), title: title(it), ...x });

  const landed: Highlight[] = [], consensus: Highlight[] = [], takes: Highlight[] = [], fresh: Highlight[] = [];
  let li = 0;
  for (const it of items) {
    // it landed — YOUR drop others gave a positive verdict (the north-star payoff)
    if (it.created_by === meId) {
      const ns = voterNames(proof.get(it.id), [meId]);
      if (ns.length) { landed.push(mk(it, { hook: "✦ it landed", hookCol: "#C9B6FF", take: landedTake(ns, it.type, li++), who: "your drop" })); continue; }
    }
    // the group agrees — two or more people into the same drop
    const cs = voterNames(proof.get(it.id), [it.created_by]);
    if (cs.length >= 2) { consensus.push(mk(it, { hook: "the group agrees", hookCol: HOOK_TINT[it.type], take: `${nameList(cs)} are all into it.`, who: `${cs.length} of your people` })); continue; }
    // a real take — a drop carrying someone's words
    if (it.note) {
      const hook = it.type === "listen" ? "on their repeat" : it.type === "watch" ? "they couldn't shake it" : "a spot they swear by";
      takes.push(mk(it, { hook, hookCol: HOOK_TINT[it.type], take: `“${it.note}”`, who: dropper(it) }));
      continue;
    }
    // fresh — everything else, held back to fill only if the reel is quiet
    fresh.push(mk(it, { hook: "just dropped", hookCol: HOOK_TINT[it.type], take: `${dropper(it)} just added this to the space.`, who: dropper(it) }));
  }

  // round-robin the three rich buckets → a visible mix; cap at 8
  const out: Highlight[] = [];
  const buckets = [landed, consensus, takes];
  for (let i = 0; out.length < 8 && buckets.some((b) => b.length); i++) {
    const b = buckets[i % buckets.length];
    if (b.length) out.push(b.shift()!);
  }
  // only reach for fresh drops if the reel would otherwise be thin
  while (out.length < 4 && fresh.length) out.push(fresh.shift()!);
  return out;
}

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

  // the cinematic highlight reel — the best of what your people did lately.
  const highlights = buildHighlights(items, proofMap, user.id);

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

        {/* the highlight reel — a wide cinematic band of the group's best moments */}
        {highlights.length > 0 && <div className="mt-6"><HighlightReel items={highlights} /></div>}

        <PushNudge />
        {!myName && <div className="mt-4 max-w-[420px]"><NameSetter /></div>}

        {/* quick decide — jump straight into tonight's shuffle, pre-lensed */}
        <div className="mt-6">
          <div className="font-m text-[11px] tracking-widest uppercase text-muted mb-2.5">in the mood for&hellip;</div>
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
                  <p className="text-muted text-sm mt-1">drop something, or peek at <span className="text-vibe-2">kizu curate</span>.</p>
                </div>
              ) : (
                <>
                  <FeedReveal>
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
                const avatarCh = it.anon ? (mine ? "Y" : "?") : dropperName.slice(0, 1).toUpperCase();
                // the single "act on it" — for music this resolves to THEIR picked
                // subscription app (actionsFor returns it as the primary); for film
                // "where to watch" / "you have it", for places "open in maps".
                const acts = availMap.get(it.id) ? [availMap.get(it.id)!] : actionsFor(it, myMusicApp, false);
                const act = acts.find((a) => a.kind !== "set") ?? null;
                return (
                  // bigger card: the colored type kicker bar fills the row (the type
                  // signal), big cover with the one corner affordance on a dark scrim,
                  // title hero, the take, an avatar+name footer, one filled act-on-it.
                  <article key={it.id} className="relative flex gap-4 py-6 border-t border-hair first:border-t-0">
                    <div className={`relative w-[116px] h-[174px] flex-none rounded-[12px] border-[2.5px] border-frame overflow-hidden bg-surface-2 ${SHADOW[it.type]}`} style={{ background: cover ? undefined : t.color }}>
                      {cover && <img src={cover} alt="" loading="lazy" decoding="async"
                          className="w-full h-full object-cover object-center" />}
                      {/* the card's one affordance, on a dark scrim so it reads over any art:
                          ⋯ delete on your own drops · bookmark (save→watchlist) on others' */}
                      <div className="absolute top-1.5 right-1.5 z-10 rounded-full bg-black/45 backdrop-blur-sm">
                        {mine
                          ? <DeleteDrop itemId={it.id} />
                          : <QueueButton itemId={it.id} initialQueued={queued.has(it.id)} variant="icon" />}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col">
                      {/* the type line — fills the row, but thin (a colored line, not a slab) */}
                      <div className="rounded-md px-2.5 py-1" style={{ background: t.color }}>
                        <span className="font-h font-extrabold text-[10px] tracking-[0.12em] text-[#15110D]">{t.label}</span>
                      </div>
                      <h3 className="font-h font-bold text-[21px] tracking-[-0.02em] leading-[1.1] line-clamp-2 mt-2">{title(it)}</h3>
                      {forYou && <div className="font-m text-[11px] text-vibe-2 mt-1" title="someone sent this to you directly">✦ for you</div>}
                      {it.note && <p className="text-[13.5px] text-ink-2 mt-1 leading-snug line-clamp-2">&ldquo;{it.note}&rdquo;</p>}
                      {proof && <div className="font-m text-[11px] text-go mt-1.5">♥ {proof}</div>}

                      {/* one engagement line, bottom-aligned to the cover:
                          avatar · who · their reactions ........ act on it */}
                      <div className="mt-auto pt-3 flex items-center gap-1.5 min-w-0">
                        <span className="w-[26px] h-[26px] flex-none rounded-full bg-surface-2 border border-hair flex items-center justify-center font-h font-extrabold text-[11px] text-ink-2">{avatarCh}</span>
                        <span className="font-m text-[12px] text-ink-2 truncate min-w-0">{it.anon ? (mine ? "you · anon" : "someone") : dropperName}</span>
                        <Reactions itemId={it.id} initial={rx} userId={user.id} canSeeWho={mine} compact />
                        {act && (
                          <a href={act.url} {...(act.kind === "set" ? {} : { target: "_blank", rel: "noreferrer" })}
                            className={`ml-auto flex-none font-h text-[12px] font-bold rounded-full px-3 py-2 transition-all active:scale-95 ${
                              act.kind === "have" ? "bg-go text-[#15110D]"
                              : act.primary ? "bg-vibe text-white"
                              : "bg-surface-2 text-ink border-[1.5px] border-frame"
                            }`}>
                            {act.kind === "have" ? `✓ ${act.label}` : act.label}
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
                  </FeedReveal>
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
