import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { setActiveGroup } from "@/lib/groups";
import { NextResponse } from "next/server";

// Switch which group is active (is_home) for the current user.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { group_id } = await req.json().catch(() => ({}));
  if (!group_id) return NextResponse.json({ error: "group_id required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: mem } = await admin
    .from("group_members").select("group_id")
    .eq("user_id", user.id).eq("group_id", group_id).maybeSingle();
  if (!mem) return NextResponse.json({ error: "not a member" }, { status: 403 });

  await setActiveGroup(admin, user.id, group_id);
  return NextResponse.json({ ok: true });
}
