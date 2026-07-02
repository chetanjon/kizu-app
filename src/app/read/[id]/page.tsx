import { getCurrentUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase-admin";
import VibeCard, { type Read } from "@/components/vibe-card";
import ItemActions from "@/components/item-actions";
import { actionsFor, type Action } from "@/lib/item-actions";
import { availabilityMap } from "@/lib/providers";
import { cleanServices } from "@/lib/services";
import type { DropType } from "@/lib/item-render";

// The weekly read's landing page. The Friday ritual notification opens THIS —
// the specific stored read — and it's the same URL for every group member.
// Membership-gated; a non-member gets notFound (don't leak that it exists).
const TYPE_WORD: Record<string, string> = { watch: "movie", listen: "music", go_out: "place" };
const norm = (s: string) => s.trim().toLowerCase();

type Drop = { id: string; type: string; data: Record<string, unknown> };

export default async function ReadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/read/${id}`);

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("vibe_reads")
    .select("group_id, card_data, generated_at")
    .eq("id", id)
    .maybeSingle();
  if (!row) notFound();

  // Everything below only needs row.group_id / user.id — one batch, no waterfall.
  // (Matching watch picks back to real drops answers the personal question
  // "do YOU have it?" — the read's picks are just title+type, but the drop
  // carries the tmdb id that availabilityMap needs.)
  const [{ data: mem }, { data: me }, { data: wRaw }] = await Promise.all([
    admin
      .from("group_members")
      .select("group_id")
      .eq("group_id", row.group_id)
      .eq("user_id", user.id)
      .maybeSingle(),
    admin.from("users").select("music_app, services").eq("id", user.id).maybeSingle(),
    admin
      .from("items").select("id, type, data")
      .eq("group_id", row.group_id).eq("type", "watch")
      .order("created_at", { ascending: false }).limit(200),
  ]);
  if (!mem) notFound();

  const read = row.card_data as unknown as Read;
  const musicApp = me?.music_app ?? null;
  const picks = (read.top_picks ?? []).filter((p) => p.title);
  const byTitle = new Map<string, Drop>();
  for (const it of (wRaw ?? []) as Drop[]) {
    const t = norm(String(it.data?.title ?? ""));
    if (t && !byTitle.has(t)) byTitle.set(t, it);
  }
  const matches = picks.map((p) => (p.type === "watch" ? byTitle.get(norm(p.title)) : undefined));
  const availMap = await availabilityMap(
    matches.filter((m): m is Drop => !!m).map((m) => ({ id: m.id, type: m.type, data: m.data })),
    cleanServices(me?.services),
  );

  // per pick: the "you have it" pill if the viewer streams it, else where-to-watch /
  // play-in-your-app / open-in-maps. Uses the matched drop's real data (tmdb id →
  // proper watch link) when found, else falls back to a title-only search.
  const pickActions: Action[][] = picks.map((p, i) => {
    const matched = matches[i];
    const have = matched ? availMap.get(matched.id) : undefined;
    if (have) return [have];
    const data = matched?.data ?? { title: p.title, place_name: p.title };
    return actionsFor({ type: p.type as DropType, data }, musicApp, i === 0);
  });

  return (
    <main className="max-w-[480px] mx-auto px-5 py-10">
      <div className="font-m text-[11px] tracking-[0.16em] uppercase text-muted">this week&apos;s read</div>
      <h1 className="font-h text-[22px] font-black tracking-[-0.035em] mt-1 mb-6 leading-none">good taste ran in the group.</h1>
      <VibeCard read={read} />

      {picks.length > 0 && (
        <section className="mt-8">
          <div className="font-m text-[11px] tracking-[0.16em] uppercase text-muted mb-3">act on it</div>
          <div className="flex flex-col gap-2.5">
            {picks.map((p, i) => (
              <div key={i} className="flex items-center justify-between gap-3 bg-surface border border-hair rounded-2xl px-4 py-3">
                <div className="min-w-0">
                  <div className="font-h font-bold text-[15px] leading-tight truncate">{p.title}</div>
                  <div className="font-m text-[10px] text-muted uppercase tracking-wide mt-0.5">{TYPE_WORD[p.type] ?? p.type}</div>
                </div>
                <ItemActions actions={pickActions[i]} className="shrink-0 justify-end" />
              </div>
            ))}
          </div>
        </section>
      )}

      <Link href="/home" className="mt-8 inline-block font-h font-bold text-sm text-muted hover:text-ink">← back to home</Link>
    </main>
  );
}
