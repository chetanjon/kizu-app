import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { redirect } from "next/navigation";

// Invite link landing: kizu.app/join/<CODE> → auto-join (after sign-in) → feed.
export default async function JoinByCode({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/join/${code}`)}`);

  const admin = createAdminClient();
  const { data: group } = await admin
    .from("groups").select("id").eq("invite_code", code.toUpperCase()).maybeSingle();
  if (!group) redirect("/groups/new?error=badcode");

  const { count } = await supabase
    .from("group_members").select("*", { count: "exact", head: true }).eq("user_id", user!.id);

  await admin.from("group_members").upsert(
    { group_id: group!.id, user_id: user!.id, is_home: (count ?? 0) === 0 },
    { onConflict: "group_id,user_id", ignoreDuplicates: true }
  );

  redirect("/feed");
}
