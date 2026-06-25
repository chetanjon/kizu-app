import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { setActiveGroup } from "@/lib/groups";
import { NextResponse } from "next/server";

// Leave a group. If it was the active one, switch to a remaining group —
// preferring one the user created, else the most recently joined.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { group_id } = await req.json().catch(() => ({}));
  if (!group_id) return NextResponse.json({ error: "group_id required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: mem } = await admin
    .from("group_members").select("is_home")
    .eq("user_id", user.id).eq("group_id", group_id).maybeSingle();
  if (!mem) return NextResponse.json({ error: "not a member" }, { status: 403 });

  await admin.from("group_members").delete().eq("user_id", user.id).eq("group_id", group_id);

  const { data: rest } = await admin
    .from("group_members")
    .select("group_id, groups(created_by)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (!rest || rest.length === 0) return NextResponse.json({ ok: true, noGroups: true });

  if (mem.is_home) {
    const mine = rest.find((r) => (r.groups as unknown as { created_by: string } | null)?.created_by === user.id);
    const next = mine?.group_id ?? rest[rest.length - 1].group_id;
    await setActiveGroup(admin, user.id, next);
  }
  return NextResponse.json({ ok: true });
}
