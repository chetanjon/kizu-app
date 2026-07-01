// Build + store a group's vibe read. Shared by the on-demand button (/api/vibe)
// and the weekly cron (/api/cron/weekly-read) so they read the room identically.

import type { createAdminClient } from "@/lib/supabase-admin";
import { generateVibe, type VibeItem, type VibeRead } from "@/lib/vibe";

type Admin = ReturnType<typeof createAdminClient>;

export const MIN_VIBE_DROPS = 3; // low for the test; raise toward ~6 later

function metaFor(type: string, d: Record<string, unknown>): string {
  const s = (v: unknown) => (typeof v === "string" && v ? v : "");
  if (type === "watch") return [s(d.year), s(d.media_type)].filter(Boolean).join(" · ");
  if (type === "listen") return s(d.artist);
  return [s(d.subtype), s(d.music_note)].filter(Boolean).join(" · ");
}

/** Generate + store a fresh vibe read for a group. Returns the stored row id +
 *  the read, or null if the group has too few drops to read. `variant` picks the
 *  tone: "default" (on-demand button) or "weekly" (the Friday ritual). Caller
 *  authorizes (cron is trusted). */
export async function buildAndStoreVibe(
  admin: Admin, groupId: string, variant: "default" | "weekly" = "default", periodStart?: string
): Promise<{ id: string; read: VibeRead } | null> {
  const { data: group } = await admin.from("groups").select("name").eq("id", groupId).single();
  const { data: memRows } = await admin
    .from("group_members").select("users(name)").eq("group_id", groupId);
  const members = ((memRows ?? []) as unknown as { users: { name: string | null } | null }[])
    .map((m) => m.users?.name).filter(Boolean) as string[];

  const { data: rows } = await admin
    .from("items")
    .select("type, rating_value, note, data, anon, users!items_created_by_fkey(name)")
    .eq("group_id", groupId)
    // the read is shared with the whole group, so it must never quote a private
    // log or a drop targeted at specific people — only true group-wide drops.
    .eq("private", false)
    .eq("targeted", false)
    .order("created_at", { ascending: false })
    .limit(60);
  const items = (rows ?? []) as unknown as {
    type: string; rating_value: string | null; note: string | null;
    data: Record<string, unknown>; anon: boolean; users: { name: string | null } | null;
  }[];
  if (items.length < MIN_VIBE_DROPS) return null;

  const vibeItems: VibeItem[] = items.map((it) => ({
    type: it.type as VibeItem["type"],
    title: (it.data?.title as string) || (it.data?.place_name as string) || "untitled",
    meta: metaFor(it.type, it.data || {}),
    rating: it.rating_value || undefined,
    note: it.note || undefined,
    who: it.anon ? "someone" : (it.users?.name || "someone"),
  }));

  const read = await generateVibe(group?.name || "the group", members, vibeItems, variant);
  const { data: inserted, error } = await admin.from("vibe_reads").insert({
    group_id: groupId,
    summary: read.title || read.body.slice(0, 120),
    card_data: read,
    // weekly rows are tagged + dated so the partial unique index enforces one
    // read per group per week; manual reads keep the defaults (manual / null).
    ...(variant === "weekly" ? { source: "weekly", period_start: periodStart ?? null } : {}),
  }).select("id").single();
  // a concurrent weekly run already wrote this group-week — treat as done, not an error.
  if (error?.code === "23505") return null;
  if (error || !inserted) throw error ?? new Error("failed to store vibe read");
  return { id: inserted.id, read };
}
