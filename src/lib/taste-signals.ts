// One person's taste, gathered from what they've dropped and queued. Shared by
// the taste read (/api/read), the "people took your word for it" number, and the
// 3 signature picks on the You page. Reads via the service-role client.

import type { createAdminClient } from "@/lib/supabase-admin";
import type { TasteSignal } from "@/lib/vibe";
import type { DropType } from "@/lib/item-render";

type Admin = ReturnType<typeof createAdminClient>;

export type SignaturePick = { type: DropType; data: Record<string, unknown> };

export type UserSignals = {
  signals: TasteSignal[];        // for the AI read
  signalCount: number;           // drops + verdicts — the threshold gate
  recsSent: number;              // recs you sent (any)
  recsLanded: number;            // recs you sent that landed — "they took your word for it"
  picks: SignaturePick[];        // your 3 standout drops
};

function metaFor(type: string, d: Record<string, unknown>): string {
  const s = (v: unknown) => (typeof v === "string" && v ? v : "");
  if (type === "watch") return [s(d.year), s(d.media_type)].filter(Boolean).join(" · ");
  if (type === "listen") return s(d.artist);
  return [s(d.subtype), s(d.music_note)].filter(Boolean).join(" · ");
}

function titleOf(d: Record<string, unknown>): string {
  const s = (v: unknown) => (typeof v === "string" && v ? v : "");
  return s(d.title) || s(d.place_name) || "untitled";
}

export async function getUserSignals(admin: Admin, userId: string): Promise<UserSignals> {
  // 1. My drops (with reaction counts, to surface signature picks).
  const { data: dropRows } = await admin
    .from("items")
    .select("type, data, rating_value, note, created_at, reactions(count)")
    .eq("created_by", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  type DropRow = {
    type: DropType; data: Record<string, unknown> | null; rating_value: string | null;
    note: string | null; created_at: string; reactions: { count: number }[] | null;
  };
  const drops = (dropRows ?? []) as unknown as DropRow[];

  // 2. My verdicts (things I queued from others/curate and judged).
  const { data: qRows } = await admin
    .from("queue_items")
    .select(
      "verdict, " +
      "items!queue_items_item_id_fkey(type, data, rating_value, note), " +
      "curate_drops!queue_items_curate_drop_id_fkey(type, data, their_words)"
    )
    .eq("user_id", userId)
    .not("verdict", "is", null)
    .limit(100);

  type QRow = {
    verdict: "loved" | "liked" | "meh" | null;
    items: { type: DropType; data: Record<string, unknown> | null; rating_value: string | null; note: string | null } | null;
    curate_drops: { type: DropType; data: Record<string, unknown> | null; their_words: string | null } | null;
  };
  const verdicts = (qRows ?? []) as unknown as QRow[];

  // 3. Recs I sent — and how many landed (north-star, sender side).
  const { count: recsSent } = await admin
    .from("recs").select("id", { count: "exact", head: true }).eq("from_user", userId);
  const { count: recsLanded } = await admin
    .from("recs").select("id", { count: "exact", head: true })
    .eq("from_user", userId).not("landed_at", "is", null);

  // ── build the signal list for the read ──
  const signals: TasteSignal[] = [];
  for (const it of drops) {
    const d = it.data ?? {};
    signals.push({
      type: it.type,
      title: titleOf(d),
      meta: metaFor(it.type, d) || undefined,
      rating: it.rating_value || undefined,
      note: it.note || undefined,
      source: "drop",
    });
  }
  for (const q of verdicts) {
    const src = q.items ?? q.curate_drops;
    if (!src) continue;
    const d = src.data ?? {};
    signals.push({
      type: src.type,
      title: titleOf(d),
      meta: metaFor(src.type, d) || undefined,
      rating: q.items?.rating_value || undefined,
      note: q.items?.note || q.curate_drops?.their_words || undefined,
      verdict: q.verdict ?? undefined,
      source: "queue",
    });
  }

  // ── signature picks: my drops ranked by reactions, rating as tiebreak ──
  const picks: SignaturePick[] = [...drops]
    .map((it) => ({
      it,
      reacts: it.reactions?.[0]?.count ?? 0,
      rate: parseFloat(it.rating_value ?? "") || 0,
    }))
    .sort((a, b) => b.reacts - a.reacts || b.rate - a.rate)
    .slice(0, 3)
    .map(({ it }) => ({ type: it.type, data: it.data ?? {} }));

  return {
    signals,
    signalCount: drops.length + verdicts.length,
    recsSent: recsSent ?? 0,
    recsLanded: recsLanded ?? 0,
    picks,
  };
}
