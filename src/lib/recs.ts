import type { SupabaseClient } from "@supabase/supabase-js";

// Create a rec: <fromUser> recommends <itemId> to <toUser?>. If toUser is a
// member who shares a group, it also lands in their queue (source='rec').
// Returns the rec's token (for /r/<token>). Uses the admin client (caller has
// already authorized fromUser). Notifications are wired in Phase 4.
export async function createRec(
  admin: SupabaseClient,
  fromUser: string,
  itemId: string,
  toUser: string | null,
): Promise<{ token: string; recId: string } | null> {
  const { data: rec, error } = await admin
    .from("recs")
    .insert({ item_id: itemId, from_user: fromUser, to_user: toUser })
    .select("id, token")
    .single();
  if (error || !rec) return null;

  if (toUser) {
    // drop it straight into the recipient's queue (idempotent).
    await admin.from("queue_items").insert({
      user_id: toUser,
      item_id: itemId,
      source: "rec",
      source_rec_id: rec.id,
    });
  }
  return { token: rec.token, recId: rec.id };
}
