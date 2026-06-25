import { createAdminClient } from "@/lib/supabase-admin";

type Admin = ReturnType<typeof createAdminClient>;

// Make `groupId` the user's active (home) group; clear is_home on their others.
export async function setActiveGroup(admin: Admin, userId: string, groupId: string) {
  await admin.from("group_members").update({ is_home: false }).eq("user_id", userId);
  await admin.from("group_members").update({ is_home: true }).eq("user_id", userId).eq("group_id", groupId);
}
