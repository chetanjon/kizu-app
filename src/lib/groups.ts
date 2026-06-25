import { createAdminClient } from "@/lib/supabase-admin";

type Admin = ReturnType<typeof createAdminClient>;

// Make `groupId` the user's active (home) group; clear is_home on their others.
export async function setActiveGroup(admin: Admin, userId: string, groupId: string) {
  const { error: clearErr } = await admin.from("group_members").update({ is_home: false }).eq("user_id", userId);
  if (clearErr) throw new Error(clearErr.message);
  const { error: setErr } = await admin.from("group_members").update({ is_home: true }).eq("user_id", userId).eq("group_id", groupId);
  if (setErr) throw new Error(setErr.message);
}
