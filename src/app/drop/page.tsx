import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import DropComposer from "@/components/drop-composer";

export default async function Drop() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: mRaw } = await supabase
    .from("group_members").select("group_id, is_home").eq("user_id", user.id);
  const memberships = (mRaw ?? []) as { group_id: string; is_home: boolean }[];
  if (memberships.length === 0) redirect("/groups/new");
  const active = memberships.find((m) => m.is_home) ?? memberships[0];

  return (
    <div className="min-h-screen bg-paper flex items-start justify-center px-6 py-10">
      <DropComposer groupId={active.group_id} />
    </div>
  );
}
