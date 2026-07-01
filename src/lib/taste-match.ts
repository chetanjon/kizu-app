// Taste-match % — platonic, deterministic, no AI ($0). How much of your taste
// you actually SHARE with each person in your home group. We score the overlap,
// never the person: no leaderboard, no rating of friends (CLAUDE.md sanctions
// taste-match % as platonic). Jaccard over each person's positive-signal set:
//   { items they dropped } ∪ { items they marked loved/liked }, scoped to the group.

import type { createAdminClient } from "@/lib/supabase-admin";

type Admin = ReturnType<typeof createAdminClient>;

const MIN_UNION = 4; // below this there isn't enough shared ground to be honest.
const MAX_ROWS = 6;  // keep the page bounded (anti-doomscroll).

export type TasteMatch = { name: string; pct: number; evidence: string[] };

function titleOf(d: Record<string, unknown> | null | undefined): string {
  const s = (v: unknown) => (typeof v === "string" && v ? v : "");
  return s(d?.title) || s(d?.place_name) || "untitled";
}

export async function getTasteMatches(admin: Admin, userId: string): Promise<TasteMatch[]> {
  // 1. My home group + its members.
  const { data: home } = await admin
    .from("group_members").select("group_id").eq("user_id", userId).eq("is_home", true).maybeSingle();
  if (!home) return [];
  const groupId = home.group_id;

  const { data: memRows } = await admin
    .from("group_members").select("user_id, users(name)").eq("group_id", groupId);
  const members = ((memRows ?? []) as unknown as { user_id: string; users: { name: string | null } | null }[])
    .filter((m) => m.user_id !== userId);
  if (members.length === 0) return [];

  // 2. All GROUP-WIDE drops → per-user "dropped" set + an id→title map. Private
  // logs and targeted (person-to-person) drops are excluded: they're not part of
  // the shared taste graph, so they neither leak as evidence nor skew the score.
  const { data: itemRows } = await admin
    .from("items").select("id, created_by, data, anon")
    .eq("group_id", groupId)
    .eq("private", false)
    .eq("targeted", false);
  const items = (itemRows ?? []) as unknown as { id: string; created_by: string; data: Record<string, unknown> | null; anon: boolean }[];

  const titleById = new Map<string, string>();
  const positive = new Map<string, Set<string>>(); // user_id → set of item_ids they love
  const add = (uid: string, itemId: string) => {
    if (!positive.has(uid)) positive.set(uid, new Set());
    positive.get(uid)!.add(itemId);
  };
  for (const it of items) {
    titleById.set(it.id, titleOf(it.data));
    // an anon drop must NOT attribute taste to its dropper — that's the whole
    // point of anon. (It can still enter a set via someone's own queue-love below.)
    if (!it.anon) add(it.created_by, it.id);
  }

  // 3. loved/liked verdicts on those items → add to each person's positive set.
  const groupItemIds = items.map((i) => i.id);
  if (groupItemIds.length) {
    const { data: qRows } = await admin
      .from("queue_items")
      .select("user_id, item_id, verdict")
      .in("item_id", groupItemIds)
      .in("verdict", ["loved", "liked"]);
    for (const q of (qRows ?? []) as { user_id: string; item_id: string | null }[]) {
      if (q.item_id) add(q.user_id, q.item_id);
    }
  }

  // 4. Jaccard me vs each member.
  const mine = positive.get(userId) ?? new Set<string>();
  const rows: TasteMatch[] = [];
  for (const m of members) {
    const theirs = positive.get(m.user_id) ?? new Set<string>();
    const inter: string[] = [];
    const union = new Set(mine);
    for (const id of theirs) union.add(id);
    for (const id of mine) if (theirs.has(id)) inter.push(id);
    if (union.size < MIN_UNION) continue;
    const pct = Math.round((inter.length / union.size) * 100);
    if (pct === 0) continue;
    rows.push({
      name: (m.users?.name || "someone").toLowerCase(),
      pct,
      evidence: inter.map((id) => titleById.get(id) || "untitled").slice(0, 3),
    });
  }

  return rows.sort((a, b) => b.pct - a.pct).slice(0, MAX_ROWS);
}
