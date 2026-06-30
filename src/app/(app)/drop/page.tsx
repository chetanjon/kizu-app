import { createClient } from "@/lib/supabase-server";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import DropComposer from "@/components/drop-composer";

export default async function Drop() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const supabase = await createClient();

  const { data: mRaw } = await supabase
    .from("group_members").select("group_id, is_home").eq("user_id", user.id);
  const memberships = (mRaw ?? []) as { group_id: string; is_home: boolean }[];
  if (memberships.length === 0) redirect("/groups/new");
  const active = memberships.find((m) => m.is_home) ?? memberships[0];

  // other members of the active group (for the "drop it for…" picker).
  const { data: memRaw } = await supabase
    .from("group_members")
    .select("user_id, users!group_members_user_id_fkey(name)")
    .eq("group_id", active.group_id)
    .neq("user_id", user.id);
  const members = ((memRaw ?? []) as unknown as { user_id: string; users: { name: string | null } | null }[])
    .map((m) => ({ id: m.user_id, name: m.users?.name ?? null }));

  return (
    <div className="min-h-screen flex items-start justify-center px-6 py-10">
      <DropComposer groupId={active.group_id} members={members} />
    </div>
  );
}
