import { getCurrentUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase-admin";
import VibeCard, { type Read } from "@/components/vibe-card";
import ItemActions from "@/components/item-actions";
import { actionsFor } from "@/lib/item-actions";
import type { DropType } from "@/lib/item-render";

// The weekly read's landing page. The Friday ritual notification opens THIS —
// the specific stored read — and it's the same URL for every group member.
// Membership-gated; a non-member gets notFound (don't leak that it exists).
const TYPE_WORD: Record<string, string> = { watch: "movie", listen: "music", go_out: "place" };

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

  const { data: mem } = await admin
    .from("group_members")
    .select("group_id")
    .eq("group_id", row.group_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!mem) notFound();

  const read = row.card_data as unknown as Read;
  const { data: me } = await admin.from("users").select("music_app").eq("id", user.id).maybeSingle();
  const musicApp = me?.music_app ?? null;
  const picks = (read.top_picks ?? []).filter((p) => p.title);

  return (
    <main className="max-w-[480px] mx-auto px-5 py-10">
      <div className="font-m text-[11px] tracking-[0.16em] uppercase text-muted">this week&apos;s read</div>
      <h1 className="font-h text-[22px] font-black tracking-[-0.035em] mt-1 mb-6 leading-none">good taste ran in the group.</h1>
      <VibeCard read={read} />

      {picks.length > 0 && (
        <section className="mt-8">
          <div className="font-m text-[11px] tracking-[0.16em] uppercase text-muted mb-3">act on it</div>
          <div className="flex flex-col gap-2.5">
            {picks.map((p, i) => {
              // top_picks carry only a title + type, so actionsFor falls back to
              // a "where to watch / listen / open in maps" search link — enough
              // to go do it. (place_name mirrors title so go_out resolves to maps.)
              const actions = actionsFor(
                { type: p.type as DropType, data: { title: p.title, place_name: p.title } },
                musicApp,
                i === 0,
              );
              return (
                <div key={i} className="flex items-center justify-between gap-3 bg-surface border border-hair rounded-2xl px-4 py-3">
                  <div className="min-w-0">
                    <div className="font-h font-bold text-[15px] leading-tight truncate">{p.title}</div>
                    <div className="font-m text-[10px] text-muted uppercase tracking-wide mt-0.5">{TYPE_WORD[p.type] ?? p.type}</div>
                  </div>
                  <ItemActions actions={actions} className="shrink-0 justify-end" />
                </div>
              );
            })}
          </div>
        </section>
      )}

      <Link href="/home" className="mt-8 inline-block font-h font-bold text-sm text-muted hover:text-ink">← back to home</Link>
    </main>
  );
}
