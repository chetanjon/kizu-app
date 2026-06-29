// Social proof — "your people are into this." The honest, trust-based version of
// "trending": which of YOUR group gave a drop a positive verdict. Only loved/liked
// is ever surfaced — `meh` stays private (no public negativity; we rate taste, not
// people). Verdicts are RLS-scoped to their owner, so this reads via the admin client.

import type { createAdminClient } from "@/lib/supabase-admin";

type Admin = ReturnType<typeof createAdminClient>;
export type Voter = { userId: string; name: string | null };

/** Map item_id → the people who marked it loved/liked. */
export async function fetchPositiveVerdicts(admin: Admin, itemIds: string[]): Promise<Map<string, Voter[]>> {
  const map = new Map<string, Voter[]>();
  if (!itemIds.length) return map;
  const { data } = await admin
    .from("queue_items")
    .select("item_id, user_id, users!queue_items_user_id_fkey(name)")
    .in("item_id", itemIds)
    .in("verdict", ["loved", "liked"]);
  for (const r of (data ?? []) as unknown as { item_id: string | null; user_id: string; users: { name: string | null } | null }[]) {
    if (!r.item_id) continue;
    const arr = map.get(r.item_id) ?? [];
    arr.push({ userId: r.user_id, name: r.users?.name ?? null });
    map.set(r.item_id, arr);
  }
  return map;
}

/** One warm line, excluding the dropper + the viewer. Null when there's no signal. */
export function proofLine(voters: Voter[] | undefined, excludeIds: string[]): string | null {
  if (!voters?.length) return null;
  const ex = new Set(excludeIds);
  const seen = new Set<string>();
  const names: string[] = [];
  for (const v of voters) {
    if (ex.has(v.userId) || seen.has(v.userId)) continue;
    seen.add(v.userId);
    names.push((v.name || "someone").toLowerCase());
  }
  if (!names.length) return null;
  if (names.length === 1) return `${names[0]} is into this`;
  if (names.length === 2) return `${names[0]} & ${names[1]} are into this`;
  return `${names[0]}, ${names[1]} +${names.length - 2} are into this`;
}
